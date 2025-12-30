import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import {
  initDatabase,
  closeDatabase,
  saveMetrics,
  getMetricsHistory,
  getLatestMetrics,
  setMetadata,
  getMetadata,
  deleteMetadata,
  vacuumDatabase,
  exportDatabase,
  importDatabase,
} from "@/lib/database";

const DB_PATH = path.join(process.cwd(), "data", "llama-dashboard.db");
const TEST_EXPORT_PATH = path.join(process.cwd(), "data", "test-export.db");

describe("Metrics History", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = initDatabase();
    // Clean up all tables before each test to ensure isolation
    db.prepare("DELETE FROM metrics_history").run();
    db.prepare("DELETE FROM models").run();
    db.prepare("DELETE FROM metadata WHERE key != 'db_version'").run();
  });

  afterEach(() => {
    closeDatabase(db);
  });

  it("should save metrics with all fields", () => {
    saveMetrics({
      cpu_usage: 50,
      memory_usage: 60,
      disk_usage: 70,
      gpu_usage: 80,
      gpu_temperature: 72,
      gpu_memory_used: 4000,
      gpu_memory_total: 8192,
      gpu_power_usage: 150,
      active_models: 3,
      uptime: 3600,
      requests_per_minute: 42,
    });

    const history = getMetricsHistory(10);
    expect(history).toHaveLength(1);
    expect(history[0].cpu_usage).toBe(50);
    expect(history[0].memory_usage).toBe(60);
    expect(history[0].gpu_usage).toBe(80);
    expect(history[0].active_models).toBe(3);
  });

  it("should save metrics with partial fields (defaulting to 0)", () => {
    saveMetrics({
      cpu_usage: 50,
      memory_usage: 60,
    });

    const history = getMetricsHistory(10);
    expect(history).toHaveLength(1);
    expect(history[0].cpu_usage).toBe(50);
    expect(history[0].memory_usage).toBe(60);
    expect(history[0].gpu_usage).toBe(0);
    expect(history[0].active_models).toBe(0);
  });

  it("should save multiple metrics entries", () => {
    saveMetrics({ cpu_usage: 50, memory_usage: 60 });
    saveMetrics({ cpu_usage: 55, memory_usage: 65 });
    saveMetrics({ cpu_usage: 60, memory_usage: 70 });

    const history = getMetricsHistory(10);
    expect(history).toHaveLength(3);
  });

  it("should auto-cleanup records older than 10 minutes", () => {
    const oldTime = Date.now() - 15 * 60 * 1000; // 15 minutes ago
    const recentTime = Date.now() - 5 * 60 * 1000; // 5 minutes ago

    // Insert old record directly
    db.prepare(
      `INSERT INTO metrics_history (
        timestamp, cpu_usage, memory_usage, disk_usage, gpu_usage,
        gpu_temperature, gpu_memory_used, gpu_memory_total, gpu_power_usage,
        active_models, uptime, requests_per_minute, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      oldTime,
      30,
      40,
      50,
      60,
      65,
      2000,
      4096,
      100,
      1,
      1800,
      20,
      oldTime
    );

    // Insert recent record directly
    db.prepare(
      `INSERT INTO metrics_history (
        timestamp, cpu_usage, memory_usage, disk_usage, gpu_usage,
        gpu_temperature, gpu_memory_used, gpu_memory_total, gpu_power_usage,
        active_models, uptime, requests_per_minute, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      recentTime,
      50,
      60,
      70,
      80,
      72,
      4000,
      8192,
      150,
      3,
      3600,
      42,
      recentTime
    );

    // Save new metrics to trigger cleanup
    saveMetrics({ cpu_usage: 55, memory_usage: 65 });

    const history = getMetricsHistory(10);
    expect(history.length).toBeGreaterThanOrEqual(2);
    expect(history.every((entry) => entry.created_at >= recentTime)).toBe(true);
  });

  it("should get metrics history for specified minutes", () => {
    saveMetrics({ cpu_usage: 50, memory_usage: 60 });
    const history5min = getMetricsHistory(5);
    const history10min = getMetricsHistory(10);
    expect(history5min).toHaveLength(1);
    expect(history10min).toHaveLength(1);
  });

  it("should get empty history when no records exist", () => {
    const history = getMetricsHistory(10);
    expect(history).toHaveLength(0);
  });

  it("should get latest metrics", () => {
    saveMetrics({ cpu_usage: 75, memory_usage: 85 });
    const latest = getLatestMetrics();
    expect(latest).not.toBeNull();
    expect(latest?.cpu_usage).toBe(75);
    expect(latest?.memory_usage).toBe(85);
  });

  it("should return null when getting latest metrics from empty database", () => {
    const latest = getLatestMetrics();
    expect(latest).toBeNull();
  });

  it("should get most recent metrics when multiple entries exist", () => {
    saveMetrics({ cpu_usage: 50, memory_usage: 60 });
    saveMetrics({ cpu_usage: 60, memory_usage: 70 });
    saveMetrics({ cpu_usage: 75, memory_usage: 85 });

    const latest = getLatestMetrics();
    expect(latest?.cpu_usage).toBe(75);
    expect(latest?.memory_usage).toBe(85);
  });
});

describe("Metadata Operations", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = initDatabase();
    db.prepare("DELETE FROM metadata WHERE key != 'db_version'").run();
  });

  afterEach(() => {
    closeDatabase(db);
  });

  it("should set and get metadata", () => {
    setMetadata("theme", "dark");
    const value = getMetadata("theme");
    expect(value).toBe("dark");
  });

  it("should set multiple metadata keys", () => {
    setMetadata("key1", "value1");
    setMetadata("key2", "value2");
    setMetadata("key3", "value3");

    expect(getMetadata("key1")).toBe("value1");
    expect(getMetadata("key2")).toBe("value2");
    expect(getMetadata("key3")).toBe("value3");
  });

  it("should update existing metadata", () => {
    setMetadata("key1", "value1");
    setMetadata("key1", "value2");
    const value = getMetadata("key1");
    expect(value).toBe("value2");
  });

  it("should delete metadata", () => {
    setMetadata("key1", "value1");
    deleteMetadata("key1");
    const value = getMetadata("key1");
    expect(value).toBeNull();
  });

  it("should return null for non-existent metadata", () => {
    const value = getMetadata("non_existent_key");
    expect(value).toBeNull();
  });

  it("should handle deleting non-existent metadata", () => {
    expect(() => deleteMetadata("non_existent_key")).not.toThrow();
  });

  it("should store complex string values in metadata", () => {
    const complexValue = JSON.stringify({
      setting1: "value1",
      setting2: 123,
      setting3: true,
    });

    setMetadata("complex", complexValue);
    const retrieved = getMetadata("complex");
    expect(retrieved).toBe(complexValue);

    const parsed = JSON.parse(retrieved || "");
    expect(parsed.setting1).toBe("value1");
  });
});

describe("Advanced Operations", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = initDatabase();
    if (fs.existsSync(TEST_EXPORT_PATH)) {
      fs.unlinkSync(TEST_EXPORT_PATH);
    }
  });

  afterEach(() => {
    closeDatabase(db);
    if (fs.existsSync(TEST_EXPORT_PATH)) {
      fs.unlinkSync(TEST_EXPORT_PATH);
    }
  });

  it("should vacuum database", () => {
    saveMetrics({ cpu_usage: 50, memory_usage: 60 });
    vacuumDatabase();
    const size = getDatabaseSize();
    expect(size).toBeGreaterThan(0);
  });

  it("should vacuum database multiple times", () => {
    saveMetrics({ cpu_usage: 50, memory_usage: 60 });
    vacuumDatabase();

    saveMetrics({ cpu_usage: 55, memory_usage: 65 });
    vacuumDatabase();

    const size = getDatabaseSize();
    expect(size).toBeGreaterThan(0);
  });

  it("should export database", () => {
    saveMetrics({ cpu_usage: 50, memory_usage: 60 });

    exportDatabase(TEST_EXPORT_PATH);
    expect(fs.existsSync(TEST_EXPORT_PATH)).toBe(true);
  });

  it("should import database", () => {
    // Create data in main database
    saveMetrics({ cpu_usage: 50, memory_usage: 60 });
    setMetadata("test-key", "test-value");

    // Export database
    exportDatabase(TEST_EXPORT_PATH);

    // Clear metrics and metadata
    db.prepare("DELETE FROM metrics_history").run();
    db.prepare("DELETE FROM metadata WHERE key != 'db_version'").run();

    // Verify database is cleared
    expect(getMetricsHistory(10)).toHaveLength(0);
    expect(getMetadata("test-key")).toBeNull();

    // Import from export
    importDatabase(TEST_EXPORT_PATH);

    // Verify data was imported
    const history = getMetricsHistory(10);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].cpu_usage).toBe(50);

    expect(getMetadata("test-key")).toBe("test-value");
  });

  it("should handle importing non-existent file", () => {
    expect(() => importDatabase("/non/existent/path.db")).not.toThrow();
  });

  it("should merge imported data with existing data", () => {
    // Create initial data
    setMetadata("existing-key", "existing-value");

    // Export database
    exportDatabase(TEST_EXPORT_PATH);

    // Create new data to be merged
    setMetadata("new-key", "new-value");

    // Import
    importDatabase(TEST_EXPORT_PATH);

    // Both metadata keys should exist
    expect(getMetadata("existing-key")).toBe("existing-value");
    expect(getMetadata("new-key")).toBe("new-value");
  });

  it("should update metadata on import conflict", () => {
    setMetadata("conflict-key", "original-value");

    // Export database
    exportDatabase(TEST_EXPORT_PATH);

    // Update metadata
    setMetadata("conflict-key", "updated-value");

    // Import should restore the key value from backup
    importDatabase(TEST_EXPORT_PATH);

    expect(getMetadata("conflict-key")).toBe("original-value");
  });
});
