/**
 * Unified Config Module
 * SINGLE SOURCE OF TRUTH for all configuration
 * Consolidates legacy and new config formats into one clean structure
 *
 * Key principles:
 * - No more legacy/unified split - single config format
 * - Explicit port configuration (no hardcoded 8080 defaults)
 * - Validation on save to prevent contamination
 * - Clean defaults that can be overridden
 */

import pkg from "better-sqlite3";
const Database = pkg.Database;

import { getDb } from "./db-base.js";

/**
 * Unified Configuration Defaults
 * These are the ONLY defaults - no more duplicate DEFAULT_CONFIG
 */
export const UNIFIED_CONFIG_DEFAULTS = {
  // Paths (intentionally empty to force user configuration)
  modelsPath: "",
  serverPath: "",

  // Server settings
  host: "0.0.0.0",
  port: null,  // No default - MUST be explicitly configured

  // Model loading
  maxModelsLoaded: 4,
  parallelSlots: 1,

  // Inference settings
  ctxSize: 4096,
  gpuLayers: 0,
  threads: 4,
  batchSize: 512,
  ubatchSize: 512,
  temperature: 0.7,
  repeatPenalty: 1.1,

  // Features
  metricsEnabled: true,
  autoStartOnLaunch: false,

  // FIT (Flash Inference Tuning) settings
  fitEnabled: true,
  fitTarget: 1024,
  fitCtx: 4096,
};

/**
 * Alert Threshold Defaults
 * 2 levels: warning (orange) and alert (red)
 */
export const THRESHOLD_DEFAULTS = {
  cpu: { warning: 70, alert: 85 },
  memory: { warning: 75, alert: 90 },
  gpu: { warning: 80, alert: 90 },
  disk: { warning: 80, alert: 95 },
  swap: { warning: 50, alert: 70 },
};

/**
 * Legacy field mappings for migration
 * These fields should NOT exist in the unified config
 */
const LEGACY_FIELDS = [
  "baseModelsPath",
  "ctx_size",
  "batch_size",
  "auto_start_on_launch",
  "llama_server_port",
  "llama_server_host",
  "llama_server_metrics",
  "llama_server_enabled",
];

// Also export as named export for easier imports
export { LEGACY_FIELDS };

/**
 * Get unified configuration from database
 * Returns clean config without legacy fields
 * @param {Object} db - Database instance (raw or wrapper)
 * @returns {Object} Unified configuration object with defaults applied
 */
export function getUnifiedConfig(db) {
  const database = getDb(db);

  // If no database, return defaults
  if (!database) {
    console.debug("[UnifiedConfig] No database, returning defaults");
    return { ...UNIFIED_CONFIG_DEFAULTS };
  }

  try {
    const result = database
      .prepare("SELECT value FROM server_config WHERE key = ?")
      .get("config");

    if (result) {
      const parsed = JSON.parse(result.value);

      // Remove any legacy fields that may have contaminated the database
      const cleanConfig = { ...UNIFIED_CONFIG_DEFAULTS };
      for (const [key, value] of Object.entries(parsed)) {
        if (!LEGACY_FIELDS.includes(key)) {
          cleanConfig[key] = value;
        }
      }

      console.debug("[UnifiedConfig] Loaded config, port:", cleanConfig.port);
      return cleanConfig;
    }

    console.debug("[UnifiedConfig] No config found, returning defaults");
    return { ...UNIFIED_CONFIG_DEFAULTS };
  } catch (error) {
    console.error("[UnifiedConfig] Error loading config:", error.message);
    return { ...UNIFIED_CONFIG_DEFAULTS };
  }
}

/**
 * Save unified configuration to database
 * Validates and cleans config before saving
 * @param {Object} db - Database instance (raw or wrapper)
 * @param {Object} config - Configuration to save
 * @returns {Object} Saved configuration
 */
export function saveUnifiedConfig(db, config) {
  const database = getDb(db);

  if (!database) {
    throw new Error("Cannot save config: database is null");
  }

  try {
    // Warn if legacy fields are being saved
    const legacyFieldsPresent = LEGACY_FIELDS.filter((field) => config[field] !== undefined);
    if (legacyFieldsPresent.length > 0) {
      console.warn("[UnifiedConfig] Attempted to save legacy fields:", legacyFieldsPresent);
    }

    // Clean and validate config
    const cleanConfig = { ...UNIFIED_CONFIG_DEFAULTS };

    for (const [key, value] of Object.entries(config)) {
      if (!LEGACY_FIELDS.includes(key)) {
        // Type validation and conversion
        if (typeof value === "number") {
          cleanConfig[key] = value;
        } else if (typeof value === "string") {
          cleanConfig[key] = value;
        } else if (typeof value === "boolean") {
          cleanConfig[key] = value;
        }
      }
    }

    // Validate required fields
    if (cleanConfig.port === null || cleanConfig.port === undefined) {
      console.warn("[UnifiedConfig] Port is not set - llama-server may not start correctly");
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const configJson = JSON.stringify(cleanConfig);

    database.prepare(
      "INSERT OR REPLACE INTO server_config (key, value) VALUES (?, ?)"
    ).run("config", configJson);

    console.log("[UnifiedConfig] Config saved successfully, port:", cleanConfig.port);
    return cleanConfig;
  } catch (error) {
    console.error("[UnifiedConfig] Error saving config:", error.message);
    throw error;
  }
}

/**
 * Reset configuration to defaults
 * @param {Object} db - Database instance
 * @returns {Object} Default configuration
 */
export function resetUnifiedConfig(db) {
  const database = getDb(db);

  if (!database) {
    return { ...UNIFIED_CONFIG_DEFAULTS };
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const configJson = JSON.stringify(UNIFIED_CONFIG_DEFAULTS);

    database.prepare(
      "INSERT OR REPLACE INTO server_config (key, value) VALUES (?, ?)"
    ).run("config", configJson);

    console.log("[UnifiedConfig] Config reset to defaults");
    return { ...UNIFIED_CONFIG_DEFAULTS };
  } catch (error) {
    console.error("[UnifiedConfig] Error resetting config:", error.message);
    throw error;
  }
}

/**
 * Check if configuration has been set up
 * @param {Object} db - Database instance
 * @returns {boolean} True if port is configured
 */
export function isConfigured(db) {
  const config = getUnifiedConfig(db);
  return config.port !== null && config.port !== undefined && config.port !== "";
}

/**
 * Get port for llama-server, throwing if not configured
 * @param {Object} db - Database instance
 * @returns {number} Configured port
 * @throws {Error} If port not configured
 */
export function getRequiredPort(db) {
  const config = getUnifiedConfig(db);

  if (!config.port) {
    throw new Error(
      "Port not configured. Please set the llama-server port in settings."
    );
  }

  return config.port;
}

/**
 * Migrate legacy configuration to unified format
 * Call this on startup to clean existing databases
 * @param {Object} db - Database instance
 * @returns {Object} Migration result
 */
export function migrateLegacyConfig(db) {
  const database = getDb(db);

  if (!database) {
    return { migrated: false, reason: "No database" };
  }

  try {
    const result = database
      .prepare("SELECT value FROM server_config WHERE key = ?")
      .get("config");

    if (!result) {
      return { migrated: false, reason: "No config found" };
    }

    const parsed = JSON.parse(result.value);
    const legacyFieldsFound = LEGACY_FIELDS.filter((field) => parsed[field] !== undefined);

    if (legacyFieldsFound.length === 0) {
      return { migrated: false, reason: "No legacy fields found" };
    }

    // Clean legacy fields
    const cleanConfig = { ...UNIFIED_CONFIG_DEFAULTS };
    for (const [key, value] of Object.entries(parsed)) {
      if (!LEGACY_FIELDS.includes(key)) {
        cleanConfig[key] = value;
      }
    }

    // Save cleaned config
    const timestamp = Math.floor(Date.now() / 1000);
    database.prepare(
      "INSERT OR REPLACE INTO server_config (key, value) VALUES (?, ?)"
    ).run("config", JSON.stringify(cleanConfig), timestamp);

    console.log(
      `[UnifiedConfig] Migrated: removed ${legacyFieldsFound.length} legacy fields:`,
      legacyFieldsFound
    );

    return {
      migrated: true,
      fieldsRemoved: legacyFieldsFound,
    };
  } catch (error) {
    console.error("[UnifiedConfig] Migration error:", error.message);
    return { migrated: false, reason: error.message };
  }
}

export default {
  getUnifiedConfig,
  saveUnifiedConfig,
  resetUnifiedConfig,
  isConfigured,
  getRequiredPort,
  migrateLegacyConfig,
  UNIFIED_CONFIG_DEFAULTS,
  LEGACY_FIELDS,
};
