#!/usr/bin/env node

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'llama-dashboard.db');

console.log('=== Database Investigation Script ===\n');

// Check if database file exists
if (fs.existsSync(DB_PATH)) {
  const stats = fs.statSync(DB_PATH);
  console.log(`✅ Database file exists`);
  console.log(`   Path: ${DB_PATH}`);
  console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`   Modified: ${stats.mtime}`);
} else {
  console.log(`❌ Database file does NOT exist at ${DB_PATH}`);
  process.exit(0);
}

// Check for WAL file
const walPath = DB_PATH + '-wal';
if (fs.existsSync(walPath)) {
  const walStats = fs.statSync(walPath);
  console.log(`\n✅ WAL file exists`);
  console.log(`   Path: ${walPath}`);
  console.log(`   Size: ${(walStats.size / 1024).toFixed(2)} KB`);
  console.log(`   Modified: ${walStats.mtime}`);
} else {
  console.log(`\n❌ WAL file does NOT exist`);
}

console.log('\n=== Opening Database ===');

const db = new Database(DB_PATH, { readonly: false, fileMustExist: false, timeout: 5000 });

try {
  // Check journal mode
  const journalMode = db.pragma('journal_mode', { simple: true });
  console.log(`Current journal_mode: ${journalMode}`);

  // Try to checkpoint
  console.log('\n=== Checking WAL checkpoint ===');
  const checkpointResult = db.pragma('wal_checkpoint(TRUNCATE)');
  console.log('WAL checkpoint result:', checkpointResult);

  // Count models
  console.log('\n=== Database Contents ===');
  const modelCount = db.prepare('SELECT COUNT(*) as count FROM models').get();
  console.log(`Models in database: ${modelCount.count}`);

  // List models
  if (modelCount.count > 0) {
    console.log('\nModel list:');
    const models = db.prepare('SELECT id, name, status, created_at FROM models ORDER BY id').all();
    models.forEach(m => {
      const date = new Date(m.created_at).toISOString();
      console.log(`  [${m.id}] ${m.name} - ${m.status} - ${date}`);
    });
  }

  // Check database integrity
  console.log('\n=== Database Integrity Check ===');
  const integrityCheck = db.pragma('integrity_check');
  if (Array.isArray(integrityCheck)) {
    integrityCheck.forEach(result => {
      console.log(`  ${result}`);
    });
  } else {
    console.log(`  ${integrityCheck}`);
  }

  // List all tables
  console.log('\n=== Database Tables ===');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  tables.forEach(t => {
    console.log(`  - ${t.name}`);
  });

} catch (error) {
  console.error(`\n❌ Error: ${error.message}`);
  console.error(error.stack);
} finally {
  db.close();
}

console.log('\n=== End of Investigation ===\n');
