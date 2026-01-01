import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { createTables } from "./database.types";

const DB_PATH = path.join(process.cwd(), "data", "llama-dashboard.db");

/**
 * Initialize database connection and create tables if needed
 * @returns Database instance
 */
export function initDatabase(): Database.Database {
  const db = new Database(DB_PATH, {
    readonly: false,
    fileMustExist: false,
    timeout: 5000,
  });

  // Try to set WAL mode, but don't fail if it fails (e.g., in test environments)
  try {
    db.pragma("journal_mode = WAL");
  } catch (error) {
    // WAL mode may fail in certain environments, fall back to DELETE mode
    console.warn(
      `[Database] Could not enable WAL mode: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  db.pragma("synchronous = NORMAL"); // Balance between performance and durability
  db.pragma("cache_size = -64000"); // 64MB cache
  db.pragma("temp_store = MEMORY");

  // Create tables if they don't exist
  createTables(db);

  return db;
}

/**
 * Close database connection and checkpoint WAL
 * @param db - Database instance to close
 */
export function closeDatabase(db: Database.Database): void {
  try {
    // Perform WAL checkpoint to ensure all changes are written to main database
    const checkpoint = db.pragma("wal_checkpoint(TRUNCATE)");
    // Only log if there was data to checkpoint
    if (
      checkpoint &&
      typeof checkpoint === "object" &&
      "checkpointed" in checkpoint
    ) {
      const ckpt = checkpoint as {
        checkpointed: number;
        log: number;
        busy: number;
      };
      if (ckpt.checkpointed > 0 || ckpt.log > 0) {
        console.log(
          `[Database] WAL checkpoint: ${ckpt.checkpointed} pages checkpointed, ${ckpt.log} log pages, busy: ${ckpt.busy}`
        );
      }
    }
  } catch (error) {
    // Don't fail on checkpoint errors, just log them
    console.warn(
      `[Database] WAL checkpoint warning: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    db.close();
  }
}

/**
 * Get database file size in bytes
 * @returns Database file size in bytes
 */
export function getDatabaseSize(): number {
  const stats = fs.statSync(DB_PATH);
  return stats.size;
}
