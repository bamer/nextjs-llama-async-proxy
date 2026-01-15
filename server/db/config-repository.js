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
  auto_start_on_launch: false, // Renamed from llama_server_enabled for clarity
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
      if (saved) {
        const parsed = JSON.parse(saved);
        // Backward compatibility: rename old key to new key
        if (parsed.llama_server_enabled !== undefined && parsed.auto_start_on_launch === undefined) {
          parsed.auto_start_on_launch = parsed.llama_server_enabled;
          delete parsed.llama_server_enabled;
        }
        return { ...DEFAULT_CONFIG, ...parsed };
      }
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
