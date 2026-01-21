/**
 * Models Router Operations
 * Model load/unload via router with standardized callback pattern
 */

import { loadModel, unloadModel, getLlamaStatus } from "../llama-router/index.js";

/**
 * Generate a unique request ID for tracking requests
 * @param {object} req - Request object
 * @returns {string} Request ID
 */
function getRequestId(req) {
  return req?.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Register models router operations handlers on the socket.
 * @param {object} socket - Socket.IO socket instance.
 * @param {object} io - Socket.IO server instance (for broadcasting).
 */
export function registerModelsRouterHandlers(socket, io) {
  /**
   * Load a model via the llama.cpp router.
   * CONTRACT:
   * - Input: { modelName: string }
   * - Output: { success: true, data: { modelName, status: "loaded" }, timestamp: string }
   * - Broadcasts: models:updated, llama:status
   */
  socket.on("models:load", async (req, callback) => {
    const id = getRequestId(req);
    const modelName = req?.modelName || req?.modelId;

    console.log("[DEBUG] models:load request", { requestId: id, modelName });

    try {
      const result = await loadModel(modelName);

      if (result.success) {
        // Get full status and broadcast to all clients
        const fullStatus = await getLlamaStatus();

        // Broadcast llama:status update
        socket.broadcast.emit("llama:status", {
          ...fullStatus,
          timestamp: new Date().toISOString(),
        });

        // Broadcast models:updated with full list
        socket.broadcast.emit("models:updated", {
          models: fullStatus.models || [],
          loaded: modelName,
          action: "loaded",
          timestamp: new Date().toISOString(),
        });

        console.log("[DEBUG] models:load response", { requestId: id, modelName, success: true });

        callback({
          success: true,
          data: { modelName, status: "loaded" },
          timestamp: new Date().toISOString(),
        });
      } else {
        console.error("[ERROR] models:load failed:", result.error);

        socket.broadcast.emit("models:status", {
          modelName,
          status: "error",
          error: result.error,
          timestamp: new Date().toISOString(),
        });

        callback({
          success: false,
          error: result.error || "Failed to load model",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error("[ERROR] models:load exception:", e.message);
      callback({
        success: false,
        error: e.message || "Failed to load model",
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * Unload a model via the llama.cpp router.
   * CONTRACT:
   * - Input: { modelName: string }
   * - Output: { success: true, data: { modelName, status: "unloaded" }, timestamp: string }
   * - Broadcasts: models:updated, llama:status
   */
  socket.on("models:unload", async (req, callback) => {
    const id = getRequestId(req);
    const modelName = req?.modelName || req?.modelId;

    console.log("[DEBUG] models:unload request", { requestId: id, modelName });

    try {
      const result = await unloadModel(modelName);

      if (result.success) {
        // Get full status and broadcast to all clients
        const fullStatus = await getLlamaStatus();

        // Broadcast llama:status update
        socket.broadcast.emit("llama:status", {
          ...fullStatus,
          timestamp: new Date().toISOString(),
        });

        // Broadcast models:updated with full list
        socket.broadcast.emit("models:updated", {
          models: fullStatus.models || [],
          unloaded: modelName,
          action: "unloaded",
          timestamp: new Date().toISOString(),
        });

        console.log("[DEBUG] models:unload response", { requestId: id, modelName, success: true });

        callback({
          success: true,
          data: { modelName, status: "unloaded" },
          timestamp: new Date().toISOString(),
        });
      } else {
        console.error("[ERROR] models:unload failed:", result.error);

        callback({
          success: false,
          error: result.error || "Failed to unload model",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error("[ERROR] models:unload exception:", e.message);
        callback({
          success: false,
          error: e.message || "Failed to unload model",
          timestamp: new Date().toISOString(),
        });
    }
  });
}
