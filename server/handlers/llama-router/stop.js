/**
 * Stop Llama Router
 * Router shutdown and cleanup
 */

import { DEFAULT_LLAMA_PORT, MAX_PORT } from "../constants.js";
import { killLlamaServer, killLlamaOnPort } from "./process.js";
import { getServerProcess, getServerUrl } from "./start.js";

/**
 * Stop llama-server router process asynchronously.
 * Kills the running llama-server process and any processes on the configured ports.
 * @returns {Promise<Object>} Result object with success status.
 */
export async function stopLlamaServerRouter() {
  const { getRouterState } = await import("./start.js");
  const state = getRouterState();
  const process = getServerProcess();

  console.log("[LLAMA] === STOPPING LLAMA-SERVER ===");
  console.log("[LLAMA] Current state:", { port: state.port, url: state.url, isRunning: state.isRunning });

  // Kill our process if it exists
  const killed = killLlamaServer(process);
  console.log("[LLAMA] Kill process result:", killed);

  // Kill on our configured port
  if (state.port) {
    console.log("[LLAMA] Killing on configured port:", state.port);
    await killLlamaOnPort(state.port);
  }

  // Also kill on default port as fallback
  if (DEFAULT_LLAMA_PORT !== state.port) {
    console.log("[LLAMA] Killing on default port:", DEFAULT_LLAMA_PORT);
    await killLlamaOnPort(DEFAULT_LLAMA_PORT);
  }

  // Small delay to ensure port is released
  await new Promise(r => setTimeout(r, 500));

  console.log("[LLAMA] === STOP COMPLETE ===");
  return { success: true, port: state.port };
}
