/**
 * Models CRUD Handlers
 * Basic model CRUD operations
 */

import { ok, err } from "../response.js";

/**
 * Register models CRUD handlers on the socket.
 * @param {object} socket - Socket.IO socket instance.
 * @param {object} io - Socket.IO server instance.
 * @param {object} db - Database instance for model operations.
 */
export function registerModelsCrudHandlers(socket, io, db) {
  /**
   * List all models from database.
   * @param {object} req - Request object containing optional requestId.
   * @param {function} ack - Acknowledgment callback function.
   */
  socket.on("models:list", (req, ack) => {
    const id = req?.requestId || Date.now();
    try {
      const models = db.getModels();
      ok(socket, "models:list:result", { models }, id, ack);
    } catch (e) {
      err(socket, "models:list:result", e.message, id, ack);
    }
  });

  /**
   * Get a single model by ID.
   * @param {object} req - Request object containing modelId and optional requestId.
   * @param {function} ack - Acknowledgment callback function.
   */
  socket.on("models:get", (req, ack) => {
    const id = req?.requestId || Date.now();
    try {
      const m = db.getModel(req?.modelId);
      m
        ? ok(socket, "models:get:result", { model: m }, id, ack)
        : err(socket, "models:get:result", "Not found", id, ack);
    } catch (e) {
      err(socket, "models:get:result", e.message, id, ack);
    }
  });

  /**
   * Create a new model in database.
   * @param {object} req - Request object containing model data and optional requestId.
   * @param {function} ack - Acknowledgment callback function.
   */
  socket.on("models:create", (req, ack) => {
    const id = req?.requestId || Date.now();
    try {
      const m = db.saveModel(req?.model || {});
      io.emit("models:created", { model: m });
      ok(socket, "models:create:result", { model: m }, id, ack);
    } catch (e) {
      err(socket, "models:create:result", e.message, id, ack);
    }
  });

  /**
   * Update an existing model by ID.
   * @param {object} req - Request object containing modelId, updates, and optional requestId.
   */
  socket.on("models:update", (req) => {
    const id = req?.requestId || Date.now();
    try {
      const m = db.updateModel(req?.modelId, req?.updates || {});
      if (m) {
        io.emit("models:updated", { model: m });
        ok(socket, "models:update:result", { model: m }, id);
      } else {
        err(socket, "models:update:result", "Not found", id);
      }
    } catch (e) {
      err(socket, "models:update:result", e.message, id);
    }
  });

  /**
   * Delete a model by ID.
   * @param {object} req - Request object containing modelId and optional requestId.
   */
  socket.on("models:delete", (req) => {
    const id = req?.requestId || Date.now();
    try {
      db.deleteModel(req?.modelId);
      io.emit("models:deleted", { modelId: req?.modelId });
      ok(socket, "models:delete:result", { deletedId: req?.modelId }, id);
    } catch (e) {
      err(socket, "models:delete:result", e.message, id);
    }
  });

  /**
   * Toggle favorite status for a model.
   * @param {object} req - Request object containing modelId, favorite boolean, and optional requestId.
   */
  socket.on("models:toggle-favorite", (req) => {
    const id = req?.requestId || Date.now();
    try {
      const m = db.toggleFavorite(req?.modelId, req?.favorite || false);
      if (m) {
        io.emit("models:updated", { model: m });
        ok(socket, "models:toggle-favorite:result", { model: m }, id);
      } else {
        err(socket, "models:toggle-favorite:result", "Not found", id);
      }
    } catch (e) {
      err(socket, "models:toggle-favorite:result", e.message, id);
    }
  });
}
