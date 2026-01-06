/**
 * Database Layer for Llama Async Proxy Dashboard
 * SQLite database operations using better-sqlite3
 */

import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";
import DatabasePackage from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const Database = DatabasePackage;

/**
 * Database class for managing models, metrics, logs, and configuration
 */
class DB {
  constructor(dbPath = null) {
    this.dbPath = dbPath || path.join(process.cwd(), "data", "llama-dashboard.db");
    this.db = new Database(this.dbPath);
    this.init();
  }

  /**
   * Initialize database tables and run migrations
   */
  init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS models (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'llama',
        status TEXT DEFAULT 'idle',
        parameters TEXT DEFAULT '{}',
        model_path TEXT,
        file_size INTEGER,
        params TEXT,
        quantization TEXT,
        ctx_size INTEGER DEFAULT 4096,
        embedding_size INTEGER DEFAULT 0,
        block_count INTEGER DEFAULT 0,
        head_count INTEGER DEFAULT 0,
        head_count_kv INTEGER DEFAULT 0,
        ffn_dim INTEGER DEFAULT 0,
        file_type INTEGER DEFAULT 0,
        batch_size INTEGER DEFAULT 512,
        threads INTEGER DEFAULT 4,
        created_at INTEGER,
        updated_at INTEGER
      );
      CREATE TABLE IF NOT EXISTS metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cpu_usage REAL,
        memory_usage REAL,
        disk_usage REAL,
        active_models INTEGER,
        uptime REAL,
        timestamp INTEGER DEFAULT (strftime('%s', 'now'))
      );
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        source TEXT,
        timestamp INTEGER DEFAULT (strftime('%s', 'now'))
      );
      CREATE TABLE IF NOT EXISTS server_config (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER
      );
    `);

    // Create indexes for performance
    this._createIndexes();

    // Migration: Add missing columns to existing models table
    this._migrateModelsTable();
  }

  /**
   * Create database indexes for frequently queried columns
   */
  _createIndexes() {
    try {
      const indexes = [
        "CREATE INDEX IF NOT EXISTS idx_models_status ON models(status)",
        "CREATE INDEX IF NOT EXISTS idx_models_name ON models(name)",
        "CREATE INDEX IF NOT EXISTS idx_models_created ON models(created_at DESC)",
        "CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp DESC)",
        "CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC)",
        "CREATE INDEX IF NOT EXISTS idx_logs_source ON logs(source)",
        "CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level)",
        "CREATE INDEX IF NOT EXISTS idx_metadata_key ON metadata(key)",
      ];

      indexes.forEach((idx) => {
        this.db.exec(idx);
      });

      console.log("[DB] Indexes created successfully");
    } catch (e) {
      console.warn("[DB] Index creation error:", e.message);
    }
  }

  /**
   * Run migrations to add missing columns to the models table
   */
  _migrateModelsTable() {
    try {
      // Check if column exists
      const columns = this.db.prepare("PRAGMA table_info(models)").all();
      const columnNames = columns.map((c) => c.name);

      const migrations = [
        { name: "embedding_size", type: "INTEGER DEFAULT 0" },
        { name: "block_count", type: "INTEGER DEFAULT 0" },
        { name: "head_count", type: "INTEGER DEFAULT 0" },
        { name: "head_count_kv", type: "INTEGER DEFAULT 0" },
        { name: "ffn_dim", type: "INTEGER DEFAULT 0" },
        { name: "file_type", type: "INTEGER DEFAULT 0" },
      ];

      for (const mig of migrations) {
        if (!columnNames.includes(mig.name)) {
          console.log(`[MIGRATION] Adding column: ${mig.name}`);
          this.db.exec(`ALTER TABLE models ADD COLUMN ${mig.name} ${mig.type}`);
        }
      }
    } catch (e) {
      console.warn("[MIGRATION] Failed:", e.message);
    }
  }

  // ==================== Models ====================

  /**
   * Get all models from the database
   * @returns {Array} Array of model objects
   */
  getModels() {
    return this.db.prepare("SELECT * FROM models ORDER BY created_at DESC").all();
  }

  /**
   * Get a single model by ID
   * @param {string} id - Model ID
   * @returns {Object|null} Model object or null if not found
   */
  getModel(id) {
    return this.db.prepare("SELECT * FROM models WHERE id = ?").get(id);
  }

  /**
   * Save a model to the database
   * @param {Object} model - Model object to save
   * @returns {Object} Saved model object
   */
  saveModel(model) {
    const id = model.id || `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Math.floor(Date.now() / 1000);
    // Columns in same order as table schema
    const query = `INSERT OR REPLACE INTO models (id, name, type, status,
      parameters, model_path, file_size, params, quantization, ctx_size,
      batch_size, threads, created_at, updated_at,
      embedding_size, block_count, head_count, head_count_kv, ffn_dim, file_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    // Helper to handle array values
    const getValue = (val, defaultVal = 0) => {
      if (Array.isArray(val)) return val[0] || defaultVal;
      if (val === undefined || val === null) return defaultVal;
      return val;
    };

    this.db
      .prepare(query)
      .run(
        id,
        model.name,
        model.type || "llama",
        model.status || "idle",
        JSON.stringify(model.parameters || {}),
        model.model_path || model.path || null,
        model.file_size || null,
        model.params || null,
        model.quantization || null,
        model.ctx_size || 4096,
        model.batch_size || 512,
        model.threads || 4,
        model.created_at || now,
        now,
        model.embedding_size || 0,
        model.block_count || 0,
        model.head_count || 0,
        model.head_count_kv || 0,
        model.ffn_dim || 0,
        model.file_type || 0
      );
    return this.getModel(id);
  }

  /**
   * Update a model by ID
   * @param {string} id - Model ID
   * @param {Object} updates - Object containing fields to update
   * @returns {Object|null} Updated model object or null if not found
   */
  updateModel(id, updates) {
    // Columns in table schema order
    const allowed = [
      "name",
      "type",
      "status",
      "parameters",
      "model_path",
      "file_size",
      "params",
      "quantization",
      "ctx_size",
      "batch_size",
      "threads",
      "embedding_size",
      "block_count",
      "head_count",
      "head_count_kv",
      "ffn_dim",
      "file_type",
    ];
    const set = [];
    const vals = [];
    for (const [k, v] of Object.entries(updates)) {
      if (allowed.includes(k)) {
        set.push(`${k} = ?`);
        // Handle array values (store as JSON string)
        if (Array.isArray(v)) {
          vals.push(JSON.stringify(v));
        } else if (k === "parameters") {
          vals.push(JSON.stringify(v));
        } else {
          vals.push(v);
        }
      }
    }
    if (set.length === 0) return null;
    vals.push(Math.floor(Date.now() / 1000), id);
    const query = `UPDATE models SET ${set.join(", ")}, updated_at = ? WHERE id = ?`;
    this.db.prepare(query).run(...vals);
    return this.getModel(id);
  }

  /**
   * Delete a model by ID
   * @param {string} id - Model ID
   * @returns {boolean} True if model was deleted
   */
  deleteModel(id) {
    return this.db.prepare("DELETE FROM models WHERE id = ?").run(id).changes > 0;
  }

  /**
   * Check if a file is a valid GGUF model file
   * @param {string} filePath - Path to the file
   * @returns {boolean} True if valid GGUF model file
   */
  _isValidModelFile(filePath) {
    try {
      const fileName = path.basename(filePath);

      // Check exclude patterns
      const excludePatterns = [
        /mmproj/i, // Multimodal projector files
        /-proj$/i, // Projector files ending with -proj
        /\.factory/i, // Factory config files (anywhere in name)
        /\.bin$/i, // .bin files that are not GGUF
        /^\_/i, // Files starting with underscore
      ];

      if (excludePatterns.some((p) => p.test(fileName))) {
        console.log("[DEBUG] Cleanup: Excluding", fileName, "(matched exclude pattern)");
        return false;
      }

      // For .gguf files, verify they have valid GGUF magic bytes
      if (fileName.toLowerCase().endsWith(".gguf")) {
        const fd = fs.openSync(filePath, "r");
        const magicBuf = Buffer.alloc(4);
        fs.readSync(fd, magicBuf, 0, 4, 0);
        fs.closeSync(fd);
        const magic = new DataView(magicBuf.buffer).getUint32(0, true);
        if (magic !== 0x46554747) {
          // GGUF magic
          console.log("[DEBUG] Cleanup: Excluding", fileName, "(invalid GGUF magic)");
          return false;
        }
      }

      return true;
    } catch (e) {
      console.log("[DEBUG] Cleanup: Excluding", filePath, "(error checking:", e.message, ")");
      return false;
    }
  }

  /**
   * Remove models that are invalid (missing files, non-GGUF files, excluded patterns)
   * @returns {number} Number of models deleted
   */
  cleanupMissingFiles() {
    const models = this.getModels();
    let deleted = 0;
    for (const m of models) {
      let shouldDelete = false;
      let reason = "";

      if (!m.model_path) {
        shouldDelete = true;
        reason = "no path";
      } else if (!fs.existsSync(m.model_path)) {
        shouldDelete = true;
        reason = "file missing";
      } else if (!this._isValidModelFile(m.model_path)) {
        shouldDelete = true;
        reason = "invalid model file";
      }

      if (shouldDelete) {
        console.log("[DEBUG] Cleanup: Removing", m.name, "(", reason, ")");
        this.deleteModel(m.id);
        deleted++;
      }
    }
    console.log("[DEBUG] Cleanup: Removed", deleted, "invalid models");
    return deleted;
  }

  // ==================== Metrics ====================

  /**
   * Save metrics to the database
   * @param {Object} m - Metrics object
   */
  saveMetrics(m) {
    const query = `INSERT INTO metrics (cpu_usage, memory_usage,
      disk_usage, active_models, uptime) VALUES (?, ?, ?, ?, ?)`;
    this.db
      .prepare(query)
      .run(
        m.cpu_usage || 0,
        m.memory_usage || 0,
        m.disk_usage || 0,
        m.active_models || 0,
        m.uptime || 0
      );
  }

  /**
   * Get metrics history
   * @param {number} limit - Maximum number of records to return
   * @returns {Array} Array of metrics objects
   */
  getMetricsHistory(limit = 100) {
    return this.db.prepare("SELECT * FROM metrics ORDER BY timestamp DESC LIMIT ?").all(limit);
  }

  /**
   * Get the latest metrics
   * @returns {Object|null} Latest metrics object or null
   */
  getLatestMetrics() {
    return this.db.prepare("SELECT * FROM metrics ORDER BY timestamp DESC LIMIT 1").get();
  }

  /**
   * Prune old metrics to maintain bounded database size
   * @param {number} maxRecords - Maximum number of metrics records to keep
   * @returns {number} Number of records deleted
   */
  pruneMetrics(maxRecords = 10000) {
    try {
      const result = this.db.prepare("SELECT COUNT(*) as cnt FROM metrics").get();

      if (result.cnt > maxRecords) {
        const toDelete = result.cnt - maxRecords;
        const deleteResult = this.db
          .prepare(
            "DELETE FROM metrics WHERE id IN (SELECT id FROM metrics ORDER BY timestamp ASC LIMIT ?)"
          )
          .run(toDelete);
        console.log(`[DB] Pruned ${deleteResult.changes} old metrics, kept ${maxRecords}`);
        return deleteResult.changes;
      }
      return 0;
    } catch (e) {
      console.error("[DB] Metrics pruning error:", e.message);
      return 0;
    }
  }

  // ==================== Logs ====================

  /**
   * Get logs from the database
   * @param {number} limit - Maximum number of records to return
   * @returns {Array} Array of log objects
   */
  getLogs(limit = 100) {
    return this.db.prepare("SELECT * FROM logs ORDER BY timestamp DESC LIMIT ?").all(limit);
  }

  /**
   * Add a log entry
   * @param {string} level - Log level (info, error, warn, debug)
   * @param {string} msg - Log message
   * @param {string} source - Source of the log
   */
  addLog(level, msg, source = "server") {
    const query = "INSERT INTO logs (level, message, source) VALUES (?, ?, ?)";
    this.db.prepare(query).run(level, String(msg), source);
  }

  /**
   * Clear all logs
   * @returns {number} Number of logs cleared
   */
  clearLogs() {
    return this.db.prepare("DELETE FROM logs").run().changes;
  }

  // ==================== Configuration ====================

  /**
   * Get server configuration
   * @returns {Object} Configuration object with defaults
   */
  getConfig() {
    const def = {
      serverPath: "/usr/local/bin/llama-server",
      host: "localhost",
      port: 8080,
      baseModelsPath: path.join(os.homedir(), "models"),
      ctx_size: 2048,
      batch_size: 512,
      threads: 4,
    };
    try {
      const saved = this.db
        .prepare("SELECT value FROM server_config WHERE key = ?")
        .get("config")?.value;
      if (saved) return { ...def, ...JSON.parse(saved) };
    } catch (e) {
      console.error("Config load error:", e);
    }
    return def;
  }

  /**
   * Save configuration to database
   * @param {Object} c - Configuration object to save
   */
  saveConfig(c) {
    const query = "INSERT OR REPLACE INTO server_config (key, value) VALUES (?, ?)";
    this.db.prepare(query).run("config", JSON.stringify(c));
  }

  // ==================== Metadata ====================

  /**
   * Get metadata value by key
   * @param {string} k - Metadata key
   * @param {*} def - Default value if key not found
   * @returns {*} Metadata value or default
   */
  getMeta(k, def = null) {
    try {
      const r = this.db.prepare("SELECT value FROM metadata WHERE key = ?").get(k);
      if (r) return JSON.parse(r.value);
    } catch {
      // Silently ignore JSON parse errors
    }
    return def;
  }

  /**
   * Set metadata value
   * @param {string} k - Metadata key
   * @param {*} v - Value to store
   */
  setMeta(k, v) {
    // Handle null/undefined by storing as empty object instead of null string
    const valueToStore = v === null || v === undefined ? "{}" : JSON.stringify(v);
    const query = "INSERT OR REPLACE INTO metadata (key, value, updated_at) VALUES (?, ?, ?)";
    this.db.prepare(query).run(k, valueToStore, Math.floor(Date.now() / 1000));
  }
}

export default DB;
