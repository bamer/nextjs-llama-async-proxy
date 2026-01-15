/**
 * Models Router Operations
 * Model load/unload via router
 */

import { ok, err } from "../response.js";
import { loadModel, unloadModel } from "../llama-router/index.js";

/**
 * Register models router operations handlers on the socket.
 * @param {object} socket - Socket.IO socket instance.
 * @param {object} io - Socket.IO server instance.
 */
export function registerModelsRouterHandlers(socket, io) {
  /**
   * Load a model via the llama.cpp router.
   * @param {object} req - Request object containing modelName/modelId and optional requestId.
   */
  socket.on("models:load", (req) => {
    const id = req?.requestId || Date.now();
    const modelName = req?.modelName || req?.modelId;

    loadModel(modelName)
      .then((result) => {
        if (result.success) {
          io.emit("models:status", { modelName, status: "loaded" });
          ok(socket, "models:load:result", { modelName, status: "loaded" }, id);
        } else {
          io.emit("models:status", { modelName, status: "error", error: result.error });
          err(socket, "models:load:result", result.error, id);
        }
      })
      .catch((e) => {
        err(socket, "models:load:result", e.message, id);
      });
  });

  /**
   * Unload a model via the llama.cpp router.
   * @param {object} req - Request object containing modelName/modelId and optional requestId.
   */
  socket.on("models:unload", (req) => {
    const id = req?.requestId || Date.now();
    const modelName = req?.modelName || req?.modelId;

    unloadModel(modelName)
      .then((result) => {
        if (result.success) {
          io.emit("models:status", { modelName, status: "unloaded" });
          ok(socket, "models:unload:result", { modelName, status: "unloaded" }, id);
        } else {
          err(socket, "models:unload:result", result.error, id);
        }
      })
      .catch((e) => {
        err(socket, "models:unload:result", e.message, id);
      });
  });
}
