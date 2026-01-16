/**
 * Start Llama Router
 * Router startup and process spawning
 * RESPECTS USER SETTINGS FROM DATABASE
 */

import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { DEFAULT_LLAMA_PORT } from "../constants.js";
import {
  killLlamaServer,
  killLlamaOnPort,
  isPortInUse,
} from "./process.js";
import { llamaApiRequest } from "./api.js";

// Module-level state
let llamaServerProcess = null;
let llamaServerPort = null; 
let llamaServerUrl = null;
let logWriteStream = null;
let notificationCallback = null;
let stdoutListener = null; 
let stderrListener = null; 

const LOGS_DIR = path.join(process.cwd(), "logs");
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

/**
 * Set callback for server events.
 */
export function setNotificationCallback(cb) {
  notificationCallback = cb;
}

/**
 * Get the current configured port for llama-server.
 */
function getConfiguredPort(db) {
  if (!db) return DEFAULT_LLAMA_PORT;
  const config = db.getConfig() || {};
  return config.port || config.llama_server_port || DEFAULT_LLAMA_PORT;
}

/**
 * Get current router state
 */
export function getRouterState(db) {
  if (!llamaServerPort && db) {
    llamaServerPort = getConfiguredPort(db);
    llamaServerUrl = `http://127.0.0.1:${llamaServerPort}`;
  }

  return {
    process: llamaServerProcess,
    port: llamaServerPort || DEFAULT_LLAMA_PORT,
    url: llamaServerUrl,
    isRunning: llamaServerProcess !== null && llamaServerProcess.exitCode === null,
  };
}

export function getServerUrl() { return llamaServerUrl; }
export function getServerProcess() { return llamaServerProcess; }

function notifyServerEvent(event, data) {
  console.log(`[LLAMA-NOTIFY] ${event}:`, data);
  if (notificationCallback) {
    notificationCallback(event, data);
  }
}

function initLogFile() {
  const logFile = path.join(LOGS_DIR, "llama-server.log");
  logWriteStream = fs.createWriteStream(logFile, { flags: "w" });
  logWriteStream.write(`# Llama Server Log - Started at ${new Date().toISOString()}\n\n`);
  return logFile;
}

function writeLog(level, message) {
  const logLine = `[${new Date().toISOString()}] [${level}] ${message}\n`;
  if (logWriteStream) logWriteStream.write(logLine);
  if (level === "ERROR") console.error(`[LLAMA-LOG] ${message}`);
  else console.log(`[LLAMA-LOG] ${message}`);
}

function cleanupProcess() {
  if (stdoutListener && llamaServerProcess?.stdout) {
    llamaServerProcess.stdout.removeListener("data", stdoutListener);
  }
  if (stderrListener && llamaServerProcess?.stderr) {
    llamaServerProcess.stderr.removeListener("data", stderrListener);
  }

  if (llamaServerProcess && !llamaServerProcess.killed) {
    try {
      llamaServerProcess.kill("SIGKILL");
    } catch (e) {
      console.warn("[LLAMA] Failed to kill process:", e.message);
    }
  }

  // Clear ALL module-level state to ensure clean restart
  llamaServerProcess = null;
  llamaServerPort = null;
  llamaServerUrl = null;

  if (logWriteStream) {
    logWriteStream.end();
    logWriteStream = null;
  }

  notifyServerEvent("stopped", {
    port: null,
    url: null,
    timestamp: Date.now(),
  });
}

/**
 * Start llama-server in router mode.
 */
export async function startLlamaServerRouter(modelsDir, db, options = {}) {
  const config = db.getConfig() || {};
  const settings = db.getMeta("user_settings") || {};
  
  const llamaBin = config.serverPath || "/home/bamer/llama.cpp/build/bin/llama-server";
  if (!fs.existsSync(llamaBin)) {
    return { success: false, error: `llama-server not found at ${llamaBin}` };
  }

  const configuredPort = getConfiguredPort(db);
  
  await killLlamaOnPort(configuredPort);

  llamaServerPort = configuredPort;
  llamaServerUrl = `http://127.0.0.1:${llamaServerPort}`;

  const args = [
    "--port", String(llamaServerPort),
    "--host", config.llama_server_host || "127.0.0.1",
    "--threads", String(options.threads || config.threads || 4),
    "--ctx-size", String(options.ctxSize || config.ctx_size || 4096),
    "--models-max", String(options.maxModels || settings.maxModelsLoaded || 4),
  ];

  // Add --metrics flag only if enabled in settings
  if (config.llama_server_metrics) {
    args.push("--metrics");
  }

  const isPresetFile = modelsDir && (modelsDir.endsWith(".ini") || options.usePreset);
  const baseModelsPath = config.baseModelsPath || "./models";

  if (isPresetFile) {
    args.push("--models-preset", modelsDir);
    args.push("--models-dir", baseModelsPath);
  } else {
    args.push("--models-dir", modelsDir || baseModelsPath);
  }

  if (settings.autoLoadModels === false || options.noAutoLoad) {
    args.push("--no-models-autoload");
  }

  console.log("[LLAMA] Spawning:", llamaBin, args.join(" "));
  initLogFile();
  writeLog("INFO", `Spawning: ${llamaBin} ${args.join(" ")}`);

  try {
    llamaServerProcess = spawn(llamaBin, args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env }
    });

    if (!llamaServerProcess.pid) throw new Error("Failed to spawn process");

    stdoutListener = (data) => writeLog("INFO", data.toString().trim());
    stderrListener = (data) => writeLog("ERROR", data.toString().trim());
    llamaServerProcess.stdout.on("data", stdoutListener);
    llamaServerProcess.stderr.on("data", stderrListener);

    for (let i = 0; i < 45; i++) {
      await new Promise(r => setTimeout(r, 1000));
      
      // Check if process exited unexpectedly
      if (llamaServerProcess.exitCode !== null) {
        const errorMsg = `Process exited with code ${llamaServerProcess.exitCode}`;
        console.error(`[LLAMA] ${errorMsg}`);
        throw new Error(errorMsg);
      }
      
      // Check if port is in use
      if (await isPortInUse(llamaServerPort)) {
        try {
          // Verify the server is actually responding
          await llamaApiRequest("/models", "GET", null, llamaServerUrl);
          console.log(`[LLAMA] Server is ready and responding on port ${llamaServerPort}`);
          notifyServerEvent("started", { port: llamaServerPort, url: llamaServerUrl, mode: "router", timestamp: Date.now() });
          return { success: true, port: llamaServerPort, url: llamaServerUrl };
        } catch (e) {
          console.log(`[LLAMA] Port ${llamaServerPort} in use but server not responding yet, waiting...`);
        }
      }
      
      // Progress log every 10 seconds
      if (i > 0 && i % 10 === 0) {
        console.log(`[LLAMA] Still waiting for server... (${i}s elapsed)`);
      }
    }
    throw new Error("Timeout waiting for llama-server to start (45s)");
  } catch (e) {
    cleanupProcess();
    return { success: false, error: e.message };
  }
}
