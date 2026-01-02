import Database from "better-sqlite3";
import { initDatabase, closeDatabase } from "./connection-pool";

/**
 * Vacuum database (rebuild database file and reclaim space)
 * @param db - Optional database instance (will create one if not provided)
 */
export function vacuumDatabase(db?: Database.Database): void {
  const shouldClose = !db;
  const actualDb = db || initDatabase();

  try {
    actualDb.pragma("wal_checkpoint(TRUNCATE)");
    actualDb.exec("VACUUM");
    console.log("Database vacuumed successfully");
  } finally {
    if (shouldClose) {
      closeDatabase(actualDb);
    }
  }
}
