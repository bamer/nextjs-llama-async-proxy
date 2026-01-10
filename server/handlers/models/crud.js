/**
 * Models CRUD Handlers
 * Basic model CRUD operations
 */

import { ok, err } from "../response.js";

/**
 * Register models CRUD handlers
 */
export function registerModelsCrudHandlers(socket, io, db) {
  /**
   * List all models
   */
  socket.on("models:list", (req) => {
    const id = req?.requestId || Date.now();
    try {
      const models = db.getModels();
      ok(socket, "models:list:result", { models }, id);
    } catch (e) {
      err(socket, "models:list:result", e.message, id);
    }
  });

  /**
   * Get a single model
   */
  socket.on("models:get", (req) => {
    const id = req?.requestId || Date.now();
    try {
      const m = db.getModel(req?.modelId);
      m
        ? ok(socket, "models:get:result", { model: m }, id)
        : err(socket, "models:get:result", "Not found", id);
    } catch (e) {
      err(socket, "models:get:result", e.message, id);
    }
  });

  /**
   * Create a new model
   */
  socket.on("models:create", (req) => {
    const id = req?.requestId || Date.now();
    try {
      const m = db.saveModel(req?.model || {});
      io.emit("models:created", { model: m });
      ok(socket, "models:create:result", { model: m }, id);
    } catch (e) {
      err(socket, "models:create:result", e.message, id);
    }
  });

  /**
   * Update an existing model
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
   * Delete a model
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
   * Toggle favorite status
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
