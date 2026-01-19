/**
 * Config Repository
 * Wrapper for legacy API - delegates to unified config module
 *
 * DEPRECATED: This is a legacy wrapper. Use getUnifiedConfig/saveUnifiedConfig from unified-config.js instead.
 * This class exists to maintain backward compatibility with code using db.config.get().
 */

import {
  getUnifiedConfig,
  saveUnifiedConfig,
  LEGACY_FIELDS,
} from "./unified-config.js";
import { getRouterConfig, saveRouterConfig, getLoggingConfig, saveLoggingConfig } from "./config.js";

// Map unified config keys to legacy keys for backward compatibility
const KEY_MAP = {
  modelsPath: "baseModelsPath",
  serverPath: "serverPath",
  host: "llama_server_host",
  port: "llama_server_port",
  threads: "threads",
  ctxSize: "ctx_size",
  batchSize: "batch_size",
  autoStartOnLaunch: "auto_start_on_launch",
  metricsEnabled: "llama_server_metrics",
};

// Reverse map (legacy to unified)
const REVERSE_KEY_MAP = Object.fromEntries(Object.entries(KEY_MAP).map(([k, v]) => [v, k]));

export class ConfigRepository {
  /**
   * @param {Object} db - Better-sqlite3 database instance
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Get server configuration with defaults
   * Uses the unified config module for clean data
   * @returns {Object} Configuration object (legacy format for backward compatibility)
   */
  get() {
    try {
      // Use unified config module for clean data
      const unifiedConfig = getUnifiedConfig(this.db);

      // Convert to legacy format for backward compatibility
      const legacyConfig = {
        serverPath: unifiedConfig.serverPath || "",
        host: unifiedConfig.host || "localhost",
        port: unifiedConfig.port || null,  // No default - must be configured
        baseModelsPath: unifiedConfig.modelsPath || "",
        ctx_size: unifiedConfig.ctxSize || 2048,
        batch_size: unifiedConfig.batchSize || 512,
        threads: unifiedConfig.threads || 4,
        auto_start_on_launch: unifiedConfig.autoStartOnLaunch || false,
        llama_server_port: unifiedConfig.port || null,
        llama_server_host: unifiedConfig.host || "0.0.0.0",
        llama_server_metrics: unifiedConfig.metricsEnabled !== false,
      };

      return legacyConfig;
    } catch (e) {
      console.error("ConfigRepository.get() error:", e);
      // Return minimal defaults on error - port is null to force configuration
      return {
        serverPath: "",
        host: "localhost",
        port: null,
        baseModelsPath: "",
        ctx_size: 2048,
        batch_size: 512,
        threads: 4,
        auto_start_on_launch: false,
        llama_server_port: null,
        llama_server_host: "0.0.0.0",
        llama_server_metrics: true,
      };
    }
  }

  /**
   * Save configuration to database
   * Validates and cleans config, warns about legacy fields
   * @param {Object} config - Configuration to save (can be legacy format or new { routerConfig, loggingConfig } format)
   */
  save(config) {
    try {
      // Check if this is the new format { routerConfig, loggingConfig }
      if (config.routerConfig) {
        console.log("[DEBUG] Saving new format config");

        // Validate: warn if legacy fields in routerConfig
        const legacyInRouter = LEGACY_FIELDS.filter((field) => config.routerConfig[field] !== undefined);
        if (legacyInRouter.length > 0) {
          console.warn("[ConfigRepository] Legacy fields in routerConfig (will be ignored):", legacyInRouter);
        }

        saveRouterConfig(this.db, config.routerConfig);

        if (config.loggingConfig) {
          console.log("[DEBUG] Saving logging config");
          saveLoggingConfig(this.db, config.loggingConfig);
        }
        return;
      }

      // Validate: warn if legacy fields are present
      const legacyFieldsPresent = LEGACY_FIELDS.filter((field) => config[field] !== undefined);
      if (legacyFieldsPresent.length > 0) {
        console.warn("[ConfigRepository] Legacy fields detected (will be ignored):", legacyFieldsPresent);
      }

      // Convert legacy format to unified format, filtering out legacy fields
      const unifiedConfig = {
        serverPath: config.serverPath || "",
        modelsPath: config.baseModelsPath || config.modelsPath || "",
        host: config.llama_server_host || config.host || "0.0.0.0",
        port: parseInt(config.llama_server_port) || parseInt(config.port) || null,  // No default
        threads: parseInt(config.threads) || 4,
        ctxSize: parseInt(config.ctx_size) || parseInt(config.ctxSize) || 4096,
        batchSize: parseInt(config.batch_size) || parseInt(config.batchSize) || 512,
        autoStartOnLaunch: config.auto_start_on_launch === true,
        metricsEnabled: config.llama_server_metrics !== false,
      };

      saveRouterConfig(this.db, unifiedConfig);
    } catch (e) {
      console.error("ConfigRepository.save() error:", e);
      throw e;
    }
  }
}

export default ConfigRepository;
