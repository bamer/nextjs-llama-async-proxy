/**
 * Start Llama Router
 * Router startup and process spawning
 * RESPECTS USER SETTINGS FROM DATABASE
 */

import fs from "fs";
import path from "path";
import { spawn, execSync } from "child_process";
import { DEFAULT_LLAMA_PORT } from "../constants.js";
import {
  killLlamaServer,
  killLlamaOnPort,
  isPortInUse,
} from "./process.js";
import { llamaApiRequest } from "./api.js";
import { initializeLlamaMetricsScraper } from "../../metrics.js";
import { getRouterConfig } from "../../db/config.js";

// Module-level state
let llamaServerProcess = null;
let llamaServerPort = null; 
let llamaServerUrl = null;
let llamaServerStartTime = null; // Track server start time for uptime
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

/**
 * Get llama-server uptime in seconds.
 * @returns {number} Uptime in seconds, or 0 if server not started
 */
export function getServerUptime() {
  if (!llamaServerStartTime) return 0;
  return Math.floor((Date.now() - llamaServerStartTime) / 1000);
}

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
 * Find llama-server binary in PATH or common locations.
 * @returns {string|null} Path to llama-server or null if not found
 */
function findLlamaServer() {
  try {
    // Try to find via which command
    const result = execSync("which llama-server 2>/dev/null || command -v llama-server 2>/dev/null", {
      encoding: "utf-8",
      timeout: 5000,
    }).trim();
    if (result && fs.existsSync(result)) {
      return result;
    }
  } catch (e) {
    // which command not found or llama-server not in PATH
  }

  // Common locations to check
  const commonPaths = [
    "/usr/local/bin/llama-server",
    "/usr/bin/llama-server",
    "/home/bamer/.local/bin/llama-server",
    process.env.HOME + "/.local/bin/llama-server",
  ];

  for (const p of commonPaths) {
    if (p && fs.existsSync(p)) {
      return p;
    }
  }

  return null;
}

/**
 * Get the llama-server binary path from config or find it.
 * @param {Object} routerConfig - Router configuration
 * @returns {{path: string, found: boolean}}
 */
function getLlamaServerPath(routerConfig) {
  const configuredPath = routerConfig?.serverPath;

  if (configuredPath) {
    // Check if it's a file directly
    if (fs.existsSync(configuredPath) && fs.statSync(configuredPath).isFile()) {
      return { path: configuredPath, found: true };
    }

    // Check if it's a directory, look for llama-server inside
    if (fs.existsSync(configuredPath) && fs.statSync(configuredPath).isDirectory()) {
      const inside = path.join(configuredPath, "llama-server");
      if (fs.existsSync(inside) && fs.statSync(inside).isFile()) {
        return { path: inside, found: true };
      }
    }
  }

  // Try to find in PATH or common locations
  const foundPath = findLlamaServer();
  if (foundPath) {
    return { path: foundPath, found: true };
  }

  // Return configured path even if it doesn't exist (for error message)
  return { path: configuredPath || "llama-server", found: false };
}

/**
 * Start llama-server in router mode.
 */
export async function startLlamaServerRouter(modelsDir, db, options = {}) {
  const routerConfig = getRouterConfig(db.db);
  const settings = db.getMeta("user_settings") || {};

  const { path: llamaBin, found } = getLlamaServerPath(routerConfig);

  if (!found) {
    return {
      success: false,
      error: `llama-server not found. Please configure the server path in Settings > Router Configuration. Searched: ${llamaBin}`,
    };
  }

  const configuredPort = getConfiguredPort(db);
  
  await killLlamaOnPort(configuredPort);

  llamaServerPort = configuredPort;
  llamaServerUrl = `http://127.0.0.1:${llamaServerPort}`;

  const args = [
    "--port", String(llamaServerPort),
    "--host", routerConfig.host || "127.0.0.1",
    "--threads", String(options.threads || routerConfig.threads || 4),
    "--ctx-size", String(options.ctxSize || routerConfig.ctxSize || 4096),
    "--models-max", String(options.maxModels || routerConfig.maxModelsLoaded || 4),
  ];

  // Add --metrics flag only if enabled in settings
  if (routerConfig.metricsEnabled) {
    args.push("--metrics");
  }

  const isPresetFile = modelsDir && (modelsDir.endsWith(".ini") || options.usePreset);
  const baseModelsPath = routerConfig.modelsPath || "./models";

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
          llamaServerStartTime = Date.now(); // Track start time for uptime
          
          // UPDATE METRICS SCRAPER WITH CORRECT PORT
          initializeLlamaMetricsScraper(llamaServerPort, null);
          console.log(`[LLAMA] Updated metrics scraper to port ${llamaServerPort}`);
          
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
