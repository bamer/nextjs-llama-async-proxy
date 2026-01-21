/**
 * Database Layer for Llama Async Proxy Dashboard
 * Modular SQLite database operations using better-sqlite3
 *
 * This module composes all repositories and provides a unified API.
 * Replaces the monolithic server/db.js file.
 */

import { DBBase } from "./db-base.js";
import { ModelsRepository } from "./models-repository.js";
import { MetricsRepository } from "./metrics-repository.js";
import { LogsRepository } from "./logs-repository.js";
import { ConfigRepository } from "./config-repository.js";
import { MetadataRepository } from "./metadata-repository.js";

/**
 * Main Database class - extends base and delegates to repositories
 * Provides unified API for database operations
 */
class DB extends DBBase {
  // ==================== Models (delegate to repository) ====================

  /**
   * Get all models
   * @returns {Array}
   */
  getModels() {
    return this.models.getAll();
  }

  /**
   * Get a single model by ID
   * @param {string} id
   * @returns {Object|null}
   */
  getModel(id) {
    return this.models.getById(id);
  }

  /**
   * Save a model
   * @param {Object} model
   * @returns {Object}
   */
  saveModel(model) {
    return this.models.save(model);
  }

  /**
   * Update a model
   * @param {string} id
   * @param {Object} updates
   * @returns {Object|null}
   */
  updateModel(id, updates) {
    return this.models.update(id, updates);
  }

  /**
   * Delete a model
   * @param {string} id
   * @returns {boolean}
   */
  deleteModel(id) {
    return this.models.delete(id);
  }

  /**
   * Cleanup invalid models
   * @returns {number}
   */
  cleanupMissingFiles() {
    return this.models.cleanupMissingFiles();
  }

  // ==================== Metrics (delegate to repository) ====================

  /**
   * Save metrics
   * @param {Object} m
   */
  saveMetrics(m) {
    this.metrics.save(m);
  }

  /**
   * Get metrics history
   * @param {number} limit
   * @returns {Array}
   */
  getMetricsHistory(limit = 100) {
    return this.metrics.getHistory(limit);
  }

  /**
   * Get latest metrics
   * @returns {Object|null}
   */
  getLatestMetrics() {
    return this.metrics.getLatest();
  }

  /**
   * Prune old metrics
   * @param {number} maxRecords
   * @returns {number}
   */
  pruneMetrics(maxRecords = 10000) {
    return this.metrics.prune(maxRecords);
  }

  // ==================== Logs (delegate to repository) ====================

  /**
   * Get logs
   * @param {number} limit
   * @returns {Array}
   */
  getLogs(limit = 100) {
    return this.logs.getAll(limit);
  }

  /**
   * Add a log entry
   * @param {string} level
   * @param {string} msg
   * @param {string} source
   */
  addLog(level, msg, source = "server") {
    this.logs.add(level, msg, source);
  }

  /**
   * Clear all logs
   * @returns {number}
   */
  clearLogs() {
    return this.logs.clear();
  }

  // ==================== Config (delegate to repository) ====================

  /**
   * Get configuration
   * @returns {Object}
   */
  getConfig() {
    return this.config.get();
  }

  /**
   * Save configuration
   * @param {Object} c
   */
  saveConfig(c) {
    this.config.save(c);
  }

  // ==================== Metadata (delegate to repository) ====================

  /**
   * Get metadata value
   * @param {string} key
   * @param {*} defaultValue
   * @returns {*}
   */
  getMeta(key, defaultValue = null) {
    return this.meta.get(key, defaultValue);
  }

  /**
   * Set metadata value
   * @param {string} key
   * @param {*} value
   */
  setMeta(key, value) {
    this.meta.set(key, value);
  }
}

// Export main class and all repositories for direct access
export {
  DB,
  DBBase,
  ModelsRepository,
  MetricsRepository,
  LogsRepository,
  ConfigRepository,
  MetadataRepository,
};
export default DB;
