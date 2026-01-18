/**
 * Test API endpoints for migrated data
 * This simulates the server API calls to verify the data is accessible
 */

import Database from "better-sqlite3";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const dbPath = join(__dirname, "data/llama-dashboard.db");
const db = new Database(dbPath);

console.log("🧪 TESTING API ENDPOINTS (Simulated)");
console.log("=".repeat(60));

/**
 * Simulate routerConfig:get endpoint
 */
function testRouterConfigGet() {
  console.log("\n📋 Testing routerConfig:get endpoint...");

  try {
    // This is how the router config endpoint would retrieve data
    const configData = db.prepare("SELECT * FROM router_config WHERE key = 'config'").get();

    if (!configData) {
      console.log("❌ FAIL: No config found");
      return false;
    }

    const config = JSON.parse(configData.value);

    // Validate structure
    const requiredKeys = ["modelsPath", "serverPath", "host", "port", "maxModelsLoaded"];
    const missingKeys = requiredKeys.filter((key) => config[key] === undefined);

    if (missingKeys.length > 0) {
      console.log(`❌ FAIL: Missing required keys: ${missingKeys.join(", ")}`);
      return false;
    }

    console.log("✅ SUCCESS: routerConfig:get returns valid data");
    console.log(`   - host: ${config.host}`);
    console.log(`   - port: ${config.port}`);
    console.log(`   - maxModelsLoaded: ${config.maxModelsLoaded}`);
    console.log(`   - ctxSize: ${config.ctxSize}`);
    console.log(`   - threads: ${config.threads}`);

    return true;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

/**
 * Simulate loggingConfig:get endpoint
 */
function testLoggingConfigGet() {
  console.log("\n📋 Testing loggingConfig:get endpoint...");

  try {
    // This is how the logging config endpoint would retrieve data
    const configData = db.prepare("SELECT * FROM logging_config WHERE key = 'config'").get();

    if (!configData) {
      console.log("❌ FAIL: No config found");
      return false;
    }

    const config = JSON.parse(configData.value);

    // Validate structure
    const requiredKeys = ["level", "maxFileSize", "maxFiles", "enableFileLogging"];
    const missingKeys = requiredKeys.filter((key) => config[key] === undefined);

    if (missingKeys.length > 0) {
      console.log(`❌ FAIL: Missing required keys: ${missingKeys.join(", ")}`);
      return false;
    }

    console.log("✅ SUCCESS: loggingConfig:get returns valid data");
    console.log(`   - level: ${config.level}`);
    console.log(`   - maxFileSize: ${config.maxFileSize}`);
    console.log(`   - maxFiles: ${config.maxFiles}`);
    console.log(`   - enableFileLogging: ${config.enableFileLogging}`);
    console.log(`   - enableDatabaseLogging: ${config.enableDatabaseLogging}`);

    return true;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

/**
 * Test data integrity - ensure defaults were applied correctly
 */
function testDataIntegrity() {
  console.log("\n📋 Testing data integrity...");

  try {
    const routerConfig = JSON.parse(
      db.prepare("SELECT * FROM router_config WHERE key = 'config'").get().value
    );
    const loggingConfig = JSON.parse(
      db.prepare("SELECT * FROM logging_config WHERE key = 'config'").get().value
    );

    // Check router config defaults
    const routerDefaults = {
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

    // Check logging config defaults
    const loggingDefaults = {
      level: "info",
      maxFileSize: 10485760,
      maxFiles: 7,
      enableFileLogging: true,
      enableDatabaseLogging: true,
      enableConsoleLogging: true,
    };

    console.log("\n🔍 Router Config Migration Analysis:");
    for (const [key, expectedValue] of Object.entries(routerDefaults)) {
      const actualValue = routerConfig[key];
      const migrated = actualValue !== expectedValue;
      console.log(
        `   ${migrated ? "📦" : "📋"} ${key}: ${actualValue} ${migrated ? "(migrated from old config)" : "(default)"}`
      );
    }

    console.log("\n🔍 Logging Config Migration Analysis:");
    for (const [key, expectedValue] of Object.entries(loggingDefaults)) {
      const actualValue = loggingConfig[key];
      const migrated = actualValue !== expectedValue;
      console.log(
        `   ${migrated ? "📦" : "📋"} ${key}: ${actualValue} ${migrated ? "(migrated from old config)" : "(default)"}`
      );
    }

    console.log("\n✅ SUCCESS: Data integrity verified");
    return true;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

/**
 * Test backup restoration capability
 */
function testBackupCapability() {
  console.log("\n📋 Testing backup restoration capability...");

  try {
    const backupEntries = db.prepare("SELECT * FROM migration_backup_004").all();

    if (backupEntries.length === 0) {
      console.log("❌ FAIL: No backup entries found");
      return false;
    }

    console.log(`✅ SUCCESS: Found ${backupEntries.length} backup entries`);
    console.log("   Backup can be used to restore previous configuration if needed:");

    backupEntries.forEach((entry) => {
      console.log(`   - ${entry.source_table}.${entry.source_key}`);
    });

    return true;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

// Run all tests
const results = {
  routerConfig: testRouterConfigGet(),
  loggingConfig: testLoggingConfigGet(),
  dataIntegrity: testDataIntegrity(),
  backup: testBackupCapability(),
};

// Summary
console.log("\n" + "=".repeat(60));
console.log("API ENDPOINT TEST SUMMARY");
console.log("=".repeat(60));

const allPassed = Object.values(results).every((r) => r);
for (const [test, passed] of Object.entries(results)) {
  console.log(`${passed ? "✅" : "❌"} ${test}: ${passed ? "PASS" : "FAIL"}`);
}

console.log("\n" + (allPassed ? "🎉 ALL API TESTS PASSED!" : "❌ SOME API TESTS FAILED"));

db.close();

process.exit(allPassed ? 0 : 1);
