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
    try {
      const config = db.getConfig();
      ok(socket, "config:get:result", { config }, id, ack);
    } catch (e) {
      err(socket, "config:get:result", e.message, id, ack);
    }
  });

  /**
   * Update server configuration
   */
  socket.on("config:update", (req, ack) => {
    const id = req?.requestId || Date.now();
    try {
      db.saveConfig(req?.config || {});
      ok(socket, "config:update:result", { config: req?.config }, id, ack);
    } catch (e) {
      err(socket, "config:update:result", e.message, id, ack);
    }
  });

  /**
   * Get user settings
   */
  socket.on("settings:get", (req, ack) => {
    const id = req?.requestId || Date.now();
    try {
      const settings = db.getMeta("user_settings") || {};
      ok(socket, "settings:get:result", { settings }, id, ack);
    } catch (e) {
      err(socket, "settings:get:result", e.message, id, ack);
    }
  });

  /**
   * Update user settings
   */
  socket.on("settings:update", (req, ack) => {
    const id = req?.requestId || Date.now();
    try {
      const settings = req?.settings || {};
      db.setMeta("user_settings", settings);

      // Apply log level change to FileLogger if specified
      if (settings.logLevel) {
        fileLogger.logLevel = settings.logLevel;
        console.log(`[DEBUG] Log level changed to: ${settings.logLevel}`);
      }

      ok(socket, "settings:update:result", { settings }, id, ack);
    } catch (e) {
      err(socket, "settings:update:result", e.message, id, ack);
    }
  });
}
