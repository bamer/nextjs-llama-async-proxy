/**
 * Database Reset Script
 * Deletes the SQLite database file to reset to initial state
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const dataDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'llama-dashboard.db');
const shmPath = path.join(dataDir, 'llama-dashboard.db-shm');
const walPath = path.join(dataDir, 'llama-dashboard.db-wal');

// Check if database exists
if (fs.existsSync(dbPath)) {
  // Delete main database file
  fs.unlinkSync(dbPath);
  console.log('Database deleted:', dbPath);
} else {
  console.log('No database found at:', dbPath);
}

// Delete shared memory files if they exist
if (fs.existsSync(shmPath)) {
  fs.unlinkSync(shmPath);
  console.log('Shared memory file deleted:', shmPath);
}

if (fs.existsSync(walPath)) {
  fs.unlinkSync(walPath);
  console.log('WAL file deleted:', walPath);
}

console.log('Database reset complete. Restart the server to create a new database.');
