/**
 * @jest-environment node
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import DatabasePackage from "better-sqlite3";
import { LogsRepository } from "../../../server/db/logs-repository.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const Database = DatabasePackage;

// Create a mock database wrapper for testing
class MockDatabase {
  constructor() {
    this.dbPath =
      "/tmp/test-logs-repo-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9) + ".db";
    this.db = new Database(this.dbPath);
    this.init();
  }

  init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        source TEXT,
        timestamp INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `);
  }

  prepare(query) {
    return new MockStatement(this.db, query);
  }

  close() {
    if (this.db) {
      this.db.close();
    }
    if (fs.existsSync(this.dbPath)) {
      fs.unlinkSync(this.dbPath);
    }
  }
}

// Mock Statement class to simulate better-sqlite3 statement behavior
class MockStatement {
  constructor(db, query) {
    this.db = db;
    this.query = query;
    this.lastParams = [];
  }

  run(...params) {
    this.lastParams = params;
    const stmt = this.db.prepare(this.query);
    const result = stmt.run(...params);
    return result;
  }

  all(...params) {
    this.lastParams = params;
    const stmt = this.db.prepare(this.query);
    return stmt.all(...params);
  }

  get(...params) {
    this.lastParams = params;
    const stmt = this.db.prepare(this.query);
    return stmt.get(...params);
  }
}

describe("LogsRepository", () => {
  let mockDb;
  let repository;

  beforeEach(() => {
    mockDb = new MockDatabase();
    repository = new LogsRepository(mockDb);
  });

  afterEach(() => {
    if (mockDb) {
      mockDb.close();
    }
  });

  describe("add", () => {
    // Positive test: add log entry with all parameters (level, message, source)
    it("should add log entry with all parameters", () => {
      // Arrange: Prepare test data with level, message, and source
      const level = "info";
      const message = "Test log message";
      const source = "test-source";

      // Act: Add the log entry
      repository.add(level, message, source);

      // Assert: Verify the log was added correctly
      const logs = repository.getAll();
      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe(level);
      expect(logs[0].message).toBe(message);
      expect(logs[0].source).toBe(source);
    });

    // Positive test: add with default source when source parameter is omitted
    it("should use default source 'server' when source not provided", () => {
      // Arrange: Test data without explicit source
      const level = "error";
      const message = "Error occurred";

      // Act: Add log without source parameter
      repository.add(level, message);

      // Assert: Verify default source 'server' is used
      const logs = repository.getAll();
      expect(logs[0].source).toBe("server");
    });

    // Positive test: verify add works with all valid log levels
    it("should handle all valid log levels: debug, info, warn, error", () => {
      // Arrange: Test each valid log level
      const levels = ["debug", "info", "warn", "error"];

      // Act: Add logs for each level
      levels.forEach((level) => {
        repository.add(level, `Message for ${level}`, "test");
      });

      // Assert: Verify all levels were stored correctly
      const logs = repository.getAll();
      expect(logs.length).toBe(4);
      // Verify all expected levels are present (order will be by timestamp DESC)
      const storedLevels = logs.map((log) => log.level);
      expect(storedLevels).toContain("debug");
      expect(storedLevels).toContain("info");
      expect(storedLevels).toContain("warn");
      expect(storedLevels).toContain("error");
    });

    // Positive test: verify message is converted to string
    it("should convert numeric message to string", () => {
      // Arrange: Numeric message value
      const level = "info";
      const numericMessage = 12345;

      // Act: Add log with numeric message
      repository.add(level, numericMessage, "test");

      // Assert: Verify message is converted to string
      const logs = repository.getAll();
      expect(logs[0].message).toBe("12345");
      expect(typeof logs[0].message).toBe("string");
    });

    // Positive test: verify object messages are converted to string
    it("should convert object message to string", () => {
      // Arrange: Object message value
      const level = "debug";
      const objectMessage = { key: "value", nested: { data: true } };

      // Act: Add log with object message
      repository.add(level, objectMessage, "test");

      // Assert: Verify message is converted to string representation
      const logs = repository.getAll();
      expect(logs[0].message).toBe(String(objectMessage));
      expect(typeof logs[0].message).toBe("string");
    });

    // Positive test: verify boolean messages are converted to string
    it("should convert boolean message to string", () => {
      // Arrange: Boolean message value
      const level = "info";
      const boolMessage = true;

      // Act: Add log with boolean message
      repository.add(level, boolMessage, "test");

      // Assert: Verify message is converted to string
      const logs = repository.getAll();
      expect(logs[0].message).toBe("true");
    });

    // Negative test: verify empty message is handled
    it("should handle empty string message", () => {
      // Arrange: Empty string message
      const level = "info";
      const emptyMessage = "";

      // Act: Add log with empty message
      repository.add(level, emptyMessage, "test");

      // Assert: Verify empty string is stored correctly
      const logs = repository.getAll();
      expect(logs[0].message).toBe("");
    });

    // Positive test: verify logs are stored with timestamps
    it("should store logs with auto-generated timestamps", () => {
      // Arrange: Test data
      const beforeAdd = Math.floor(Date.now() / 1000);

      // Act: Add a log entry
      repository.add("info", "Test message", "test");

      // Assert: Verify timestamp was auto-generated
      const logs = repository.getAll();
      expect(logs[0].timestamp).toBeDefined();
      expect(logs[0].timestamp).toBeGreaterThanOrEqual(beforeAdd);
    });
  });

  describe("getAll", () => {
    beforeEach(() => {
      // Clear logs before each test
      repository.clear();
    });

    // Positive test: getAll returns empty array when no logs exist
    it("should return empty array when no logs exist", () => {
      // Act: Get logs from empty repository
      const logs = repository.getAll();

      // Assert: Verify empty array is returned
      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBe(0);
    });

    // Positive test: getAll respects limit parameter
    it("should respect limit parameter when retrieving logs", () => {
      // Arrange: Add more logs than the limit
      for (let i = 0; i < 10; i++) {
        repository.add("info", `Log message ${i}`, "test");
      }

      // Act: Get logs with limit of 5
      const limit = 5;
      const logs = repository.getAll(limit);

      // Assert: Verify only limited number of logs are returned
      expect(logs.length).toBe(limit);
    });

    // Positive test: getAll returns all logs when limit exceeds count
    it("should return all logs when limit exceeds total count", () => {
      // Arrange: Add a few logs
      for (let i = 0; i < 3; i++) {
        repository.add("info", `Log ${i}`, "test");
      }

      // Act: Get logs with a large limit
      const logs = repository.getAll(100);

      // Assert: Verify all logs are returned
      expect(logs.length).toBe(3);
    });

    // Positive test: getAll uses default limit of 100
    it("should use default limit of 100 when no limit specified", () => {
      // Arrange: Add more than 100 logs
      for (let i = 0; i < 150; i++) {
        repository.add("info", `Log ${i}`, "test");
      }

      // Act: Get logs without specifying limit
      const logs = repository.getAll();

      // Assert: Verify default limit of 100 is applied
      expect(logs.length).toBe(100);
    });

    // Positive test: getAll returns logs ordered by timestamp DESC
    it("should return logs ordered by timestamp DESC (newest first)", () => {
      // Arrange: Add logs with explicit timestamps
      const now = Math.floor(Date.now() / 1000);

      // Insert logs with specific timestamps using direct DB access
      mockDb.db
        .prepare("INSERT INTO logs (level, message, source, timestamp) VALUES (?, ?, ?, ?)")
        .run("info", "Oldest log", "test", now);
      mockDb.db
        .prepare("INSERT INTO logs (level, message, source, timestamp) VALUES (?, ?, ?, ?)")
        .run("info", "Middle log", "test", now + 1);
      mockDb.db
        .prepare("INSERT INTO logs (level, message, source, timestamp) VALUES (?, ?, ?, ?)")
        .run("info", "Newest log", "test", now + 2);

      // Act: Get all logs
      const logs = repository.getAll();

      // Assert: Verify newest log appears first
      expect(logs.length).toBe(3);
      expect(logs[0].message).toBe("Newest log");
      expect(logs[1].message).toBe("Middle log");
      expect(logs[2].message).toBe("Oldest log");
    });

    // Positive test: getAll returns all log fields
    it("should return logs with all fields: id, level, message, source, timestamp", () => {
      // Arrange: Add a log entry
      repository.add("warn", "Warning message", "test-source");

      // Act: Get the log
      const logs = repository.getAll();

      // Assert: Verify all fields are present
      expect(logs[0].id).toBeDefined();
      expect(logs[0].level).toBe("warn");
      expect(logs[0].message).toBe("Warning message");
      expect(logs[0].source).toBe("test-source");
      expect(logs[0].timestamp).toBeDefined();
    });

    // Negative test: getAll handles limit of 0
    it("should return empty array when limit is 0", () => {
      // Arrange: Add some logs
      repository.add("info", "Test", "test");

      // Act: Get logs with limit 0
      const logs = repository.getAll(0);

      // Assert: Verify empty array
      expect(logs.length).toBe(0);
    });

    // Positive test: getAll with negative limit returns default behavior
    it("should handle negative limit gracefully", () => {
      // Arrange: Add some logs
      repository.add("info", "Test", "test");

      // Act: Get logs with negative limit
      const logs = repository.getAll(-1);

      // Assert: Should return logs (SQLite handles negative limit)
      expect(Array.isArray(logs)).toBe(true);
    });
  });

  describe("clear", () => {
    beforeEach(() => {
      // Clear logs before each test
      repository.clear();
    });

    // Positive test: clear returns count of deleted logs
    it("should return count of deleted logs", () => {
      // Arrange: Add multiple log entries
      repository.add("info", "Log 1", "test");
      repository.add("error", "Log 2", "test");
      repository.add("warn", "Log 3", "test");

      // Act: Clear all logs
      const deletedCount = repository.clear();

      // Assert: Verify correct count is returned
      expect(deletedCount).toBe(3);
    });

    // Negative test: clear returns 0 when no logs exist
    it("should return 0 when clearing empty logs table", () => {
      // Act: Clear logs when none exist
      const deletedCount = repository.clear();

      // Assert: Verify 0 is returned
      expect(deletedCount).toBe(0);
    });

    // Positive test: clear actually removes all logs
    it("should remove all logs from database", () => {
      // Arrange: Add some logs
      repository.add("info", "Test message", "test");
      expect(repository.getAll().length).toBe(1);

      // Act: Clear logs
      repository.clear();

      // Assert: Verify all logs are removed
      expect(repository.getAll().length).toBe(0);
    });

    // Positive test: clear can be called multiple times safely
    it("should handle multiple clear calls", () => {
      // Arrange: Add and clear logs
      repository.add("info", "Test", "test");
      repository.clear();

      // Act: Call clear again on empty table
      const secondClearCount = repository.clear();

      // Assert: Second clear should return 0
      expect(secondClearCount).toBe(0);
    });

    // Positive test: clear after add operations returns correct count
    it("should return correct count after multiple add operations", () => {
      // Arrange: Add logs in batches
      repository.add("info", "Batch 1", "test");
      repository.add("info", "Batch 2", "test");
      repository.clear();
      repository.add("info", "After clear", "test");
      repository.add("warn", "After clear 2", "test");

      // Act: Clear again
      const count = repository.clear();

      // Assert: Should only clear the 2 logs added after first clear
      expect(count).toBe(2);
    });
  });

  describe("Integration tests", () => {
    beforeEach(() => {
      repository.clear();
    });

    // Positive test: full workflow - add, get, clear
    it("should handle complete workflow: add logs, retrieve with limit, clear", () => {
      // Act: Complete workflow
      repository.add("debug", "Debug message", "app");
      repository.add("info", "Info message", "app");
      repository.add("warn", "Warning message", "app");
      repository.add("error", "Error message", "app");

      // Get with limit
      const logs = repository.getAll(2);
      expect(logs.length).toBe(2);

      // Clear and verify
      const cleared = repository.clear();
      expect(cleared).toBe(4);
      expect(repository.getAll().length).toBe(0);
    });

    // Positive test: multiple sources with same level
    it("should differentiate logs from different sources", () => {
      // Arrange: Add logs from different sources
      repository.add("info", "Server message", "server");
      repository.add("info", "API message", "api");
      repository.add("info", "Database message", "database");

      // Act: Get all logs
      const logs = repository.getAll();

      // Assert: Verify all sources are preserved
      const sources = logs.map((log) => log.source).sort();
      expect(sources).toEqual(["api", "database", "server"]);
    });

    // Positive test: timestamp ordering with mixed sources
    it("should order logs by timestamp regardless of source", () => {
      // Arrange: Add logs in non-sequential order
      const now = Math.floor(Date.now() / 1000);

      // Insert with specific timestamps
      mockDb.db
        .prepare("INSERT INTO logs (level, message, source, timestamp) VALUES (?, ?, ?, ?)")
        .run("info", "Third", "src1", now + 2);
      mockDb.db
        .prepare("INSERT INTO logs (level, message, source, timestamp) VALUES (?, ?, ?, ?)")
        .run("info", "First", "src2", now);
      mockDb.db
        .prepare("INSERT INTO logs (level, message, source, timestamp) VALUES (?, ?, ?, ?)")
        .run("info", "Second", "src3", now + 1);

      // Act: Get logs
      const logs = repository.getAll();

      // Assert: Verify ordering by timestamp DESC
      expect(logs[0].message).toBe("Third");
      expect(logs[1].message).toBe("Second");
      expect(logs[2].message).toBe("First");
    });

    // Positive test: special characters in message
    it("should handle special characters in log messages", () => {
      // Arrange: Log message with special characters
      const specialMessage = "Message with \"quotes\" and 'apostrophes' and newlines\n\tand\ttabs";

      // Act: Add log
      repository.add("info", specialMessage, "test");

      // Assert: Verify special characters are preserved
      const logs = repository.getAll();
      expect(logs[0].message).toBe(specialMessage);
    });

    // Positive test: unicode characters in message
    it("should handle unicode characters in log messages", () => {
      // Arrange: Unicode message
      const unicodeMessage = "Unicode: 中文 emoji 🎉 français";

      // Act: Add log
      repository.add("info", unicodeMessage, "test");

      // Assert: Verify unicode is preserved
      const logs = repository.getAll();
      expect(logs[0].message).toBe(unicodeMessage);
    });

    // Positive test: very long messages
    it("should handle very long log messages", () => {
      // Arrange: Long message (1000+ characters)
      const longMessage = "A".repeat(2000);

      // Act: Add log
      repository.add("info", longMessage, "test");

      // Assert: Verify long message is stored
      const logs = repository.getAll();
      expect(logs[0].message).toBe(longMessage);
      expect(logs[0].message.length).toBe(2000);
    });
  });

  describe("Edge cases", () => {
    beforeEach(() => {
      repository.clear();
    });

    // Positive test: null message handling
    it("should convert null message to string 'null'", () => {
      // Act: Add log with null message
      repository.add("info", null, "test");

      // Assert: Verify null is converted to string
      const logs = repository.getAll();
      expect(logs[0].message).toBe("null");
    });

    // Positive test: undefined message handling
    it("should convert undefined message to string 'undefined'", () => {
      // Act: Add log with undefined message
      repository.add("info", undefined, "test");

      // Assert: Verify undefined is converted to string
      const logs = repository.getAll();
      expect(logs[0].message).toBe("undefined");
    });

    // Positive test: array message handling
    it("should convert array message to string representation", () => {
      // Arrange: Array message
      const arrayMessage = [1, 2, 3, "four"];

      // Act: Add log
      repository.add("info", arrayMessage, "test");

      // Assert: Verify array is converted to string
      const logs = repository.getAll();
      expect(logs[0].message).toBe(String(arrayMessage));
    });

    // Positive test: function message handling
    it("should convert function message to string representation", () => {
      // Arrange: Function message
      const functionMessage = function myFunc() {
        return true;
      };

      // Act: Add log
      repository.add("info", functionMessage, "test");

      // Assert: Verify function is converted to string
      const logs = repository.getAll();
      expect(logs[0].message).toContain("myFunc");
    });

    // Positive test: custom source with spaces
    it("should handle source with spaces", () => {
      // Act: Add log with spaced source
      repository.add("info", "Test", "my custom source");

      // Assert: Verify source with spaces is preserved
      const logs = repository.getAll();
      expect(logs[0].source).toBe("my custom source");
    });

    // Positive test: empty source handling
    it("should handle empty string source", () => {
      // Act: Add log with empty source
      repository.add("info", "Test", "");

      // Assert: Verify empty source is stored
      const logs = repository.getAll();
      expect(logs[0].source).toBe("");
    });
  });
});
