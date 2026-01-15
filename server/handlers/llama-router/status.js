/**
 * Llama Router Status
 * Status queries and model load/unload operations
 */

import { llamaApiRequest } from "./api.js";
import { getServerProcess, getServerUrl, getRouterState } from "./start.js";

/**
 * Get llama-server status (router mode).
 * Checks if the server is running and retrieves model information.
 * @returns {Promise<Object>} Status object with running state, port, url, and model list.
 */
export async function getLlamaStatus() {
  const state = getRouterState();
  const process = getServerProcess();
  const url = getServerUrl();
  const { isPortInUse } = await import("./process.js");

  const isRunning = state.isRunning;
  const portInUse = state.port ? await isPortInUse(state.port) : false;

  let modelsStatus = null;
  let modelsError = null;

  if (isRunning || portInUse) {
    try {
      // Add timeout protection for API call
      const timeoutMs = 5000;
      const modelsPromise = llamaApiRequest("/models", "GET", null, url);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), timeoutMs)
      );

      modelsStatus = await Promise.race([modelsPromise, timeoutPromise]);
    } catch (e) {
      modelsError = e.message;
      console.warn("[LLAMA] Failed to get models status:", e.message);
      // Don't fail the whole status request, just log the warning
    }
  }

  return {
    status: isRunning || portInUse ? "running" : "idle",
    port: isRunning || portInUse ? state.port : null,
    url: isRunning || portInUse ? url : null,
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
