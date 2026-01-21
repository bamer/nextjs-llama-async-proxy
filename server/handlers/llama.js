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
import { getUnifiedConfig } from "../db/unified-config.js";
import path from "path";

// (Removed global callback gating; per-socket broadcasts will be used in future patches)

/**
 * Register all Socket.IO event handlers for llama router control.
 * @param {Object} socket - Socket.IO socket instance.
 * @param {Object} io - Socket.IO server instance (for broadcasting).
 * @param {Object} db - Database instance.
 * @param {Function} initializeLlamaMetrics - Function to initialize metrics collection.
 */
export function registerLlamaHandlers(socket, io, db, initializeLlamaMetrics) {
  // Removed global notification callback to avoid emitting from a non-socket context

  /**
    * Get llama server status
    */
  socket.on("llama:status", (req, ack) => {
    const id = req?.requestId || Date.now();
    getLlamaStatus(db)
      .then((status) => {
        // Pass status directly - don't wrap in { status }
        ok(socket, "llama:status:result", status, id, ack);
      })
      .catch((e) => {
        err(socket, "llama:status:result", e.message, id, ack);
      });
  });

  /**
    * Start llama server
    */
   socket.on("llama:start", async (req, ack) => {
      const id = req?.requestId || Date.now();
      console.log(`[LLAMA-HANDLERS] Received llama:start event from client ${socket.id}. Request ID: ${id}`);

       try {
         const config = getUnifiedConfig(db);
         const settings = db.getMeta("user_settings") || {};
         const modelsDir = config.modelsPath;

         console.log(`[LLAMA-HANDLERS] Starting router with config:`, {
           modelsDir,
           maxModels: settings.maxModelsLoaded || 4,
           ctxSize: config.ctxSize || 4096,
           threads: config.threads || 4,
         });

        const result = await startLlamaServerRouter(modelsDir, db, {
          maxModels: settings.maxModelsLoaded || 4,
          ctxSize: config.ctxSize || 4096,
          threads: config.threads || 4,
          noAutoLoad: !settings.autoLoadModels,
        });

        console.log(`[LLAMA-HANDLERS] startLlamaServerRouter result:`, result);
        if (result.success) {
          console.log(`[LLAMA-HANDLERS] Router started successfully on port ${result.port}`);
          if (initializeLlamaMetrics) {
            initializeLlamaMetrics(result.port);
          }
          ok(socket, "llama:start:result", { success: true, ...result }, id, ack);
        } else {
          console.error(`[LLAMA-HANDLERS] Failed to start router:`, result.error);
          err(socket, "llama:start:result", result.error, id, ack);
        }
      } catch (e) {
        console.error("[LLAMA-HANDLERS] Error in llama:start handler:", e.message);
        err(socket, "llama:start:result", e.message, id, ack);
      }
    });

   /**
    * Start llama server with preset
    */
   socket.on("llama:start-with-preset", async (req, ack) => {
     const id = req?.requestId || Date.now();
     console.log(`[LLAMA-HANDLERS] Received llama:start-with-preset from client ${socket.id}: ${req?.presetName}`);

     try {
       const presetName = req?.presetName;
       if (!presetName) {
         err(socket, "llama:start-with-preset:result", "Preset name required", id, ack);
         return;
       }

       const presetPath = path.join(process.cwd(), "config", `${presetName}.ini`);
       const settings = db.getMeta("user_settings") || {};

       const result = await startLlamaServerRouter(presetPath, db, {
         maxModels: req?.maxModels || settings.maxModelsLoaded || 4,
         ctxSize: req?.ctxSize || 4096,
         threads: req?.threads || 4,
         usePreset: true,
       });

       if (result.success) {
         if (initializeLlamaMetrics) {
           initializeLlamaMetrics(result.port);
         }
         ok(socket, "llama:start-with-preset:result", { success: true, ...result }, id, ack);
       } else {
         err(socket, "llama:start-with-preset:result", result.error, id, ack);
       }
     } catch (e) {
       err(socket, "llama:start-with-preset:result", e.message, id, ack);
     }
   });

   /**
    * Restart llama server
    */
    socket.on("llama:restart", async (req, ack) => {
     const id = req?.requestId || Date.now();
    try {
      // Stop the server and wait for completion
      await stopLlamaServerRouter();
      
      // Emit status update immediately (broadcast to other clients)
      socket.broadcast.emit("llama:status", {
        status: "idle",
        port: null,
        url: null,
        mode: "router",
        timestamp: Date.now(),
      });
      
      // Small delay for clean shutdown (only 500ms)
      await new Promise(resolve => setTimeout(resolve, 500));
      
        // Start the server
        const config = getUnifiedConfig(db);
        const settings = db.getMeta("user_settings") || {};
        const modelsDir = config.modelsPath;

       const result = await startLlamaServerRouter(modelsDir, db, {
         maxModels: settings.maxModelsLoaded || 4,
         ctxSize: config.ctxSize || 4096,
         threads: config.threads || 4,
         noAutoLoad: !settings.autoLoadModels,
       });

      if (result.success) {
        if (initializeLlamaMetrics) {
          initializeLlamaMetrics(result.port);
        }
        ok(socket, "llama:restart:result", { success: true, ...result }, id);
      } else {
        err(socket, "llama:restart:result", result.error, id);
      }
    } catch (e) {
      console.error("[LLAMA-HANDLERS] Error in llama:restart handler:", e.message);
      err(socket, "llama:restart:result", e.message, id);
    }
  });

  /**
   * Stop llama server
   */
    socket.on("llama:stop", async (req) => {
    const id = req?.requestId || Date.now();
    console.log(`[LLAMA-HANDLERS] Received llama:stop from client ${socket.id}`);
    try {
      const result = await stopLlamaServerRouter();
      // Explicitly emit status update to ensure all clients see "idle" (broadcast)
      socket.broadcast.emit("llama:status", {
        status: "idle",
        port: null,
        url: null,
        mode: "router",
        timestamp: Date.now(),
      });
      socket.broadcast.emit("models:router-stopped", {});
      ok(socket, "llama:stop:result", result, id);
    } catch (e) {
      console.error("[LLAMA-HANDLERS] Error stopping llama:", e.message);
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

  // Relay server-wide events to other clients without echoing the sender
  socket.on("llama:server:event", (payload) => {
    socket.broadcast.emit("llama:server-event", payload);
  });
}
