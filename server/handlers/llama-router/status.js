/**
 * Llama Router Status
 * Status queries and model load/unload operations
 */

import { llamaApiRequest } from "./api.js";
import { getServerProcess, getServerUrl, getRouterState } from "./start.js";

/**
 * Common ports to check for running llama-server
 * Includes standard router ports (8080-8085) and alternative ports (8134, etc.)
 */
const COMMON_LLAMA_PORTS = [
  8080, 8081, 8082, 8083, 8084, 8085, // Standard router ports
  8134, 8135, 8136, 8137, 8138,       // Alternative ports
  3000, 3001, 3002,                   // Development ports
  8086, 8087, 8088, 8089, 8090,       // Extended range
];

/**
 * Try to detect if a llama-server is running on any of the common ports
 * OPTIMIZED: Checks known/configured port FIRST, then scans others
 * @returns {Promise<{port: number, url: string}|null>} Port and URL if found, null otherwise
 */
export async function detectLlamaServer(knownPort = null) {
  const { isPortInUse } = await import("./process.js");

  // FIRST: Check the known port (if provided) - fastest path
  if (knownPort) {
    if (await isPortInUse(knownPort)) {
      const url = `http://127.0.0.1:${knownPort}`;
      try {
        await Promise.race([
          llamaApiRequest("/health", "GET", null, url),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 500)),
        ]);
        console.log(`[DETECT] Found llama-server on known port ${knownPort}`);
        return { port: knownPort, url };
      } catch (e) {
        // Known port in use but not responding, continue scanning
        console.debug(`[DETECT] Known port ${knownPort} in use but not responding`);
      }
    }
  }

  // SECOND: Scan other ports in parallel batches for speed
  const batches = [];
  for (let i = 0; i < COMMON_LLAMA_PORTS.length; i += 3) {
    batches.push(COMMON_LLAMA_PORTS.slice(i, i + 3));
  }

  for (const batch of batches) {
    const results = await Promise.all(
      batch.map(async (port) => {
        if (await isPortInUse(port)) {
          const url = `http://127.0.0.1:${port}`;
          try {
            await Promise.race([
              llamaApiRequest("/health", "GET", null, url),
              new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 300)),
            ]);
            return { port, url };
          } catch (e) {
            return null;
          }
        }
        return null;
      })
    );

    const found = results.find((r) => r !== null);
    if (found) {
      console.log(`[DETECT] Found llama-server on port ${found.port} (scanned batch)`);
      return found;
    }
  }

  return null;
}

/**
 * Get llama-server status (router mode).
 * Checks if the server is running and retrieves model information.
 * @param {Object} db - Database instance.
 * @returns {Promise<Object>} Status object with running state, port, url, and model list.
 */
export async function getLlamaStatus(db) {
  const state = getRouterState(db);
  const process = getServerProcess();
  const configuredUrl = getServerUrl();
  const { isPortInUse } = await import("./process.js");

  // Check if we know about a running process
  const isRunning = state.isRunning;
  const configuredPortInUse = state.port ? await isPortInUse(state.port) : false;

  // Detect actual running llama-server if our tracked one isn't running
  // Pass the known port (state.port) for fast-path detection
  let actualServer = null;
  if (!isRunning && !configuredPortInUse) {
    actualServer = await detectLlamaServer(state.port);
  }

  // Determine if server is actually running
  let actuallyRunning = isRunning;

  // If no tracked process but port is in use, check if it's responding
  if (!actuallyRunning && (configuredPortInUse || actualServer)) {
    const testUrl = actualServer?.url || configuredUrl || state.url || `http://127.0.0.1:${state.port}`;
    try {
      const testPromise = llamaApiRequest("/health", "GET", null, testUrl);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 1000)
      );
      await Promise.race([testPromise, timeoutPromise]);
      actuallyRunning = true; // API responded, server is running
    } catch (e) {
      console.warn("[LLAMA] Port in use but API not responding:", e.message);
      actuallyRunning = false;
    }
  }

  // Determine the final port and URL
  let finalPort = state.port;
  let finalUrl = configuredUrl || state.url || `http://127.0.0.1:${state.port}`;

  // If we detected a server on a different port, use that instead
  if (actuallyRunning && actualServer) {
    finalPort = actualServer.port;
    finalUrl = actualServer.url;
    console.log(`[LLAMA] Detected llama-server on different port: ${finalPort}`);
  }

  let modelsStatus = null;
  let modelsError = null;

  if (actuallyRunning) {
    try {
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
    port: actuallyRunning ? finalPort : null,
    url: actuallyRunning ? finalUrl : null,
    processRunning: isRunning,
    mode: "router",
    // API returns { data: [...], object: "list" } - use .data for models array
    models: modelsStatus?.data || modelsStatus?.models || [],
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
