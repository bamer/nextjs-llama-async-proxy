import fs from "fs";
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
    if (!fs.existsSync(actualPath)) {
      console.warn(`Import file does not exist: ${actualPath}`);
      return;
    }

    actualDb.exec(`ATTACH DATABASE '${actualPath}' AS backup`);
    actualDb.exec(`
      INSERT INTO main.metrics_history
      SELECT * FROM backup.metrics_history
      WHERE NOT EXISTS (
        SELECT 1 FROM main.metrics_history WHERE main.metrics_history.id = backup.metrics_history.id
      );

      INSERT INTO main.models
      SELECT * FROM backup.models
      WHERE NOT EXISTS (
        SELECT 1 FROM main.models WHERE main.models.id = backup.models.id
      );

      INSERT INTO main.model_sampling_config
      SELECT * FROM backup.model_sampling_config
      WHERE NOT EXISTS (
        SELECT 1 FROM main.model_sampling_config WHERE main.model_sampling_config.id = backup.model_sampling_config.id
      );

      INSERT INTO main.model_memory_config
      SELECT * FROM backup.model_memory_config
      WHERE NOT EXISTS (
        SELECT 1 FROM main.model_memory_config WHERE main.model_memory_config.id = backup.model_memory_config.id
      );

      INSERT INTO main.model_gpu_config
      SELECT * FROM backup.model_gpu_config
      WHERE NOT EXISTS (
        SELECT 1 FROM main.model_gpu_config WHERE main.model_gpu_config.id = backup.model_gpu_config.id
      );

      INSERT INTO main.model_advanced_config
      SELECT * FROM backup.model_advanced_config
      WHERE NOT EXISTS (
        SELECT 1 FROM main.model_advanced_config WHERE main.model_advanced_config.id = backup.model_advanced_config.id
      );

      INSERT INTO main.model_lora_config
      SELECT * FROM backup.model_lora_config
      WHERE NOT EXISTS (
        SELECT 1 FROM main.model_lora_config WHERE main.model_lora_config.id = backup.model_lora_config.id
      );

      INSERT INTO main.model_multimodal_config
      SELECT * FROM backup.model_multimodal_config
      WHERE NOT EXISTS (
        SELECT 1 FROM main.model_multimodal_config WHERE main.model_multimodal_config.id = backup.model_multimodal_config.id
      );

      INSERT OR REPLACE INTO main.model_server_config
      SELECT * FROM backup.model_server_config;

      INSERT OR REPLACE INTO main.metadata
      SELECT * FROM backup.metadata;

      DETACH DATABASE backup;
    `);
    console.log(`Database imported from ${actualPath}`);
  } finally {
    if (shouldClose) {
      closeDatabase(actualDb);
    }
  }
}

/**
 * Clear all data from all tables (for testing)
 * @warning This will delete all data from the database
 * @param db - Optional database instance (will create one if not provided)
 */
export function clearAllTables(db?: Database.Database): void {
  const shouldClose = !db;
  const actualDb = db || initDatabase();

  try {
    actualDb.exec("DELETE FROM model_fit_params");
    actualDb.exec("DELETE FROM model_sampling_config");
    actualDb.exec("DELETE FROM model_memory_config");
    actualDb.exec("DELETE FROM model_gpu_config");
    actualDb.exec("DELETE FROM model_advanced_config");
    actualDb.exec("DELETE FROM model_lora_config");
    actualDb.exec("DELETE FROM model_multimodal_config");
    actualDb.exec("DELETE FROM models");
    actualDb.exec("DELETE FROM metrics_history");
    console.log("All tables cleared");
  } finally {
    if (shouldClose) {
      closeDatabase(actualDb);
    }
  }
}
