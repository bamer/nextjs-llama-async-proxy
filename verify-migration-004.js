/**
 * Database Migration 004 Verification Script
 * Tests the migration and verifies data integrity
 */

import { copyFileSync, existsSync } from "fs";
import Database from "better-sqlite3";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Expected schema for router_config
const ROUTER_CONFIG_SCHEMA = {
  modelsPath: "string",
  serverPath: "string",
  host: "string",
  port: "number",
  maxModelsLoaded: "number",
  parallelSlots: "number",
  ctxSize: "number",
  gpuLayers: "number",
  threads: "number",
  batchSize: "number",
  temperature: "number",
  repeatPenalty: "number",
  metricsEnabled: "boolean",
  autoStartOnLaunch: "boolean",
};

// Expected schema for logging_config
const LOGGING_CONFIG_SCHEMA = {
  level: "string",
  maxFileSize: "number",
  maxFiles: "number",
  enableFileLogging: "boolean",
  enableDatabaseLogging: "boolean",
  enableConsoleLogging: "boolean",
};

/**
 * Load the migration module
 */
async function loadMigration() {
  const migrationPath = join(__dirname, "server/db/migrations/004_unify_router_config.js");
  const migration = await import(`file://${migrationPath}`);
  return migration;
}

/**
 * Get database path
 */
function getDbPath() {
  return join(__dirname, "data/llama-dashboard.db");
}

/**
 * Backup the database
 */
function backupDatabase(dbPath) {
  const backupPath = dbPath + ".backup";
  copyFileSync(dbPath, backupPath);
  console.log(`✅ Database backed up to: ${backupPath}`);
  return backupPath;
}

/**
 * Get current database state before migration
 */
function getPreMigrationState(db) {
  console.log("\n📊 Pre-Migration Database State:");
  console.log("=".repeat(60));

  // Get all tables
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all();
  console.log(`Tables: ${tables.map((t) => t.name).join(", ")}`);

  // Get server_config data
  const serverConfig = db.prepare("SELECT * FROM server_config").all();
  console.log(`server_config entries: ${serverConfig.length}`);
  serverConfig.forEach((row) => {
    console.log(
      `  - ${row.key}: ${row.value.substring(0, 100)}${row.value.length > 100 ? "..." : ""}`
    );
  });

  // Get metadata
  const userSettings = db.prepare("SELECT * FROM metadata WHERE key = 'user_settings'").get();
  if (userSettings) {
    console.log(`user_settings found: ${userSettings.value.substring(0, 100)}...`);
  } else {
    console.log("user_settings: NOT FOUND");
  }

  return { tables, serverConfig, userSettings };
}

/**
 * Verify router_config table exists and has valid data
 */
function verifyRouterConfig(db) {
  console.log("\n🔍 Verifying router_config table:");
  console.log("-".repeat(60));

  // Check table exists
  const tableExists = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='router_config'")
    .get();
  if (!tableExists) {
    console.log("❌ router_config table does not exist!");
    return false;
  }
  console.log("✅ router_config table exists");

  // Check data exists
  const configData = db.prepare("SELECT * FROM router_config WHERE key = 'config'").get();
  if (!configData) {
    console.log("❌ No config entry found in router_config!");
    return false;
  }
  console.log("✅ Config entry exists");

  // Parse and validate config
  let routerConfig;
  try {
    routerConfig = JSON.parse(configData.value);
    console.log("✅ Config parses as valid JSON");
  } catch (e) {
    console.log(`❌ Config JSON parse error: ${e.message}`);
    return false;
  }

  // Validate schema
  const missingKeys = [];
  const wrongTypes = [];

  for (const [key, expectedType] of Object.entries(ROUTER_CONFIG_SCHEMA)) {
    if (routerConfig[key] === undefined) {
      missingKeys.push(key);
    } else {
      const actualType = typeof routerConfig[key];
      const typeMap = {
        number: ["number"],
        string: ["string"],
        boolean: ["boolean"],
      };

      if (!typeMap[expectedType]?.includes(actualType)) {
        wrongTypes.push(`${key}: expected ${expectedType}, got ${actualType}`);
      }
    }
  }

  if (missingKeys.length > 0) {
    console.log(`❌ Missing keys: ${missingKeys.join(", ")}`);
  } else {
    console.log("✅ All expected keys present");
  }

  if (wrongTypes.length > 0) {
    console.log(`❌ Wrong types: ${wrongTypes.join(", ")}`);
  } else {
    console.log("✅ All types are correct");
  }

  console.log("\n📋 router_config content:");
  console.log(JSON.stringify(routerConfig, null, 2));

  return missingKeys.length === 0 && wrongTypes.length === 0;
}

/**
 * Verify logging_config table exists and has valid data
 */
function verifyLoggingConfig(db) {
  console.log("\n🔍 Verifying logging_config table:");
  console.log("-".repeat(60));

  // Check table exists
  const tableExists = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='logging_config'")
    .get();
  if (!tableExists) {
    console.log("❌ logging_config table does not exist!");
    return false;
  }
  console.log("✅ logging_config table exists");

  // Check data exists
  const configData = db.prepare("SELECT * FROM logging_config WHERE key = 'config'").get();
  if (!configData) {
    console.log("❌ No config entry found in logging_config!");
    return false;
  }
  console.log("✅ Config entry exists");

  // Parse and validate config
  let loggingConfig;
  try {
    loggingConfig = JSON.parse(configData.value);
    console.log("✅ Config parses as valid JSON");
  } catch (e) {
    console.log(`❌ Config JSON parse error: ${e.message}`);
    return false;
  }

  // Validate schema
  const missingKeys = [];
  const wrongTypes = [];

  for (const [key, expectedType] of Object.entries(LOGGING_CONFIG_SCHEMA)) {
    if (loggingConfig[key] === undefined) {
      missingKeys.push(key);
    } else {
      const actualType = typeof loggingConfig[key];
      const typeMap = {
        number: ["number"],
        string: ["string"],
        boolean: ["boolean"],
      };

      if (!typeMap[expectedType]?.includes(actualType)) {
        wrongTypes.push(`${key}: expected ${expectedType}, got ${actualType}`);
      }
    }
  }

  if (missingKeys.length > 0) {
    console.log(`❌ Missing keys: ${missingKeys.join(", ")}`);
  } else {
    console.log("✅ All expected keys present");
  }

  if (wrongTypes.length > 0) {
    console.log(`❌ Wrong types: ${wrongTypes.join(", ")}`);
  } else {
    console.log("✅ All types are correct");
  }

  console.log("\n📋 logging_config content:");
  console.log(JSON.stringify(loggingConfig, null, 2));

  return missingKeys.length === 0 && wrongTypes.length === 0;
}

/**
 * Verify migration_backup_004 table exists and has data
 */
function verifyBackupTable(db) {
  console.log("\n🔍 Verifying migration_backup_004 table:");
  console.log("-".repeat(60));

  // Check table exists
  const tableExists = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='migration_backup_004'")
    .get();
  if (!tableExists) {
    console.log("❌ migration_backup_004 table does not exist!");
    return false;
  }
  console.log("✅ migration_backup_004 table exists");

  // Check backup data
  const backupEntries = db.prepare("SELECT * FROM migration_backup_004").all();
  console.log(`✅ Backup entries: ${backupEntries.length}`);

  if (backupEntries.length === 0) {
    console.log("⚠️  Warning: No backup entries found");
  } else {
    console.log("\n📋 Backup entries:");
    backupEntries.forEach((entry) => {
      console.log(
        `  - ${entry.source_table}.${entry.source_key}: ${entry.original_value?.substring(0, 50)}...`
      );
    });
  }

  return true;
}

/**
 * Verify old data was cleaned up
 */
function verifyCleanup(db) {
  console.log("\n🔍 Verifying old data cleanup:");
  console.log("-".repeat(60));

  // Check if config key was removed from server_config
  const oldConfig = db.prepare("SELECT * FROM server_config WHERE key = 'config'").get();
  if (oldConfig) {
    console.log("❌ Old config entry still exists in server_config!");
    return false;
  }
  console.log("✅ Old config entry removed from server_config");

  // Check that user_settings was retained (for backward compatibility)
  const userSettings = db.prepare("SELECT * FROM metadata WHERE key = 'user_settings'").get();
  if (userSettings) {
    console.log("✅ user_settings retained in metadata for backward compatibility");
  } else {
    console.log(
      "⚠️  Warning: user_settings was not found (might be expected if it didn't exist before)"
    );
  }

  return true;
}

/**
 * Verify indexes were created
 */
function verifyIndexes(db) {
  console.log("\n🔍 Verifying indexes:");
  console.log("-".repeat(60));

  const requiredIndexes = ["idx_router_config_key", "idx_logging_config_key"];

  let allValid = true;
  for (const idxName of requiredIndexes) {
    const index = db
      .prepare("SELECT name FROM sqlite_master WHERE type='index' AND name = ?")
      .get(idxName);
    if (index) {
      console.log(`✅ Index ${idxName} exists`);
    } else {
      console.log(`❌ Index ${idxName} missing!`);
      allValid = false;
    }
  }

  return allValid;
}

/**
 * Main test function
 */
async function runVerification() {
  console.log("=".repeat(60));
  console.log("DATABASE MIGRATION 004 VERIFICATION");
  console.log("=".repeat(60));

  const dbPath = getDbPath();

  // Check if database exists
  if (!existsSync(dbPath)) {
    console.error(`❌ Database not found at: ${dbPath}`);
    process.exit(1);
  }

  // Backup database
  const backupPath = backupDatabase(dbPath);

  // Load migration module
  console.log("\n📦 Loading migration module...");
  const migration = await loadMigration();
  console.log("✅ Migration module loaded");

  // Open database
  const db = new Database(dbPath);
  console.log("✅ Database connection established");

  // Get pre-migration state
  const preState = getPreMigrationState(db);

  // Check if migration is needed
  const needsMigration = migration.isMigrationNeeded(db);
  console.log(`\n🔄 Migration needed: ${needsMigration}`);

  if (needsMigration) {
    // Run migration
    console.log("\n🚀 Running migration...");
    const result = migration.runMigration(db);

    if (!result.success) {
      console.error(`\n❌ Migration failed: ${result.error}`);
      process.exit(1);
    }

    console.log(`\n✅ Migration completed in ${result.duration}ms`);
    console.log(`   - router_config keys: ${result.routerConfig?.length || 0}`);
    console.log(`   - logging_config keys: ${result.loggingConfig?.length || 0}`);
  } else {
    console.log("\n⚠️  Migration not needed - tables already exist");
  }

  // Run verification checks
  console.log("\n" + "=".repeat(60));
  console.log("VERIFICATION CHECKS");
  console.log("=".repeat(60));

  const results = {
    routerConfig: verifyRouterConfig(db),
    loggingConfig: verifyLoggingConfig(db),
    backupTable: verifyBackupTable(db),
    cleanup: verifyCleanup(db),
    indexes: verifyIndexes(db),
  };

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("VERIFICATION SUMMARY");
  console.log("=".repeat(60));

  const allPassed = Object.values(results).every((r) => r);

  for (const [check, passed] of Object.entries(results)) {
    console.log(`${passed ? "✅" : "❌"} ${check}: ${passed ? "PASS" : "FAIL"}`);
  }

  console.log("\n" + (allPassed ? "🎉 ALL CHECKS PASSED!" : "❌ SOME CHECKS FAILED"));

  // Close database
  db.close();

  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
}

// Run verification
runVerification().catch((error) => {
  console.error("\n❌ Verification script error:", error);
  process.exit(1);
});
