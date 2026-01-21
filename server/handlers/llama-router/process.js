/**
 * Llama Router Process Management
 * Process spawning, port finding, and lifecycle management
 * FIXED: Uses reliable net.connect for port checking
 * Uses unified config for port discovery
 */

import fs from "fs";
import path from "path";
import os from "os";
import net from "net";
import { exec } from "child_process";
import { promisify } from "util";
import { MAX_PORT } from "../constants.js";
import { getUnifiedConfig } from "../../db/unified-config.js";

const execAsync = promisify(exec);

/**
 * Get the default starting port from config.
 * Falls back to a reasonable default if not configured.
 */
async function getDefaultStartPort(db) {
  if (db) {
    try {
      const config = getUnifiedConfig(db);
      if (config.port) {
        return config.port;
      }
    } catch (e) {
      // Ignore
    }
  }
  // No hardcoded default - caller should handle this
  return null;
}

/**
 * Find available port for llama-server starting from configured port.
 */
export async function findAvailablePort(db, isPortInUseFn) {
  const startPort = await getDefaultStartPort(db);
  if (!startPort) {
    throw new Error("Port not configured. Cannot find available port.");
  }

  for (let port = startPort; port <= MAX_PORT; port++) {
    if (!(await isPortInUseFn(port))) {
      return port;
    }
  }
  return MAX_PORT + 1;
}

/**
 * Kill existing llama-server process gracefully.
 */
export function killLlamaServer(llamaServerProcess) {
  if (llamaServerProcess && !llamaServerProcess.killed) {
    console.log("[LLAMA] Killing existing llama-server process...");
    llamaServerProcess.kill("SIGTERM");
    return true;
  }
  return false;
}

/**
 * Check if a port is in use using a socket connection.
 */
export function isPortInUse(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 1000;

    socket.setTimeout(timeout);
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, "127.0.0.1", () => {
      socket.destroy();
      resolve(true);
    });
  });
}

/**
 * Find and kill llama-server on a specific port.
 */
export async function killLlamaOnPort(port) {
  try {
    const { stdout } = await execAsync(`lsof -ti:${port}`);
    const pid = stdout.trim();
    if (pid) {
      console.log(`[LLAMA] Killing llama-server on port ${port} (PID: ${pid})`);
      // Kill all processes on that port
      const pids = pid.split("\n");
      for (const p of pids) {
        if (p.trim()) {
          try { await execAsync(`kill -9 ${p.trim()}`); } catch (e) { /* ignore */ }
        }
      }
      return true;
    }
  } catch {
    // No process on this port
  }
  return false;
}

/**
 * Find llama-server binary.
 */
export function findLlamaServer() {
  const possiblePaths = [
    "/home/bamer/llama.cpp/build/bin/llama-server",
    "/home/bamer/.local/share/voxd/bin/llama-server",
    "/usr/local/bin/llama-server",
    "/usr/bin/llama-server",
    "/home/bamer/.local/bin/llama-server",
    path.join(os.homedir(), ".local/bin/llama-server"),
    "llama-server",
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }

  return null;
}

/**
 * Stop llama-server process asynchronously.
 */
export async function stopLlamaServer(
  llamaServerProcess,
  llamaServerPort,
  llamaServerUrl,
  isPortInUseFn,
  killLlamaServerFn,
  killLlamaOnPortFn
) {
  console.log("[LLAMA] === STOPPING LLAMA-SERVER ===");

  killLlamaServerFn(llamaServerProcess);

  if (llamaServerPort) {
    await killLlamaOnPortFn(llamaServerPort);
  }

  return { success: true };
}
