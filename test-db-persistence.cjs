#!/usr/bin/env node

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'llama-dashboard.db');

console.log('=== Database Persistence Test ===\n');

// Step 1: Clear database and check starting state
console.log('Step 1: Clearing database...');
const db = new Database(DB_PATH, { readonly: false, fileMustExist: false });
db.pragma("journal_mode = WAL");
db.exec("DELETE FROM models");
db.exec("DELETE FROM sqlite_sequence WHERE name='models'");
db.close();
console.log('✅ Database cleared\n');

// Step 2: Simulate model import
console.log('Step 2: Importing test models...');
const db2 = new Database(DB_PATH, { readonly: false, fileMustExist: false });
db2.pragma("journal_mode = WAL");

const testModels = [
  { name: 'Model-Test-1', type: 'llama', status: 'stopped', model_path: '/models/test1.gguf', created_at: Date.now(), updated_at: Date.now() },
  { name: 'Model-Test-2', type: 'llama', status: 'stopped', model_path: '/models/test2.gguf', created_at: Date.now(), updated_at: Date.now() },
];

const stmt = db2.prepare(`
  INSERT INTO models (name, type, status, model_path, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

testModels.forEach(model => {
  stmt.run(model.name, model.type, model.status, model.model_path, model.created_at, model.updated_at);
  console.log(`  ✅ Imported: ${model.name}`);
});

// Verify import
const importedCount = db2.prepare('SELECT COUNT(*) as count FROM models').get();
console.log(`\n📊 Total models in database (before close): ${importedCount.count}\n`);

// Step 3: Close with WAL checkpoint (simulating our fix)
console.log('Step 3: Closing database with WAL checkpoint...');
try {
  const checkpoint = db2.pragma("wal_checkpoint(TRUNCATE)");
  console.log(`  WAL checkpoint result:`, checkpoint);
} catch (error) {
  console.error(`  ❌ Checkpoint error: ${error.message}`);
}
db2.close();
console.log('✅ Database closed\n');

// Step 4: Open new connection (simulate refresh)
console.log('Step 4: Opening new database connection (simulating page refresh)...');
const db3 = new Database(DB_PATH, { readonly: false, fileMustExist: false });
const countAfterReopen = db3.prepare('SELECT COUNT(*) as count FROM models').get();
console.log(`\n📊 Total models in database (after reopen): ${countAfterReopen.count}\n`);

if (countAfterReopen.count === testModels.length) {
  console.log('✅ SUCCESS: All models persisted after database close/reopen!\n');
} else {
  console.log(`❌ FAILURE: Expected ${testModels.length} models, found ${countAfterReopen.count}\n`);
}

// List models
const models = db3.prepare('SELECT id, name, status FROM models ORDER BY id').all();
console.log('Current models in database:');
models.forEach(m => {
  console.log(`  [${m.id}] ${m.name} - ${m.status}`);
});

db3.close();

console.log('\n=== Test Complete ===\n');
