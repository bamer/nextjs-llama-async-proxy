/**
 * Database Schema Module
 * Handles table definitions, indexes, and migrations
 */

/**
 * Get the SQL schema for all tables
 * @returns {string} SQL CREATE TABLE statements
 */
export function getSchemaDefinition() {
  return `
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
      gpu_usage REAL DEFAULT 0,
      gpu_memory_used REAL DEFAULT 0,
      gpu_memory_total REAL DEFAULT 0,
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
  `;
}

/**
 * Get all index definitions
 * @returns {Array} Array of SQL index creation statements
 */
export function getIndexesDefinition() {
  return [
    "CREATE INDEX IF NOT EXISTS idx_models_status ON models(status)",
    "CREATE INDEX IF NOT EXISTS idx_models_name ON models(name)",
    "CREATE INDEX IF NOT EXISTS idx_models_created ON models(created_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp DESC)",
    "CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC)",
    "CREATE INDEX IF NOT EXISTS idx_logs_source ON logs(source)",
    "CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level)",
    "CREATE INDEX IF NOT EXISTS idx_metadata_key ON metadata(key)",
  ];
}

/**
 * Get migrations for models table
 * @returns {Array} Array of migration objects
 */
export function getModelsMigrations() {
  return [
    { name: "embedding_size", type: "INTEGER DEFAULT 0" },
    { name: "block_count", type: "INTEGER DEFAULT 0" },
    { name: "head_count", type: "INTEGER DEFAULT 0" },
    { name: "head_count_kv", type: "INTEGER DEFAULT 0" },
    { name: "ffn_dim", type: "INTEGER DEFAULT 0" },
    { name: "file_type", type: "INTEGER DEFAULT 0" },
  ];
}

/**
 * Get migrations for metrics table
 * @returns {Array} Array of migration objects
 */
export function getMetricsMigrations() {
  return [
    { name: "gpu_usage", type: "REAL DEFAULT 0" },
    { name: "gpu_memory_used", type: "REAL DEFAULT 0" },
    { name: "gpu_memory_total", type: "REAL DEFAULT 0" },
    { name: "swap_usage", type: "REAL DEFAULT 0" },
  ];
}

/**
 * Initialize schema - create tables and indexes
 * @param {Object} db - Better-sqlite3 database instance
 */
export function initSchema(db) {
  db.exec(getSchemaDefinition());
  createIndexes(db);
}

/**
 * Create all indexes
 * @param {Object} db - Better-sqlite3 database instance
 */
export function createIndexes(db) {
  const indexes = getIndexesDefinition();
  indexes.forEach((idx) => {
    db.exec(idx);
  });
  console.log("[DB] Indexes created successfully");
}

/**
 * Run migrations on models table
 * @param {Object} db - Better-sqlite3 database instance
 */
export function runModelsMigrations(db) {
  try {
    const columns = db.prepare("PRAGMA table_info(models)").all();
    const columnNames = columns.map((c) => c.name);
    const migrations = getModelsMigrations();

    for (const mig of migrations) {
      if (!columnNames.includes(mig.name)) {
        console.log(`[MIGRATION] Adding column: ${mig.name}`);
        db.exec(`ALTER TABLE models ADD COLUMN ${mig.name} ${mig.type}`);
      }
    }
  } catch (e) {
    console.warn("[MIGRATION] Failed:", e.message);
  }
}

/**
 * Run migrations on metrics table
 * @param {Object} db - Better-sqlite3 database instance
 */
export function runMetricsMigrations(db) {
  try {
    const columns = db.prepare("PRAGMA table_info(metrics)").all();
    const columnNames = columns.map((c) => c.name);
    const migrations = getMetricsMigrations();

    for (const mig of migrations) {
      if (!columnNames.includes(mig.name)) {
        console.log(`[MIGRATION] Adding column: ${mig.name}`);
        db.exec(`ALTER TABLE metrics ADD COLUMN ${mig.name} ${mig.type}`);
      }
    }
  } catch (e) {
    console.warn("[MIGRATION] Failed:", e.message);
  }
}

/**
 * Run all migrations
 * @param {Object} db - Better-sqlite3 database instance
 */
export function runAllMigrations(db) {
  runModelsMigrations(db);
  runMetricsMigrations(db);
}
