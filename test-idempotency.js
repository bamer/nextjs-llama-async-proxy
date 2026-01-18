/**
 * Test idempotency of migration 004
 * Ensures the migration can be run multiple times without errors
 */

import Database from "better-sqlite3";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, "data/llama-dashboard.db");

async function testIdempotency() {
  console.log("🧪 TESTING MIGRATION IDEMPOTENCY");
  console.log("=".repeat(60));

  const migration = await import(
    `file://${join(__dirname, "server/db/migrations/004_unify_router_config.js")}`
  );
  const db = new Database(dbPath);

  // Check if migration is needed
  const needsMigration = migration.isMigrationNeeded(db);
  console.log(`\n🔄 Migration needed: ${needsMigration}`);

  if (needsMigration) {
    console.log("❌ ERROR: Migration should not be needed on already-migrated database!");
    db.close();
    return false;
  }

  console.log("✅ Migration correctly detects tables already exist");

  // Try to run migration anyway
  console.log("\n🚀 Attempting to run migration on already-migrated database...");
  try {
    const result = migration.runMigration(db);

    if (result.success) {
      console.log("✅ Migration ran successfully (idempotent)");
      console.log(`   - Duration: ${result.duration}ms`);
      console.log(`   - Router config keys: ${result.routerConfig?.length || 0}`);
      console.log(`   - Logging config keys: ${result.loggingConfig?.length || 0}`);
    } else {
      console.log(`❌ Migration failed: ${result.error}`);
      db.close();
      return false;
    }
  } catch (error) {
    console.log(`❌ Migration threw error: ${error.message}`);
    db.close();
    return false;
  }

  // Verify data is still intact
  console.log("\n🔍 Verifying data integrity after second migration...");

  const routerConfig = db.prepare("SELECT * FROM router_config WHERE key = 'config'").get();
  const loggingConfig = db.prepare("SELECT * FROM logging_config WHERE key = 'config'").get();
  const backupEntries = db.prepare("SELECT * FROM migration_backup_004").all();

  if (!routerConfig) {
    console.log("❌ router_config data lost!");
    db.close();
    return false;
  }

  if (!loggingConfig) {
    console.log("❌ logging_config data lost!");
    db.close();
    return false;
  }

  // Parse and validate
  try {
    const routerData = JSON.parse(routerConfig.value);
    const loggingData = JSON.parse(loggingConfig.value);

    if (Object.keys(routerData).length < 10) {
      console.log("❌ router_config appears incomplete!");
      db.close();
      return false;
    }

    if (Object.keys(loggingData).length < 5) {
      console.log("❌ logging_config appears incomplete!");
      db.close();
      return false;
    }

    console.log("✅ Data integrity verified");
    console.log(`   - router_config: ${Object.keys(routerData).length} keys`);
    console.log(`   - logging_config: ${Object.keys(loggingData).length} keys`);
    console.log(`   - backup entries: ${backupEntries.length}`);
  } catch (error) {
    console.log(`❌ Data parse error: ${error.message}`);
    db.close();
    return false;
  }

  db.close();
  console.log("\n🎉 IDEMPOTENCY TEST PASSED!");
  return true;
}

testIdempotency()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("❌ Test error:", error);
    process.exit(1);
  });
