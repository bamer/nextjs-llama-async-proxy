/**
 * Database Migration 004: Unify Router Configuration Schema
 *
 * Consolidates scattered configuration into unified tables:
 * - router_config: All router/server settings in one place
 * - logging_config: All logging settings in one place
 *
 * MIGRATION LOGIC:
 * 1. Backup existing data to migration_backup table
 * 2. Create new router_config and logging_config tables
 * 3. Map old keys from server_config and user_settings to new schema
 * 4. Apply sensible defaults for missing values
 * 5. Log all operations for debugging
 */

/**
 * Default values for router_config table
 */
const ROUTER_CONFIG_DEFAULTS = {
  modelsPath: "./models",
  serverPath: "/home/bamer/llama.cpp/build/bin/llama-server",
  host: "0.0.0.0",
  port: 8080,
  maxModelsLoaded: 4,
  parallelSlots: 1,
  ctxSize: 4096,
  gpuLayers: 0,
  threads: 4,
  batchSize: 512,
  temperature: 0.7,
  repeatPenalty: 1.1,
  metricsEnabled: true,
  autoStartOnLaunch: false,
};

/**
 * Default values for logging_config table
 */
const LOGGING_CONFIG_DEFAULTS = {
  level: "info",
  maxFileSize: 10485760,
  maxFiles: 7,
  enableFileLogging: true,
  enableDatabaseLogging: true,
  enableConsoleLogging: true,
};

/**
 * Get current timestamp
 * @returns {string} ISO timestamp
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Log migration progress
 * @param {Object} db - Database instance
 * @param {string} level - Log level (info, warn, error)
 * @param {string} message - Log message
 */
function logMigration(db, level, message) {
  const timestamp = getTimestamp();
  const logEntry = `[${timestamp}] [MIGRATION 004] [${level.toUpperCase()}] ${message}`;
  console.log(logEntry);

  try {
    db.prepare(
      "INSERT INTO logs (level, message, source, timestamp) VALUES (?, ?, ?, ?)"
    ).run(level, message, "migration_004", Math.floor(Date.now() / 1000));
  } catch (e) {
    console.warn("[MIGRATION 004] Failed to write log to database:", e.message);
  }
}

/**
 * Create backup of existing configuration data
 * @param {Object} db - Database instance
 * @returns {boolean} Success status
 */
function createBackup(db) {
  try {
    logMigration(db, "info", "Creating backup of existing configuration data...");

    // Create backup table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS migration_backup_004 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_table TEXT NOT NULL,
        source_key TEXT,
        original_value TEXT,
        migrated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Backup server_config data
    const serverConfig = db.prepare("SELECT * FROM server_config").all();
    for (const row of serverConfig) {
      db.prepare(
        "INSERT INTO migration_backup_004 (source_table, source_key, original_value) VALUES (?, ?, ?)"
      ).run("server_config", row.key, row.value);
    }
    logMigration(db, "info", `Backed up ${serverConfig.length} server_config entries`);

    // Backup metadata (user_settings) data
    const userSettings = db.prepare("SELECT * FROM metadata WHERE key = ?").get("user_settings");
    if (userSettings) {
      db.prepare(
        "INSERT INTO migration_backup_004 (source_table, source_key, original_value) VALUES (?, ?, ?)"
      ).run("metadata", "user_settings", userSettings.value);
      logMigration(db, "info", "Backed up user_settings metadata entry");
    } else {
      logMigration(db, "info", "No user_settings metadata entry found (will use defaults)");
    }

    logMigration(db, "info", "Backup completed successfully");
    return true;
  } catch (error) {
    logMigration(db, "error", `Backup failed: ${error.message}`);
    return false;
  }
}

/**
 * Create new router_config table
 * @param {Object} db - Database instance
 */
function createRouterConfigTable(db) {
  try {
    logMigration(db, "info", "Creating router_config table...");

    db.exec(`
      CREATE TABLE IF NOT EXISTS router_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    logMigration(db, "info", "router_config table created successfully");
  } catch (error) {
    logMigration(db, "error", `Failed to create router_config table: ${error.message}`);
    throw error;
  }
}

/**
 * Create new logging_config table
 * @param {Object} db - Database instance
 */
function createLoggingConfigTable(db) {
  try {
    logMigration(db, "info", "Creating logging_config table...");

    db.exec(`
      CREATE TABLE IF NOT EXISTS logging_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    logMigration(db, "info", "logging_config table created successfully");
  } catch (error) {
    logMigration(db, "error", `Failed to create logging_config table: ${error.message}`);
    throw error;
  }
}

/**
 * Get server_config from database
 * @param {Object} db - Database instance
 * @returns {Object} Parsed server config or empty object
 */
function getServerConfig(db) {
  try {
    const result = db.prepare("SELECT value FROM server_config WHERE key = ?").get("config");
    if (result) {
      return JSON.parse(result.value);
    }
  } catch (error) {
    logMigration(db, "error", `Failed to parse server_config: ${error.message}`);
  }
  return {};
}

/**
 * Get user_settings from metadata table
 * @param {Object} db - Database instance
 * @returns {Object} Parsed user settings or empty object
 */
function getUserSettings(db) {
  try {
    const result = db.prepare("SELECT value FROM metadata WHERE key = ?").get("user_settings");
    if (result) {
      return JSON.parse(result.value);
    }
  } catch (error) {
    logMigration(db, "error", `Failed to parse user_settings: ${error.message}`);
  }
  return {};
}

/**
 * Build router_config from old schema
 * @param {Object} db - Database instance
 * @returns {Object} New router configuration
 */
function buildRouterConfig(db) {
  logMigration(db, "info", "Building router_config from existing schema...");

  const serverConfig = getServerConfig(db);
  const userSettings = getUserSettings(db);

  const routerConfig = { ...ROUTER_CONFIG_DEFAULTS };

  // Map paths from server_config
  // baseModelsPath -> modelsPath
  if (serverConfig.baseModelsPath !== undefined) {
    routerConfig.modelsPath = serverConfig.baseModelsPath;
    logMigration(db, "info", `Mapped baseModelsPath -> modelsPath: ${serverConfig.baseModelsPath}`);
  }

  // serverPath stays as serverPath
  if (serverConfig.serverPath !== undefined) {
    routerConfig.serverPath = serverConfig.serverPath;
    logMigration(db, "info", `Copied serverPath: ${serverConfig.serverPath}`);
  }

  // Map network config from server_config
  // host: Prefer llama_server_host, fallback to host
  if (serverConfig.llama_server_host !== undefined) {
    routerConfig.host = serverConfig.llama_server_host;
    logMigration(db, "info", `Mapped llama_server_host -> host: ${serverConfig.llama_server_host}`);
  } else if (serverConfig.host !== undefined) {
    routerConfig.host = serverConfig.host;
    logMigration(db, "info", `Copied host: ${serverConfig.host}`);
  }

  // port: Prefer llama_server_port, fallback to port
  if (serverConfig.llama_server_port !== undefined) {
    routerConfig.port = parseInt(serverConfig.llama_server_port, 10);
    logMigration(db, "info", `Mapped llama_server_port -> port: ${serverConfig.llama_server_port}`);
  } else if (serverConfig.port !== undefined) {
    routerConfig.port = parseInt(serverConfig.port, 10);
    logMigration(db, "info", `Copied port: ${serverConfig.port}`);
  }

  // Map inference defaults from server_config
  if (serverConfig.ctx_size !== undefined) {
    routerConfig.ctxSize = parseInt(serverConfig.ctx_size, 10);
    logMigration(db, "info", `Mapped ctx_size -> ctxSize: ${serverConfig.ctx_size}`);
  }

  if (serverConfig.threads !== undefined) {
    routerConfig.threads = parseInt(serverConfig.threads, 10);
    logMigration(db, "info", `Copied threads: ${serverConfig.threads}`);
  }

  if (serverConfig.batch_size !== undefined) {
    routerConfig.batchSize = parseInt(serverConfig.batch_size, 10);
    logMigration(db, "info", `Mapped batch_size -> batchSize: ${serverConfig.batch_size}`);
  }

  if (serverConfig.temperature !== undefined) {
    routerConfig.temperature = parseFloat(serverConfig.temperature);
    logMigration(db, "info", `Copied temperature: ${serverConfig.temperature}`);
  }

  if (serverConfig.repeatPenalty !== undefined) {
    routerConfig.repeatPenalty = parseFloat(serverConfig.repeatPenalty);
    logMigration(db, "info", `Copied repeatPenalty: ${serverConfig.repeatPenalty}`);
  }

  // Map server options from server_config
  if (serverConfig.llama_server_metrics !== undefined) {
    routerConfig.metricsEnabled = !!serverConfig.llama_server_metrics;
    logMigration(db, "info", `Mapped llama_server_metrics -> metricsEnabled: ${serverConfig.llama_server_metrics}`);
  }

  if (serverConfig.auto_start_on_launch !== undefined) {
    routerConfig.autoStartOnLaunch = !!serverConfig.auto_start_on_launch;
    logMigration(db, "info", `Mapped auto_start_on_launch -> autoStartOnLaunch: ${serverConfig.auto_start_on_launch}`);
  }

  // Map router behavior from user_settings
  if (userSettings.maxModelsLoaded !== undefined) {
    routerConfig.maxModelsLoaded = parseInt(userSettings.maxModelsLoaded, 10);
    logMigration(db, "info", `Copied maxModelsLoaded: ${userSettings.maxModelsLoaded}`);
  }

  if (userSettings.parallelSlots !== undefined) {
    routerConfig.parallelSlots = parseInt(userSettings.parallelSlots, 10);
    logMigration(db, "info", `Copied parallelSlots: ${userSettings.parallelSlots}`);
  }

  if (userSettings.gpuLayers !== undefined) {
    routerConfig.gpuLayers = parseInt(userSettings.gpuLayers, 10);
    logMigration(db, "info", `Copied gpuLayers: ${userSettings.gpuLayers}`);
  }

  logMigration(db, "info", `router_config built with ${Object.keys(routerConfig).length} keys`);
  return routerConfig;
}

/**
 * Build logging_config from old schema
 * @param {Object} db - Database instance
 * @returns {Object} New logging configuration
 */
function buildLoggingConfig(db) {
  logMigration(db, "info", "Building logging_config from existing schema...");

  const userSettings = getUserSettings(db);

  const loggingConfig = { ...LOGGING_CONFIG_DEFAULTS };

  // Map all logging settings from user_settings
  if (userSettings.logLevel !== undefined) {
    loggingConfig.level = userSettings.logLevel;
    logMigration(db, "info", `Mapped logLevel -> level: ${userSettings.logLevel}`);
  }

  if (userSettings.maxFileSize !== undefined) {
    loggingConfig.maxFileSize = parseInt(userSettings.maxFileSize, 10);
    logMigration(db, "info", `Copied maxFileSize: ${userSettings.maxFileSize}`);
  }

  if (userSettings.maxFiles !== undefined) {
    loggingConfig.maxFiles = parseInt(userSettings.maxFiles, 10);
    logMigration(db, "info", `Copied maxFiles: ${userSettings.maxFiles}`);
  }

  if (userSettings.enableFileLogging !== undefined) {
    loggingConfig.enableFileLogging = !!userSettings.enableFileLogging;
    logMigration(db, "info", `Copied enableFileLogging: ${userSettings.enableFileLogging}`);
  }

  if (userSettings.enableDatabaseLogging !== undefined) {
    loggingConfig.enableDatabaseLogging = !!userSettings.enableDatabaseLogging;
    logMigration(db, "info", `Copied enableDatabaseLogging: ${userSettings.enableDatabaseLogging}`);
  }

  if (userSettings.enableConsoleLogging !== undefined) {
    loggingConfig.enableConsoleLogging = !!userSettings.enableConsoleLogging;
    logMigration(db, "info", `Copied enableConsoleLogging: ${userSettings.enableConsoleLogging}`);
  }

  logMigration(db, "info", `logging_config built with ${Object.keys(loggingConfig).length} keys`);
  return loggingConfig;
}

/**
 * Save router_config to database
 * @param {Object} db - Database instance
 * @param {Object} config - Router configuration
 */
function saveRouterConfig(db, config) {
  try {
    logMigration(db, "info", "Saving router_config to database...");

    const stmt = db.prepare(
      "INSERT OR REPLACE INTO router_config (key, value, updated_at) VALUES (?, ?, ?)"
    );

    // Store entire config as JSON under a single key
    stmt.run("config", JSON.stringify(config), Math.floor(Date.now() / 1000));

    logMigration(db, "info", "router_config saved successfully");
  } catch (error) {
    logMigration(db, "error", `Failed to save router_config: ${error.message}`);
    throw error;
  }
}

/**
 * Save logging_config to database
 * @param {Object} db - Database instance
 * @param {Object} config - Logging configuration
 */
function saveLoggingConfig(db, config) {
  try {
    logMigration(db, "info", "Saving logging_config to database...");

    const stmt = db.prepare(
      "INSERT OR REPLACE INTO logging_config (key, value, updated_at) VALUES (?, ?, ?)"
    );

    // Store entire config as JSON under a single key
    stmt.run("config", JSON.stringify(config), Math.floor(Date.now() / 1000));

    logMigration(db, "info", "logging_config saved successfully");
  } catch (error) {
    logMigration(db, "error", `Failed to save logging_config: ${error.message}`);
    throw error;
  }
}

/**
 * Clean up old configuration data
 * @param {Object} db - Database instance
 */
function cleanupOldData(db) {
  try {
    logMigration(db, "info", "Cleaning up old configuration data from server_config...");

    // Delete the old config key from server_config
    const deleted = db.prepare("DELETE FROM server_config WHERE key = ?").run("config");
    logMigration(db, "info", `Deleted ${deleted.changes} entry from server_config`);

    // Note: We keep user_settings in metadata for backward compatibility
    // during transition, but log that it's now deprecated for router settings
    logMigration(db, "info", "user_settings retained in metadata for backward compatibility");
  } catch (error) {
    logMigration(db, "error", `Failed to cleanup old data: ${error.message}`);
    // Don't throw - cleanup failure shouldn't stop migration
  }
}

/**
 * Create indexes for new tables
 * @param {Object} db - Database instance
 */
function createIndexes(db) {
  try {
    logMigration(db, "info", "Creating indexes for new tables...");

    db.exec("CREATE INDEX IF NOT EXISTS idx_router_config_key ON router_config(key)");
    db.exec("CREATE INDEX IF NOT EXISTS idx_logging_config_key ON logging_config(key)");

    logMigration(db, "info", "Indexes created successfully");
  } catch (error) {
    logMigration(db, "error", `Failed to create indexes: ${error.message}`);
    throw error;
  }
}

/**
 * Run the migration
 * @param {Object} db - Better-sqlite3 database instance
 * @returns {Object} Migration result
 */
export function runMigration(db) {
  const startTime = Date.now();
  let success = false;
  let errorMessage = null;

  try {
    logMigration(db, "info", "=".repeat(60));
    logMigration(db, "info", "Starting migration 004: Unify Router Configuration Schema");
    logMigration(db, "info", "=".repeat(60));

    // Step 1: Create backup
    if (!createBackup(db)) {
      throw new Error("Failed to create backup");
    }

    // Step 2: Create new tables
    createRouterConfigTable(db);
    createLoggingConfigTable(db);

    // Step 3: Build and save new configurations
    const routerConfig = buildRouterConfig(db);
    const loggingConfig = buildLoggingConfig(db);

    saveRouterConfig(db, routerConfig);
    saveLoggingConfig(db, loggingConfig);

    // Step 4: Create indexes
    createIndexes(db);

    // Step 5: Clean up old data
    cleanupOldData(db);

    success = true;
    const duration = Date.now() - startTime;
    logMigration(db, "info", "=".repeat(60));
    logMigration(db, "info", `Migration 004 completed successfully in ${duration}ms`);
    logMigration(db, "info", "=".repeat(60));

    return {
      success: true,
      duration,
      routerConfig: Object.keys(routerConfig),
      loggingConfig: Object.keys(loggingConfig),
    };
  } catch (error) {
    errorMessage = error.message;
    logMigration(db, "error", `Migration 004 failed: ${error.message}`);
    logMigration(db, "error", error.stack);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Check if migration is needed
 * @param {Object} db - Database instance
 * @returns {boolean} True if migration should run
 */
export function isMigrationNeeded(db) {
  try {
    // Check if new tables exist
    const routerConfigExists = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='router_config'")
      .get();
    const loggingConfigExists = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='logging_config'")
      .get();

    // Migration is needed if new tables don't exist
    return !routerConfigExists || !loggingConfigExists;
  } catch (error) {
    console.error("[MIGRATION 004] Failed to check migration status:", error.message);
    return true;
  }
}

export default {
  runMigration,
  isMigrationNeeded,
};
