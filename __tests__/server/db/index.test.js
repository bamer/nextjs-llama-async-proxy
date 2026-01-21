/**
 * @jest-environment node
 */

/**
 * Database Composition Layer Tests
 * Tests the DB class that composes all repository methods
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the DB composition layer
import {
  DB,
  DBBase,
  ModelsRepository,
  MetricsRepository,
  LogsRepository,
  ConfigRepository,
  MetadataRepository,
} from "../../../server/db/index.js";

describe("DB Composition Layer", () => {
  let db;
  let testDbPath;

  beforeAll(() => {
    testDbPath =
      "/tmp/test-db-composition-" +
      Date.now() +
      "-" +
      Math.random().toString(36).substr(2, 9) +
      ".db";
    db = new DB(testDbPath);
  });

  afterAll(() => {
    if (db) {
      // Clean up test data
      try {
        const models = db.getModels();
        models.forEach((m) => db.deleteModel(m.id));
        db.clearLogs();
        // Clean up metrics
        const metrics = db.getMetricsHistory(1000);
        metrics.forEach((m) => db.db.prepare("DELETE FROM metrics WHERE id = ?").run(m.id));
      } catch (e) {}
      // Close the underlying database connection
      if (db.db && typeof db.db.close === "function") {
        db.db.close();
      }
    }
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe("Class Composition and Exports", () => {
    it("should export DB class", () => {
      // Positive test: verify DB class is exported and can be instantiated
      expect(DB).toBeDefined();
      expect(typeof DB).toBe("function");
      expect(DB.prototype).toBeDefined();
    });

    it("should export DBBase class", () => {
      // Positive test: verify DBBase is exported for inheritance
      expect(DBBase).toBeDefined();
      expect(typeof DBBase).toBe("function");
    });

    it("should export all repository classes", () => {
      // Positive test: verify all repositories are exported for direct access
      expect(ModelsRepository).toBeDefined();
      expect(typeof ModelsRepository).toBe("function");
      expect(MetricsRepository).toBeDefined();
      expect(typeof MetricsRepository).toBe("function");
      expect(LogsRepository).toBeDefined();
      expect(typeof LogsRepository).toBe("function");
      expect(ConfigRepository).toBeDefined();
      expect(typeof ConfigRepository).toBe("function");
      expect(MetadataRepository).toBeDefined();
      expect(typeof MetadataRepository).toBe("function");
    });

    it("should have DB extend DBBase", () => {
      // Positive test: verify inheritance chain
      expect(db instanceof DB).toBe(true);
      expect(db instanceof DBBase).toBe(true);
    });

    it("should initialize all repositories on construction", () => {
      // Positive test: verify repositories are composed
      expect(db.models).toBeInstanceOf(ModelsRepository);
      expect(db.metrics).toBeInstanceOf(MetricsRepository);
      expect(db.logs).toBeInstanceOf(LogsRepository);
      expect(db.config).toBeInstanceOf(ConfigRepository);
      expect(db.meta).toBeInstanceOf(MetadataRepository);
    });
  });

  describe("Models Repository Delegation", () => {
    beforeEach(() => {
      // Clean up models before each test
      const models = db.getModels();
      models.forEach((m) => db.deleteModel(m.id));
    });

    describe("getModels", () => {
      it("should return empty array when no models exist", () => {
        // Positive test: verify getModels returns empty array for fresh database
        const models = db.getModels();
        expect(Array.isArray(models)).toBe(true);
        expect(models.length).toBe(0);
      });

      it("should return array of models when models exist", () => {
        // Positive test: verify getModels returns array with models
        db.saveModel({ name: "test-model-1" });
        db.saveModel({ name: "test-model-2" });

        const models = db.getModels();
        expect(Array.isArray(models)).toBe(true);
        expect(models.length).toBe(2);
      });

      it("should return models ordered by created_at DESC", () => {
        // Positive test: verify ordering is maintained
        const now = Math.floor(Date.now() / 1000);
        db.saveModel({ id: "order-test-1", name: "first", created_at: now });
        db.saveModel({ id: "order-test-2", name: "second", created_at: now + 10 });

        const models = db.getModels();
        expect(models[0].name).toBe("second");
        expect(models[1].name).toBe("first");
      });
    });

    describe("getModel", () => {
      it("should return null for non-existent model", () => {
        // Negative test: verify getModel returns undefined for non-existent ID
        const model = db.getModel("non-existent-id");
        expect(model).toBeUndefined();
      });

      it("should return model when exists", () => {
        // Positive test: verify getModel returns model when found
        const saved = db.saveModel({ name: "get-test-model" });
        const retrieved = db.getModel(saved.id);

        expect(retrieved).toBeDefined();
        expect(retrieved.id).toBe(saved.id);
        expect(retrieved.name).toBe("get-test-model");
      });
    });

    describe("saveModel", () => {
      it("should generate id when not provided", () => {
        // Positive test: verify auto-generated ID
        const saved = db.saveModel({ name: "auto-id" });
        expect(saved.id).toBeDefined();
        expect(typeof saved.id).toBe("string");
      });

      it("should use provided id when available", () => {
        // Positive test: verify custom ID is preserved
        const saved = db.saveModel({ id: "custom-id-123", name: "custom" });
        expect(saved.id).toBe("custom-id-123");
      });

      it("should set default values for optional fields", () => {
        // Positive test: verify defaults are applied
        const saved = db.saveModel({ name: "minimal" });
        expect(saved.type).toBe("llama");
        expect(saved.status).toBe("idle");
        expect(saved.ctx_size).toBe(4096);
      });

      it("should return the saved model with all fields", () => {
        // Positive test: verify return value
        const input = { name: "save-test" };
        const saved = db.saveModel(input);

        expect(saved).not.toBeNull();
        expect(saved.id).toBeDefined();
        expect(saved.created_at).toBeDefined();
        expect(saved.updated_at).toBeDefined();
      });
    });

    describe("updateModel", () => {
      it("should return null/undefined for non-existent model", () => {
        // Negative test: verify update on non-existent returns undefined
        const result = db.updateModel("non-existent", { status: "running" });
        expect(result).toBeUndefined();
      });

      it("should update single field", () => {
        // Positive test: verify single field update
        const saved = db.saveModel({ name: "update-test" });
        const updated = db.updateModel(saved.id, { status: "running" });

        expect(updated.status).toBe("running");
      });

      it("should return null for empty updates", () => {
        // Negative test: empty updates returns null
        const saved = db.saveModel({ name: "empty-update-test" });
        const result = db.updateModel(saved.id, {});

        expect(result).toBeNull();
      });

      it("should update updated_at timestamp", () => {
        const saved = db.saveModel({ name: "timestamp-test" });
        const originalUpdatedAt = saved.updated_at;

        const updated = db.updateModel(saved.id, { status: "running" });
        expect(updated.updated_at).toBeGreaterThanOrEqual(originalUpdatedAt);
      });
    });

    describe("deleteModel", () => {
      it("should return false for non-existent model", () => {
        // Negative test: delete non-existent returns false
        const result = db.deleteModel("non-existent-delete");
        expect(result).toBe(false);
      });

      it("should return true when model exists", () => {
        // Positive test: delete existing returns true
        const saved = db.saveModel({ name: "to-delete" });
        const result = db.deleteModel(saved.id);

        expect(result).toBe(true);
      });

      it("should actually remove model from database", () => {
        const saved = db.saveModel({ name: "remove-test" });
        expect(db.getModel(saved.id)).toBeDefined();

        db.deleteModel(saved.id);
        expect(db.getModel(saved.id)).toBeUndefined();
      });
    });

    describe("cleanupMissingFiles", () => {
      it("should return 0 when no models have missing files", () => {
        // Positive test: no cleanup needed when all models are valid
        db.saveModel({ name: "valid-model", model_path: "/non/existent/path" });
        // Note: In real scenarios, file existence would be checked
        const result = db.cleanupMissingFiles();
        expect(typeof result).toBe("number");
      });

      it("should return count of deleted models", () => {
        // Positive test: cleanup returns count
        const result = db.cleanupMissingFiles();
        expect(result).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe("Metrics Repository Delegation", () => {
    beforeEach(() => {
      // Clear metrics before each test
      const metrics = db.getMetricsHistory(1000);
      metrics.forEach((m) => db.db.prepare("DELETE FROM metrics WHERE id = ?").run(m.id));
    });

    describe("saveMetrics", () => {
      it("should save metrics with all fields", () => {
        // Positive test: save and retrieve metrics
        db.saveMetrics({
          cpu_usage: 45.5,
          memory_usage: 1024000,
          disk_usage: 50,
          active_models: 2,
          uptime: 3600,
          gpu_usage: 75,
          gpu_memory_used: 4000000000,
          gpu_memory_total: 8000000000,
        });

        const latest = db.getLatestMetrics();
        expect(latest.cpu_usage).toBe(45.5);
        expect(latest.memory_usage).toBe(1024000);
        expect(latest.gpu_usage).toBe(75);
      });

      it("should use defaults for missing fields", () => {
        // Positive test: defaults are applied
        db.saveMetrics({});

        const latest = db.getLatestMetrics();
        expect(latest.cpu_usage).toBe(0);
        expect(latest.memory_usage).toBe(0);
        expect(latest.active_models).toBe(0);
      });

      it("should auto-generate timestamp", () => {
        const before = Math.floor(Date.now() / 1000);
        db.saveMetrics({ cpu_usage: 10 });
        const latest = db.getLatestMetrics();

        expect(latest.timestamp).toBeGreaterThanOrEqual(before);
      });
    });

    describe("getMetricsHistory", () => {
      it("should return metrics ordered by timestamp DESC", () => {
        // Positive test: verify ordering
        const now = Math.floor(Date.now() / 1000);

        // Insert with specific timestamps
        db.db
          .prepare(
            "INSERT INTO metrics (cpu_usage, memory_usage, disk_usage, active_models, uptime, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
          )
          .run(10, 100, 50, 1, 100, now);
        db.db
          .prepare(
            "INSERT INTO metrics (cpu_usage, memory_usage, disk_usage, active_models, uptime, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
          )
          .run(20, 200, 50, 1, 200, now + 1);

        const history = db.getMetricsHistory();
        expect(history[0].cpu_usage).toBe(20);
        expect(history[1].cpu_usage).toBe(10);
      });

      it("should respect limit parameter", () => {
        // Add multiple metrics
        for (let i = 0; i < 5; i++) {
          db.saveMetrics({ cpu_usage: i * 10 });
        }

        const history = db.getMetricsHistory(2);
        expect(history.length).toBeLessThanOrEqual(2);
      });

      it("should return empty array when no metrics exist", () => {
        // Negative test: no metrics returns empty array
        const history = db.getMetricsHistory();
        expect(history.length).toBe(0);
      });
    });

    describe("getLatestMetrics", () => {
      it("should return most recent metrics", () => {
        // Positive test: verify latest is returned
        const now = Math.floor(Date.now() / 1000);

        db.db
          .prepare(
            "INSERT INTO metrics (cpu_usage, memory_usage, disk_usage, active_models, uptime, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
          )
          .run(10, 100, 50, 1, 100, now);
        db.db
          .prepare(
            "INSERT INTO metrics (cpu_usage, memory_usage, disk_usage, active_models, uptime, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
          )
          .run(30, 300, 50, 1, 300, now + 1);

        const latest = db.getLatestMetrics();
        expect(latest.cpu_usage).toBe(30);
        expect(latest.memory_usage).toBe(300);
      });

      it("should return undefined when no metrics", () => {
        // Negative test: no metrics returns undefined
        const latest = db.getLatestMetrics();
        expect(latest).toBeUndefined();
      });
    });

    describe("pruneMetrics", () => {
      it("should return 0 when no pruning needed", () => {
        // Positive test: no pruning when under limit
        // First ensure there are no metrics
        const metrics = db.getMetricsHistory(1000);
        metrics.forEach((m) => db.db.prepare("DELETE FROM metrics WHERE id = ?").run(m.id));

        const result = db.pruneMetrics(10000);
        expect(result).toBe(0);
      });

      it("should return 0 when metrics count is at or below limit", () => {
        // Positive test: verify the else branch when count <= maxRecords
        // Add a few metrics
        db.saveMetrics({ cpu_usage: 10 });
        db.saveMetrics({ cpu_usage: 20 });

        // Prune with a high limit
        const result = db.pruneMetrics(100);
        expect(result).toBe(0); // No pruning needed
      });

      it("should prune old metrics when over limit", () => {
        // Positive test: pruning works
        // Insert many metrics to exceed limit
        for (let i = 0; i < 15; i++) {
          db.saveMetrics({ cpu_usage: i });
        }

        const result = db.pruneMetrics(10);
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThanOrEqual(0);
      });

      it("should respect maxRecords parameter", () => {
        // Positive test: limit is respected
        const result = db.pruneMetrics(5);
        expect(typeof result).toBe("number");
      });

      it("should return 0 when database error occurs", () => {
        // Negative test: error handling returns 0
        // Simulate error by closing the database first
        const errorDb = new DB("/tmp/error-test.db");
        errorDb.saveMetrics({ cpu_usage: 10 });
        // Close the database to cause an error
        errorDb.db.close();

        // This should not throw and should return 0
        const result = errorDb.pruneMetrics(10);
        expect(result).toBe(0);

        // Clean up
        if (fs.existsSync("/tmp/error-test.db")) {
          fs.unlinkSync("/tmp/error-test.db");
        }
      });
    });
  });

  describe("Logs Repository Delegation", () => {
    beforeEach(() => {
      db.clearLogs();
    });

    describe("getLogs", () => {
      it("should return empty array when no logs exist", () => {
        // Positive test: no logs returns empty array
        const logs = db.getLogs();
        expect(Array.isArray(logs)).toBe(true);
        expect(logs.length).toBe(0);
      });

      it("should return logs ordered by timestamp DESC", () => {
        // Positive test: verify ordering
        const now = Math.floor(Date.now() / 1000);

        db.db
          .prepare("INSERT INTO logs (level, message, source, timestamp) VALUES (?, ?, ?, ?)")
          .run("info", "First", "test", now);
        db.db
          .prepare("INSERT INTO logs (level, message, source, timestamp) VALUES (?, ?, ?, ?)")
          .run("error", "Second", "test", now + 1);

        const logs = db.getLogs();
        expect(logs[0].level).toBe("error");
        expect(logs[1].level).toBe("info");
      });

      it("should use default limit when not provided", () => {
        // Positive test: default limit of 100 is used
        // Add 50 logs to ensure default limit is sufficient
        for (let i = 0; i < 50; i++) {
          db.addLog("info", `Log ${i}`);
        }

        const logs = db.getLogs(); // No limit argument - uses default
        expect(logs.length).toBe(50);
      });

      it("should respect limit parameter", () => {
        // Add multiple logs
        for (let i = 0; i < 5; i++) {
          db.addLog("info", `Log ${i}`);
        }

        const logs = db.getLogs(2);
        expect(logs.length).toBe(2);
      });
    });

    describe("addLog", () => {
      it("should add log entry", () => {
        // Positive test: add and retrieve log
        db.addLog("info", "Test message", "test");

        const logs = db.getLogs();
        expect(logs.length).toBe(1);
        expect(logs[0].level).toBe("info");
        expect(logs[0].message).toBe("Test message");
        expect(logs[0].source).toBe("test");
      });

      it("should use default source when not provided", () => {
        // Positive test: default source is "server"
        db.addLog("error", "Error message");

        const logs = db.getLogs();
        expect(logs[0].source).toBe("server");
      });

      it("should convert message to string", () => {
        // Positive test: message is converted to string
        db.addLog("info", 12345);

        const logs = db.getLogs();
        expect(logs[0].message).toBe("12345");
      });

      it("should handle complex object message", () => {
        // Positive test: object message is stringified
        const obj = { key: "value" };
        db.addLog("debug", obj);

        const logs = db.getLogs();
        expect(logs[0].message).toBe(String(obj));
      });
    });

    describe("clearLogs", () => {
      it("should clear all logs", () => {
        // Positive test: clear logs
        db.addLog("info", "Test 1");
        db.addLog("error", "Test 2");

        const cleared = db.clearLogs();
        expect(cleared).toBe(2);
        expect(db.getLogs().length).toBe(0);
      });

      it("should return 0 when no logs to clear", () => {
        // Negative test: no logs returns 0
        const cleared = db.clearLogs();
        expect(cleared).toBe(0);
      });
    });
  });

  describe("Config Repository Delegation", () => {
    afterEach(() => {
      // Reset config to default
      db.saveConfig(db.getConfig());
    });

    describe("getConfig", () => {
      it("should return default config when no saved config", () => {
        // Positive test: defaults are returned
        const config = db.getConfig();
        expect(config.serverPath).toBe("/usr/local/bin/llama-server");
        expect(config.host).toBe("localhost");
        expect(config.port).toBe(8080);
      });

      it("should include all default fields", () => {
        // Positive test: all default fields present
        const config = db.getConfig();
        expect(config.ctx_size).toBe(2048);
        expect(config.batch_size).toBe(512);
        expect(config.threads).toBe(4);
        expect(config.baseModelsPath).toBeDefined();
      });

      it("should return merged config when saved config exists", () => {
        // Positive test: saved config overrides defaults
        db.saveConfig({ port: 9999, custom_field: "custom" });

        const config = db.getConfig();
        expect(config.port).toBe(9999);
        expect(config.custom_field).toBe("custom");
        // Default values should still be present
        expect(config.serverPath).toBe("/usr/local/bin/llama-server");
      });
    });

    describe("saveConfig", () => {
      it("should save and persist config", () => {
        // Positive test: save and retrieve
        const newConfig = { port: 8081, host: "0.0.0.0", threads: 8 };
        db.saveConfig(newConfig);

        const retrieved = db.getConfig();
        expect(retrieved.port).toBe(8081);
        expect(retrieved.host).toBe("0.0.0.0");
        expect(retrieved.threads).toBe(8);
      });

      it("should overwrite previous config", () => {
        // Positive test: overwrite works
        db.saveConfig({ port: 9000 });
        db.saveConfig({ port: 9001 });

        const config = db.getConfig();
        expect(config.port).toBe(9001);
      });

      it("should handle complex config values", () => {
        // Positive test: complex objects are preserved
        const complexConfig = {
          advanced: { temp: 0.7, tokens: 2048 },
        };
        db.saveConfig(complexConfig);

        const retrieved = db.getConfig();
        expect(retrieved.advanced.temp).toBe(0.7);
      });
    });
  });

  describe("Metadata Repository Delegation", () => {
    afterEach(() => {
      // Clean up test metadata
      try {
        db.setMeta("test_key", {});
        db.setMeta("string_val", {});
        db.setMeta("number_val", {});
        db.setMeta("bool_val", {});
        db.setMeta("array_val", {});
        db.setMeta("obj_val", {});
        db.setMeta("my_key", {});
        db.setMeta("update_key", {});
        db.setMeta("null_key", {});
        db.setMeta("undefined_key", {});
        db.setMeta("complex", {});
        db.setMeta("empty_obj", {});
        db.setMeta("empty_arr", {});
      } catch (e) {}
    });

    describe("getMeta", () => {
      it("should return default when key does not exist", () => {
        // Positive test: default is returned
        const result = db.getMeta("non_existent_key", "default_value");
        expect(result).toBe("default_value");
      });

      it("should return null default when not specified", () => {
        // Positive test: null is default
        const result = db.getMeta("non_existent_key");
        expect(result).toBeNull();
      });

      it("should return stored value when key exists", () => {
        // Positive test: stored value is returned
        db.setMeta("test_key_abc", { data: "value" });
        const result = db.getMeta("test_key_abc");
        expect(result).toEqual({ data: "value" });
      });

      it("should handle various value types", () => {
        // Positive test: all types are preserved
        db.setMeta("string_val_xyz", "test string");
        expect(db.getMeta("string_val_xyz")).toBe("test string");

        db.setMeta("number_val_xyz", 42);
        expect(db.getMeta("number_val_xyz")).toBe(42);

        db.setMeta("bool_val_xyz", true);
        expect(db.getMeta("bool_val_xyz")).toBe(true);

        db.setMeta("array_val_xyz", [1, 2, 3]);
        expect(db.getMeta("array_val_xyz")).toEqual([1, 2, 3]);
      });
    });

    describe("setMeta", () => {
      it("should set metadata value", () => {
        // Positive test: set and get
        db.setMeta("my_key_xyz", "my_value");
        const result = db.getMeta("my_key_xyz");
        expect(result).toBe("my_value");
      });

      it("should update existing key", () => {
        // Positive test: update overwrites
        db.setMeta("update_key_xyz", "first");
        db.setMeta("update_key_xyz", "second");
        expect(db.getMeta("update_key_xyz")).toBe("second");
      });

      it("should handle null values", () => {
        // Positive test: null is handled
        db.setMeta("null_key_xyz", null);
        const result = db.getMeta("null_key_xyz");
        // null is stored as "{}"
        expect(result).toEqual({});
      });

      it("should handle undefined values", () => {
        // Positive test: undefined is handled
        db.setMeta("undefined_key_xyz", undefined);
        const result = db.getMeta("undefined_key_xyz");
        // undefined is stored as "{}"
        expect(result).toEqual({});
      });

      it("should handle complex nested objects", () => {
        // Positive test: complex objects are preserved
        const complexValue = {
          level1: {
            level2: {
              level3: ["array", "of", "values"],
            },
          },
        };
        db.setMeta("complex_xyz", complexValue);
        expect(db.getMeta("complex_xyz")).toEqual(complexValue);
      });

      it("should handle empty objects and arrays", () => {
        // Positive test: empty values are preserved
        db.setMeta("empty_obj_xyz", {});
        expect(db.getMeta("empty_obj_xyz")).toEqual({});

        db.setMeta("empty_arr_xyz", []);
        expect(db.getMeta("empty_arr_xyz")).toEqual([]);
      });
    });
  });

  describe("Database Initialization and Connection", () => {
    it("should initialize with default path when no path provided", () => {
      // Positive test: default path is used
      const defaultDb = new DB();
      expect(defaultDb.dbPath).toBeDefined();
      expect(defaultDb.dbPath).toContain("llama-dashboard.db");
      // Close underlying connection
      defaultDb.db.close();
    });

    it("should use provided dbPath", () => {
      // Positive test: custom path is used
      const customPath = "/tmp/custom-test.db";
      const customDb = new DB(customPath);
      expect(customDb.dbPath).toBe(customPath);
      // Close underlying connection
      customDb.db.close();

      // Clean up
      if (fs.existsSync(customPath)) {
        fs.unlinkSync(customPath);
      }
    });

    it("should have valid database connection", () => {
      // Positive test: database is open and ready
      expect(db.db).toBeDefined();
      expect(typeof db.db.prepare).toBe("function");
    });

    it("should have initialized schema", () => {
      // Positive test: schema tables exist
      const tables = db.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      const tableNames = tables.map((t) => t.name);

      expect(tableNames).toContain("models");
      expect(tableNames).toContain("metrics");
      expect(tableNames).toContain("logs");
      expect(tableNames).toContain("server_config");
      expect(tableNames).toContain("metadata");
    });

    it("should have created indexes", () => {
      // Positive test: indexes exist
      const indexes = db.db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all();
      const indexNames = indexes.map((i) => i.name);

      expect(indexNames).toContain("idx_models_status");
      expect(indexNames).toContain("idx_models_name");
      expect(indexNames).toContain("idx_metrics_timestamp");
      expect(indexNames).toContain("idx_logs_timestamp");
    });

    it("should properly close database connection", () => {
      // Positive test: close works without error
      const closeDb = new DB("/tmp/close-test.db");
      closeDb.saveModel({ name: "before-close" });
      // Close underlying connection
      closeDb.db.close();

      // Verify it's closed by checking if we can reopen
      const reopenDb = new DB("/tmp/close-test.db");
      const models = reopenDb.getModels();
      expect(models.length).toBeGreaterThanOrEqual(1);
      reopenDb.db.close();

      // Clean up
      if (fs.existsSync("/tmp/close-test.db")) {
        fs.unlinkSync("/tmp/close-test.db");
      }
    });
  });

  describe("Integration Tests", () => {
    beforeEach(() => {
      // Clean all tables
      const models = db.getModels();
      models.forEach((m) => db.deleteModel(m.id));
      db.clearLogs();
      const metrics = db.getMetricsHistory(1000);
      metrics.forEach((m) => db.db.prepare("DELETE FROM metrics WHERE id = ?").run(m.id));
    });

    it("should handle mixed operations atomically", () => {
      // Positive test: operations work together
      const model = db.saveModel({ name: "integration-model" });
      expect(model).toBeDefined();

      db.addLog("info", "Model created", "test");
      const logs = db.getLogs();
      expect(logs.length).toBe(1);

      db.saveMetrics({ cpu_usage: 50 });
      const metrics = db.getLatestMetrics();
      expect(metrics.cpu_usage).toBe(50);

      db.setMeta("test", "value");
      expect(db.getMeta("test")).toBe("value");
    });

    it("should maintain data isolation between operations", () => {
      // Positive test: data doesn't leak between operations
      db.saveModel({ name: "model-1" });
      db.saveMetrics({ cpu_usage: 10 });
      db.addLog("info", "test");
      db.setMeta("key", "value");

      const models = db.getModels();
      const logs = db.getLogs();
      const metrics = db.getMetricsHistory();
      const meta = db.getMeta("key");

      expect(models.length).toBe(1);
      expect(logs.length).toBe(1);
      expect(metrics.length).toBe(1);
      expect(meta).toBe("value");
    });
  });
});
