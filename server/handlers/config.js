/**
 * Config Handlers
 * Socket.IO handlers for configuration and settings
 */

import { ok, err } from "./response.js";
import { fileLogger } from "./file-logger.js";
import {
  getRouterConfig,
  saveRouterConfig,
  resetRouterConfig,
  getLoggingConfig,
  saveLoggingConfig,
  resetLoggingConfig,
} from "../db/config.js";

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

  // ============================================================
  // New Router Config Handlers (Unified Schema)
  // ============================================================

  /**
   * Get router configuration
   */
  socket.on("routerConfig:get", (req, ack) => {
    const id = req?.requestId || generateRequestId();
    console.log("[ROUTERCONFIG] Received routerConfig:get request, ID:", id);
    try {
      const config = getRouterConfig(db.db);  // Pass native DB instance
      console.log("[ROUTERCONFIG] Sending routerConfig:get response, ID:", id);
      const response = { success: true, data: { config }, requestId: id };
      if (typeof ack === "function") {
        ack(response);
      } else {
        socket.emit("routerConfig:get:result", response);
      }
    } catch (e) {
      console.error("[ROUTERCONFIG] Error in routerConfig:get:", e.message);
      const response = {
        success: false,
        error: { message: e.message },
        requestId: id,
      };
      if (typeof ack === "function") {
        ack(response);
      } else {
        socket.emit("routerConfig:get:result", response);
      }
    }
  });

  /**
   * Update router configuration
   */
  socket.on("routerConfig:update", (req) => {
    const id = req?.requestId || generateRequestId();
    console.log("[ROUTERCONFIG] Received routerConfig:update request, ID:", id);
    console.log("[ROUTERCONFIG] Update payload:", JSON.stringify(req?.config, null, 2));
    try {
      const newConfig = req?.config || {};
      const currentConfig = getRouterConfig(db.db);  // Pass native DB instance
      // Merge new config with existing (shallow merge for partial updates)
      const mergedConfig = { ...currentConfig, ...newConfig };
      const savedConfig = saveRouterConfig(db.db, mergedConfig);  // Pass native DB instance
      console.log("[ROUTERCONFIG] Router config updated successfully, ID:", id);
      socket.emit("routerConfig:update:result", {
        success: true,
        data: { config: savedConfig },
        requestId: id,
      });
    } catch (e) {
      console.error("[ROUTERCONFIG] Error in routerConfig:update:", e.message);
      socket.emit("routerConfig:update:result", {
        success: false,
        error: { message: e.message },
        requestId: id,
      });
    }
  });

  /**
   * Reset router configuration to defaults
   */
  socket.on("routerConfig:reset", (req) => {
    const id = req?.requestId || generateRequestId();
    console.log("[ROUTERCONFIG] Received routerConfig:reset request, ID:", id);
    try {
      const defaultConfig = resetRouterConfig(db.db);  // Pass native DB instance
      console.log("[ROUTERCONFIG] Router config reset to defaults, ID:", id);
      socket.emit("routerConfig:reset:result", {
        success: true,
        data: { config: defaultConfig },
        requestId: id,
      });
    } catch (e) {
      console.error("[ROUTERCONFIG] Error in routerConfig:reset:", e.message);
      socket.emit("routerConfig:reset:result", {
        success: false,
        error: { message: e.message },
        requestId: id,
      });
    }
  });

  // ============================================================
  // New Logging Config Handlers (Unified Schema)
  // ============================================================

  /**
   * Get logging configuration
   */
  socket.on("loggingConfig:get", (req, ack) => {
    const id = req?.requestId || generateRequestId();
    console.log("[LOGGINGCONFIG] Received loggingConfig:get request, ID:", id);
    try {
      const config = getLoggingConfig(db.db);  // Pass native DB instance
      console.log("[LOGGINGCONFIG] Sending loggingConfig:get response, ID:", id);
      const response = { success: true, data: { config }, requestId: id };
      if (typeof ack === "function") {
        ack(response);
      } else {
        socket.emit("loggingConfig:get:result", response);
      }
    } catch (e) {
      console.error("[LOGGINGCONFIG] Error in loggingConfig:get:", e.message);
      const response = {
        success: false,
        error: { message: e.message },
        requestId: id,
      };
      if (typeof ack === "function") {
        ack(response);
      } else {
        socket.emit("loggingConfig:get:result", response);
      }
    }
  });

  /**
   * Update logging configuration
   */
  socket.on("loggingConfig:update", (req) => {
    const id = req?.requestId || generateRequestId();
    console.log("[LOGGINGCONFIG] Received loggingConfig:update request, ID:", id);
    console.log("[LOGGINGCONFIG] Update payload:", JSON.stringify(req?.config, null, 2));
    try {
      const newConfig = req?.config || {};
      const currentConfig = getLoggingConfig(db.db);  // Pass native DB instance
      // Merge new config with existing (shallow merge for partial updates)
      const mergedConfig = { ...currentConfig, ...newConfig };
      const savedConfig = saveLoggingConfig(db.db, mergedConfig);  // Pass native DB instance
      console.log("[LOGGINGCONFIG] Logging config updated successfully, ID:", id);
      socket.emit("loggingConfig:update:result", {
        success: true,
        data: { config: savedConfig },
        requestId: id,
      });
    } catch (e) {
      console.error("[LOGGINGCONFIG] Error in loggingConfig:update:", e.message);
      socket.emit("loggingConfig:update:result", {
        success: false,
        error: { message: e.message },
        requestId: id,
      });
    }
  });

  /**
   * Reset logging configuration to defaults
   */
  socket.on("loggingConfig:reset", (req) => {
    const id = req?.requestId || generateRequestId();
    console.log("[LOGGINGCONFIG] Received loggingConfig:reset request, ID:", id);
    try {
      const defaultConfig = resetLoggingConfig(db.db);  // Pass native DB instance
      console.log("[LOGGINGCONFIG] Logging config reset to defaults, ID:", id);
      socket.emit("loggingConfig:reset:result", {
        success: true,
        data: { config: defaultConfig },
        requestId: id,
      });
    } catch (e) {
      console.error("[LOGGINGCONFIG] Error in loggingConfig:reset:", e.message);
      socket.emit("loggingConfig:reset:result", {
        success: false,
        error: { message: e.message },
        requestId: id,
      });
    }
  });
}

/**
 * Generate a unique request ID for tracking requests
 * @returns {string} Unique request ID
 */
function generateRequestId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `req_${timestamp}_${random}`;
}
