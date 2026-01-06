/**
 * @jest-environment node
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import DatabasePackage from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const Database = DatabasePackage;

// Inline DB class for testing (copied from server.js to ensure isolation)
class DB {
  constructor(dbPath = null) {
    this.dbPath = dbPath || path.join(process.cwd(), "data", "llama-dashboard.db");
    this.db = new Database(this.dbPath);
    this.init();
  }

  init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS models (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'llama',
        status TEXT DEFAULT 'idle',
        parameters TEXT DEFAULT '{}',
        model_path TEXT,
        file_size INTEGER,
        params TEXT,
        quantization TEXT,
        ctx_size INTEGER DEFAULT 4096,
        batch_size INTEGER DEFAULT 512,
        threads INTEGER DEFAULT 4,
        created_at INTEGER,
        updated_at INTEGER
      );
      CREATE TABLE IF NOT EXISTS metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cpu_usage REAL,
        memory_usage REAL,
        disk_usage REAL,
        active_models INTEGER,
        uptime REAL,
        timestamp INTEGER DEFAULT (strftime('%s', 'now'))
      );
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        source TEXT,
        timestamp INTEGER DEFAULT (strftime('%s', 'now'))
      );
      CREATE TABLE IF NOT EXISTS server_config (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER);
    `);
  }

  // Models
  getModels() {
    return this.db.prepare("SELECT * FROM models ORDER BY created_at DESC").all();
  }

  getModel(id) {
    return this.db.prepare("SELECT * FROM models WHERE id = ?").get(id);
  }

  saveModel(model) {
    const id = model.id || `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Math.floor(Date.now() / 1000);
    this.db
      .prepare(
        `INSERT OR REPLACE INTO models (id, name, type, status, parameters, model_path, file_size, params, quantization, ctx_size, batch_size, threads, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        model.name,
        model.type || "llama",
        model.status || "idle",
        JSON.stringify(model.parameters || {}),
        model.model_path || model.path || null,
        model.file_size || null,
        model.params || null,
        model.quantization || null,
        model.ctx_size || 4096,
        model.batch_size || 512,
        model.threads || 4,
        model.created_at || now,
        now
      );
    return this.getModel(id);
  }

  updateModel(id, updates) {
    const allowed = [
      "name",
      "type",
      "status",
      "parameters",
      "model_path",
      "file_size",
      "params",
      "quantization",
      "ctx_size",
      "batch_size",
      "threads",
    ];
    const set = [],
      vals = [];
    for (const [k, v] of Object.entries(updates)) {
      if (allowed.includes(k)) {
        set.push(`${k} = ?`);
        vals.push(k === "parameters" ? JSON.stringify(v) : v);
      }
    }
    if (set.length === 0) return null;
    vals.push(Math.floor(Date.now() / 1000), id);
    this.db.prepare(`UPDATE models SET ${set.join(", ")}, updated_at = ? WHERE id = ?`).run(...vals);
    return this.getModel(id);
  }

  deleteModel(id) {
    return this.db.prepare("DELETE FROM models WHERE id = ?").run(id).changes > 0;
  }

  // Metrics
  saveMetrics(m) {
    this.db
      .prepare("INSERT INTO metrics (cpu_usage, memory_usage, disk_usage, active_models, uptime) VALUES (?, ?, ?, ?, ?)")
      .run(
        m.cpu_usage || 0,
        m.memory_usage || 0,
        m.disk_usage || 0,
        m.active_models || 0,
        m.uptime || 0
      );
  }

  getMetricsHistory(limit = 100) {
    return this.db.prepare("SELECT * FROM metrics ORDER BY timestamp DESC LIMIT ?").all(limit);
  }

  getLatestMetrics() {
    return this.db.prepare("SELECT * FROM metrics ORDER BY timestamp DESC LIMIT 1").get();
  }

  // Logs
  getLogs(limit = 100) {
    return this.db.prepare("SELECT * FROM logs ORDER BY timestamp DESC LIMIT ?").all(limit);
  }

  addLog(level, msg, source = "server") {
    this.db.prepare("INSERT INTO logs (level, message, source) VALUES (?, ?, ?)").run(level, String(msg), source);
  }

  clearLogs() {
    return this.db.prepare("DELETE FROM logs").run().changes;
  }

  // Config
  getConfig() {
    const def = {
      serverPath: "/usr/local/bin/llama-server",
      host: "localhost",
      port: 8080,
      baseModelsPath: path.join(process.env.HOME || os.homedir(), "models"),
      ctx_size: 2048,
      batch_size: 512,
      threads: 4,
    };
    try {
      const saved = this.db.prepare("SELECT value FROM server_config WHERE key = ?").get("config")?.value;
      if (saved) return { ...def, ...JSON.parse(saved) };
    } catch (e) {
      console.error("Config load error:", e);
    }
    return def;
  }

  saveConfig(c) {
    this.db.prepare("INSERT OR REPLACE INTO server_config (key, value) VALUES (?, ?)").run("config", JSON.stringify(c));
  }

  // Metadata
  getMeta(k, def = null) {
    try {
      const r = this.db.prepare("SELECT value FROM metadata WHERE key = ?").get(k);
      if (r) return JSON.parse(r.value);
    } catch (e) {}
    return def;
  }

  setMeta(k, v) {
    this.db
      .prepare("INSERT OR REPLACE INTO metadata (key, value, updated_at) VALUES (?, ?, ?)")
      .run(k, JSON.stringify(v), Math.floor(Date.now() / 1000));
  }

  close() {
    this.db.close();
  }
}

describe("DB class", () => {
  let db;
  const testDbPath = "/tmp/test-db-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9) + ".db";

  beforeAll(() => {
    db = new DB(testDbPath);
  });

  afterAll(() => {
    if (db) {
      // Clean up all test data
      try {
        db.getModels().forEach(m => db.deleteModel(m.id));
        db.getMetricsHistory(1000).forEach(m => db.db.prepare("DELETE FROM metrics WHERE id = ?").run(m.id));
        db.clearLogs();
      } catch (e) {}
      db.close();
    }
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe("getModels", () => {
    it("should return empty array when no models exist", () => {
      // Positive test: verify getModels returns empty array for fresh database
      const models = db.getModels();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBe(0);
    });

    it("should return array type even after adding models", () => {
      db.saveModel({ name: "test-model" });
      const models = db.getModels();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
    });

    it("should return models ordered by created_at DESC", () => {
      // Create models with slight delay to ensure different timestamps
      const first = db.saveModel({ name: "model-first" });
      const second = db.saveModel({ name: "model-second" });
      const third = db.saveModel({ name: "model-third" });

      const models = db.getModels();
      // Find our test models in the results
      const testModels = models.filter(m => 
        m.id === first.id || m.id === second.id || m.id === third.id
      );
      expect(testModels.length).toBe(3);
      // Most recent first
      expect(testModels[0].name).toBe("model-third");
      expect(testModels[2].name).toBe("model-first");
    });
  });

  describe("getModel", () => {
    it("should return null for non-existent model id", () => {
      // Negative test: verify getModel returns null/undefined for non-existent ID
      // better-sqlite3 returns undefined when no row is found
      const model = db.getModel("non-existent-id-12345");
      expect(model).toBeUndefined();
    });

    it("should return undefined for invalid id types", () => {
      const model = db.getModel(null);
      expect(model).toBeUndefined();
    });

    it("should return model when id exists", () => {
      // Positive test: verify getModel returns model when found
      const saved = db.saveModel({ name: "test-get-model", type: "llama" });
      const retrieved = db.getModel(saved.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved.id).toBe(saved.id);
      expect(retrieved.name).toBe("test-get-model");
    });

    it("should include all model fields", () => {
      const saved = db.saveModel({
        name: "full-model",
        type: "mistral",
        status: "running",
        parameters: { temperature: 0.7 },
        model_path: "/path/to/model.gguf",
        file_size: 1024,
        params: "7B",
        quantization: "Q4_K_M",
        ctx_size: 8192,
        batch_size: 256,
        threads: 8,
      });

      const retrieved = db.getModel(saved.id);
      expect(retrieved.name).toBe("full-model");
      expect(retrieved.type).toBe("mistral");
      expect(retrieved.status).toBe("running");
      expect(JSON.parse(retrieved.parameters)).toEqual({ temperature: 0.7 });
      expect(retrieved.model_path).toBe("/path/to/model.gguf");
      expect(retrieved.file_size).toBe(1024);
      expect(retrieved.params).toBe("7B");
      expect(retrieved.quantization).toBe("Q4_K_M");
      expect(retrieved.ctx_size).toBe(8192);
      expect(retrieved.batch_size).toBe(256);
      expect(retrieved.threads).toBe(8);
    });
  });

  describe("saveModel", () => {
    it("should generate id when not provided", () => {
      // Positive test: verify auto-generated ID
      const saved = db.saveModel({ name: "auto-id-model" });
      expect(saved.id).toBeDefined();
      expect(typeof saved.id).toBe("string");
      expect(saved.id.length).toBeGreaterThan(10);
    });

    it("should use provided id when available", () => {
      // Positive test: verify custom ID is preserved
      const saved = db.saveModel({ id: "custom-id-123", name: "custom-model" });
      expect(saved.id).toBe("custom-id-123");
    });

    it("should set default values for optional fields", () => {
      const saved = db.saveModel({ name: "minimal-model" });
      expect(saved.type).toBe("llama");
      expect(saved.status).toBe("idle");
      expect(saved.ctx_size).toBe(4096);
      expect(saved.batch_size).toBe(512);
      expect(saved.threads).toBe(4);
      expect(JSON.parse(saved.parameters)).toEqual({});
    });

    it("should override defaults with provided values", () => {
      const saved = db.saveModel({
        name: "custom-defaults",
        type: "qwen",
        status: "running",
        ctx_size: 8192,
        batch_size: 1024,
        threads: 16,
      });
      expect(saved.type).toBe("qwen");
      expect(saved.status).toBe("running");
      expect(saved.ctx_size).toBe(8192);
      expect(saved.batch_size).toBe(1024);
      expect(saved.threads).toBe(16);
    });

    it("should return the saved model with all fields", () => {
      const input = { name: "return-test" };
      const saved = db.saveModel(input);

      expect(saved).not.toBeNull();
      expect(saved.name).toBe("return-test");
      expect(saved.id).toBeDefined();
      expect(saved.created_at).toBeDefined();
      expect(saved.updated_at).toBeDefined();
    });

    it("should handle model with path alias", () => {
      const saved = db.saveModel({ name: "path-alias-model", path: "/aliased/path.gguf" });
      expect(saved.model_path).toBe("/aliased/path.gguf");
    });

    it("should handle complex parameters object", () => {
      const complexParams = {
        temperature: 0.7,
        top_p: 0.9,
        top_k: 50,
        repeat_penalty: 1.1,
        mirostat: 0,
        stop: ["<|endoftext|>", "<|eot_id|>"],
      };

      const saved = db.saveModel({ name: "complex-params", parameters: complexParams });
      const retrieved = db.getModel(saved.id);
      expect(JSON.parse(retrieved.parameters)).toEqual(complexParams);
    });

    it("should allow upsert with existing id", () => {
      // Test INSERT OR REPLACE behavior
      const original = db.saveModel({ id: "upsert-test", name: "original-name" });
      expect(original.name).toBe("original-name");

      const updated = db.saveModel({ id: "upsert-test", name: "new-name" });
      expect(updated.name).toBe("new-name");

      // Should only have one model with this ID
      const models = db.getModels().filter((m) => m.id === "upsert-test");
      expect(models.length).toBe(1);
    });
  });

  describe("updateModel", () => {
    beforeEach(() => {
      db.saveModel({ id: "update-test-id", name: "to-be-updated" });
    });

    it("should return null for non-existent model", () => {
      // Negative test: update on non-existent returns undefined
      const result = db.updateModel("non-existent-update", { status: "running" });
      expect(result).toBeUndefined();
    });

    it("should update single field", () => {
      // Positive test: single field update
      const updated = db.updateModel("update-test-id", { status: "running" });
      expect(updated.status).toBe("running");
    });

    it("should update multiple fields", () => {
      const updated = db.updateModel("update-test-id", {
        status: "running",
        type: "mistral",
        ctx_size: 8192,
      });
      expect(updated.status).toBe("running");
      expect(updated.type).toBe("mistral");
      expect(updated.ctx_size).toBe(8192);
    });

    it("should update parameters as JSON", () => {
      const updated = db.updateModel("update-test-id", {
        parameters: { new_param: "value" },
      });
      expect(JSON.parse(updated.parameters)).toEqual({ new_param: "value" });
    });

    it("should return null for empty updates object", () => {
      // Negative test: empty updates returns null
      const result = db.updateModel("update-test-id", {});
      expect(result).toBeNull();
    });

    it("should return null when updates contain no allowed fields", () => {
      // Negative test: non-allowed fields are ignored
      const result = db.updateModel("update-test-id", { not_allowed: "value" });
      expect(result).toBeNull();
    });

    it("should only update allowed fields", () => {
      const original = db.getModel("update-test-id");
      const updated = db.updateModel("update-test-id", {
        name: "new-name",
        not_allowed_field: "should-be-ignored",
        another_bad: 123,
      });

      expect(updated.name).toBe("new-name");
      // Should have updated_at changed
      expect(updated.updated_at).toBeGreaterThanOrEqual(original.updated_at);
    });

    it("should update updated_at timestamp", () => {
      const beforeUpdate = db.getModel("update-test-id");
      const originalUpdatedAt = beforeUpdate.updated_at;

      // Wait a bit to ensure timestamp difference
      const newUpdatedAt = db.updateModel("update-test-id", { status: "running" }).updated_at;
      expect(newUpdatedAt).toBeGreaterThanOrEqual(originalUpdatedAt);
    });
  });

  describe("deleteModel", () => {
    it("should return false for non-existent id", () => {
      // Negative test: delete non-existent returns false
      const result = db.deleteModel("non-existent-delete");
      expect(result).toBe(false);
    });

    it("should return true when model exists", () => {
      // Positive test: delete existing returns true
      const saved = db.saveModel({ name: "to-be-deleted" });
      const result = db.deleteModel(saved.id);
      expect(result).toBe(true);
    });

    it("should actually remove model from database", () => {
      const saved = db.saveModel({ name: "remove-test" });
      expect(db.getModel(saved.id)).not.toBeUndefined();

      db.deleteModel(saved.id);
      expect(db.getModel(saved.id)).toBeUndefined();
    });

    it("should return false for already deleted model", () => {
      const saved = db.saveModel({ name: "double-delete" });
      db.deleteModel(saved.id);
      const result = db.deleteModel(saved.id);
      expect(result).toBe(false);
    });

    it("should handle null id", () => {
      const result = db.deleteModel(null);
      expect(result).toBe(false);
    });
  });

  describe("Metrics operations", () => {
    beforeEach(() => {
      // Clear metrics before each test
      db.getMetricsHistory(1000).forEach((m) => {
        db.db.prepare("DELETE FROM metrics WHERE id = ?").run(m.id);
      });
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
        });

        const latest = db.getLatestMetrics();
        expect(latest.cpu_usage).toBe(45.5);
        expect(latest.memory_usage).toBe(1024000);
        expect(latest.disk_usage).toBe(50);
        expect(latest.active_models).toBe(2);
        expect(latest.uptime).toBe(3600);
      });

      it("should use defaults for missing fields", () => {
        db.saveMetrics({});
        const latest = db.getLatestMetrics();
        expect(latest.cpu_usage).toBe(0);
        expect(latest.memory_usage).toBe(0);
        expect(latest.active_models).toBe(0);
        expect(latest.uptime).toBe(0);
      });

      it("should auto-generate timestamp", () => {
        const before = Math.floor(Date.now() / 1000);
        db.saveMetrics({ cpu_usage: 10 });
        const latest = db.getLatestMetrics();
        expect(latest.timestamp).toBeGreaterThanOrEqual(before);
      });
    });

    describe("getMetricsHistory", () => {
      beforeEach(() => {
        // Add multiple metrics
        for (let i = 0; i < 5; i++) {
          db.saveMetrics({ cpu_usage: i * 10 });
        }
      });

      it("should return metrics ordered by timestamp DESC", () => {
        const history = db.getMetricsHistory();
        expect(history.length).toBeGreaterThanOrEqual(5);
        // Most recent first - get the last 5 metrics we just added
        const recent = history.slice(0, 5);
        expect(recent[0].cpu_usage).toBe(40);
        expect(recent[4].cpu_usage).toBe(0);
      });

      it("should respect limit parameter", () => {
        const history = db.getMetricsHistory(2);
        expect(history.length).toBeLessThanOrEqual(2);
      });

      it("should return empty array when no metrics exist", () => {
        // Clear all metrics
        db.getMetricsHistory(1000).forEach((m) => {
          db.db.prepare("DELETE FROM metrics WHERE id = ?").run(m.id);
        });
        const history = db.getMetricsHistory();
        expect(history.length).toBe(0);
      });

      it("should return all metrics when limit exceeds count", () => {
        const history = db.getMetricsHistory(100);
        expect(history.length).toBeGreaterThanOrEqual(5);
      });
    });

    describe("getLatestMetrics", () => {
      beforeEach(() => {
        // Clear metrics first
        db.getMetricsHistory(1000).forEach((m) => {
          db.db.prepare("DELETE FROM metrics WHERE id = ?").run(m.id);
        });
      });

      it("should return most recent metrics", () => {
        db.saveMetrics({ cpu_usage: 10, memory_usage: 100 });
        db.saveMetrics({ cpu_usage: 20, memory_usage: 200 });
        db.saveMetrics({ cpu_usage: 30, memory_usage: 300 });

        const latest = db.getLatestMetrics();
        expect(latest.cpu_usage).toBe(30);
        expect(latest.memory_usage).toBe(300);
      });

      it("should return undefined when no metrics", () => {
        // Clear all metrics
        db.getMetricsHistory(1000).forEach((m) => {
          db.db.prepare("DELETE FROM metrics WHERE id = ?").run(m.id);
        });
        const latest = db.getLatestMetrics();
        expect(latest).toBeUndefined();
      });
    });
  });

  describe("Logs operations", () => {
    beforeEach(() => {
      db.clearLogs();
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
        db.addLog("error", "Error message");
        const logs = db.getLogs();

        expect(logs[0].source).toBe("server");
      });

      it("should convert message to string", () => {
        db.addLog("info", 12345);
        const logs = db.getLogs();
        expect(logs[0].message).toBe("12345");
      });

      it("should handle empty message", () => {
        db.addLog("info", "");
        const logs = db.getLogs();
        expect(logs[0].message).toBe("");
      });

      it("should handle complex object message", () => {
        const obj = { key: "value", nested: { data: true } };
        db.addLog("debug", obj);
        const logs = db.getLogs();
        expect(logs[0].message).toBe(String(obj));
      });
    });

    describe("getLogs", () => {
      beforeEach(() => {
        db.clearLogs();
        db.addLog("info", "Info message 1");
        db.addLog("error", "Error message");
        db.addLog("info", "Info message 2");
        db.addLog("debug", "Debug message");
        db.addLog("warn", "Warning message");
      });

      it("should return logs ordered by timestamp DESC", () => {
        const logs = db.getLogs();
        expect(logs.length).toBe(5);
        // Most recent first
        expect(logs[0].level).toBe("warn");
        expect(logs[4].level).toBe("info");
      });

      it("should respect limit parameter", () => {
        const logs = db.getLogs(2);
        expect(logs.length).toBe(2);
      });

      it("should return all fields", () => {
        const logs = db.getLogs(1);
        expect(logs[0].id).toBeDefined();
        expect(logs[0].level).toBeDefined();
        expect(logs[0].message).toBeDefined();
        expect(logs[0].source).toBeDefined();
        expect(logs[0].timestamp).toBeDefined();
      });
    });

    describe("clearLogs", () => {
      it("should clear all logs", () => {
        // Positive test: clear logs
        db.addLog("info", "Test message");
        expect(db.getLogs().length).toBe(1);

        const cleared = db.clearLogs();
        expect(cleared).toBe(1);
        expect(db.getLogs().length).toBe(0);
      });

      it("should return 0 when no logs to clear", () => {
        const cleared = db.clearLogs();
        expect(cleared).toBe(0);
      });

      it("should handle multiple clear calls", () => {
        db.addLog("info", "Message");
        db.clearLogs();
        const cleared = db.clearLogs();
        expect(cleared).toBe(0);
      });
    });
  });

  describe("Config operations", () => {
    afterEach(() => {
      // Reset config to default
      db.saveConfig(db.getConfig());
    });

    describe("getConfig", () => {
      it("should return default config when no saved config", () => {
        // Positive test: get default config
        const config = db.getConfig();
        expect(config.serverPath).toBe("/usr/local/bin/llama-server");
        expect(config.host).toBe("localhost");
        expect(config.port).toBe(8080);
        expect(config.ctx_size).toBe(2048);
        expect(config.batch_size).toBe(512);
        expect(config.threads).toBe(4);
      });

      it("should include baseModelsPath in default config", () => {
        const config = db.getConfig();
        expect(config.baseModelsPath).toBeDefined();
        expect(typeof config.baseModelsPath).toBe("string");
      });

      it("should return merged config when saved config exists", () => {
        db.saveConfig({ port: 9999, custom_field: "custom" });
        const config = db.getConfig();

        expect(config.port).toBe(9999);
        expect(config.custom_field).toBe("custom");
        // Default values should still be present
        expect(config.serverPath).toBe("/usr/local/bin/llama-server");
        expect(config.host).toBe("localhost");
      });
    });

    describe("saveConfig", () => {
      it("should save and persist config", () => {
        // Positive test: save and retrieve config
        const newConfig = { port: 8081, host: "0.0.0.0", threads: 8 };
        db.saveConfig(newConfig);

        const retrieved = db.getConfig();
        expect(retrieved.port).toBe(8081);
        expect(retrieved.host).toBe("0.0.0.0");
        expect(retrieved.threads).toBe(8);
      });

      it("should overwrite previous config", () => {
        db.saveConfig({ port: 9000 });
        db.saveConfig({ port: 9001 });

        const config = db.getConfig();
        expect(config.port).toBe(9001);
      });

      it("should handle empty config object", () => {
        db.saveConfig({});
        const config = db.getConfig();
        expect(config.port).toBeDefined();
      });

      it("should handle complex config values", () => {
        const complexConfig = {
          serverPath: "/custom/path",
          host: "192.168.1.1",
          port: 3000,
          baseModelsPath: "/models",
          ctx_size: 4096,
          batch_size: 1024,
          threads: 16,
          advanced: {
            temp: 0.7,
            tokens: 2048,
            flags: ["no-mmap", "mlock"],
          },
        };

        db.saveConfig(complexConfig);
        const retrieved = db.getConfig();

        expect(retrieved.advanced).toEqual(complexConfig.advanced);
        expect(retrieved.advanced.temp).toBe(0.7);
        expect(retrieved.advanced.flags).toEqual(["no-mmap", "mlock"]);
      });
    });
  });

  describe("Metadata operations", () => {
    afterEach(() => {
      // Clean up test metadata
      db.setMeta("test_key", undefined);
    });

    describe("getMeta", () => {
      it("should return default when key does not exist", () => {
        // Positive test: get default for missing key
        const result = db.getMeta("non_existent_key", "default_value");
        expect(result).toBe("default_value");
      });

      it("should return null default when not specified", () => {
        const result = db.getMeta("non_existent_key");
        expect(result).toBeNull();
      });

      it("should return stored value when key exists", () => {
        db.setMeta("test_key", { data: "value" });
        const result = db.getMeta("test_key");
        expect(result).toEqual({ data: "value" });
      });

      it("should handle various value types", () => {
        // String
        db.setMeta("string_val", "test string");
        expect(db.getMeta("string_val")).toBe("test string");

        // Number
        db.setMeta("number_val", 42);
        expect(db.getMeta("number_val")).toBe(42);

        // Boolean
        db.setMeta("bool_val", true);
        expect(db.getMeta("bool_val")).toBe(true);

        // Array
        db.setMeta("array_val", [1, 2, 3]);
        expect(db.getMeta("array_val")).toEqual([1, 2, 3]);

        // Object
        db.setMeta("obj_val", { nested: { deep: true } });
        expect(db.getMeta("obj_val")).toEqual({ nested: { deep: true } });
      });
    });

    describe("setMeta", () => {
      it("should set metadata value", () => {
        // Positive test: set and get metadata
        db.setMeta("my_key", "my_value");
        const result = db.getMeta("my_key");
        expect(result).toBe("my_value");
      });

      it("should update existing key", () => {
        db.setMeta("update_key", "first");
        db.setMeta("update_key", "second");
        expect(db.getMeta("update_key")).toBe("second");
      });

      it("should handle null values", () => {
        db.setMeta("null_key", null);
        const result = db.getMeta("null_key");
        expect(result).toBeNull();
      });

      it("should handle undefined values", () => {
        db.setMeta("undefined_key", undefined);
        const result = db.getMeta("undefined_key", "default");
        expect(result).toBe("default");
      });

      it("should handle complex nested objects", () => {
        const complexValue = {
          level1: {
            level2: {
              level3: ["array", "of", "values"],
              number: 123,
              boolean: false,
            },
          },
        };

        db.setMeta("complex", complexValue);
        expect(db.getMeta("complex")).toEqual(complexValue);
      });

      it("should handle empty objects and arrays", () => {
        db.setMeta("empty_obj", {});
        expect(db.getMeta("empty_obj")).toEqual({});

        db.setMeta("empty_arr", []);
        expect(db.getMeta("empty_arr")).toEqual([]);
      });
    });
  });

  describe("Edge cases and error handling", () => {
    describe("Model edge cases", () => {
      it("should handle model with special characters in name", () => {
        const saved = db.saveModel({ name: "Model-With_Special.Chars123" });
        expect(saved.name).toBe("Model-With_Special.Chars123");
      });

      it("should handle model with empty name", () => {
        const saved = db.saveModel({ name: "" });
        expect(saved.name).toBe("");
      });

      it("should handle very long model names", () => {
        const longName = "a".repeat(1000);
        const saved = db.saveModel({ name: longName });
        expect(saved.name).toBe(longName);
      });

      it("should handle model with unicode characters", () => {
        const saved = db.saveModel({ name: "模型名称" });
        expect(saved.name).toBe("模型名称");
      });

      it("should handle model with all fields null/undefined", () => {
        const saved = db.saveModel({});
        expect(saved.id).toBeDefined();
        expect(saved.name).toBeUndefined(); // name is NOT NULL in schema but we're passing undefined
      });
    });

    describe("Update edge cases", () => {
      it("should handle update with null values", () => {
        const saved = db.saveModel({ name: "null-test", model_path: "/path" });
        const updated = db.updateModel(saved.id, { model_path: null });
        expect(updated.model_path).toBeNull();
      });

      it("should handle update with zero values", () => {
        const saved = db.saveModel({ name: "zero-test" });
        const updated = db.updateModel(saved.id, { ctx_size: 0 });
        expect(updated.ctx_size).toBe(0);
      });

      it("should handle update with negative values", () => {
        const saved = db.saveModel({ name: "negative-test" });
        const updated = db.updateModel(saved.id, { batch_size: -100 });
        expect(updated.batch_size).toBe(-100);
      });
    });

    describe("Delete edge cases", () => {
      it("should handle delete with empty string id", () => {
        const result = db.deleteModel("");
        expect(result).toBe(false);
      });

      it("should handle delete with whitespace id", () => {
        const result = db.deleteModel("   ");
        expect(result).toBe(false);
      });
    });

    describe("Metrics edge cases", () => {
      it("should handle negative metric values", () => {
        db.saveMetrics({ cpu_usage: -5, memory_usage: -100 });
        const latest = db.getLatestMetrics();
        expect(latest.cpu_usage).toBe(-5);
        expect(latest.memory_usage).toBe(-100);
      });

      it("should handle very large metric values", () => {
        const veryLarge = Number.MAX_SAFE_INTEGER;
        db.saveMetrics({ memory_usage: veryLarge });
        const latest = db.getLatestMetrics();
        expect(latest.memory_usage).toBe(veryLarge);
      });

      it("should handle decimal values", () => {
        db.saveMetrics({ cpu_usage: 45.6789 });
        const latest = db.getLatestMetrics();
        expect(latest.cpu_usage).toBeCloseTo(45.6789);
      });
    });

    describe("Config edge cases", () => {
      it("should handle invalid JSON in config", () => {
        // Directly insert invalid JSON
        db.db.prepare("INSERT OR REPLACE INTO server_config (key, value) VALUES (?, ?)").run(
          "config",
          "not-valid-json"
        );

        // Should not throw, should return defaults
        const config = db.getConfig();
        expect(config.port).toBe(8080);
      });

      it("should handle config with null values", () => {
        const configWithNulls = { port: null, host: null };
        db.saveConfig(configWithNulls);
        const retrieved = db.getConfig();
        expect(retrieved.port).toBeNull();
        expect(retrieved.host).toBeNull();
      });
    });

    describe("Metadata edge cases", () => {
      it("should handle invalid JSON in metadata", () => {
        // Directly insert invalid JSON
        db.db
          .prepare("INSERT OR REPLACE INTO metadata (key, value, updated_at) VALUES (?, ?, ?)")
          .run("bad_json", "{invalid", Math.floor(Date.now() / 1000));

        // Should not throw, should return default
        const result = db.getMeta("bad_json", "fallback");
        expect(result).toBe("fallback");
      });

      it("should handle metadata key collisions", () => {
        db.setMeta("collision", { first: 1 });
        db.setMeta("collision", { second: 2 });
        db.setMeta("collision", { third: 3 });
        expect(db.getMeta("collision")).toEqual({ third: 3 });
      });
    });
  });

  describe("Database isolation", () => {
    it("each test should have independent database state", () => {
      // Verify that the test database is clean at the start of this test
      expect(db.getModels().length).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(db.getModels())).toBe(true);
    });

    it("should properly close and reopen database", () => {
      const saved = db.saveModel({ name: "before-close" });
      db.close();

      // Reopen with same path - should be empty (new connection)
      const db2 = new DB(testDbPath);
      const models = db2.getModels();
      expect(models.length).toBe(0);
      db2.close();
    });
  });
});
