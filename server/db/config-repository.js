/**
 * Config Repository
 * Handles server configuration with defaults
 */

import os from "os";
import path from "path";

const DEFAULT_CONFIG = {
  serverPath: "/home/bamer/llama.cpp/build/bin/llama-server",
  host: "localhost",
  port: 8080,
  baseModelsPath: path.join(os.homedir(), "models"),
  ctx_size: 2048,
  batch_size: 512,
  threads: 4,
  llama_server_enabled: true,
  llama_server_port: 8080,
  llama_server_host: "0.0.0.0",
  llama_server_metrics: true,
};

export class ConfigRepository {
  /**
   * @param {Object} db - Better-sqlite3 database instance
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Get server configuration with defaults
   * @returns {Object} Configuration object
   */
  get() {
    try {
      const saved = this.db
        .prepare("SELECT value FROM server_config WHERE key = ?")
        .get("config")?.value;
      if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch (e) {
      console.error("Config load error:", e);
    }
    // Always return a new object, even if it's just the default
    return { ...DEFAULT_CONFIG };
  }

  /**
   * Save configuration to database
   * @param {Object} config - Configuration to save
   */
  save(config) {
    const query = "INSERT OR REPLACE INTO server_config (key, value) VALUES (?, ?)";
    this.db.prepare(query).run("config", JSON.stringify(config));
  }
}

export default ConfigRepository;
