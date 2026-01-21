/**
 * Database Migration Script
 * Removes legacy fields from router_config and ensures clean config
 *
 * Run this script to clean existing databases:
 *   node server/db/migrate-config.js
 */

import Database from "better-sqlite3";
import unifiedConfig from "./unified-config.js";

const { LEGACY_FIELDS, UNIFIED_CONFIG_DEFAULTS } = unifiedConfig;

const DB_PATH = "./data/llama-dashboard.db";

function migrateDatabase() {
  console.log("[Migration] Starting database migration...");
  console.log("[Migration] Database:", DB_PATH);

  const db = new Database(DB_PATH);

  try {
    // Check current config
    const result = db.prepare("SELECT value FROM router_config WHERE key = ?").get("config");

    if (!result) {
      console.log("[Migration] No config found - initializing defaults");
      const timestamp = Math.floor(Date.now() / 1000);
      db.prepare(
        "INSERT OR REPLACE INTO router_config (key, value, updated_at) VALUES (?, ?, ?)"
      ).run("config", JSON.stringify(UNIFIED_CONFIG_DEFAULTS), timestamp);
      console.log("[Migration] Initialized with defaults");
      return;
    }

    const parsed = JSON.parse(result.value);

    // Find legacy fields
    const legacyFieldsFound = LEGACY_FIELDS.filter((field) => parsed[field] !== undefined);

    if (legacyFieldsFound.length === 0) {
      console.log("[Migration] No legacy fields found - database is clean");
      return;
    }

    console.log("[Migration] Found legacy fields:", legacyFieldsFound);

    // Clean legacy fields
    const cleanConfig = { ...UNIFIED_CONFIG_DEFAULTS };
    for (const [key, value] of Object.entries(parsed)) {
      if (!LEGACY_FIELDS.includes(key)) {
        cleanConfig[key] = value;
      }
    }

    // Show before/after
    console.log("[Migration] Before:");
    console.log("  - port:", parsed.port);
    console.log("  - llama_server_port:", parsed.llama_server_port);

    console.log("[Migration] After:");
    console.log("  - port:", cleanConfig.port);
    console.log("  - llama_server_port: REMOVED");

    // Save cleaned config
    const timestamp = Math.floor(Date.now() / 1000);
    db.prepare(
      "INSERT OR REPLACE INTO router_config (key, value, updated_at) VALUES (?, ?, ?)"
    ).run("config", JSON.stringify(cleanConfig), timestamp);

    console.log("[Migration] Successfully cleaned database");
    console.log(`[Migration] Removed ${legacyFieldsFound.length} legacy fields`);

    // Verify
    const verifyResult = db.prepare("SELECT value FROM router_config WHERE key = ?").get("config");
    const verifyParsed = JSON.parse(verifyResult.value);
    const remainingLegacy = LEGACY_FIELDS.filter((field) => verifyParsed[field] !== undefined);

    if (remainingLegacy.length > 0) {
      console.error("[Migration] ERROR: Some legacy fields still present:", remainingLegacy);
      process.exit(1);
    }

    console.log("[Migration] Verification passed - no legacy fields remain");
    console.log("[Migration] Current port:", verifyParsed.port);
  } catch (error) {
    console.error("[Migration] Error:", error.message);
    throw error;
  } finally {
    db.close();
  }
}

// Run if called directly
if (process.argv[1]?.includes("migrate-config.js")) {
  migrateDatabase();
}

export { migrateDatabase };
