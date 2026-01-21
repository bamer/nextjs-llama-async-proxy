#!/usr/bin/env node
/**
 * Database Access Test Script
 * Tests if the database is writable and diagnoses readonly issues
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import DatabasePackage from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "data", "llama-dashboard.db");
console.log(`\n📁 File Check:`);
console.log(`  Exists: ${fs.existsSync(dbPath)}`);

if (fs.existsSync(dbPath)) {
  const stats = fs.statSync(dbPath);
  console.log(`  Size: ${stats.size} bytes`);
  console.log(`  Mode: ${(stats.mode & 0o777).toString(8)}`);
  console.log(`  Owner: ${stats.uid}:${stats.gid}`);
  console.log(
    `  Readable: ${fs.accessSync(dbPath, fs.constants.R_OK) ? "Yes" : "No"}`
  );
  console.log(
    `  Writable: ${fs.accessSync(dbPath, fs.constants.W_OK) ? "Yes" : "No"}`
  );
}

// Check parent directory
const parentDir = path.dirname(dbPath);
console.log(`\n📁 Parent Directory:`);
console.log(`  Path: ${parentDir}`);
console.log(`  Exists: ${fs.existsSync(parentDir)}`);
if (fs.existsSync(parentDir)) {
  const parentStats = fs.statSync(parentDir);
  console.log(`  Mode: ${(parentStats.mode & 0o777).toString(8)}`);
  console.log(
    `  Writable: ${fs.accessSync(parentDir, fs.constants.W_OK) ? "Yes" : "No"}`
  );
}

// Check for WAL files
const walFile = dbPath + "-wal";
const shmFile = dbPath + "-shm";
console.log(`\n📁 WAL Files:`);
console.log(`  -wal exists: ${fs.existsSync(walFile)}`);
console.log(`  -shm exists: ${fs.existsSync(shmFile)}`);

// Try to open database
console.log(`\n🗄️  Database Connection Test:`);
let db;
try {
  db = new Database(dbPath);
  console.log(`  ✅ Database opened successfully`);

  // Check journal mode
  const journalMode = db.pragma("journal_mode");
  console.log(`  Journal Mode: ${journalMode}`);

  // Try to read
  console.log(`\n📖 Read Test:`);
  const readTest = db.prepare("SELECT COUNT(*) as count FROM metadata").get();
  console.log(`  ✅ Read successful: ${readTest.count} metadata rows`);

  // Try to write (INSERT OR REPLACE)
  console.log(`\n✍️  Write Test:`);
  const testKey = "__test_write_" + Date.now();
  const testValue = JSON.stringify({
    test: true,
    timestamp: new Date().toISOString(),
  });

  try {
    db.prepare(
      "INSERT OR REPLACE INTO metadata (key, value, updated_at) VALUES (?, ?, ?)"
    ).run(testKey, testValue, Math.floor(Date.now() / 1000));
    console.log(`  ✅ Write successful!`);

    // Verify write
    const verify = db
      .prepare("SELECT value FROM metadata WHERE key = ?")
      .get(testKey);
    if (verify) {
      console.log(`  ✅ Write verified: ${verify.value}`);
    }

    // Clean up test data
    db.prepare("DELETE FROM metadata WHERE key = ?").run(testKey);
    console.log(`  🧹 Test data cleaned up`);
  } catch (writeError) {
    console.error(`  ❌ Write failed: ${writeError.message}`);
    console.error(`     Code: ${writeError.code}`);
    console.error(`     Errno: ${writeError.errno}`);
    console.error(`     Syscall: ${writeError.syscall}`);
    console.error(`     Path: ${writeError.path}`);
  }

  // Close database
  db.close();
  console.log(`\n🔒 Database closed`);
} catch (error) {
  console.error(`\n❌ Failed to open database: ${error.message}`);
  console.error(`   Code: ${error.code}`);
  console.error(`   Errno: ${error.errno}`);
  console.error(`   Syscall: ${error.syscall}`);
  console.error(`   Path: ${error.path}`);
}

console.log("\n" + "=".repeat(80));
console.log("🏁 Diagnostic Complete");
console.log("=".repeat(80));
