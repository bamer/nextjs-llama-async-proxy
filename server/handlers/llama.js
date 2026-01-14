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
export function registerLlamaHandlers(io, db, initializeLlamaMetrics) {
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
   * Note: llama-server:status is handled in llama-router/process-handlers.js
   */
  io.on("llama:status", (req, ack) => {
    const id = req?.requestId || Date.now();
    try {
      getLlamaStatus()
        .then((status) => {
          ok(io, "llama:status:result", { status }, id, ack);
        })
        .catch((e) => {
          err(io, "llama:status:result", e.message, id, ack);
        });
    } catch (e) {
      err(io, "llama:status:result", e.message, id, ack);
    }
  });

  /**
   * Start llama server
   */
  io.on("llama:start", (req) => {
    const id = req?.requestId || Date.now();
    console.log(`[LLAMA-HANDLERS] Received llama:start event. Request ID: ${id}`); // ADDED LOG

    try {
      const config = db.getConfig();
      const settings = db.getMeta("user_settings") || {};

      const modelsDir = config.baseModelsPath;
      if (!modelsDir) {
        err(io, "llama:start:result", "No models directory configured", id); // Changed socket to io
        console.error("[LLAMA-HANDLERS] No models directory configured."); // ADDED LOG
        return;
      }
      console.log(`[LLAMA-HANDLERS] Calling startLlamaServerRouter with modelsDir: ${modelsDir}`); // ADDED LOG

      startLlamaServerRouter(modelsDir, db, {
        maxModels: settings.maxModelsLoaded || 4,
        ctxSize: config.ctx_size || 4096,
        threads: config.threads || 4,
        noAutoLoad: !settings.autoLoadModels,
      })
        .then((result) => {
          console.log(`[LLAMA-HANDLERS] startLlamaServerRouter result:`, result); // ADDED LOG
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
            ok(io, "llama:start:result", { success: true, ...result }, id); // Changed socket to io
          } else {
            err(io, "llama:start:result", result.error, id); // Changed socket to io
          }
        })
        .catch((e) => {
          console.error("[LLAMA-HANDLERS] Error in startLlamaServerRouter promise:", e.message); // ADDED LOG
          err(io, "llama:start:result", e.message, id); // Changed socket to io
        });
    } catch (e) {
      console.error("[LLAMA-HANDLERS] Error in llama:start handler:", e.message); // ADDED LOG
      err(io, "llama:start:result", e.message, id); // Changed socket to io
    }
  });

  /**
   * Restart llama server
   */
  io.on("llama:restart", (req) => {
    const id = req?.requestId || Date.now();

    stopLlamaServerRouter();

    setTimeout(() => {
      io.emit("llama:start", { requestId: id });
    }, 2000);
  });

  /**
   * Stop llama server
   */
  io.on("llama:stop", (req) => {
    const id = req?.requestId || Date.now();

    try {
      const result = stopLlamaServerRouter();
      io.emit("llama:status", { status: "idle" });
      io.emit("models:router-stopped", {});
      ok(io, "llama:stop:result", result, id);
    } catch (e) {
      err(io, "llama:stop:result", e.message, id);
    }
  });

  /**
   * Configure llama server
   */
  io.on("llama:config", (req) => {
    const id = req?.requestId || Date.now();
    try {
      const settings = req?.settings || {};
      db.setMeta("router_settings", settings);
      ok(io, "llama:config:result", { settings }, id);
    } catch (e) {
      err(io, "llama:config:result", e.message, id);
    }
  });

  /**
   * Start llama server with preset
   */
  io.on("llama:start-with-preset", (req) => {
    const id = req?.requestId || Date.now();

    try {
      const presetName = req?.presetName;
      if (!presetName) {
        err(io, "llama:start:result", "Preset name required", id);
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
            ok(io, "llama:start-with-preset:result", { success: true, ...result }, id);
          } else {
            err(io, "llama:start-with-preset:result", result.error, id);
          }
        })
        .catch((e) => {
          err(io, "llama:start-with-preset:result", e.message, id);
        });
    } catch (e) {
      err(io, "llama:start:result", e.message, id);
    }
  });
}
