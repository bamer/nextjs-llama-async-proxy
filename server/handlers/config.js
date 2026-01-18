/**
 * Config Handlers
 * Unified router and logging configuration handlers
 */

import { fileLogger } from "./file-logger.js";
import {
  getRouterConfig,
  saveRouterConfig,
  resetRouterConfig,
  getLoggingConfig,
  saveLoggingConfig,
  resetLoggingConfig,
} from "../db/config.js";

function getRequestId(req) {
  return req?.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function registerConfigHandlers(socket, db) {
  // Router Config
  socket.on("routerConfig:get", (req, callback) => {
    try {
      const config = getRouterConfig(db);
      callback({ success: true, data: { config }, timestamp: new Date().toISOString() });
    } catch (e) {
      callback({ success: false, error: e.message, timestamp: new Date().toISOString() });
    }
  });

  socket.on("routerConfig:update", (req, callback) => {
    try {
      const newConfig = req?.config || {};
      const currentConfig = getRouterConfig(db);
      const mergedConfig = { ...currentConfig, ...newConfig };
      const savedConfig = saveRouterConfig(db, mergedConfig);

      socket.broadcast.emit("routerConfig:updated", { config: savedConfig, timestamp: new Date().toISOString() });
      callback({ success: true, data: { config: savedConfig }, timestamp: new Date().toISOString() });
    } catch (e) {
      callback({ success: false, error: e.message, timestamp: new Date().toISOString() });
    }
  });

  socket.on("routerConfig:reset", (req, callback) => {
    try {
      const defaultConfig = resetRouterConfig(db);
      socket.broadcast.emit("routerConfig:updated", { config: defaultConfig, timestamp: new Date().toISOString() });
      callback({ success: true, data: { config: defaultConfig }, timestamp: new Date().toISOString() });
    } catch (e) {
      callback({ success: false, error: e.message, timestamp: new Date().toISOString() });
    }
  });

  // Logging Config
  socket.on("loggingConfig:get", (req, callback) => {
    try {
      const config = getLoggingConfig(db);
      callback({ success: true, data: { config }, timestamp: new Date().toISOString() });
    } catch (e) {
      callback({ success: false, error: e.message, timestamp: new Date().toISOString() });
    }
  });

  socket.on("loggingConfig:update", (req, callback) => {
    try {
      const newConfig = req?.config || {};
      const currentConfig = getLoggingConfig(db);
      const mergedConfig = { ...currentConfig, ...newConfig };
      const savedConfig = saveLoggingConfig(db, mergedConfig);

      if (savedConfig.logLevel) {
        fileLogger.logLevel = savedConfig.logLevel;
      }

      socket.broadcast.emit("loggingConfig:updated", { config: savedConfig, timestamp: new Date().toISOString() });
      callback({ success: true, data: { config: savedConfig }, timestamp: new Date().toISOString() });
    } catch (e) {
      callback({ success: false, error: e.message, timestamp: new Date().toISOString() });
    }
  });

  socket.on("loggingConfig:reset", (req, callback) => {
    try {
      const defaultConfig = resetLoggingConfig(db);
      socket.broadcast.emit("loggingConfig:updated", { config: defaultConfig, timestamp: new Date().toISOString() });
      callback({ success: true, data: { config: defaultConfig }, timestamp: new Date().toISOString() });
    } catch (e) {
      callback({ success: false, error: e.message, timestamp: new Date().toISOString() });
    }
  });

  // User Settings
  socket.on("settings:get", (req, ack) => {
    try {
      const settings = db.getMeta("user_settings") || {};
      ack({ success: true, data: settings });
    } catch (e) {
      ack({ success: false, error: e.message });
    }
  });

  socket.on("settings:update", (req, callback) => {
    try {
      const settings = req?.settings || {};
      db.setMeta("user_settings", settings);

      if (settings.logLevel) {
        fileLogger.logLevel = settings.logLevel;
      }

      socket.broadcast.emit("settings:updated", { settings, timestamp: new Date().toISOString() });
      callback({ success: true, data: { settings }, timestamp: new Date().toISOString() });
    } catch (e) {
      callback({ success: false, error: e.message, timestamp: new Date().toISOString() });
    }
  });
}
