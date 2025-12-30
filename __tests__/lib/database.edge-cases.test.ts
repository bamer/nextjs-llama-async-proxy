import Database from "better-sqlite3";
import {
  initDatabase,
  closeDatabase,
  saveMetrics,
  getMetricsHistory,
  getLatestMetrics,
  setMetadata,
  getMetadata,
  getDatabaseSize,
  vacuumDatabase,
} from "@/lib/database";

describe("Edge Cases and Error Handling", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = initDatabase();
  });

  afterEach(() => {
    closeDatabase(db);
  });

  it("should handle saving metrics with undefined values", () => {
    db.prepare("DELETE FROM metrics_history").run();

    saveMetrics({});

    const history = getMetricsHistory(10);
    expect(history).toHaveLength(1);
    expect(history[0].cpu_usage).toBe(0);
    expect(history[0].memory_usage).toBe(0);
  });

  it("should handle getting metrics history with zero minutes", () => {
    saveMetrics({ cpu_usage: 50, memory_usage: 60 });
    const history = getMetricsHistory(0);
    expect(history).toHaveLength(0);
  });

  it("should handle getting metrics history with negative minutes", () => {
    saveMetrics({ cpu_usage: 50, memory_usage: 60 });
    const history = getMetricsHistory(-5);
    expect(history).toHaveLength(0);
  });

  it("should handle very large metric values", () => {
    saveMetrics({
      cpu_usage: 999.999,
      memory_usage: 999.999,
      uptime: 999999999,
      requests_per_minute: 999999.999,
    });

    const latest = getLatestMetrics();
    expect(latest?.cpu_usage).toBe(999.999);
    expect(latest?.uptime).toBe(999999999);
  });

  it("should handle very small metric values", () => {
    saveMetrics({
      cpu_usage: 0.001,
      memory_usage: 0.001,
      uptime: 0,
      requests_per_minute: 0.001,
    });

    const latest = getLatestMetrics();
    expect(latest?.cpu_usage).toBe(0.001);
  });

  it("should handle metadata with empty string values", () => {
    setMetadata("empty-key", "");
    const value = getMetadata("empty-key");
    expect(value).toBe("");
  });

  it("should handle metadata with special characters", () => {
    const specialValue = `value with "quotes" and 'apostrophes' and newlines\n`;

    setMetadata("special-key", specialValue);
    const value = getMetadata("special-key");
    expect(value).toBe(specialValue);
  });

  it("should handle metadata key with special characters", () => {
    const specialKey = "key-with_special.chars";

    setMetadata(specialKey, "value");
    const value = getMetadata(specialKey);
    expect(value).toBe("value");
  });
});

describe("Performance and Scaling", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = initDatabase();
  });

  afterEach(() => {
    closeDatabase(db);
  });

  it("should handle saving many metrics entries efficiently", () => {
    const startTime = Date.now();

    for (let i = 0; i < 100; i++) {
      saveMetrics({ cpu_usage: i, memory_usage: i * 2 });
    }

    const duration = Date.now() - startTime;
    const history = getMetricsHistory(10);

    expect(history.length).toBeGreaterThanOrEqual(100);
    expect(duration).toBeLessThan(5000);
  });

  it("should handle getting metrics history from large dataset", () => {
    // Save 1000 metrics entries
    for (let i = 0; i < 1000; i++) {
      saveMetrics({ cpu_usage: i, memory_usage: i * 2 });
    }

    const startTime = Date.now();
    const history = getMetricsHistory(10);
    const duration = Date.now() - startTime;

    expect(history.length).toBeGreaterThanOrEqual(1000);
    expect(duration).toBeLessThan(1000);
  });
});

describe("Database Integrity and Consistency", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = initDatabase();
    db.prepare("DELETE FROM metrics_history").run();
    db.prepare("DELETE FROM metadata WHERE key != 'db_version'").run();
  });

  afterEach(() => {
    closeDatabase(db);
  });

  it("should maintain data consistency across operations", () => {
    saveMetrics({ cpu_usage: 50, memory_usage: 60 });
    setMetadata("test-key", "test-value");

    const history = getMetricsHistory(10);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].cpu_usage).toBe(50);

    const metadata = getMetadata("test-key");
    expect(metadata).toBe("test-value");
  });

  it("should maintain metrics chronological order", () => {
    for (let i = 0; i < 5; i++) {
      saveMetrics({ cpu_usage: i * 10, memory_usage: i * 20 });
    }

    const history = getMetricsHistory(10);

    // Verify order
    for (let i = 1; i < history.length; i++) {
      expect(history[i].timestamp).toBeGreaterThanOrEqual(history[i - 1].timestamp);
    }
  });
});

describe("Database Schema Validation", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = initDatabase();
    db.prepare("DELETE FROM metadata WHERE key != 'db_version'").run();
  });

  afterEach(() => {
    closeDatabase(db);
  });

  it("should have proper indexes on timestamp fields", () => {
    saveMetrics({ cpu_usage: 50, memory_usage: 60 });

    const indexes = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='metrics_history'"
      )
      .all() as { name: string }[];

    expect(indexes.length).toBeGreaterThan(0);
    expect(
      indexes.some(
        (idx) => idx.name.includes("timestamp") || idx.name.includes("created_at")
      )
    ).toBe(true);
  });

  it("should have proper indexes on models fields", () => {
    const indexes = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='models'"
      )
      .all() as { name: string }[];

    expect(indexes.length).toBeGreaterThan(0);
    const indexNames = indexes.map((idx) => idx.name);
    expect(indexNames.some((name) => name.includes("name"))).toBe(true);
    expect(indexNames.some((name) => name.includes("status"))).toBe(true);
    expect(indexNames.some((name) => name.includes("type"))).toBe(true);
  });

  it("should have primary key on metadata", () => {
    setMetadata("key1", "value1");
    setMetadata("key2", "value2");

    const keys = db.prepare("SELECT key FROM metadata").all() as { key: string }[];
    expect(keys).toHaveLength(3); // 2 inserted + 1 db_version
  });
});
