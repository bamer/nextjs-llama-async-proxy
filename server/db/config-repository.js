/**
 * Config Repository
 * Wrapper for legacy API - delegates to unified config module
 *
 * DEPRECATED: This is a legacy wrapper. Use getRouterConfig/saveRouterConfig from config.js instead.
 * This class exists to maintain backward compatibility with code using db.config.get().
 */

import { getRouterConfig, saveRouterConfig, ROUTER_CONFIG_DEFAULTS } from "./config.js";

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
   * Now uses the unified router_config table
   * @returns {Object} Configuration object (legacy format)
   */
  get() {
    try {
      const unifiedConfig = getRouterConfig(this.db);

      // Convert to legacy format for backward compatibility
      const legacyConfig = {
        serverPath: unifiedConfig.serverPath || "",
        host: unifiedConfig.host || "localhost",
        port: unifiedConfig.port || 8080,
        baseModelsPath: unifiedConfig.modelsPath || "",
        ctx_size: unifiedConfig.ctxSize || 2048,
        batch_size: unifiedConfig.batchSize || 512,
        threads: unifiedConfig.threads || 4,
        auto_start_on_launch: unifiedConfig.autoStartOnLaunch || false,
        llama_server_port: unifiedConfig.port || 8080,
        llama_server_host: unifiedConfig.host || "0.0.0.0",
        llama_server_metrics: unifiedConfig.metricsEnabled !== false,
      };

      return legacyConfig;
    } catch (e) {
      console.error("ConfigRepository.get() error:", e);
      // Return minimal defaults on error
      return {
        serverPath: "",
        host: "localhost",
        port: 8080,
        baseModelsPath: "",
        ctx_size: 2048,
        batch_size: 512,
        threads: 4,
        auto_start_on_launch: false,
        llama_server_port: 8080,
        llama_server_host: "0.0.0.0",
        llama_server_metrics: true,
      };
    }
  }

  /**
   * Save configuration to database
   * Saves to the unified router_config table
   * @param {Object} config - Configuration to save (legacy format)
   */
  save(config) {
    try {
      // Convert legacy format to unified format
      const unifiedConfig = {
        serverPath: config.serverPath || "",
        modelsPath: config.baseModelsPath || config.modelsPath || "",
        host: config.llama_server_host || config.host || "0.0.0.0",
        port: parseInt(config.llama_server_port) || parseInt(config.port) || 8080,
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
