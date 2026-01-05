/**
 * Database Export Script
 * Exports the SQLite database to a backup file
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import DatabasePackage from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const dataDir = path.join(process.cwd(), 'data');
const backupDir = path.join(dataDir, 'backup');
const sourceDb = path.join(dataDir, 'llama-dashboard.db');
const backupDb = path.join(backupDir, `llama-dashboard-backup-${Date.now()}.db`);

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Check if source database exists
if (!fs.existsSync(sourceDb)) {
  console.error('Error: Source database not found:', sourceDb);
  process.exit(1);
}

console.log('Exporting database...');
console.log('Source:', sourceDb);
console.log('Backup:', backupDb);

try {
  // Copy the database file
  fs.copyFileSync(sourceDb, backupDb);
  console.log('Database exported successfully!');
  console.log('Backup location:', backupDb);
} catch (error) {
  console.error('Error exporting database:', error.message);
  process.exit(1);
}
