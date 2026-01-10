/**
 * Llama Handlers
 * Socket.IO handlers for llama router control
 */

import { ok, err } from "./response.js";
import {
  startLlamaServerRouter,
  stopLlamaServerRouter,
  getLlamaStatus,
  setNotificationCallback,
} from "./llama-router/index.js";
import path from "path";

/**
 * Register llama router handlers
 */
export function registerLlamaHandlers(socket, io, db, initializeLlamaMetrics) {
  // Set up notification callback to broadcast server events to all clients
  setNotificationCallback((event, data) => {
    console.log(`[LLAMA-HANDLERS] Broadcasting event: ${event}`, data);

    // Broadcast to all clients
    io.emit("llama:server-event", {
      type: event,
      data: {
        ...data,
        status: event === "started" ? "running" : event === "stopped" ? "idle" : "unknown",
      },
    });

    // Also emit specific events for clients listening
    if (event === "started") {
      io.emit("llama:status", {
        status: "running",
        port: data.port,
        url: data.url,
        mode: data.mode || "router",
      });
    } else if (event === "stopped" || event === "closed") {
      io.emit("llama:status", { status: "idle" });
      io.emit("models:router-stopped", {});
    } else if (event === "error") {
      io.emit("llama:status", {
        status: "error",
        error: data.error,
      });
    }
  });
  /**
   * Get llama server status (llama:status)
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
   * Get llama-server status (llama-server:status) - used by frontend on page reload
   * This ensures the frontend can detect if the server is already running
   */
  socket.on("llama-server:status", (req) => {
    const id = req?.requestId || Date.now();
    try {
      getLlamaStatus()
        .then((status) => {
          console.log("[DEBUG] llama-server:status returning:", status);
          ok(socket, "llama-server:status:result", { status }, id);
        })
        .catch((e) => {
          console.error("[DEBUG] llama-server:status error:", e);
          err(socket, "llama-server:status:result", e.message, id);
        });
    } catch (e) {
      console.error("[DEBUG] llama-server:status exception:", e);
      err(socket, "llama-server:status:result", e.message, id);
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
            // Initialize metrics scraper when server starts
            if (initializeLlamaMetrics) {
              initializeLlamaMetrics(result.port);
            }
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

  /**
   * Start llama server with preset
   */
  socket.on("llama:start-with-preset", (req) => {
    const id = req?.requestId || Date.now();

    try {
      const presetName = req?.presetName;
      if (!presetName) {
        err(socket, "llama:start:result", "Preset name required", id);
        return;
      }

      const presetPath = path.join(process.cwd(), "config", `${presetName}.ini`);
      const settings = db.getMeta("user_settings") || {};

      startLlamaServerRouter(presetPath, db, {
        maxModels: req?.maxModels || settings.maxModelsLoaded || 4,
        ctxSize: req?.ctxSize || 4096,
        threads: req?.threads || settings.threads || 4,
        usePreset: true,
      })
        .then((result) => {
          if (result.success) {
            // Initialize metrics scraper when server starts
            if (initializeLlamaMetrics) {
              initializeLlamaMetrics(result.port);
            }
            io.emit("llama:status", {
              status: "running",
              port: result.port,
              url: result.url,
              mode: "router",
              preset: presetName,
            });
            ok(socket, "llama:start-with-preset:result", { success: true, ...result }, id);
          } else {
            err(socket, "llama:start-with-preset:result", result.error, id);
          }
        })
        .catch((e) => {
          err(socket, "llama:start-with-preset:result", e.message, id);
        });
    } catch (e) {
      err(socket, "llama:start:result", e.message, id);
    }
  });
}
