/**
 * Base Database Class
 * Handles initialization and composes all repositories
 */

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
 * Base DB class - initializes schema and repositories
 */
export class DBBase {
  /**
   * @param {string} dbPath - Database file path
   */
  constructor(dbPath) {
    this.dbPath = dbPath || path.join(process.cwd(), "data", "llama-dashboard.db");
    this.db = new Database(this.dbPath);

    // Initialize schema and run migrations
    initSchema(this.db);
    runAllMigrations(this.db);

    // Initialize repositories
    this.models = new ModelsRepository(this.db);
    this.metrics = new MetricsRepository(this.db);
    this.logs = new LogsRepository(this.db);
    this.config = new ConfigRepository(this.db);
    this.meta = new MetadataRepository(this.db);
  }
}

export default DBBase;
