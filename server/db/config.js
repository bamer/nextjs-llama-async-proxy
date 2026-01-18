/**
 * Config Module
 * Database layer for configuration management with router and logging config support
 */

import pkg from "better-sqlite3";
const Database = pkg.Database;

/**
 * Default values for router_config table
 */
export const ROUTER_CONFIG_DEFAULTS = {
  modelsPath: "./models",
  serverPath: "/home/bamer/llama.cpp/build/bin/llama-server",
  host: "0.0.0.0",
  port: 8080,
  maxModelsLoaded: 4,
  parallelSlots: 1,
  ctxSize: 4096,
  gpuLayers: 0,
  threads: 4,
  batchSize: 512,
  temperature: 0.7,
  repeatPenalty: 1.1,
  metricsEnabled: true,
  autoStartOnLaunch: false,
};

/**
 * Default values for logging_config table
 */
export const LOGGING_CONFIG_DEFAULTS = {
  level: "info",
  maxFileSize: 10485760,
  maxFiles: 7,
  enableFileLogging: true,
  enableDatabaseLogging: true,
  enableConsoleLogging: true,
};

/**
 * Default server configuration (legacy format)
 */
const DEFAULT_CONFIG = {
  serverPath: "/home/bamer/llama.cpp/build/bin/llama-server",
  host: "localhost",
  port: 8080,
  baseModelsPath: "./models",
  ctx_size: 2048,
  batch_size: 512,
  threads: 4,
  auto_start_on_launch: false,
  llama_server_port: 8080,
  llama_server_host: "0.0.0.0",
  llama_server_metrics: true,
};

/**
 * Get the current timestamp as Unix epoch seconds
 * @returns {number} Current timestamp
 */
function getTimestamp() {
  return Math.floor(Date.now() / 1000);
}

/**
 * Get full router configuration from database
 * @param {Database} db - Better-sqlite3 database instance
 * @returns {Object} Router configuration object with defaults applied
 */
export function getRouterConfig(db) {
  console.log("[DEBUG] getRouterConfig called");
  try {
    const result = db
      .prepare("SELECT value, updated_at FROM router_config WHERE key = ?")
      .get("config");

    if (result) {
      console.log("[DEBUG] Found router_config in database, updated_at:", result.updated_at);
      const parsed = JSON.parse(result.value);
      const merged = { ...ROUTER_CONFIG_DEFAULTS, ...parsed };
      console.log("[DEBUG] Returning merged router config:", JSON.stringify(merged, null, 2));
      return merged;
    }

    console.log("[DEBUG] No router_config found, returning defaults");
    return { ...ROUTER_CONFIG_DEFAULTS };
  } catch (error) {
    console.error("[DEBUG] Error getting router config:", error.message);
    console.error("[DEBUG] Stack:", error.stack);
    return { ...ROUTER_CONFIG_DEFAULTS };
  }
}

/**
 * Save router configuration to database
 * @param {Database} db - Better-sqlite3 database instance
 * @param {Object} config - Router configuration to save
 * @returns {Object} Saved configuration
 */
export function saveRouterConfig(db, config) {
  console.log("[DEBUG] saveRouterConfig called with config:", JSON.stringify(config, null, 2));
  try {
    const timestamp = getTimestamp();
    const stmt = db.prepare(
      "INSERT OR REPLACE INTO router_config (key, value, updated_at) VALUES (?, ?, ?)"
    );

    const configJson = JSON.stringify(config);
    stmt.run("config", configJson, timestamp);

    console.log("[DEBUG] Router config saved successfully, updated_at:", timestamp);
    return getRouterConfig(db);
  } catch (error) {
    console.error("[DEBUG] Error saving router config:", error.message);
    console.error("[DEBUG] Stack:", error.stack);
    throw error;
  }
}

/**
 * Reset router configuration to defaults
 * @param {Database} db - Better-sqlite3 database instance
 * @returns {Object} Default router configuration
 */
export function resetRouterConfig(db) {
  console.log("[DEBUG] resetRouterConfig called");
  try {
    const defaults = { ...ROUTER_CONFIG_DEFAULTS };
    console.log("[DEBUG] Resetting to defaults:", JSON.stringify(defaults, null, 2));
    return saveRouterConfig(db, defaults);
  } catch (error) {
    console.error("[DEBUG] Error resetting router config:", error.message);
    return { ...ROUTER_CONFIG_DEFAULTS };
  }
}

/**
 * Get logging configuration from database
 * @param {Database} db - Better-sqlite3 database instance
 * @returns {Object} Logging configuration object with defaults applied
 */
export function getLoggingConfig(db) {
  console.log("[DEBUG] getLoggingConfig called");
  try {
    const result = db
      .prepare("SELECT value, updated_at FROM logging_config WHERE key = ?")
      .get("config");

    if (result) {
      console.log("[DEBUG] Found logging_config in database, updated_at:", result.updated_at);
      const parsed = JSON.parse(result.value);
      const merged = { ...LOGGING_CONFIG_DEFAULTS, ...parsed };
      console.log("[DEBUG] Returning merged logging config:", JSON.stringify(merged, null, 2));
      return merged;
    }

    console.log("[DEBUG] No logging_config found, returning defaults");
    return { ...LOGGING_CONFIG_DEFAULTS };
  } catch (error) {
    console.error("[DEBUG] Error getting logging config:", error.message);
    console.error("[DEBUG] Stack:", error.stack);
    return { ...LOGGING_CONFIG_DEFAULTS };
  }
}

/**
 * Save logging configuration to database
 * @param {Database} db - Better-sqlite3 database instance
 * @param {Object} config - Logging configuration to save
 * @returns {Object} Saved configuration
 */
export function saveLoggingConfig(db, config) {
  console.log("[DEBUG] saveLoggingConfig called with config:", JSON.stringify(config, null, 2));
  try {
    const timestamp = getTimestamp();
    const stmt = db.prepare(
      "INSERT OR REPLACE INTO logging_config (key, value, updated_at) VALUES (?, ?, ?)"
    );

    const configJson = JSON.stringify(config);
    stmt.run("config", configJson, timestamp);

    console.log("[DEBUG] Logging config saved successfully, updated_at:", timestamp);
    return getLoggingConfig(db);
  } catch (error) {
    console.error("[DEBUG] Error saving logging config:", error.message);
    console.error("[DEBUG] Stack:", error.stack);
    throw error;
  }
}

/**
 * Reset logging configuration to defaults
 * @param {Database} db - Better-sqlite3 database instance
 * @returns {Object} Default logging configuration
 */
export function resetLoggingConfig(db) {
  console.log("[DEBUG] resetLoggingConfig called");
  try {
    const defaults = { ...LOGGING_CONFIG_DEFAULTS };
    console.log("[DEBUG] Resetting to defaults:", JSON.stringify(defaults, null, 2));
    return saveLoggingConfig(db, defaults);
  } catch (error) {
    console.error("[DEBUG] Error resetting logging config:", error.message);
    return { ...LOGGING_CONFIG_DEFAULTS };
  }
}

/**
 * Get legacy server configuration (for backward compatibility)
 * @param {Database} db - Better-sqlite3 database instance
 * @returns {Object} Server configuration object
 */
export function getConfig(db) {
  console.log("[DEBUG] getConfig called (legacy method)");
  try {
    const saved = db
      .prepare("SELECT value FROM server_config WHERE key = ?")
      .get("config")?.value;

    if (saved) {
      console.log("[DEBUG] Found legacy server_config");
      const parsed = JSON.parse(saved);
      // Backward compatibility: rename old key to new key
      if (parsed.llama_server_enabled !== undefined && parsed.auto_start_on_launch === undefined) {
        parsed.auto_start_on_launch = parsed.llama_server_enabled;
        delete parsed.llama_server_enabled;
      }
      const merged = { ...DEFAULT_CONFIG, ...parsed };
      console.log("[DEBUG] Returning merged legacy config");
      return merged;
    }

    console.log("[DEBUG] No legacy config found, returning defaults");
    return { ...DEFAULT_CONFIG };
  } catch (error) {
    console.error("[DEBUG] Error getting legacy config:", error.message);
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Save legacy server configuration (for backward compatibility)
 * @param {Database} db - Better-sqlite3 database instance
 * @param {Object} config - Configuration to save
 */
export function saveConfig(db, config) {
  console.log("[DEBUG] saveConfig called (legacy method)");
  try {
    const query = "INSERT OR REPLACE INTO server_config (key, value) VALUES (?, ?)";
    db.prepare(query).run("config", JSON.stringify(config));
    console.log("[DEBUG] Legacy config saved successfully");
  } catch (error) {
    console.error("[DEBUG] Error saving legacy config:", error.message);
    throw error;
  }
}

/**
 * Get user settings from metadata table (for backward compatibility)
 * @param {Database} db - Better-sqlite3 database instance
 * @returns {Object} User settings object
 */
export function getSettings(db) {
  console.log("[DEBUG] getSettings called (legacy method)");
  try {
    const result = db.prepare("SELECT value FROM metadata WHERE key = ?").get("user_settings");
    if (result) {
      console.log("[DEBUG] Found user_settings in metadata");
      return JSON.parse(result.value);
    }
    console.log("[DEBUG] No user_settings found, returning empty object");
    return {};
  } catch (error) {
    console.error("[DEBUG] Error getting user settings:", error.message);
    return {};
  }
}

/**
 * Save user settings to metadata table (for backward compatibility)
 * @param {Database} db - Better-sqlite3 database instance
 * @param {Object} settings - Settings to save
 */
export function saveSettings(db, settings) {
  console.log("[DEBUG] saveSettings called (legacy method)");
  try {
    const query = "INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)";
    db.prepare(query).run("user_settings", JSON.stringify(settings));
    console.log("[DEBUG] User settings saved successfully");
  } catch (error) {
    console.error("[DEBUG] Error saving user settings:", error.message);
    throw error;
  }
}

export default {
  // Router config functions
  getRouterConfig,
  saveRouterConfig,
  resetRouterConfig,

  // Logging config functions
  getLoggingConfig,
  saveLoggingConfig,
  resetLoggingConfig,

  // Legacy compatibility functions
  getConfig,
  saveConfig,
  getSettings,
  saveSettings,

  // Constants
  ROUTER_CONFIG_DEFAULTS,
  LOGGING_CONFIG_DEFAULTS,
};
