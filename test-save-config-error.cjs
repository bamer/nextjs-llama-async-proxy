/**
 * Test script to reproduce the save_config error
 *
 * This test demonstrates:
 * 1. The issue with duplicate config entries in database
 * 2. The duplicate handler problem
 * 3. The INSERT vs INSERT OR REPLACE issue
 */

const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "data", "llama-dashboard.db");

console.log("=== Testing save_config error scenario ===\n");

// Step 1: Check if database exists
console.log("Step 1: Checking database...");
const fs = require("fs");
if (!fs.existsSync(DB_PATH)) {
  console.log(`❌ Database not found at ${DB_PATH}`);
  console.log("   Run the application first to create the database");
  process.exit(1);
}
console.log(`✅ Database found at ${DB_PATH}\n`);

// Step 2: Open database and check for duplicate configs
console.log("Step 2: Checking for duplicate configs...");
const db = new Database(DB_PATH, { readonly: true });

try {
  // Check for models
  const models = db.prepare("SELECT id, name FROM models").all();
  console.log(`📊 Found ${models.length} models:`);
  models.forEach(m => {
    console.log(`   - ID: ${m.id}, Name: ${m.name}`);
  });

  if (models.length === 0) {
    console.log("\n❌ No models found. Add a model first.");
    process.exit(0);
  }

  // Check for duplicate sampling configs
  const samplingConfigs = db.prepare(`
    SELECT id, model_id, created_at
    FROM model_sampling_config
    ORDER BY model_id, created_at DESC
  `).all();

  console.log(`\n📊 Sampling configs: ${samplingConfigs.length} total`);
  const duplicateSampling = findDuplicates(samplingConfigs, "model_id");
  if (duplicateSampling.length > 0) {
    console.log(`❌ DUPLICATE SAMPLING CONFIGS FOUND:`);
    duplicateSampling.forEach(dup => {
      console.log(`   - Model ID ${dup.model_id}: ${dup.count} records`);
      dup.records.forEach(r => {
        console.log(`     * ID: ${r.id}, Created: ${new Date(r.created_at).toISOString()}`);
      });
    });
  } else {
    console.log(`✅ No duplicate sampling configs`);
  }

  // Check for duplicate memory configs
  const memoryConfigs = db.prepare(`
    SELECT id, model_id, created_at
    FROM model_memory_config
    ORDER BY model_id, created_at DESC
  `).all();

  console.log(`\n📊 Memory configs: ${memoryConfigs.length} total`);
  const duplicateMemory = findDuplicates(memoryConfigs, "model_id");
  if (duplicateMemory.length > 0) {
    console.log(`❌ DUPLICATE MEMORY CONFIGS FOUND:`);
    duplicateMemory.forEach(dup => {
      console.log(`   - Model ID ${dup.model_id}: ${dup.count} records`);
    });
  } else {
    console.log(`✅ No duplicate memory configs`);
  }

  // Step 3: Test INSERT vs INSERT OR REPLACE
  console.log("\n\nStep 3: Testing INSERT vs INSERT OR REPLACE...");
  const testModelId = models[0].id;

  console.log(`Testing with model ID: ${testModelId}`);

  // Try to insert a sampling config
  const testConfig = {
    temperature: 0.8,
    top_k: 40,
    top_p: 0.9,
  };

  // Count before
  const beforeCount = db.prepare("SELECT COUNT(*) as count FROM model_sampling_config WHERE model_id = ?").get(testModelId);
  console.log(`Before INSERT: ${beforeCount.count} sampling configs for model ${testModelId}`);

  // This is what the current code does - just INSERT
  try {
    const insertStmt = db.prepare(`
      INSERT INTO model_sampling_config (
        model_id, temperature, top_k, top_p, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(testModelId, testConfig.temperature, testConfig.top_k, testConfig.top_p, Date.now(), Date.now());
    console.log(`✅ INSERT successful (created new record)`);

    const afterCount = db.prepare("SELECT COUNT(*) as count FROM model_sampling_config WHERE model_id = ?").get(testModelId);
    console.log(`After INSERT: ${afterCount.count} sampling configs for model ${testModelId}`);

    if (afterCount.count > beforeCount.count) {
      console.log(`❌ PROBLEM: Created DUPLICATE config instead of updating existing one!`);
      console.log(`   This is the root cause of the save error.`);
    }
  } catch (error) {
    console.log(`❌ INSERT failed: ${error.message}`);
    console.log(`   (This would happen if there's a UNIQUE constraint)`);
  }

} catch (error) {
  console.error(`\n❌ Error during test: ${error.message}`);
  console.error(error.stack);
} finally {
  db.close();
}

console.log("\n=== Test Complete ===");

function findDuplicates(records, keyField) {
  const groups = {};

  records.forEach(r => {
    const key = r[keyField];
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(r);
  });

  const duplicates = [];
  Object.keys(groups).forEach(key => {
    if (groups[key].length > 1) {
      duplicates.push({
        model_id: parseInt(key, 10),
        count: groups[key].length,
        records: groups[key]
      });
    }
  });

  return duplicates;
}
