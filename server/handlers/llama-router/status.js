/**
 * Llama Router Status
 * Status queries and model load/unload operations
 */

import { llamaApiRequest } from "./api.js";
import { getServerProcess, getServerUrl, getRouterState } from "./start.js";

/**
 * Get llama-server status (router mode).
 * Checks if the server is running and retrieves model information.
 * @param {Object} db - Database instance.
 * @returns {Promise<Object>} Status object with running state, port, url, and model list.
 */
export async function getLlamaStatus(db) {
  const state = getRouterState(db);
  const process = getServerProcess();
  const url = getServerUrl();
  const { isPortInUse } = await import("./process.js");

  // Check if our process is actually running (not just any process on the port)
  const isRunning = state.isRunning;
  const portInUse = state.port ? await isPortInUse(state.port) : false;

  // Only consider port "in use" if our process is actually running
  // This prevents false positives when another process is using the port
  const actuallyRunning = isRunning || (portInUse && process !== null);

  let modelsStatus = null;
  let modelsError = null;

  if (actuallyRunning) {
    try {
      // Use state.url or url
      const finalUrl = url || state.url || `http://127.0.0.1:${state.port}`;

      // Add timeout protection for API call
      const timeoutMs = 2000; // Shorter timeout for status check
      const modelsPromise = llamaApiRequest("/models", "GET", null, finalUrl);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), timeoutMs)
      );

      modelsStatus = await Promise.race([modelsPromise, timeoutPromise]);
    } catch (e) {
      modelsError = e.message;
      console.warn("[LLAMA] Failed to get models status:", e.message);
    }
  }

  return {
    status: actuallyRunning ? "running" : "idle",
    port: actuallyRunning ? (state.port || null) : null,
    url: actuallyRunning ? (url || state.url || `http://127.0.0.1:${state.port}`) : null,
    processRunning: isRunning,
    mode: "router",
    models: modelsStatus?.models || [],
    modelsError: modelsError || null,
  };
}

/**
 * Load a model (router mode).
 * Sends a request to llama-server to load a specific model.
 * @param {string} modelName - Name of the model to load.
 * @returns {Promise<Object>} Result object with success status and load result or error.
 */
export async function loadModel(modelName) {
  const state = getRouterState();
  let url = getServerUrl();
  const { isPortInUse } = await import("./process.js");
  const portInUse = isPortInUse(state.port);

  // If URL is null but port is in use, build URL from state
  if (!url && portInUse) {
    url = `http://${state.host || "localhost"}:${state.port}`;
  }

  console.log("[LLAMA] Loading model:", modelName, { url, portInUse });

  if (!url) {
    return { success: false, error: "llama-server not running" };
  }

  try {
    const result = await llamaApiRequest("/models/load", "POST", { model: modelName }, url);
    console.log("[LLAMA] Load result:", result);
    return { success: true, result };
  } catch (e) {
    console.error("[LLAMA] Failed to load model:", e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Unload a model (router mode).
 * Sends a request to llama-server to unload a specific model.
 * @param {string} modelName - Name of the model to unload.
 * @returns {Promise<Object>} Result object with success status and unload result or error.
 */
export async function unloadModel(modelName) {
  const state = getRouterState();
  let url = getServerUrl();
  const { isPortInUse } = await import("./process.js");
  const portInUse = isPortInUse(state.port);

  // If URL is null but port is in use, build URL from state
  if (!url && portInUse) {
    url = `http://${state.host || "localhost"}:${state.port}`;
  }

  console.log("[LLAMA] Unloading model:", modelName, { url, portInUse });

  if (!url) {
    return { success: false, error: "llama-server not running" };
  }

  try {
    const result = await llamaApiRequest("/models/unload", "POST", { model: modelName }, url);
    console.log("[LLAMA] Unload result:", result);
    return { success: true, result };
  } catch (e) {
    console.error("[LLAMA] Failed to unload model:", e.message);
    return { success: false, error: e.message };
  }
}
