/**
 * Models CRUD Handlers
 * Basic model CRUD operations with standardized callback pattern
 */

import { ok, err } from "../response.js";

/**
 * Generate a unique request ID for tracking requests
 * @param {object} req - Request object
 * @returns {string} Request ID
 */
function getRequestId(req) {
  return req?.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Register models CRUD handlers on the socket.
 * @param {object} socket - Socket.IO socket instance.
 * @param {object} io - Socket.IO server instance (for broadcasting).
 * @param {object} db - Database instance for model operations.
 */
export function registerModelsCrudHandlers(socket, io, db) {
  /**
   * List all models from database.
   * CONTRACT:
   * - Input: {}
   * - Output: { success: true, data: { models: Model[] }, timestamp: string }
   */
  socket.on("models:list", (req, ack) => {
    console.log("[DEBUG] models:list request");
  
    try {
      const models = db.getModels();
      console.log("[DEBUG] models:list response", { count: models.length });
  
      if (typeof ack === "function") {
        ack({
          success: true,
          data: models,
        });
      }
    } catch (e) {
      console.error("[ERROR] models:list failed:", e.message);
      if (typeof ack === "function") {
        ack({
          success: false,
          error: e.message || "Failed to list models",
        });
      }
    }
  });

  /**
   * Get a single model by ID.
   * CONTRACT:
   * - Input: { modelId: string }
   * - Output: { success: true, data: { model: Model }, timestamp: string }
   * - Error: { success: false, error: string, timestamp: string }
   */
  socket.on("models:get", (req, callback) => {
    const id = getRequestId(req);
    console.log("[DEBUG] models:get request", { requestId: id, modelId: req?.modelId });

    try {
      const model = db.getModel(req?.modelId);
      if (model) {
        callback({
          success: true,
          data: { model },
          timestamp: new Date().toISOString(),
        });
      } else {
        callback({
          success: false,
          error: "Model not found",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error("[ERROR] models:get failed:", e.message);
      callback({
        success: false,
        error: e.message || "Failed to get model",
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * Create a new model in database.
   * CONTRACT:
   * - Input: { model: { name: string, path: string, ... } }
   * - Output: { success: true, data: { model: Model }, timestamp: string }
   * - Broadcasts: models:created
   */
  socket.on("models:create", (req, callback) => {
    const id = getRequestId(req);
    console.log("[DEBUG] models:create request", { requestId: id, modelName: req?.model?.name });

    try {
      const model = db.saveModel(req?.model || {});
      console.log("[DEBUG] models:created", { requestId: id, modelId: model.id });

      // Broadcast to all clients
      socket.broadcast.emit("models:created", {
        model,
        timestamp: new Date().toISOString(),
      });

      callback({
        success: true,
        data: { model },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[ERROR] models:create failed:", e.message);
      callback({
        success: false,
        error: e.message || "Failed to create model",
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * Update an existing model by ID.
   * CONTRACT:
   * - Input: { modelId: string, updates: { ... } }
   * - Output: { success: true, data: { model: Model }, timestamp: string }
   * - Broadcasts: models:updated
   */
  socket.on("models:update", (req, callback) => {
    const id = getRequestId(req);
    console.log("[DEBUG] models:update request", { requestId: id, modelId: req?.modelId });

    try {
      const model = db.updateModel(req?.modelId, req?.updates || {});
      if (model) {
        console.log("[DEBUG] models:updated", { requestId: id, modelId: model.id });

        // Broadcast to all clients
        socket.broadcast.emit("models:updated", {
          model,
          timestamp: new Date().toISOString(),
        });

        callback({
          success: true,
          data: { model },
          timestamp: new Date().toISOString(),
        });
      } else {
        callback({
          success: false,
          error: "Model not found",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error("[ERROR] models:update failed:", e.message);
      callback({
        success: false,
        error: e.message || "Failed to update model",
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * Delete a model by ID.
   * CONTRACT:
   * - Input: { modelId: string }
   * - Output: { success: true, data: { deletedId: string }, timestamp: string }
   * - Broadcasts: models:deleted
   */
  socket.on("models:delete", (req, callback) => {
    const id = getRequestId(req);
    console.log("[DEBUG] models:delete request", { requestId: id, modelId: req?.modelId });

    try {
      db.deleteModel(req?.modelId);
      console.log("[DEBUG] models:deleted", { requestId: id, modelId: req?.modelId });

      // Broadcast to all clients
      socket.broadcast.emit("models:deleted", {
        modelId: req?.modelId,
        timestamp: new Date().toISOString(),
      });

      callback({
        success: true,
        data: { deletedId: req?.modelId },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[ERROR] models:delete failed:", e.message);
      callback({
        success: false,
        error: e.message || "Failed to delete model",
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * Toggle favorite status for a model.
   * CONTRACT:
   * - Input: { modelId: string, favorite: boolean }
   * - Output: { success: true, data: { model: Model }, timestamp: string }
   * - Broadcasts: models:updated
   */
  socket.on("models:toggle-favorite", (req, callback) => {
    const id = getRequestId(req);
    console.log("[DEBUG] models:toggle-favorite request", { requestId: id, modelId: req?.modelId, favorite: req?.favorite });

    try {
      const model = db.toggleFavorite(req?.modelId, req?.favorite || false);
      if (model) {
        console.log("[DEBUG] models:toggle-favorite updated", { requestId: id, modelId: model.id });

        // Broadcast to all clients
        socket.broadcast.emit("models:updated", {
          model,
          timestamp: new Date().toISOString(),
        });

        callback({
          success: true,
          data: { model },
          timestamp: new Date().toISOString(),
        });
      } else {
        callback({
          success: false,
          error: "Model not found",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error("[ERROR] models:toggle-favorite failed:", e.message);
      callback({
        success: false,
        error: e.message || "Failed to toggle favorite",
        timestamp: new Date().toISOString(),
      });
    }
  });
}
