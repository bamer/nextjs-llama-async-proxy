/**
 * Llama Router Process Management
 * Process spawning, port finding, and lifecycle management
 */

import fs from "fs";
import path from "path";
import os from "os";
import { spawn, execSync } from "child_process";
import { DEFAULT_LLAMA_PORT, MAX_PORT } from "../constants.js";

/**
 * Find available port for llama-server
 */
export async function findAvailablePort(isPortInUse) {
  for (let port = DEFAULT_LLAMA_PORT; port <= MAX_PORT; port++) {
    if (!isPortInUse(port)) {
      return port;
    }
  }
  return MAX_PORT + 1;
}

/**
 * Kill existing llama-server process
 */
export function killLlamaServer(llamaServerProcess) {
  if (llamaServerProcess) {
    console.log("[LLAMA] Killing existing llama-server process...");
    llamaServerProcess.kill("SIGTERM");
    return true;
  }
  return false;
}

/**
 * Check if a port is in use
 */
export function isPortInUse(port) {
  try {
    execSync(`lsof -ti:${port} > /dev/null 2>&1`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Find and kill llama-server on a specific port
 */
export function killLlamaOnPort(port) {
  try {
    const pid = execSync(`lsof -ti:${port}`).toString().trim();
    if (pid) {
      console.log(`[LLAMA] Killing llama-server on port ${port} (PID: ${pid})`);
      execSync(`kill -9 ${pid}`);
      return true;
    }
  } catch {
    // No process on this port
  }
  return false;
}

/**
 * Find llama-server binary
 */
export function findLlamaServer() {
  const possiblePaths = [
    "/home/bamer/llama.cpp/build/bin/llama-server",
    "/home/bamer/ik_llama.cpp/build/bin/llama-server",
    "/home/bamer/.local/share/voxd/bin/llama-server",
    "/usr/local/bin/llama-server",
    "/usr/bin/llama-server",
    "/home/bamer/.local/bin/llama-server",
    path.join(os.homedir(), ".local/bin/llama-server"),
    "llama-server", // In PATH
  ];

  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        return p;
      }
    } catch {
      // Continue
    }
  }

  // Try which command
  try {
    return execSync("which llama-server").toString().trim();
  } catch {
    return null;
  }
}

/**
 * Stop llama-server
 */
export function stopLlamaServer(
  llamaServerProcess,
  llamaServerPort,
  llamaServerUrl,
  isPortInUse,
  killLlamaServerFn,
  killLlamaOnPortFn
) {
  console.log("[LLAMA] === STOPPING LLAMA-SERVER ===");

  const killed = killLlamaServerFn(llamaServerProcess);

  // Also kill by port
  for (let p = DEFAULT_LLAMA_PORT; p <= MAX_PORT; p++) {
    if (killLlamaOnPortFn(p)) {
      console.log("[LLAMA] Killed llama-server on port", p);
    }
  }

  return { success: true };
}
