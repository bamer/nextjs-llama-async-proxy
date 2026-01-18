/**
 * Inspect current database state before migration
 */

import Database from "better-sqlite3";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const dbPath = join(__dirname, "data/llama-dashboard.db");
const db = new Database(dbPath);

console.log("📊 CURRENT DATABASE STATE");
console.log("=".repeat(60));

// Get all tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log(`\nTables: ${tables.map((t) => t.name).join(", ")}`);

// Get server_config data
console.log("\n📋 server_config:");
const serverConfig = db.prepare("SELECT * FROM server_config").all();
if (serverConfig.length > 0) {
  serverConfig.forEach((row) => {
    console.log(
      `  - ${row.key}: ${row.value.substring(0, 200)}${row.value.length > 200 ? "..." : ""}`
    );
  });
} else {
  console.log("  (empty)");
}

// Get metadata
console.log("\n📋 metadata (user_settings):");
const userSettings = db.prepare("SELECT * FROM metadata WHERE key = 'user_settings'").get();
if (userSettings) {
  console.log(`  - key: ${userSettings.key}`);
  console.log(
    `  - value: ${userSettings.value.substring(0, 200)}${userSettings.value.length > 200 ? "..." : ""}`
  );
} else {
  console.log("  (not found)");
}

// Check if migration tables already exist
console.log("\n📋 Migration tables check:");
const routerConfigExists = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='router_config'")
  .get();
const loggingConfigExists = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='logging_config'")
  .get();
console.log(`  - router_config: ${routerConfigExists ? "EXISTS" : "NOT FOUND"}`);
console.log(`  - logging_config: ${loggingConfigExists ? "EXISTS" : "NOT FOUND"}`);

db.close();

console.log("\n✅ Database inspection complete");
