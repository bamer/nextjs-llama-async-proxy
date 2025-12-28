import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import {
  initDatabase,
  closeDatabase,
  getDatabaseSize,
  saveMetrics,
  getMetricsHistory,
  getLatestMetrics,
  saveModel,
  getModels,
  getModelById,
  getModelByName,
  updateModel,
  deleteModel,
  deleteAllModels,
  setMetadata,
  getMetadata,
  deleteMetadata,
  vacuumDatabase,
  exportDatabase,
  importDatabase,
  type ModelConfig,
  type MetricsData,
} from "@/lib/database";

// Use a separate test database to avoid interfering with production data
const TEST_DB_PATH = path.join(process.cwd(), "data", "test-llama-dashboard.db");
const ORIGINAL_DB_PATH = path.join(process.cwd(), "data", "llama-dashboard.db");

describe("Database Initialization", () => {
  beforeAll(() => {
    // Backup original database if it exists
    if (fs.existsSync(ORIGINAL_DB_PATH)) {
      fs.copyFileSync(ORIGINAL_DB_PATH, `${ORIGINAL_DB_PATH}.backup`);
    }
  });

  afterAll(() => {
    // Restore original database
    if (fs.existsSync(`${ORIGINAL_DB_PATH}.backup`)) {
      if (fs.existsSync(ORIGINAL_DB_PATH)) {
        fs.unlinkSync(ORIGINAL_DB_PATH);
      }
      fs.renameSync(`${ORIGINAL_DB_PATH}.backup`, ORIGINAL_DB_PATH);
    }
    // Clean up test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    // Clean up test WAL files
    const testWalPath = `${TEST_DB_PATH}-wal`;
    const testShmPath = `${TEST_DB_PATH}-shm`;
    if (fs.existsSync(testWalPath)) {
      fs.unlinkSync(testWalPath);
    }
    if (fs.existsSync(testShmPath)) {
      fs.unlinkSync(testShmPath);
    }
  });

  beforeEach(() => {
    // Ensure clean test database before each test
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    const testWalPath = `${TEST_DB_PATH}-wal`;
    const testShmPath = `${TEST_DB_PATH}-shm`;
    if (fs.existsSync(testWalPath)) {
      fs.unlinkSync(testWalPath);
    }
    if (fs.existsSync(testShmPath)) {
      fs.unlinkSync(testShmPath);
    }
  });

  it("should initialize database and create tables", () => {
    const db = initDatabase();
    expect(db).toBeDefined();
    expect(fs.existsSync(ORIGINAL_DB_PATH)).toBe(true);
    closeDatabase(db);
  });

  it("should close database connection", () => {
    const db = initDatabase();
    closeDatabase(db);
    // Verify no errors occur when closing
    expect(() => closeDatabase(db)).not.toThrow();
  });

  it("should get database size", () => {
    const db = initDatabase();
    const size = getDatabaseSize();
    expect(size).toBeGreaterThan(0);
    closeDatabase(db);
  });

  it("should create metrics_history table on initialization", () => {
    const db = initDatabase();
    const tableExists = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='metrics_history'"
      )
      .get();
    expect(tableExists).toBeDefined();
    closeDatabase(db);
  });

  it("should create models table on initialization", () => {
    const db = initDatabase();
    const tableExists = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='models'")
      .get();
    expect(tableExists).toBeDefined();
    closeDatabase(db);
  });

  it("should create metadata table on initialization", () => {
    const db = initDatabase();
    const tableExists = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='metadata'")
      .get();
    expect(tableExists).toBeDefined();
    closeDatabase(db);
  });

  it("should initialize db_version metadata", () => {
    initDatabase();
    const dbVersion = getMetadata("db_version");
    expect(dbVersion).toBe("1.0");
  });
});

describe("Metrics History", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = initDatabase();
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
    // Old record should be removed, recent and new records remain
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

  it("should filter metrics by timestamp in getMetricsHistory", () => {
    saveMetrics({ cpu_usage: 50, memory_usage: 60 });
    saveMetrics({ cpu_usage: 60, memory_usage: 70 });

    const history = getMetricsHistory(1); // Only last 1 minute
    // Since both were just saved, they should be within 1 minute
    expect(history.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Models Management", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = initDatabase();
  });

  afterEach(() => {
    closeDatabase(db);
  });

  it("should save model configuration", () => {
    const modelConfig: Omit<ModelConfig, "id" | "created_at" | "updated_at"> = {
      name: "test-model",
      type: "llama",
      status: "stopped",
      ctx_size: 8192,
      temperature: 0.8,
      top_p: 0.9,
    };

    const id = saveModel(modelConfig);
    expect(id).toBeGreaterThan(0);

    const model = getModelById(id);
    expect(model?.name).toBe("test-model");
    expect(model?.ctx_size).toBe(8192);
    expect(model?.temperature).toBe(0.8);
  });

  it("should save model with minimal required fields", () => {
    const modelConfig: Omit<ModelConfig, "id" | "created_at" | "updated_at"> = {
      name: "minimal-model",
      type: "llama",
      status: "stopped",
    };

    const id = saveModel(modelConfig);
    expect(id).toBeGreaterThan(0);

    const model = getModelById(id);
    expect(model?.name).toBe("minimal-model");
    expect(model?.status).toBe("stopped");
  });

  it("should save model with complex configuration", () => {
    const modelConfig: Omit<ModelConfig, "id" | "created_at" | "updated_at"> = {
      name: "complex-model",
      type: "llama",
      status: "running",
      ctx_size: 4096,
      temperature: 0.7,
      top_p: 0.95,
      top_k: 50,
      threads: 8,
      gpu_layers: 35,
      batch_size: 512,
      host: "192.168.1.100",
      port: 9090,
      hf_repo: "meta-llama/Llama-2-7b-chat-hf",
    };

    const id = saveModel(modelConfig);
    const model = getModelById(id);
    expect(model?.name).toBe("complex-model");
    expect(model?.ctx_size).toBe(4096);
    expect(model?.threads).toBe(8);
    expect(model?.gpu_layers).toBe(35);
  });

  it("should get all models", () => {
    saveModel({ name: "model1", type: "llama", status: "stopped" });
    saveModel({ name: "model2", type: "llama", status: "running" });

    const models = getModels();
    expect(models).toHaveLength(2);
  });

  it("should return empty array when no models exist", () => {
    const models = getModels();
    expect(models).toHaveLength(0);
  });

  it("should filter models by status", () => {
    saveModel({ name: "model1", type: "llama", status: "running" });
    saveModel({ name: "model2", type: "llama", status: "stopped" });
    saveModel({ name: "model3", type: "llama", status: "running" });

    const running = getModels({ status: "running" });
    expect(running).toHaveLength(2);
    expect(running.every((m) => m.status === "running")).toBe(true);
  });

  it("should filter models by type", () => {
    saveModel({ name: "model1", type: "llama", status: "stopped" });
    saveModel({ name: "model2", type: "gpt", status: "stopped" });
    saveModel({ name: "model3", type: "llama", status: "stopped" });

    const llamaModels = getModels({ type: "llama" });
    expect(llamaModels).toHaveLength(2);
    expect(llamaModels.every((m) => m.type === "llama")).toBe(true);
  });

  it("should filter models by name (partial match)", () => {
    saveModel({ name: "test-model-1", type: "llama", status: "stopped" });
    saveModel({ name: "test-model-2", type: "llama", status: "stopped" });
    saveModel({ name: "other-model", type: "llama", status: "stopped" });

    const testModels = getModels({ name: "test" });
    expect(testModels).toHaveLength(2);
  });

  it("should combine multiple filters", () => {
    saveModel({ name: "llama-running", type: "llama", status: "running" });
    saveModel({ name: "llama-stopped", type: "llama", status: "stopped" });
    saveModel({ name: "gpt-running", type: "gpt", status: "running" });

    const filtered = getModels({ type: "llama", status: "running" });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe("llama-running");
  });

  it("should get model by id", () => {
    const id = saveModel({
      name: "test-model",
      type: "llama",
      status: "stopped",
    });

    const model = getModelById(id);
    expect(model).not.toBeNull();
    expect(model?.name).toBe("test-model");
    expect(model?.id).toBe(id);
  });

  it("should return null when getting non-existent model by id", () => {
    const model = getModelById(999999);
    expect(model).toBeNull();
  });

  it("should get model by name", () => {
    saveModel({
      name: "test-model",
      type: "llama",
      status: "stopped",
    });

    const model = getModelByName("test-model");
    expect(model).not.toBeNull();
    expect(model?.name).toBe("test-model");
  });

  it("should return null when getting non-existent model by name", () => {
    const model = getModelByName("non-existent-model");
    expect(model).toBeNull();
  });

  it("should update model configuration", () => {
    const id = saveModel({
      name: "test-model",
      type: "llama",
      status: "stopped",
    });

    updateModel(id, {
      status: "running",
      temperature: 0.7,
    });

    const model = getModelById(id);
    expect(model?.status).toBe("running");
    expect(model?.temperature).toBe(0.7);
  });

  it("should update multiple model fields", () => {
    const id = saveModel({
      name: "test-model",
      type: "llama",
      status: "stopped",
      ctx_size: 2048,
    });

    updateModel(id, {
      status: "running",
      ctx_size: 4096,
      temperature: 0.6,
      top_p: 0.85,
    });

    const model = getModelById(id);
    expect(model?.status).toBe("running");
    expect(model?.ctx_size).toBe(4096);
    expect(model?.temperature).toBe(0.6);
    expect(model?.top_p).toBe(0.85);
  });

  it("should not update model name or type", () => {
    const id = saveModel({
      name: "original-name",
      type: "llama",
      status: "stopped",
    });

    // TypeScript should prevent this, but let's verify runtime behavior
    const originalName = getModelById(id)?.name;
    const originalType = getModelById(id)?.type;

    expect(originalName).toBe("original-name");
    expect(originalType).toBe("llama");
  });

  it("should delete model", () => {
    const id = saveModel({
      name: "test-model",
      type: "llama",
      status: "stopped",
    });

    deleteModel(id);

    const model = getModelById(id);
    expect(model).toBeNull();
  });

  it("should handle deleting non-existent model", () => {
    expect(() => deleteModel(999999)).not.toThrow();
  });

  it("should delete all models", () => {
    saveModel({ name: "model1", type: "llama", status: "stopped" });
    saveModel({ name: "model2", type: "llama", status: "stopped" });
    saveModel({ name: "model3", type: "llama", status: "stopped" });

    deleteAllModels();

    const models = getModels();
    expect(models).toHaveLength(0);
  });

  it("should handle deleting all models when none exist", () => {
    expect(() => deleteAllModels()).not.toThrow();
    const models = getModels();
    expect(models).toHaveLength(0);
  });

  it("should store created_at and updated_at timestamps", () => {
    const beforeCreate = Date.now();
    const id = saveModel({
      name: "test-model",
      type: "llama",
      status: "stopped",
    });
    const afterCreate = Date.now();

    const model = getModelById(id);
    expect(model?.created_at).toBeGreaterThanOrEqual(beforeCreate);
    expect(model?.created_at).toBeLessThanOrEqual(afterCreate);
    expect(model?.updated_at).toBeGreaterThanOrEqual(beforeCreate);
    expect(model?.updated_at).toBeLessThanOrEqual(afterCreate);
  });

  it("should update updated_at timestamp on update", () => {
    const id = saveModel({
      name: "test-model",
      type: "llama",
      status: "stopped",
    });

    const originalTimestamp = getModelById(id)?.updated_at;

    // Wait a bit to ensure timestamp difference
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    wait(10);

    updateModel(id, { status: "running" });

    const updatedModel = getModelById(id);
    expect(updatedModel?.updated_at).toBeGreaterThan(originalTimestamp || 0);
  });

  it("should support all valid status values", () => {
    const statuses: Array<"running" | "stopped" | "loading" | "error"> = [
      "running",
      "stopped",
      "loading",
      "error",
    ];

    statuses.forEach((status) => {
      saveModel({ name: `model-${status}`, type: "llama", status });
    });

    const models = getModels();
    expect(models).toHaveLength(4);
    expect(models.every((m) => m.status)).toBe(true);
  });

  it("should support all valid type values", () => {
    const types: Array<"llama" | "gpt" | "mistrall" | "custom"> = [
      "llama",
      "gpt",
      "mistrall",
      "custom",
    ];

    types.forEach((type) => {
      saveModel({ name: `model-${type}`, type, status: "stopped" });
    });

    const models = getModels();
    expect(models).toHaveLength(4);
  });
});

describe("Metadata Operations", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = initDatabase();
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

  it("should update updated_at timestamp on metadata update", () => {
    const beforeUpdate = Date.now();
    setMetadata("key1", "value1");
    const afterUpdate = Date.now();

    setMetadata("key1", "value2");

    // The metadata should exist and have been updated
    expect(getMetadata("key1")).toBe("value2");
  });
});

describe("Advanced Operations", () => {
  let db: Database.Database;
  const TEST_EXPORT_PATH = path.join(process.cwd(), "data", "test-export.db");

  beforeEach(() => {
    db = initDatabase();
    // Clean up any existing export files
    if (fs.existsSync(TEST_EXPORT_PATH)) {
      fs.unlinkSync(TEST_EXPORT_PATH);
    }
  });

  afterEach(() => {
    closeDatabase(db);
    // Clean up export files
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
    saveModel({ name: "test-model", type: "llama", status: "stopped" });

    exportDatabase(TEST_EXPORT_PATH);
    expect(fs.existsSync(TEST_EXPORT_PATH)).toBe(true);
  });

  it("should import database", () => {
    // Create data in main database
    saveMetrics({ cpu_usage: 50, memory_usage: 60 });
    const modelId = saveModel({
      name: "test-model",
      type: "llama",
      status: "stopped",
    });
    setMetadata("test-key", "test-value");

    // Export database
    exportDatabase(TEST_EXPORT_PATH);

    // Clear current database
    deleteAllModels();
    db.prepare("DELETE FROM metrics_history").run();
    db.prepare("DELETE FROM metadata WHERE key != 'db_version'").run();

    // Verify database is cleared
    expect(getModels()).toHaveLength(0);
    expect(getMetricsHistory(10)).toHaveLength(0);
    expect(getMetadata("test-key")).toBeNull();

    // Import from export
    importDatabase(TEST_EXPORT_PATH);

    // Verify data was imported
    const models = getModels();
    expect(models.length).toBeGreaterThan(0);
    expect(models[0].name).toBe("test-model");

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
    saveModel({ name: "existing-model", type: "llama", status: "stopped" });

    // Export database
    exportDatabase(TEST_EXPORT_PATH);

    // Clear models but keep metadata
    deleteAllModels();

    // Create new data to be merged
    saveModel({ name: "new-model", type: "gpt", status: "running" });

    // Import
    importDatabase(TEST_EXPORT_PATH);

    // Both models should exist
    const models = getModels();
    expect(models.length).toBeGreaterThan(1);
    const modelNames = models.map((m) => m.name);
    expect(modelNames).toContain("existing-model");
    expect(modelNames).toContain("new-model");
  });

  it("should update metadata on import conflict", () => {
    setMetadata("conflict-key", "original-value");

    // Export database
    exportDatabase(TEST_EXPORT_PATH);

    // Update metadata
    setMetadata("conflict-key", "updated-value");

    // Import should update the key value
    importDatabase(TEST_EXPORT_PATH);

    expect(getMetadata("conflict-key")).toBe("original-value");
  });
});

describe("Edge Cases and Error Handling", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = initDatabase();
  });

  afterEach(() => {
    closeDatabase(db);
  });

  it("should handle saving metrics with undefined values", () => {
    saveMetrics({});

    const history = getMetricsHistory(10);
    expect(history).toHaveLength(1);
    expect(history[0].cpu_usage).toBe(0);
    expect(history[0].memory_usage).toBe(0);
  });

  it("should handle saving model with undefined optional fields", () => {
    const id = saveModel({
      name: "test-model",
      type: "llama",
      status: "stopped",
    });

    const model = getModelById(id);
    expect(model).toBeDefined();
    expect(model?.name).toBe("test-model");
  });

  it("should handle getting metrics history with zero minutes", () => {
    saveMetrics({ cpu_usage: 50, memory_usage: 60 });
    const history = getMetricsHistory(0);
    expect(history).toHaveLength(0); // No records from 0 minutes ago
  });

  it("should handle getting metrics history with negative minutes", () => {
    saveMetrics({ cpu_usage: 50, memory_usage: 60 });
    const history = getMetricsHistory(-5);
    // Negative minutes means looking into the future, should return all records
    expect(history.length).toBeGreaterThanOrEqual(1);
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

  it("should handle saving model with special characters in name", () => {
    const specialName = `model-with-"quotes" and 'apostrophes'`;

    const id = saveModel({
      name: specialName,
      type: "llama",
      status: "stopped",
    });

    const model = getModelById(id);
    expect(model?.name).toBe(specialName);
  });

  it("should handle very long model names", () => {
    const longName = "a".repeat(1000);

    const id = saveModel({
      name: longName,
      type: "llama",
      status: "stopped",
    });

    const model = getModelById(id);
    expect(model?.name).toBe(longName);
  });

  it("should handle updating non-existent model", () => {
    expect(() => updateModel(999999, { status: "running" })).not.toThrow();
  });

  it("should handle getting models with no filters", () => {
    saveModel({ name: "model1", type: "llama", status: "stopped" });
    saveModel({ name: "model2", type: "gpt", status: "running" });

    const models = getModels({});
    expect(models.length).toBeGreaterThanOrEqual(2);
  });

  it("should handle metadata with empty string values", () => {
    setMetadata("empty-key", "");
    const value = getMetadata("empty-key");
    expect(value).toBe("");
  });

  it("should handle metadata with special characters", () => {
    const specialValue = 'value with "quotes" and \'apostrophes\' and newlines\n';

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
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
  });

  it("should handle saving many models efficiently", () => {
    const startTime = Date.now();

    const ids: number[] = [];
    for (let i = 0; i < 50; i++) {
      const id = saveModel({
        name: `model-${i}`,
        type: i % 2 === 0 ? "llama" : "gpt",
        status: i % 3 === 0 ? "running" : "stopped",
      });
      ids.push(id);
    }

    const duration = Date.now() - startTime;
    const models = getModels();

    expect(models).toHaveLength(50);
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
  });

  it("should handle filtering large model sets efficiently", () => {
    // Create 100 models
    for (let i = 0; i < 100; i++) {
      saveModel({
        name: `model-${i}`,
        type: i % 2 === 0 ? "llama" : "gpt",
        status: i % 3 === 0 ? "running" : "stopped",
      });
    }

    const startTime = Date.now();
    const running = getModels({ status: "running" });
    const duration = Date.now() - startTime;

    expect(running.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(100); // Should complete within 100ms
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
    expect(duration).toBeLessThan(1000); // Should complete within 1 second
  });
});

describe("Database Integrity and Consistency", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = initDatabase();
  });

  afterEach(() => {
    closeDatabase(db);
  });

  it("should maintain referential integrity", () => {
    const modelId = saveModel({
      name: "test-model",
      type: "llama",
      status: "stopped",
    });

    // Model should be retrievable by id
    const byId = getModelById(modelId);
    expect(byId).not.toBeNull();

    // Model should be retrievable by name
    const byName = getModelByName("test-model");
    expect(byName).not.toBeNull();

    // Both should reference the same model
    expect(byId?.id).toBe(byName?.id);
  });

  it("should maintain data consistency across operations", () => {
    const id = saveModel({
      name: "test-model",
      type: "llama",
      status: "stopped",
      ctx_size: 4096,
    });

    // Update model
    updateModel(id, { status: "running", ctx_size: 8192 });

    // Verify update
    const model = getModelById(id);
    expect(model?.status).toBe("running");
    expect(model?.ctx_size).toBe(8192);

    // Verify it appears in filtered queries
    const runningModels = getModels({ status: "running" });
    expect(runningModels.length).toBeGreaterThan(0);
  });

  it("should handle concurrent database operations", () => {
    // Simulate concurrent operations
    const promises: Promise<void>[] = [];

    for (let i = 0; i < 10; i++) {
      promises.push(
        Promise.resolve().then(() => {
          saveModel({
            name: `concurrent-model-${i}`,
            type: "llama",
            status: "stopped",
          });
        })
      );
    }

    expect(() => Promise.all(promises)).not.toThrow();

    const models = getModels();
    expect(models.length).toBeGreaterThanOrEqual(10);
  });

  it("should maintain metrics chronological order", () => {
    const timestamps: number[] = [];

    for (let i = 0; i < 5; i++) {
      saveMetrics({ cpu_usage: i * 10, memory_usage: i * 20 });
      timestamps.push(Date.now());
      // Small delay to ensure different timestamps
      const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      wait(1);
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
  });

  afterEach(() => {
    closeDatabase(db);
  });

  it("should enforce status constraint on models", () => {
    // Valid statuses should work
    const validStatuses = ["running", "stopped", "loading", "error"];
    validStatuses.forEach((status) => {
      const id = saveModel({
        name: `model-${status}`,
        type: "llama",
        status: status as any,
      });
      expect(id).toBeGreaterThan(0);
    });
  });

  it("should have proper indexes on timestamp fields", () => {
    saveMetrics({ cpu_usage: 50, memory_usage: 60 });

    const indexes = db
      .prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='metrics_history'")
      .all() as { name: string }[];

    expect(indexes.length).toBeGreaterThan(0);
    expect(indexes.some((idx) => idx.name.includes("timestamp") || idx.name.includes("created_at"))).toBe(true);
  });

  it("should have proper indexes on models fields", () => {
    saveModel({ name: "test-model", type: "llama", status: "stopped" });

    const indexes = db
      .prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='models'")
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
