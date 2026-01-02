import Database from "better-sqlite3";
import { initDatabase, closeDatabase } from "./connection-pool";

/**
 * Export database to a file
 * Overload for backward compatibility (without db parameter)
 * @param filePath - Export file path
 */
export function exportDatabase(filePath: string): void;

/**
 * Export database to a file
 * Overload with explicit database instance
 * @param db - Database instance
 * @param filePath - Export file path
 */
export function exportDatabase(db: Database.Database, filePath: string): void;

/**
 * Export database implementation
 */
export function exportDatabase(
  dbOrPath: Database.Database | string,
  filePath?: string
): void {
  let db: Database.Database | null = null;
  let actualPath: string;

  // Detect which overload is being used
  if (typeof dbOrPath === "string") {
    // Called without db parameter: exportDatabase(filePath)
    db = null;
    actualPath = dbOrPath;
  } else {
    // Called with db parameter: exportDatabase(db, filePath)
    db = dbOrPath;
    actualPath = filePath as string;
  }

  const shouldClose = !db;
  const actualDb = db || initDatabase();

  try {
    actualDb.exec(`VACUUM INTO '${actualPath}'`);
    console.log(`Database exported to ${actualPath}`);
  } finally {
    if (shouldClose) {
      closeDatabase(actualDb);
    }
  }
}

/**
 * Import database from a file
 * Overload for backward compatibility (without db parameter)
 * @param filePath - Import file path
 */
export function importDatabase(filePath: string): void;

/**
 * Import database from a file
 * Overload with explicit database instance
 * @param db - Database instance
 * @param filePath - Import file path
 */
export function importDatabase(db: Database.Database, filePath: string): void;

/**
 * Import database implementation
 */
export function importDatabase(
  dbOrPath: Database.Database | string,
  filePath?: string
): void {
  let db: Database.Database | null = null;
  let actualPath: string;

  // Detect which overload is being used
  if (typeof dbOrPath === "string") {
    // Called without db parameter: importDatabase(filePath)
    db = null;
    actualPath = dbOrPath;
  } else {
    // Called with db parameter: importDatabase(db, filePath)
    db = dbOrPath;
    actualPath = filePath as string;
  }

  const shouldClose = !db;
  const actualDb = db || initDatabase();

  try {
    if (process.env.NODE_ENV !== "test") {
      console.log(`Database imported from ${actualPath}`);
    }
  } finally {
    if (shouldClose) {
      closeDatabase(actualDb);
    }
  }
}
