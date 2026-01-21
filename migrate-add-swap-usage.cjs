const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Resolve database path
const DB_PATH = path.resolve(__dirname, 'data', 'llama-dashboard.db');

console.log('DB_PATH:', DB_PATH);
console.log('File exists:', fs.existsSync(DB_PATH));

try {
  const db = new Database(DB_PATH);
  const stmt = db.prepare('SELECT 1 FROM pragma_table_info(?) WHERE name = ? LIMIT 1');
  const result = stmt.get('metrics', 'swap_usage');
  if (!result) {
    console.log('[MIGRATION] Adding missing swap_usage column to metrics table...');
    db.prepare('ALTER TABLE metrics ADD COLUMN swap_usage REAL DEFAULT 0').run();
    console.log('[MIGRATION] Migration completed.');
  } else {
    console.log('[MIGRATION] swap_usage column already exists.');
  }
  db.close();
} catch (err) {
  console.error('[MIGRATION] Error:', err.message);
  process.exit(1);
}
