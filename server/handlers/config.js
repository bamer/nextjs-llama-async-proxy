/**
 * Config Handlers
 * Socket.IO handlers for configuration and settings
 */

import { ok, err } from "./response.js";
import { fileLogger } from "./file-logger.js";

/**
 * Register all Socket.IO event handlers for configuration and settings.
 * @param {Object} socket - Socket.IO socket instance.
 * @param {Object} db - Database instance.
 */
export function registerConfigHandlers(socket, db) {
  /**
   * Get server configuration
   */
  socket.on("config:get", (req, ack) => {
    const id = req?.requestId || Date.now();
    console.log("[CONFIG] Received config:get request, ID:", id);
    try {
      const config = db.getConfig();
      console.log("[CONFIG] Sending config:get response, ID:", id);
      const response = { success: true, data: { config }, requestId: id };
      if (typeof ack === "function") {
        ack(response);
      } else {
        socket.emit("config:get:result", response);
      }
    } catch (e) {
      console.error("[CONFIG] Error in config:get:", e.message);
      const response = {
        success: false,
        error: { message: e.message },
        requestId: id,
      };
      if (typeof ack === "function") {
        ack(response);
      } else {
        socket.emit("config:get:result", response);
      }
    }
  });

  /**
   * Update server configuration
   */
  socket.on("config:update", (req) => {
    const id = req?.requestId || Date.now();
    try {
      db.saveConfig(req?.config || {});
      // Always emit, never use ack() - client expects :result event
      socket.emit("config:update:result", {
        success: true,
        data: { config: req?.config },
        requestId: id,
      });
    } catch (e) {
      socket.emit("config:update:result", {
        success: false,
        error: { message: e.message },
        requestId: id,
      });
    }
  });

  /**
   * Get user settings
   */
  socket.on("settings:get", (req, ack) => {
    const id = req?.requestId || Date.now();
    try {
      const settings = db.getMeta("user_settings") || {};
      const response = { success: true, data: { settings }, requestId: id };
      if (typeof ack === "function") {
        ack(response);
      } else {
        socket.emit("settings:get:result", response);
      }
    } catch (e) {
      const response = {
        success: false,
        error: { message: e.message },
        requestId: id,
      };
      if (typeof ack === "function") {
        ack(response);
      } else {
        socket.emit("settings:get:result", response);
      }
    }
  });

  /**
   * Update user settings
   */
  socket.on("settings:update", (req) => {
    const id = req?.requestId || Date.now();
    try {
      const settings = req?.settings || {};
      db.setMeta("user_settings", settings);

      // Apply log level change to FileLogger if specified
      if (settings.logLevel) {
        fileLogger.logLevel = settings.logLevel;
        console.log(`[DEBUG] Log level changed to: ${settings.logLevel}`);
      }

      // Always emit, never use ack() - client expects :result event
      socket.emit("settings:update:result", { success: true, data: { settings }, requestId: id });
    } catch (e) {
      socket.emit("settings:update:result", {
        success: false,
        error: { message: e.message },
        requestId: id,
      });
    }
  });
}
