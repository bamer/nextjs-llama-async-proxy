/**
 * Config Handlers
 * Socket.IO handlers for configuration and settings
 */

import { ok, err } from "./response.js";

/**
 * Register config handlers
 */
export function registerConfigHandlers(socket, db) {
  /**
   * Get server configuration
   */
  socket.on("config:get", (req) => {
    const id = req?.requestId || Date.now();
    try {
      const config = db.getConfig();
      ok(socket, "config:get:result", { config }, id);
    } catch (e) {
      err(socket, "config:get:result", e.message, id);
    }
  });

  /**
   * Update server configuration
   */
  socket.on("config:update", (req) => {
    const id = req?.requestId || Date.now();
    try {
      db.saveConfig(req?.config || {});
      ok(socket, "config:update:result", { config: req?.config }, id);
    } catch (e) {
      err(socket, "config:update:result", e.message, id);
    }
  });

  /**
   * Get user settings
   */
  socket.on("settings:get", (req) => {
    const id = req?.requestId || Date.now();
    try {
      const settings = db.getMeta("user_settings") || {};
      ok(socket, "settings:get:result", { settings }, id);
    } catch (e) {
      err(socket, "settings:get:result", e.message, id);
    }
  });

  /**
   * Update user settings
   */
  socket.on("settings:update", (req) => {
    const id = req?.requestId || Date.now();
    try {
      db.setMeta("user_settings", req?.settings || {});
      ok(socket, "settings:update:result", { settings: req?.settings }, id);
    } catch (e) {
      err(socket, "settings:update:result", e.message, id);
    }
  });
}
