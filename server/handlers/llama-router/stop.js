/**
 * Stop Llama Router
 * Router shutdown and cleanup
 */

import { DEFAULT_LLAMA_PORT, MAX_PORT } from "../constants.js";
import { killLlamaServer, killLlamaOnPort } from "./process.js";
import { getServerProcess, getServerUrl } from "./start.js";

/**
 * Stop llama-server router process.
 * Kills the running llama-server process and any processes on the default port range.
 * @returns {Object} Result object with success status.
 */
export function stopLlamaServerRouter() {
  const process = getServerProcess();

  console.log("[LLAMA] === STOPPING LLAMA-SERVER ===");

  const killed = killLlamaServer(process);

  for (let p = DEFAULT_LLAMA_PORT; p <= MAX_PORT; p++) {
    killLlamaOnPort(p);
  }

  return { success: true };
}
