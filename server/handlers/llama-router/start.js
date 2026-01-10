/**
 * Start Llama Router
 * Router startup and process spawning
 */

import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { DEFAULT_LLAMA_PORT, MAX_PORT } from "../constants.js";
import {
  findLlamaServer,
  isPortInUse,
  killLlamaServer,
  killLlamaOnPort,
  findAvailablePort,
} from "./process.js";
import { llamaApiRequest } from "./api.js";

// Module-level state
let llamaServerProcess = null;
let llamaServerPort = DEFAULT_LLAMA_PORT;
let llamaServerUrl = null;
let logWriteStream = null;
let notificationCallback = null;

// Logs directory
const LOGS_DIR = path.join(process.cwd(), "logs");
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

/**
 * Set callback for server events (start, stop, error)
 * Called by handlers/llama.js when registering handlers
 */
export function setNotificationCallback(cb) {
  notificationCallback = cb;
}

/**
 * Notify clients about server events
 */
function notifyServerEvent(event, data) {
  console.log(`[LLAMA-NOTIFY] ${event}:`, data);
  if (notificationCallback) {
    notificationCallback(event, data);
  }
}

/**
 * Initialize log file for llama-server output
 */
function initLogFile() {
  const logFile = path.join(LOGS_DIR, "llama-server.log");

  // Create or truncate log file
  logWriteStream = fs.createWriteStream(logFile, { flags: "w" });

  logWriteStream.write(`# Llama Server Log - Started at ${new Date().toISOString()}\n`);
  logWriteStream.write(`# ============================================\n\n`);

  return logFile;
}

/**
 * Write to log file
 */
function writeLog(level, message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${level}] ${message}\n`;

  if (logWriteStream) {
    logWriteStream.write(logLine);
  }

  // Also print to console
  if (level === "ERROR") {
    console.error(`[LLAMA-LOG] ${message}`);
  } else {
    console.log(`[LLAMA-LOG] ${message}`);
  }
}

/**
 * Close log file
 */
function closeLogFile() {
  if (logWriteStream) {
    logWriteStream.write(`\n# Log closed at ${new Date().toISOString()}\n`);
    logWriteStream.end();
    logWriteStream = null;
  }
}

/**
 * Get current router state
 */
export function getRouterState() {
  return {
    process: llamaServerProcess,
    port: llamaServerPort,
    url: llamaServerUrl,
    isRunning: llamaServerProcess !== null && llamaServerProcess.exitCode === null,
  };
}

/**
 * Get server URL
 */
export function getServerUrl() {
  return llamaServerUrl;
}

/**
 * Get server process
 */
export function getServerProcess() {
  return llamaServerProcess;
}

/**
 * Start llama-server in router mode
 * Can use either --models-dir (auto-discovery) or --models-preset (INI config file)
 */
export async function startLlamaServerRouter(modelsDir, db, options = {}) {
  console.log("[LLAMA] === STARTING LLAMA-SERVER IN ROUTER MODE ===");
  console.log("[LLAMA] Models directory/preset:", modelsDir);
  console.log("[LLAMA] Options:", options);

  const llamaBin = findLlamaServer();
  if (!llamaBin) {
    const error = "llama-server binary not found! Install llama.cpp or add to PATH.";
    console.error("[LLAMA] ERROR:", error);
    return { success: false, error };
  }
  console.log("[LLAMA] Using binary:", llamaBin);

  // Kill any existing llama-server
  console.log("[LLAMA] Cleaning up existing processes...");
  killLlamaServer(llamaServerProcess);
  for (let p = DEFAULT_LLAMA_PORT; p <= MAX_PORT; p++) {
    killLlamaOnPort(p);
  }

  // Get port from config
  const config = db.getConfig();
  const configuredPort = config.port || 8080;

  if (!(await isPortInUse(configuredPort))) {
    llamaServerPort = configuredPort;
  } else {
    llamaServerPort = await findAvailablePort(isPortInUse);
  }

  llamaServerUrl = `http://127.0.0.1:${llamaServerPort}`;
  console.log("[LLAMA] Final port:", llamaServerPort);

  // Build command - support both directory and preset file modes
  const optionsToUse = options || {};
  const args = ["--port", String(llamaServerPort), "--host", "127.0.0.1"];

  // Determine if modelsDir is an INI preset file or a directory
  const isPresetFile = modelsDir.endsWith(".ini") || options.usePreset;

  if (isPresetFile) {
    // Use preset mode (INI config file)
    if (!fs.existsSync(modelsDir)) {
      return { success: false, error: `Preset file not found: ${modelsDir}` };
    }
    console.log("[LLAMA] Using preset file mode:", modelsDir);
    args.push("--models-preset", modelsDir);

    // In router mode, ALWAYS add the models directory from config for auto-discovery
    // Create the directory if it doesn't exist
    const baseModelsPath = config.baseModelsPath || "./models";

    // Ensure the directory exists
    if (!fs.existsSync(baseModelsPath)) {
      console.log("[LLAMA] Creating models directory:", baseModelsPath);
      try {
        fs.mkdirSync(baseModelsPath, { recursive: true });
      } catch (e) {
        console.error("[LLAMA] Failed to create models directory:", e.message);
      }
    }

    console.log("[LLAMA] Adding models directory for router mode:", baseModelsPath);
    args.push("--models-dir", baseModelsPath);
  } else {
    // Use directory mode (auto-discovery)
    if (!fs.existsSync(modelsDir)) {
      return { success: false, error: `Models directory not found: ${modelsDir}` };
    }
    console.log("[LLAMA] Using models directory mode:", modelsDir);
    args.push("--models-dir", modelsDir);
  }

  // Add common options
  args.push(
    "--models-max",
    String(optionsToUse.maxModels || 4),
    "--threads",
    String(optionsToUse.threads || 4),
    "--ctx-size",
    String(optionsToUse.ctxSize || 4096),
    "--metrics"
  );

  if (optionsToUse.noAutoLoad) {
    args.push("--no-models-autoload");
  }

  // Quote paths with spaces to handle paths like "/media/bamer/crucial MX300/..."
  const quotePath = (p) => (p && p.includes(" ") ? `"${p}"` : p);

  console.log("[LLAMA] Command:", llamaBin, args.map(quotePath).join(" "));

  // Initialize log file for llama-server output
  initLogFile();
  writeLog(
    "INFO",
    `Starting llama-server with command: ${llamaBin} ${args.map(quotePath).join(" ")}`
  );

  // Spawn process
  try {
    llamaServerProcess = spawn(llamaBin, args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
    });

    // Pipe stdout/stderr to log file
    if (llamaServerProcess.stdout) {
      llamaServerProcess.stdout.on("data", (data) => {
        const message = data.toString().trim();
        if (message) {
          writeLog("INFO", message);
        }
      });
    }

    if (llamaServerProcess.stderr) {
      llamaServerProcess.stderr.on("data", (data) => {
        const message = data.toString().trim();
        if (message) {
          writeLog("ERROR", message);
        }
      });
    }

    // Cleanup function for process
    const cleanupProcess = () => {
      console.log("[LLAMA] Cleaning up process...");
      writeLog("INFO", "Cleaning up llama-server process...");

      if (llamaServerProcess) {
        try {
          if (!llamaServerProcess.killed) {
            console.log("[LLAMA] Killing process...");
            writeLog("INFO", "Sending SIGTERM to llama-server process");
            llamaServerProcess.kill("SIGTERM");
            // Force kill after 5 seconds
            setTimeout(() => {
              if (llamaServerProcess && !llamaServerProcess.killed) {
                console.log("[LLAMA] Force killing process...");
                writeLog("INFO", "Force killing llama-server process with SIGKILL");
                llamaServerProcess.kill("SIGKILL");
              }
            }, 5000);
          }
        } catch (e) {
          console.error("[LLAMA] Error during process cleanup:", e);
          writeLog("ERROR", `Error during cleanup: ${e.message}`);
        }
      }

      // Close log file
      closeLogFile();

      // Notify clients that server stopped
      notifyServerEvent("stopped", {
        port: llamaServerPort,
        url: llamaServerUrl,
        timestamp: Date.now(),
      });
    };

    llamaServerProcess.on("error", (err) => {
      console.error("[LLAMA] Process ERROR:", err.message);
      writeLog("ERROR", `Process error: ${err.message}`);
      console.log("[LLAMA] Cleaning up after error");
      cleanupProcess();
      llamaServerProcess = null;

      // Notify clients about error
      notifyServerEvent("error", {
        error: err.message,
        port: llamaServerPort,
        timestamp: Date.now(),
      });
    });

    llamaServerProcess.on("close", (code, signal) => {
      console.log("[LLAMA] Process CLOSED with code:", code, "signal:", signal);
      writeLog("INFO", `Process closed with code ${code}, signal: ${signal}`);
      console.log("[LLAMA] Cleaning up after close");
      cleanupProcess();
      llamaServerProcess = null;

      // Notify clients about close
      notifyServerEvent("closed", {
        code,
        signal,
        port: llamaServerPort,
        timestamp: Date.now(),
      });
    });

    // Handle process exit
    process.on("exit", () => {
      console.log("[LLAMA] Process exit detected, cleaning up");
      cleanupProcess();
    });

    // Wait for server
    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 1000));
      attempts++;

      if (isPortInUse(llamaServerPort)) {
        try {
          await llamaApiRequest("/models", "GET", null, llamaServerUrl);
          console.log("[LLAMA] Router server successfully started on port", llamaServerPort);
          writeLog("INFO", `Router server successfully started on port ${llamaServerPort}`);

          // Notify clients that server started
          notifyServerEvent("started", {
            port: llamaServerPort,
            url: llamaServerUrl,
            mode: "router",
            timestamp: Date.now(),
          });

          return {
            success: true,
            port: llamaServerPort,
            url: llamaServerUrl,
            mode: "router",
          };
        } catch {
          // Continue waiting
        }
      }

      if (llamaServerProcess && llamaServerProcess.exitCode !== null) {
        writeLog("ERROR", `llama-server exited with code ${llamaServerProcess.exitCode}`);
        return {
          success: false,
          error: `llama-server exited with code ${llamaServerProcess.exitCode}`,
        };
      }
    }

    writeLog("ERROR", "Timeout waiting for llama-server router to start");
    return { success: false, error: "Timeout waiting for llama-server router to start" };
  } catch (e) {
    return { success: false, error: `Failed to start llama-server router: ${e.message}` };
  }
}
