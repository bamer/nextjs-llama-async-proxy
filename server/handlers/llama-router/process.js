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
 * Find available port for llama-server.
 * Checks ports in the default range and returns the first available one.
 * @param {Function} isPortInUse - Function to check if a port is in use.
 * @returns {Promise<number>} First available port number, or MAX_PORT+1 if none found.
 */
export async function findAvailablePort(isPortInUse) {
  for (let port = DEFAULT_LLAMA_PORT; port <= MAX_PORT; port++) {
    try {
      if (!isPortInUse(port)) {
        return port;
      }
    } catch {
      // Port check failed, skip this port
    }
  }
  return MAX_PORT + 1;
}

/**
 * Kill existing llama-server process.
 * Sends SIGTERM to the process for graceful shutdown.
 * @param {ChildProcess|null} llamaServerProcess - The process object to kill.
 * @returns {boolean} True if process was killed, false if process was null.
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
 * Check if a port is in use.
 * Uses lsof command to check if any process is listening on the port.
 * @param {number} port - Port number to check.
 * @returns {boolean} True if port is in use, false otherwise.
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
 * Find and kill llama-server on a specific port.
 * Uses lsof to find the PID and kills the process with SIGKILL.
 * @param {number} port - Port number to check and kill process on.
 * @returns {boolean} True if process was found and killed, false otherwise.
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
 * Find llama-server binary.
 * Searches common installation paths and PATH for llama-server executable.
 * @returns {string|null} Path to llama-server binary, or null if not found.
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
 * Stop llama-server process.
 * Kills the process by process reference and by port scanning.
 * @param {ChildProcess|null} llamaServerProcess - The process object to kill.
 * @param {number} llamaServerPort - Port number the server was running on.
 * @param {string} llamaServerUrl - URL of the server.
 * @param {Function} isPortInUse - Function to check if a port is in use.
 * @param {Function} killLlamaServerFn - Function to kill a process.
 * @param {Function} killLlamaOnPortFn - Function to kill process on a port.
 * @returns {Object} Result object with success status.
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

  try {
    const killed = killLlamaServerFn(llamaServerProcess);
  } catch {
    // Ignore errors from killLlamaServerFn
  }

  // Also kill by port
  for (let p = DEFAULT_LLAMA_PORT; p <= MAX_PORT; p++) {
    if (killLlamaOnPortFn(p)) {
      console.log("[LLAMA] Killed llama-server on port", p);
    }
  }

  return { success: true };
}
