import Database from "better-sqlite3";
import { initDatabase, closeDatabase } from "./connection-pool";
import {
  executeStatement,
  getRow,
  executeSql,
  executeTransaction,
  setMetadataInDb,
  getMetadataFromDb,
  deleteMetadataFromDb,
  vacuumDb,
  clearTables,
  getTablesToClear,
} from "./query-builder";
import {
  validateFilePath,
  validateImportOperation,
  validateExportOperation,
} from "./query-validator";
import {
  formatDbSuccess,
  formatDbWarning,
  formatMetadataValue,
  formatExportSql,
  formatAttachBackupSql,
  getImportTableQueries,
} from "./query-formatter";

// Set metadata value (with or without db parameter)
export function setMetadata(
  dbOrKey: Database.Database | string,
  keyOrValue?: string,
  value?: string
): void {
  let db: Database.Database | null = null;
  let key: string;
  let val: string;
  if (typeof dbOrKey === "string") {
    db = null; key = dbOrKey; val = keyOrValue as string;
  } else {
    db = dbOrKey; key = keyOrValue as string; val = value as string;
  }
  const shouldClose = !db;
  const actualDb = db || initDatabase();
  try {
    setMetadataInDb(actualDb, key, formatMetadataValue(val));
  } finally {
    if (shouldClose) closeDatabase(actualDb);
  }
}

// Get metadata value (with or without db parameter)
export function getMetadata(
  dbOrKey: Database.Database | string,
  key?: string
): string | null {
  let db: Database.Database | null = null;
  let actualKey: string;
  if (typeof dbOrKey === "string") {
    db = null; actualKey = dbOrKey;
  } else {
    db = dbOrKey; actualKey = key as string;
  }
  const shouldClose = !db;
  const actualDb = db || initDatabase();
  try {
    return getMetadataFromDb(actualDb, actualKey);
  } finally {
    if (shouldClose) closeDatabase(actualDb);
  }
}

// Delete metadata value (with or without db parameter)
export function deleteMetadata(
  dbOrKey: Database.Database | string,
  key?: string
): void {
  let db: Database.Database | null = null;
  let actualKey: string;
  if (typeof dbOrKey === "string") {
    db = null; actualKey = dbOrKey;
  } else {
    db = dbOrKey; actualKey = key as string;
  }
  const shouldClose = !db;
  const actualDb = db || initDatabase();
  try {
    deleteMetadataFromDb(actualDb, actualKey);
  } finally {
    if (shouldClose) closeDatabase(actualDb);
  }
}

// Vacuum database (rebuild database file and reclaim space)
export function vacuumDatabase(db?: Database.Database): void {
  const shouldClose = !db;
  const actualDb = db || initDatabase();
  try {
    vacuumDb(actualDb);
    console.log(formatDbSuccess("vacuumed"));
  } finally {
    if (shouldClose) closeDatabase(actualDb);
  }
}

// Export database to a file (with or without db parameter)
export function exportDatabase(
  dbOrPath: Database.Database | string,
  filePath?: string
): void {
  let db: Database.Database | null = null;
  let actualPath: string;
  if (typeof dbOrPath === "string") {
    db = null; actualPath = dbOrPath;
  } else {
    db = dbOrPath; actualPath = filePath as string;
  }
  const validation = validateExportOperation(actualPath);
  if (!validation.isValid) throw new Error(validation.error);
  const shouldClose = !db;
  const actualDb = db || initDatabase();
  try {
    const sql = formatExportSql(actualPath);
    executeSql(actualDb, sql);
    console.log(formatDbSuccess("exported", actualPath));
  } finally {
    if (shouldClose) closeDatabase(actualDb);
  }
}

// Import database from a file (with or without db parameter)
export function importDatabase(
  dbOrPath: Database.Database | string,
  filePath?: string
): void {
  let db: Database.Database | null = null;
  let actualPath: string;
  if (typeof dbOrPath === "string") {
    db = null; actualPath = dbOrPath;
  } else {
    db = dbOrPath; actualPath = filePath as string;
  }
  const validation = validateImportOperation(actualPath);
  if (!validation.isValid) {
    console.warn(formatDbWarning("import", validation.error || ""));
    return;
  }
  const shouldClose = !db;
  const actualDb = db || initDatabase();
  try {
    const attachSql = formatAttachBackupSql(actualPath);
    const importQueries = getImportTableQueries();
    executeSql(actualDb, attachSql);
    executeTransaction(actualDb, importQueries);
    console.log(formatDbSuccess("imported", actualPath));
  } finally {
    if (shouldClose) closeDatabase(actualDb);
  }
}

// Clear all data from all tables (for testing)
export function clearAllTables(db?: Database.Database): void {
  const shouldClose = !db;
  const actualDb = db || initDatabase();
  try {
    clearTables(actualDb, getTablesToClear());
    console.log("All tables cleared");
  } finally {
    if (shouldClose) closeDatabase(actualDb);
  }
}
