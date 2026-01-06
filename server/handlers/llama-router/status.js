/**
 * Llama Router Status
 * Status queries and model load/unload operations
 */

import { llamaApiRequest } from "./api.js";
import { getServerProcess, getServerUrl, getRouterState } from "./start.js";

/**
 * Get llama-server status (router mode)
 */
export async function getLlamaStatus() {
  const state = getRouterState();
  const process = getServerProcess();
  const url = getServerUrl();
  const { isPortInUse } = await import("./process.js");

  const isRunning = state.isRunning;
  const portInUse = isPortInUse(state.port);

  let modelsStatus = null;

  if (isRunning || portInUse) {
    try {
      modelsStatus = await llamaApiRequest("/models", "GET", null, url);
    } catch (e) {
      console.warn("[LLAMA] Failed to get models status:", e.message);
    }
  }

  return {
    status: isRunning || portInUse ? "running" : "idle",
    port: isRunning || portInUse ? state.port : null,
    url: isRunning || portInUse ? url : null,
    processRunning: isRunning,
    mode: "router",
    models: modelsStatus?.models || [],
  };
}

/**
 * Load a model (router mode)
 */
export async function loadModel(modelName) {
  const url = getServerUrl();

  console.log("[LLAMA] Loading model:", modelName);

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
 * Unload a model (router mode)
 */
export async function unloadModel(modelName) {
  const url = getServerUrl();

  console.log("[LLAMA] Unloading model:", modelName);

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
