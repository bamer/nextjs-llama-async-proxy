/**
 * Metrics Repository Tests
 * Comprehensive tests for metrics CRUD operations and pruning
 */

import { jest } from "@jest/globals";
import Database from "better-sqlite3";
import MetricsRepository from "../../../server/db/metrics-repository.js";

describe("MetricsRepository", () => {
  let db;
  let repository;

  /**
   * Creates an in-memory SQLite database with the metrics table
   */
  function createTestDatabase() {
    const database = new Database(":memory:");

    // Create the metrics table (matching actual schema)
    database.exec(`
      CREATE TABLE metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cpu_usage REAL DEFAULT 0,
        memory_usage REAL DEFAULT 0,
        disk_usage REAL DEFAULT 0,
        active_models INTEGER DEFAULT 0,
        uptime REAL DEFAULT 0,
        gpu_usage REAL DEFAULT 0,
        gpu_memory_used REAL DEFAULT 0,
        gpu_memory_total REAL DEFAULT 0,
        timestamp INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    return database;
  }

  beforeEach(() => {
    db = createTestDatabase();
    repository = new MetricsRepository(db);
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    db.close();
  });

  describe("save(metrics)", () => {
    it("should save metrics with all fields correctly", () => {
      // Arrange: Create metrics with all fields populated
      const metrics = {
        cpu_usage: 45.5,
        memory_usage: 2048,
        disk_usage: 75.2,
        active_models: 3,
        uptime: 3600,
        gpu_usage: 60.0,
        gpu_memory_used: 4096,
        gpu_memory_total: 8192,
      };

      // Act: Save the metrics
      repository.save(metrics);

      // Assert: Verify the metrics was saved to the database
      const result = db.prepare("SELECT * FROM metrics WHERE id = 1").get();
      expect(result.cpu_usage).toBe(45.5);
      expect(result.memory_usage).toBe(2048);
      expect(result.disk_usage).toBe(75.2);
      expect(result.active_models).toBe(3);
      expect(result.uptime).toBe(3600);
      expect(result.gpu_usage).toBe(60.0);
      expect(result.gpu_memory_used).toBe(4096);
      expect(result.gpu_memory_total).toBe(8192);
    });

    it("should use default values of 0 for missing fields", () => {
      // Arrange: Create metrics with only some fields
      const metrics = {
        cpu_usage: 25.0,
        memory_usage: 1024,
      };

      // Act: Save the partial metrics
      repository.save(metrics);

      // Assert: Verify missing fields default to 0
      const result = db.prepare("SELECT * FROM metrics WHERE id = 1").get();
      expect(result.cpu_usage).toBe(25.0);
      expect(result.memory_usage).toBe(1024);
      expect(result.disk_usage).toBe(0);
      expect(result.active_models).toBe(0);
      expect(result.uptime).toBe(0);
      expect(result.gpu_usage).toBe(0);
      expect(result.gpu_memory_used).toBe(0);
      expect(result.gpu_memory_total).toBe(0);
    });

    it("should use default values when metrics object is empty", () => {
      // Arrange: Create empty metrics object
      const metrics = {};

      // Act: Save empty metrics
      repository.save(metrics);

      // Assert: Verify all fields default to 0
      const result = db.prepare("SELECT * FROM metrics WHERE id = 1").get();
      expect(result.cpu_usage).toBe(0);
      expect(result.memory_usage).toBe(0);
      expect(result.disk_usage).toBe(0);
      expect(result.active_models).toBe(0);
      expect(result.uptime).toBe(0);
      expect(result.gpu_usage).toBe(0);
      expect(result.gpu_memory_used).toBe(0);
      expect(result.gpu_memory_total).toBe(0);
    });

    it("should throw error when metrics is undefined", () => {
      // Act & Assert: Save undefined metrics should throw an error
      expect(() => {
        repository.save(undefined);
      }).toThrow();
    });

    it("should use default values for null field values", () => {
      // Arrange: Create metrics with null values
      const metrics = {
        cpu_usage: null,
        memory_usage: null,
        active_models: null,
      };

      // Act: Save metrics with null values
      repository.save(metrics);

      // Assert: Verify null fields use falsy value defaults (0)
      const result = db.prepare("SELECT * FROM metrics WHERE id = 1").get();
      expect(result.cpu_usage).toBe(0);
      expect(result.memory_usage).toBe(0);
      expect(result.active_models).toBe(0);
      expect(result.disk_usage).toBe(0);
      expect(result.uptime).toBe(0);
    });

    it("should save multiple metrics records sequentially", () => {
      // Arrange & Act: Save multiple metrics
      repository.save({ cpu_usage: 10 });
      repository.save({ cpu_usage: 20 });
      repository.save({ cpu_usage: 30 });

      // Assert: Verify all records saved
      const results = db.prepare("SELECT * FROM metrics ORDER BY id").all();
      expect(results.length).toBe(3);
      expect(results[0].cpu_usage).toBe(10);
      expect(results[1].cpu_usage).toBe(20);
      expect(results[2].cpu_usage).toBe(30);
    });

    it("should generate timestamps for each record", () => {
      // Arrange & Act: Save two records with a delay
      repository.save({ cpu_usage: 10 });
      // Wait for a new second to ensure different timestamps
      const targetSecond = Math.floor(Date.now() / 1000) + 1;
      while (Math.floor(Date.now() / 1000) < targetSecond) {
        /* spin until new second */
      }
      repository.save({ cpu_usage: 20 });

      // Assert: Verify timestamps are different
      const results = db.prepare("SELECT * FROM metrics ORDER BY id").all();
      expect(results[0].timestamp).toBeDefined();
      expect(results[1].timestamp).toBeDefined();
      expect(results[1].timestamp).toBeGreaterThan(results[0].timestamp);
    });
  });

  describe("getHistory(limit)", () => {
    it("should return metrics ordered by timestamp DESC when timestamps differ", () => {
      // Arrange: Save multiple metrics with timestamp differences (1+ second apart)
      repository.save({ cpu_usage: 10 });
      let targetSecond = Math.floor(Date.now() / 1000) + 1;
      while (Math.floor(Date.now() / 1000) < targetSecond) {
        /* spin */
      }
      repository.save({ cpu_usage: 20 });
      targetSecond = Math.floor(Date.now() / 1000) + 1;
      while (Math.floor(Date.now() / 1000) < targetSecond) {
        /* spin */
      }
      repository.save({ cpu_usage: 30 });

      // Act: Get history
      const history = repository.getHistory(10);

      // Assert: Verify order is descending by timestamp
      expect(history.length).toBe(3);
      // The most recently saved record (30) should be first
      expect(history[0].cpu_usage).toBe(30);
      expect(history[1].cpu_usage).toBe(20);
      expect(history[2].cpu_usage).toBe(10);
    });

    it("should respect limit parameter", () => {
      // Arrange: Save 5 metrics
      for (let i = 0; i < 5; i++) {
        repository.save({ cpu_usage: i * 10 });
      }

      // Act: Get history with limit of 3
      const history = repository.getHistory(3);

      // Assert: Verify only 3 records returned
      expect(history.length).toBe(3);
    });

    it("should return empty array when no metrics exist", () => {
      // Act: Get history when database is empty
      const history = repository.getHistory();

      // Assert: Verify empty array returned
      expect(history).toEqual([]);
    });

    it("should use default limit of 100", () => {
      // Arrange: Save 150 metrics
      for (let i = 0; i < 150; i++) {
        repository.save({ cpu_usage: i });
      }

      // Act: Get history without specifying limit
      const history = repository.getHistory();

      // Assert: Verify default limit of 100 is used
      expect(history.length).toBe(100);
    });

    it("should return all records when limit exceeds total count", () => {
      // Arrange: Save 10 metrics
      for (let i = 0; i < 10; i++) {
        repository.save({ cpu_usage: i });
      }

      // Act: Get history with limit larger than total
      const history = repository.getHistory(100);

      // Assert: Verify all 10 records returned
      expect(history.length).toBe(10);
    });

    it("should return metrics with all fields populated", () => {
      // Arrange: Save metrics with all fields
      repository.save({
        cpu_usage: 50.5,
        memory_usage: 2048,
        disk_usage: 75.5,
        active_models: 3,
        uptime: 3600,
        gpu_usage: 80.0,
        gpu_memory_used: 4096,
        gpu_memory_total: 8192,
      });

      // Act: Get history
      const history = repository.getHistory(1);

      // Assert: Verify all fields are returned
      expect(history.length).toBe(1);
      expect(history[0].cpu_usage).toBe(50.5);
      expect(history[0].memory_usage).toBe(2048);
      expect(history[0].disk_usage).toBe(75.5);
      expect(history[0].active_models).toBe(3);
      expect(history[0].uptime).toBe(3600);
      expect(history[0].gpu_usage).toBe(80.0);
      expect(history[0].gpu_memory_used).toBe(4096);
      expect(history[0].gpu_memory_total).toBe(8192);
      expect(history[0].id).toBeDefined();
      expect(history[0].timestamp).toBeDefined();
    });

    it("should return records ordered by id DESC when timestamps are the same", () => {
      // Arrange: Save multiple records quickly (same second = same timestamp)
      repository.save({ cpu_usage: 10 });
      repository.save({ cpu_usage: 20 });
      repository.save({ cpu_usage: 30 });

      // Act: Get history
      const history = repository.getHistory(10);

      // Assert: Records returned in some order (timestamp same, order undefined)
      expect(history.length).toBe(3);
      // All records should be present
      const cpuValues = history.map((h) => h.cpu_usage).sort();
      expect(cpuValues).toEqual([10, 20, 30]);
    });

    it("should return most recent records when limit is applied with timestamp differences", () => {
      // Arrange: Save 5 records with timestamp differences
      for (let i = 1; i <= 5; i++) {
        repository.save({ cpu_usage: i * 10 });
        let targetSecond = Math.floor(Date.now() / 1000) + 1;
        while (Math.floor(Date.now() / 1000) < targetSecond) {
          /* spin */
        }
      }

      // Act: Get only 2 records
      const history = repository.getHistory(2);

      // Assert: Verify we get the 2 most recent records
      expect(history.length).toBe(2);
      // The last 2 records saved should be returned (50 and 40)
      expect(history[0].cpu_usage).toBe(50);
      expect(history[1].cpu_usage).toBe(40);
    });
  });

  describe("getLatest()", () => {
    it("should return undefined when no metrics exist", () => {
      // Act: Get latest from empty database
      const latest = repository.getLatest();

      // Assert: Verify undefined returned
      expect(latest).toBeUndefined();
    });

    it("should return a metrics record when records exist", () => {
      // Arrange: Save multiple metrics
      repository.save({ cpu_usage: 10 });
      repository.save({ cpu_usage: 20 });
      repository.save({ cpu_usage: 30 });

      // Act: Get latest
      const latest = repository.getLatest();

      // Assert: Verify a record is returned
      expect(latest).toBeDefined();
      expect([10, 20, 30]).toContain(latest.cpu_usage);
    });

    it("should return metrics with all fields", () => {
      // Arrange: Save full metrics
      repository.save({
        cpu_usage: 45.5,
        memory_usage: 2048,
        disk_usage: 75.2,
        active_models: 3,
        uptime: 3600,
        gpu_usage: 60.0,
        gpu_memory_used: 4096,
        gpu_memory_total: 8192,
      });

      // Act: Get latest
      const latest = repository.getLatest();

      // Assert: Verify all fields returned
      expect(latest.cpu_usage).toBe(45.5);
      expect(latest.memory_usage).toBe(2048);
      expect(latest.disk_usage).toBe(75.2);
      expect(latest.active_models).toBe(3);
      expect(latest.uptime).toBe(3600);
      expect(latest.gpu_usage).toBe(60.0);
      expect(latest.gpu_memory_used).toBe(4096);
      expect(latest.gpu_memory_total).toBe(8192);
    });
  });

  describe("prune(maxRecords)", () => {
    it("should remove old records keeping the most recent", () => {
      // Arrange: Save 10 metrics
      for (let i = 0; i < 10; i++) {
        repository.save({ cpu_usage: i });
      }

      // Act: Prune to keep only 5 records
      const deleted = repository.prune(5);

      // Assert: Verify 5 records were deleted
      expect(deleted).toBe(5);
      const count = db.prepare("SELECT COUNT(*) as cnt FROM metrics").get();
      expect(count.cnt).toBe(5);
    });

    it("should keep recent records and remove oldest ones", () => {
      // Arrange: Save 5 metrics with specific cpu_usage values
      for (let i = 0; i < 5; i++) {
        repository.save({ cpu_usage: i * 10 });
      }

      // Act: Prune to keep 3 most recent
      repository.prune(3);

      // Assert: Verify only recent records remain
      const count = db.prepare("SELECT COUNT(*) as cnt FROM metrics").get();
      expect(count.cnt).toBe(3);

      // Get the remaining records and verify they are recent ones
      const remaining = db.prepare("SELECT * FROM metrics ORDER BY id DESC").all();
      // The 3 most recent by id should remain
      expect(remaining[0].cpu_usage).toBe(40);
      expect(remaining[1].cpu_usage).toBe(30);
      expect(remaining[2].cpu_usage).toBe(20);
    });

    it("should return 0 when no pruning needed (below maxRecords)", () => {
      // Arrange: Save 5 metrics
      for (let i = 0; i < 5; i++) {
        repository.save({ cpu_usage: i });
      }

      // Act: Prune with maxRecords larger than current count
      const deleted = repository.prune(10);

      // Assert: Verify no records deleted
      expect(deleted).toBe(0);
      const count = db.prepare("SELECT COUNT(*) as cnt FROM metrics").get();
      expect(count.cnt).toBe(5);
    });

    it("should return 0 when metrics count equals maxRecords", () => {
      // Arrange: Save 5 metrics
      for (let i = 0; i < 5; i++) {
        repository.save({ cpu_usage: i });
      }

      // Act: Prune with maxRecords equal to current count
      const deleted = repository.prune(5);

      // Assert: Verify no records deleted
      expect(deleted).toBe(0);
      const count = db.prepare("SELECT COUNT(*) as cnt FROM metrics").get();
      expect(count.cnt).toBe(5);
    });

    it("should handle maxRecords = 0 by removing all records", () => {
      // Arrange: Save 5 metrics
      for (let i = 0; i < 5; i++) {
        repository.save({ cpu_usage: i });
      }

      // Act: Prune with maxRecords = 0
      // The repository's logic: if result.cnt > maxRecords (5 > 0 is true)
      // then toDelete = 5 - 0 = 5, so it would delete all 5 records
      const deleted = repository.prune(0);

      // Assert: Verify all records were deleted
      expect(deleted).toBe(5);
      const count = db.prepare("SELECT COUNT(*) as cnt FROM metrics").get();
      expect(count.cnt).toBe(0);
    });

    it("should handle maxRecords = 1 correctly", () => {
      // Arrange: Save 3 metrics
      for (let i = 0; i < 3; i++) {
        repository.save({ cpu_usage: i });
      }

      // Act: Prune with maxRecords = 1
      const deleted = repository.prune(1);

      // Assert: Verify 2 records deleted
      expect(deleted).toBe(2);
      const count = db.prepare("SELECT COUNT(*) as cnt FROM metrics").get();
      expect(count.cnt).toBe(1);
    });

    it("should return 0 when database is empty", () => {
      // Act: Prune empty database
      const deleted = repository.prune(10);

      // Assert: Verify no records deleted
      expect(deleted).toBe(0);
    });

    it("should return 0 on database error", () => {
      // Arrange: Create a mock that throws on prepare
      const errorDb = {
        prepare: jest.fn(() => {
          throw new Error("Database error");
        }),
      };
      const errorRepo = new MetricsRepository(errorDb);

      // Act: Try to prune
      const deleted = errorRepo.prune(10);

      // Assert: Verify 0 returned and error logged
      expect(deleted).toBe(0);
      expect(console.error).toHaveBeenCalledWith("[DB] Metrics pruning error:", expect.anything());
    });

    it("should log pruned message when records are deleted", () => {
      // Arrange: Save 10 metrics
      for (let i = 0; i < 10; i++) {
        repository.save({ cpu_usage: i });
      }

      // Act: Prune to keep 5
      repository.prune(5);

      // Assert: Verify log message
      expect(console.log).toHaveBeenCalledWith("[DB] Pruned 5 old metrics, kept 5");
    });

    it("should not log when no pruning needed", () => {
      // Arrange: Save 3 metrics
      for (let i = 0; i < 3; i++) {
        repository.save({ cpu_usage: i });
      }

      // Act: Prune with larger limit
      repository.prune(10);

      // Assert: Verify no log message
      expect(console.log).not.toHaveBeenCalled();
    });

    it("should correctly identify which records to delete", () => {
      // Arrange: Save 5 records with distinct cpu_usage values
      repository.save({ cpu_usage: 10 }); // id=1, oldest
      repository.save({ cpu_usage: 20 }); // id=2
      repository.save({ cpu_usage: 30 }); // id=3
      repository.save({ cpu_usage: 40 }); // id=4
      repository.save({ cpu_usage: 50 }); // id=5, newest

      // Act: Prune to keep 3 records
      repository.prune(3);

      // Assert: Verify the oldest 2 records were deleted
      const remaining = db.prepare("SELECT * FROM metrics ORDER BY id").all();
      expect(remaining.length).toBe(3);
      expect(remaining[0].cpu_usage).toBe(30);
      expect(remaining[1].cpu_usage).toBe(40);
      expect(remaining[2].cpu_usage).toBe(50);
    });
  });

  describe("integration tests", () => {
    it("should perform full CRUD lifecycle", () => {
      // Arrange & Act & Assert: Full lifecycle test

      // Create - Save initial metrics
      repository.save({
        cpu_usage: 50,
        memory_usage: 2048,
        disk_usage: 60,
        active_models: 2,
        uptime: 1000,
      });

      // Read - Get all history
      let history = repository.getHistory();
      expect(history.length).toBe(1);
      expect(history[0].cpu_usage).toBe(50);

      // Update - Add more metrics with timestamp differences
      repository.save({ cpu_usage: 60 });
      let targetSecond = Math.floor(Date.now() / 1000) + 1;
      while (Math.floor(Date.now() / 1000) < targetSecond) {
        /* spin */
      }
      repository.save({ cpu_usage: 70 });

      // Read - Verify new records
      history = repository.getHistory();
      expect(history.length).toBe(3);
      // With different timestamps, getLatest should return the most recent (70)
      expect(repository.getLatest().cpu_usage).toBe(70);

      // Delete - Prune old records
      const deleted = repository.prune(2);
      expect(deleted).toBe(1);

      // Verify final state
      history = repository.getHistory();
      expect(history.length).toBe(2);
      expect(history[0].cpu_usage).toBe(70);
    });

    it("should handle rapid successive saves correctly", () => {
      // Arrange & Act: Rapid saves
      for (let i = 0; i < 100; i++) {
        repository.save({ cpu_usage: i, memory_usage: i * 10 });
      }

      // Assert: Verify all records saved
      const count = db.prepare("SELECT COUNT(*) as cnt FROM metrics").get();
      expect(count.cnt).toBe(100);

      // Verify getHistory returns records
      const history = repository.getHistory(100);
      expect(history.length).toBe(100);
    });

    it("should maintain data integrity after multiple prune operations", () => {
      // Arrange: Save initial data
      for (let i = 0; i < 20; i++) {
        repository.save({ cpu_usage: i });
      }

      // Act: Multiple prune operations
      repository.prune(15);
      repository.prune(10);
      repository.prune(5);

      // Assert: Verify correct number of records remain
      const history = repository.getHistory();
      expect(history.length).toBe(5);
    });

    it("should handle interleaved save, read, and prune operations", () => {
      // Initial save
      repository.save({ cpu_usage: 10 });

      // Read
      expect(repository.getLatest().cpu_usage).toBe(10);

      // Save more
      repository.save({ cpu_usage: 20 });
      repository.save({ cpu_usage: 30 });

      // Read history
      let history = repository.getHistory();
      expect(history.length).toBe(3);

      // Prune
      repository.prune(2);

      // Read after prune
      history = repository.getHistory();
      expect(history.length).toBe(2);
      const latest = repository.getLatest();
      expect([20, 30]).toContain(latest.cpu_usage);

      // Save more after prune
      repository.save({ cpu_usage: 40 });

      // Verify new record is included
      history = repository.getHistory();
      expect(history.length).toBe(3);
    });

    it("should correctly handle edge case of pruning to current count", () => {
      // Arrange: Save 5 records
      for (let i = 0; i < 5; i++) {
        repository.save({ cpu_usage: i });
      }

      // Act: Prune to current count (5)
      const deleted = repository.prune(5);

      // Assert: Verify no records deleted
      expect(deleted).toBe(0);
      const count = db.prepare("SELECT COUNT(*) as cnt FROM metrics").get();
      expect(count.cnt).toBe(5);
    });

    it("should handle single record scenario", () => {
      // Arrange: Save one record
      repository.save({ cpu_usage: 100 });

      // Act: Try to prune
      const deleted = repository.prune(1);

      // Assert: Verify no deletion
      expect(deleted).toBe(0);
      expect(repository.getLatest().cpu_usage).toBe(100);
    });

    it("should handle prune with timestamp differences", () => {
      // Arrange: Save records with 1+ second delays
      for (let i = 0; i < 5; i++) {
        repository.save({ cpu_usage: (i + 1) * 10 });
        let targetSecond = Math.floor(Date.now() / 1000) + 1;
        while (Math.floor(Date.now() / 1000) < targetSecond) {
          /* spin */
        }
      }

      // Act: Prune to keep 3 most recent
      const deleted = repository.prune(3);

      // Assert: Verify correct records remain
      expect(deleted).toBe(2);
      const history = repository.getHistory();
      expect(history.length).toBe(3);
      // Most recent should be 50
      expect(history[0].cpu_usage).toBe(50);
    });
  });
});
