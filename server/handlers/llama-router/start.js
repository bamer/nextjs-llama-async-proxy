/**
 * Start Llama Router
 * Router startup and process spawning
 */

import fs from "fs";
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

let llamaServerProcess = null;
let llamaServerPort = DEFAULT_LLAMA_PORT;
let llamaServerUrl = null;

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
  const args = [
    "--port",
    String(llamaServerPort),
    "--host",
    "127.0.0.1",
  ];

  // Determine if modelsDir is an INI preset file or a directory
  const isPresetFile = modelsDir.endsWith(".ini") || options.usePreset;
  
  if (isPresetFile) {
    // Use preset mode (INI config file)
    if (!fs.existsSync(modelsDir)) {
      return { success: false, error: `Preset file not found: ${modelsDir}` };
    }
    console.log("[LLAMA] Using preset file mode:", modelsDir);
    args.push("--models-preset", modelsDir);

    // When using preset, also add the models directory from config
    const baseModelsPath = config.baseModelsPath || "./models";
    if (fs.existsSync(baseModelsPath)) {
      console.log("[LLAMA] Adding models directory:", baseModelsPath);
      args.push("--models-dir", baseModelsPath);
    }
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
    String(optionsToUse.ctxSize || 4096)
  );

  if (optionsToUse.noAutoLoad) {
    args.push("--no-models-autoload");
  }

  console.log("[LLAMA] Command:", llamaBin, args.join(" "));

  // Spawn process
  try {
    llamaServerProcess = spawn(llamaBin, args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
    });

    llamaServerProcess.on("error", (err) => {
      console.error("[LLAMA] Process ERROR:", err.message);
    });

    llamaServerProcess.on("close", (code) => {
      console.log("[LLAMA] Process CLOSED with code:", code);
      if (llamaServerProcess) {
        llamaServerProcess = null;
      }
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
        return {
          success: false,
          error: `llama-server exited with code ${llamaServerProcess.exitCode}`,
        };
      }
    }

    return { success: false, error: "Timeout waiting for llama-server router to start" };
  } catch (e) {
    return { success: false, error: `Failed to start llama-server router: ${e.message}` };
  }
}
