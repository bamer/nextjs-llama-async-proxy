/**
 * Base Database Class
 * Handles initialization and composes all repositories
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import DatabasePackage from "better-sqlite3";

import { initSchema, runAllMigrations } from "./schema.js";
import { ModelsRepository } from "./models-repository.js";
import { MetricsRepository } from "./metrics-repository.js";
import { LogsRepository } from "./logs-repository.js";
import { ConfigRepository } from "./config-repository.js";
import { MetadataRepository } from "./metadata-repository.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const Database = DatabasePackage;

/**
 * Get the actual database instance
 * Handles both raw Database and DB wrapper instances
 * @param {Object} db - Database instance (raw or wrapper)
 * @returns {Object|null} Raw database instance or null
 */
export function getDb(db) {
  if (db === null || db === undefined) {
    return null;
  }
  // If db has .prepare directly (raw Database instance), use it
  if (typeof db.prepare === "function") {
    return db;
  }
  // If db has a .db property with .prepare (DB wrapper), use that
  if (db.db && typeof db.db.prepare === "function") {
    return db.db;
  }
  // Fallback - should not happen
  console.error("[DEBUG] getDb: Unknown db type", typeof db, db);
  return null;
}

/**
 * Base DB class - initializes schema and repositories
 */
export class DBBase {
  /**
     * @param {string} dbPath - Database file path
     */
  constructor(dbPath) {
    this.dbPath = dbPath || path.join(process.cwd(), "data", "llama-dashboard.db");
    
    this._ensureWritable();
    this.db = new Database(this.dbPath);
    this.db.pragma("journal_mode = WAL");
    
    initSchema(this.db);
    runAllMigrations(this.db);

    this.models = new ModelsRepository(this.db);
    this.metrics = new MetricsRepository(this.db);
    this.logs = new LogsRepository(this.db);
    this.config = new ConfigRepository(this.db);
    this.meta = new MetadataRepository(this.db);
  }
  
  _ensureWritable() {
    const dbDir = path.dirname(this.dbPath);
    try {
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true, mode: 0o775 });
        console.log("[DEBUG] Created database directory:", dbDir);
      }
      
      if (!fs.accessSync(dbDir, fs.constants.W_OK)) {
        console.warn("[DEBUG] Database directory is not writable:", dbDir);
      }
    } catch (err) {
      console.error("[DEBUG] Database directory check failed:", err.message);
    }
    
    if (!fs.existsSync(this.dbPath)) {
      console.log("[DEBUG] Creating new database file:", this.dbPath);
    } else {
      try {
        const fd = fs.openSync(this.dbPath, "r+");
        fs.closeSync(fd);
        console.log("[DEBUG] Database file is writable:", this.dbPath);
      } catch (err) {
        console.error("[DEBUG] Database file is not writable:", err.message);
        console.error("[DEBUG] File stat:", fs.statSync(this.dbPath));
      }
    }
  }
}

export default DBBase;
