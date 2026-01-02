import Database from "better-sqlite3";
import { initDatabase, closeDatabase } from "./connection-pool";

/**
 * Set metadata value
 * Overload for backward compatibility (without db parameter)
 * @param key - Metadata key
 * @param value - Metadata value
 */
export function setMetadata(key: string, value: string): void;

/**
 * Set metadata value
 * Overload with explicit database instance
 * @param db - Database instance
 * @param key - Metadata key
 * @param value - Metadata value
 */
export function setMetadata(
  db: Database.Database,
  key: string,
  value: string
): void;

/**
 * Set metadata value implementation
 */
export function setMetadata(
  dbOrKey: Database.Database | string,
  keyOrValue?: string,
  value?: string
): void {
  let db: Database.Database | null = null;
  let key: string;
  let val: string;

  // Detect which overload is being used
  if (typeof dbOrKey === "string") {
    // Called without db parameter: setMetadata(key, value)
    db = null;
    key = dbOrKey;
    val = keyOrValue as string;
  } else {
    // Called with db parameter: setMetadata(db, key, value)
    db = dbOrKey;
    key = keyOrValue as string;
    val = value as string;
  }

  const shouldClose = !db;
  const actualDb = db || initDatabase();

  try {
    const stmt = actualDb.prepare(`
      INSERT INTO metadata (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);

    stmt.run(key, val, Date.now());
  } finally {
    if (shouldClose) {
      closeDatabase(actualDb);
    }
  }
}

/**
 * Get metadata value
 * Overload for backward compatibility (without db parameter)
 * @param key - Metadata key
 * @returns Metadata value or null if not found
 */
export function getMetadata(key: string): string | null;

/**
 * Get metadata value
 * Overload with explicit database instance
 * @param db - Database instance
 * @param key - Metadata key
 * @returns Metadata value or null if not found
 */
export function getMetadata(db: Database.Database, key: string): string | null;

/**
 * Get metadata value implementation
 */
export function getMetadata(
  dbOrKey: Database.Database | string,
  key?: string
): string | null {
  let db: Database.Database | null = null;
  let actualKey: string;

  // Detect which overload is being used
  if (typeof dbOrKey === "string") {
    // Called without db parameter: getMetadata(key)
    db = null;
    actualKey = dbOrKey;
  } else {
    // Called with db parameter: getMetadata(db, key)
    db = dbOrKey;
    actualKey = key as string;
  }

  const shouldClose = !db;
  const actualDb = db || initDatabase();

  try {
    const row = actualDb
      .prepare("SELECT value FROM metadata WHERE key = ?")
      .get(actualKey) as { value: string } | undefined;

    if (!row) return null;
    return row.value;
  } finally {
    if (shouldClose) {
      closeDatabase(actualDb);
    }
  }
}

/**
 * Delete metadata value
 * Overload for backward compatibility (without db parameter)
 * @param key - Metadata key
 */
export function deleteMetadata(key: string): void;

/**
 * Delete metadata value
 * Overload with explicit database instance
 * @param db - Database instance
 * @param key - Metadata key
 */
export function deleteMetadata(db: Database.Database, key: string): void;

/**
 * Delete metadata value implementation
 */
export function deleteMetadata(
  dbOrKey: Database.Database | string,
  key?: string
): void {
  let db: Database.Database | null = null;
  let actualKey: string;

  // Detect which overload is being used
  if (typeof dbOrKey === "string") {
    // Called without db parameter: deleteMetadata(key)
    db = null;
    actualKey = dbOrKey;
  } else {
    // Called with db parameter: deleteMetadata(db, key)
    db = dbOrKey;
    actualKey = key as string;
  }

  const shouldClose = !db;
  const actualDb = db || initDatabase();

  try {
    const stmt = actualDb.prepare("DELETE FROM metadata WHERE key = ?");
    stmt.run(actualKey);
  } finally {
    if (shouldClose) {
      closeDatabase(actualDb);
    }
  }
}