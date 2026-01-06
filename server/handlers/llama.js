/**
 * Llama Handlers
 * Socket.IO handlers for llama router control
 */

import { ok, err } from "./response.js";
import {
  startLlamaServerRouter,
  stopLlamaServerRouter,
  getLlamaStatus,
} from "./llama-router/index.js";

/**
 * Register llama router handlers
 */
export function registerLlamaHandlers(socket, io, db) {
  /**
   * Get llama server status
   */
  socket.on("llama:status", (req) => {
    const id = req?.requestId || Date.now();
    try {
      getLlamaStatus()
        .then((status) => {
          ok(socket, "llama:status:result", { status }, id);
        })
        .catch((e) => {
          err(socket, "llama:status:result", e.message, id);
        });
    } catch (e) {
      err(socket, "llama:status:result", e.message, id);
    }
  });

  /**
   * Start llama server
   */
  socket.on("llama:start", (req) => {
    const id = req?.requestId || Date.now();

    try {
      const config = db.getConfig();
      const settings = db.getMeta("user_settings") || {};

      const modelsDir = config.baseModelsPath;
      if (!modelsDir) {
        err(socket, "llama:start:result", "No models directory configured", id);
        return;
      }

      startLlamaServerRouter(modelsDir, db, {
        maxModels: settings.maxModelsLoaded || 4,
        ctxSize: config.ctx_size || 4096,
        threads: config.threads || 4,
        noAutoLoad: !settings.autoLoadModels,
      })
        .then((result) => {
          if (result.success) {
            io.emit("llama:status", {
              status: "running",
              port: result.port,
              url: result.url,
              mode: "router",
            });
            ok(socket, "llama:start:result", { success: true, ...result }, id);
          } else {
            err(socket, "llama:start:result", result.error, id);
          }
        })
        .catch((e) => {
          err(socket, "llama:start:result", e.message, id);
        });
    } catch (e) {
      err(socket, "llama:start:result", e.message, id);
    }
  });

  /**
   * Restart llama server
   */
  socket.on("llama:restart", (req) => {
    const id = req?.requestId || Date.now();

    stopLlamaServerRouter();

    setTimeout(() => {
      socket.emit("llama:start", { requestId: id });
    }, 2000);
  });

  /**
   * Stop llama server
   */
  socket.on("llama:stop", (req) => {
    const id = req?.requestId || Date.now();

    try {
      const result = stopLlamaServerRouter();
      io.emit("llama:status", { status: "idle" });
      io.emit("models:router-stopped", {});
      ok(socket, "llama:stop:result", result, id);
    } catch (e) {
      err(socket, "llama:stop:result", e.message, id);
    }
  });

  /**
   * Configure llama server
   */
  socket.on("llama:config", (req) => {
    const id = req?.requestId || Date.now();
    try {
      const settings = req?.settings || {};
      db.setMeta("router_settings", settings);
      ok(socket, "llama:config:result", { settings }, id);
    } catch (e) {
      err(socket, "llama:config:result", e.message, id);
    }
  });
}
