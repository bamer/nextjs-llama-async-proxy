import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import {
  initDatabase,
  closeDatabase,
  getDatabaseSize,
  vacuumDatabase,
  exportDatabase,
  importDatabase,
  setMetadata,
  getMetadata,
  deleteMetadata,
} from "@/lib/database";

const DB_PATH = path.join(process.cwd(), "data", "llama-dashboard.db");
const TEST_EXPORT_PATH = path.join(process.cwd(), "data", "test-export.db");

describe("Database - Basic Operations", () => {
  afterEach(() => {
    if (fs.existsSync(TEST_EXPORT_PATH)) {
      fs.unlinkSync(TEST_EXPORT_PATH);
    }
  });

  it("should initialize database and create tables", () => {
    const db = initDatabase();
    expect(db).toBeDefined();
    expect(fs.existsSync(DB_PATH)).toBe(true);
    closeDatabase(db);
  });

  it("should close database connection", () => {
    const db = initDatabase();
    closeDatabase(db);
    expect(() => closeDatabase(db)).not.toThrow();
  });

  it("should get database size", () => {
    const db = initDatabase();
    const size = getDatabaseSize();
    expect(size).toBeGreaterThan(0);
    closeDatabase(db);
  });

  it("should vacuum database", () => {
    const db = initDatabase();
    expect(() => vacuumDatabase(db)).not.toThrow();
    closeDatabase(db);
  });

  it("should export database", () => {
    const db = initDatabase();
    expect(() => exportDatabase(TEST_EXPORT_PATH)).not.toThrow();
    expect(fs.existsSync(TEST_EXPORT_PATH)).toBe(true);
    closeDatabase(db);
  });

  it("should import database", () => {
    const db = initDatabase();
    expect(() => importDatabase(TEST_EXPORT_PATH)).not.toThrow();
    closeDatabase(db);
  });

  it("should handle importing non-existent file", () => {
    const db = initDatabase();
    expect(() => importDatabase("/non/existent/path.db")).not.toThrow();
    closeDatabase(db);
  });
});

describe("Metadata Operations", () => {
  beforeEach(() => {
    const db = initDatabase();
    closeDatabase(db);
  });

  it("should set and get metadata", () => {
    const db = initDatabase();
    setMetadata(db, "test-key", "test-value");
    const value = getMetadata(db, "test-key");
    expect(value).toBe("test-value");
    closeDatabase(db);
  });

  it("should update existing metadata", () => {
    const db = initDatabase();
    setMetadata(db, "test-key", "value1");
    setMetadata(db, "test-key", "value2");
    const value = getMetadata(db, "test-key");
    expect(value).toBe("value2");
    closeDatabase(db);
  });

  it("should return null for non-existent metadata", () => {
    const db = initDatabase();
    const value = getMetadata(db, "non-existent");
    expect(value).toBeNull();
    closeDatabase(db);
  });

  it("should delete metadata", () => {
    const db = initDatabase();
    setMetadata(db, "test-key", "test-value");
    deleteMetadata(db, "test-key");
    const value = getMetadata(db, "test-key");
    expect(value).toBeNull();
    closeDatabase(db);
  });

  it("should handle metadata with empty string values", () => {
    const db = initDatabase();
    setMetadata(db, "empty-key", "");
    const value = getMetadata(db, "empty-key");
    expect(value).toBe("");
    closeDatabase(db);
  });

  it("should handle metadata with special characters", () => {
    const db = initDatabase();
    setMetadata(db, "special-key", "value with \n\t\\\"' chars");
    const value = getMetadata(db, "special-key");
    expect(value).toBe("value with \n\t\\\"' chars");
    closeDatabase(db);
  });
});
