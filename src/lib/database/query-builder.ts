import Database from "better-sqlite3";
import { initDatabase, closeDatabase } from "./connection-pool";

/**
 * Execute a prepared statement with parameters
 * @param db - Database instance
 * @param sql - SQL statement with placeholders
 * @param params - Parameters to bind to placeholders
 * @returns Run result
 */
export function executeStatement<T = Database.RunResult>(
  db: Database.Database,
  sql: string,
  params: unknown[] = []
): T {
  const stmt = db.prepare(sql);
  return stmt.run(...params) as T;
}

/**
 * Execute a prepared statement and get a single row
 * @param db - Database instance
 * @param sql - SQL statement with placeholders
 * @param params - Parameters to bind to placeholders
 * @returns Single row or undefined
 */
export function getRow<T = Record<string, unknown>>(
  db: Database.Database,
  sql: string,
  params: unknown[] = []
): T | undefined {
  const stmt = db.prepare(sql);
  return stmt.get(...params) as T | undefined;
}

/**
 * Execute a SQL statement (for operations without parameters)
 * @param db - Database instance
 * @param sql - SQL statement to execute
 */
export function executeSql(db: Database.Database, sql: string): void {
  db.exec(sql);
}

/**
 * Execute multiple SQL statements in a transaction
 * @param db - Database instance
 * @param statements - Array of SQL statements to execute
 */
export function executeTransaction(
  db: Database.Database,
  statements: string[]
): void {
  const transaction = db.transaction(() => {
    statements.forEach((stmt) => db.exec(stmt));
  });
  transaction();
}

/**
 * Set metadata value in database
 * @param db - Database instance
 * @param key - Metadata key
 * @param value - Metadata value
 */
export function setMetadataInDb(
  db: Database.Database,
  key: string,
  value: string
): void {
  const stmt = db.prepare(`
    INSERT INTO metadata (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `);
  stmt.run(key, value, Date.now());
}

/**
 * Get metadata value from database
 * @param db - Database instance
 * @param key - Metadata key
 * @returns Metadata value or null if not found
 */
export function getMetadataFromDb(
  db: Database.Database,
  key: string
): string | null {
  const row = db
    .prepare("SELECT value FROM metadata WHERE key = ?")
    .get(key) as { value: string } | undefined;

  if (!row) {
    return null;
  }
  return row.value;
}

/**
 * Delete metadata value from database
 * @param db - Database instance
 * @param key - Metadata key
 */
export function deleteMetadataFromDb(db: Database.Database, key: string): void {
  const stmt = db.prepare("DELETE FROM metadata WHERE key = ?");
  stmt.run(key);
}

/**
 * Vacuum database to reclaim space
 * @param db - Database instance
 */
export function vacuumDb(db: Database.Database): void {
  db.pragma("wal_checkpoint(TRUNCATE)");
  db.exec("VACUUM");
}

/**
 * Clear all data from specific tables
 * @param db - Database instance
 * @param tables - Array of table names to clear
 */
export function clearTables(db: Database.Database, tables: string[]): void {
  tables.forEach((table) => {
    db.exec(`DELETE FROM ${table}`);
  });
}

/**
 * Get list of tables to clear
 * @returns Array of table names
 */
export function getTablesToClear(): string[] {
  return [
    "model_fit_params",
    "model_sampling_config",
    "model_memory_config",
    "model_gpu_config",
    "model_advanced_config",
    "model_lora_config",
    "model_multimodal_config",
    "models",
    "metrics_history",
  ];
}
