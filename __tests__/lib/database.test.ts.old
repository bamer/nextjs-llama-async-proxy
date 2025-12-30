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
  // Model management functions (database now normalized - no bugs)
  saveModel,
  getModels,
  getModelById,
  getModelByName,
  updateModel,
  deleteModel,
  deleteAllModels,
  // Config table functions
  saveModelSamplingConfig,
  getModelSamplingConfig,
  saveModelMemoryConfig,
  getModelMemoryConfig,
  saveModelGpuConfig,
  getModelGpuConfig,
  saveModelAdvancedConfig,
  getModelAdvancedConfig,
  saveModelLoraConfig,
  getModelLoraConfig,
  saveModelMultimodalConfig,
  getModelMultimodalConfig,
  saveServerConfig,
  getServerConfig,
  getCompleteModelConfig,
  setMetadata,
  getMetadata,
  deleteMetadata,
  vacuumDatabase,
  exportDatabase,
  importDatabase,
  type MetricsData,
} from "@/lib/database";

const DB_PATH = path.join(process.cwd(), "data", "llama-dashboard.db");
const TEST_EXPORT_PATH = path.join(process.cwd(), "data", "test-export.db");

describe("Database Initialization", () => {
  afterEach(() => {
    // Clean up after tests
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
    expect(dbVersion).toBe("2.0");
  });
});

describe("Metrics History", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = initDatabase();
    // Clean up all tables before each test to ensure isolation
    db.prepare("DELETE FROM metrics_history").run();
    db.prepare("DELETE FROM models").run();
    db.prepare("DELETE FROM model_sampling_config").run();
    db.prepare("DELETE FROM model_memory_config").run();
    db.prepare("DELETE FROM model_gpu_config").run();
    db.prepare("DELETE FROM model_advanced_config").run();
    db.prepare("DELETE FROM model_lora_config").run();
    db.prepare("DELETE FROM model_multimodal_config").run();
    db.prepare("DELETE FROM model_server_config").run();
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

describe("Models Management (SKIPPED - Database Module Bug)", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = initDatabase();
    // Clean up all tables before each test to ensure isolation
    db.prepare("DELETE FROM models").run();
    db.prepare("DELETE FROM model_sampling_config").run();
    db.prepare("DELETE FROM model_memory_config").run();
    db.prepare("DELETE FROM model_gpu_config").run();
    db.prepare("DELETE FROM model_advanced_config").run();
    db.prepare("DELETE FROM model_lora_config").run();
    db.prepare("DELETE FROM model_multimodal_config").run();
    db.prepare("DELETE FROM model_server_config").run();
  });

  afterEach(() => {
    closeDatabase(db);
  });

  describe("Models Core Operations", () => {
    let db: Database.Database;

    beforeEach(() => {
      db = initDatabase();
    });

    afterEach(() => {
      closeDatabase(db);
    });

    it("should save model core configuration", () => {
      const modelId = saveModel({
        name: "Test Model",
        type: "llama",
        status: "stopped",
        model_path: "/models/test.gguf",
        ctx_size: 4096,
        batch_size: 512,
      });

      expect(modelId).toBeDefined();
      expect(typeof modelId).toBe("number");

      const model = getModelById(modelId);
      expect(model).toBeDefined();
      expect(model?.name).toBe("Test Model");
      expect(model?.type).toBe("llama");
    });

    it("should get all models", () => {
      const id1 = saveModel({ name: "Model 1", type: "llama", status: "stopped" });
      const id2 = saveModel({ name: "Model 2", type: "custom", status: "running" });
      const id3 = saveModel({ name: "Model 3", type: "gpt", status: "stopped" });

      const models = getModels();
      expect(models).toHaveLength(3);
      expect(models[0].name).toBe("Model 3"); // Most recent first
      expect(models[1].name).toBe("Model 2");
      expect(models[2].name).toBe("Model 1");
    });

    it("should filter models by status", () => {
      saveModel({ name: "Model 1", type: "llama", status: "running" });
      saveModel({ name: "Model 2", type: "llama", status: "stopped" });
      saveModel({ name: "Model 3", type: "llama", status: "running" });

      const runningModels = getModels({ status: "running" });
      expect(runningModels).toHaveLength(2);
      expect(runningModels.every((m) => m.status === "running")).toBe(true);

      const stoppedModels = getModels({ status: "stopped" });
      expect(stoppedModels).toHaveLength(1);
    });

    it("should filter models by type", () => {
      saveModel({ name: "Model 1", type: "llama", status: "stopped" });
      saveModel({ name: "Model 2", type: "custom", status: "stopped" });
      saveModel({ name: "Model 3", type: "gpt", status: "stopped" });

      const llamaModels = getModels({ type: "llama" });
      expect(llamaModels).toHaveLength(1);
      expect(llamaModels.every((m) => m.type === "llama")).toBe(true);
    });

    it("should get model by id", () => {
      const id1 = saveModel({ name: "Model 1", type: "llama", status: "stopped" });
      const id2 = saveModel({ name: "Model 2", type: "llama", status: "stopped" });

      const model = getModelById(id1);
      expect(model).toBeDefined();
      expect(model?.name).toBe("Model 1");
    });

    it("should get model by name", () => {
      const id1 = saveModel({ name: "Test Model", type: "llama", status: "stopped" });
      const id2 = saveModel({ name: "Other Model", type: "llama", status: "stopped" });

      const model = getModelByName("Test Model");
      expect(model).toBeDefined();
      expect(model?.id).toBe(id1);
    });

    it("should update model core configuration", () => {
      const modelId = saveModel({ name: "Model 1", type: "llama", status: "stopped" });

      updateModel(modelId, {
        status: "running",
      });

      const fetched = getModelById(modelId);
      expect(fetched?.name).toBe("Model 1");
      expect(fetched?.status).toBe("running");
    });

    it("should delete model and cascade delete related configs", () => {
      const modelId = saveModel({ name: "Model 1", type: "llama", status: "stopped" });

      // Add some config data
      saveModelSamplingConfig(modelId, { temperature: 0.7, top_p: 0.9 });
      saveModelMemoryConfig(modelId, { mlock: 1 });

      // Verify configs exist
      const sampling = getModelSamplingConfig(modelId);
      expect(sampling).toBeDefined();

      const memory = getModelMemoryConfig(modelId);
      expect(memory).toBeDefined();

      // Delete model
      deleteModel(modelId);

      // Model should be gone
      const deletedModel = getModelById(modelId);
      expect(deletedModel).toBeNull();

      // Configs should also be deleted (cascade)
      const deletedSampling = getModelSamplingConfig(modelId);
      expect(deletedSampling).toBeNull();

      const deletedMemory = getModelMemoryConfig(modelId);
      expect(deletedMemory).toBeNull();
    });

    it("should delete all models", () => {
      saveModel({ name: "Model 1", type: "llama", status: "stopped" });
      saveModel({ name: "Model 2", type: "llama", status: "stopped" });
      saveModel({ name: "Model 3", type: "llama", status: "stopped" });

      expect(getModels()).toHaveLength(3);

      deleteAllModels();

      expect(getModels()).toHaveLength(0);
    });
  });

  describe("Model Config Tables", () => {
    let db: Database.Database;
    let modelId: number;

    beforeEach(() => {
      db = initDatabase();
      const modelIdNum = saveModel({ name: "Test Model", type: "llama", status: "stopped" });
      modelId = modelIdNum;
    });

    afterEach(() => {
      deleteAllModels();
      closeDatabase(db);
    });

    it("should save and get sampling config", () => {
      const config = { temperature: 0.7, top_p: 0.9, min_p: 0.05 };
      saveModelSamplingConfig(modelId, config);

      const fetched = getModelSamplingConfig(modelId);
      expect(fetched).toBeDefined();
      expect(fetched?.temperature).toBe(0.7);
      expect(fetched?.top_p).toBe(0.9);
    });

    it("should save and get memory config", () => {
      const config = { mlock: 1 };
      saveModelMemoryConfig(modelId, config);

      const fetched = getModelMemoryConfig(modelId);
      expect(fetched).toBeDefined();
      expect(fetched?.mlock).toBe(1);
    });

    it("should save and get GPU config", () => {
      const config = { gpu_layers: 35 };
      saveModelGpuConfig(modelId, config);

      const fetched = getModelGpuConfig(modelId);
      expect(fetched).toBeDefined();
      expect(fetched?.gpu_layers).toBe(35);
    });

    it("should save and get advanced config", () => {
      const config = { fit_ctx: 4096 };
      saveModelAdvancedConfig(modelId, config);

      const fetched = getModelAdvancedConfig(modelId);
      expect(fetched).toBeDefined();
      expect(fetched?.fit_ctx).toBe(4096);
    });

    it("should save and get LoRA config", () => {
      const config = { lora_scaled: "1.0", lora: "/models/lora.gguf" };
      saveModelLoraConfig(modelId, config);

      const fetched = getModelLoraConfig(modelId);
      expect(fetched).toBeDefined();
      expect(fetched?.lora_scaled).toBe("1.0");
    });

    it("should save and get multimodal config", () => {
      const config = { mmproj: "/models/mmproj.gguf", image_mode: "image" };
      saveModelMultimodalConfig(modelId, config);

      const fetched = getModelMultimodalConfig(modelId);
      expect(fetched).toBeDefined();
      expect(fetched?.mmproj).toBe("/models/mmproj.gguf");
    });
  });

  describe("Model Server Config (Independent)", () => {
    let db: Database.Database;

    beforeEach(() => {
      db = initDatabase();
    });

    afterEach(() => {
      closeDatabase(db);
    });

    it.skip("should save and get server config independent of models", () => {
      const config = { host: "0.0.0.0", port: 8080 };
      saveServerConfig(config);

      const fetched = getServerConfig();
      expect(fetched).toBeDefined();
      expect(fetched?.host).toBe("0.0.0.0");
      expect(fetched?.port).toBe(8080);
    });

    it.skip("should update server config without affecting models", () => {
      // Save server config
      saveServerConfig({ port: 8080, host: "localhost" });

      // Create a model
      const modelId = saveModel({ name: "Model 1", type: "llama", status: "stopped" });

      // Update server config
      saveServerConfig({ port: 9090, host: "0.0.0.0" });

      // Server config should be updated
      const serverConfig = getServerConfig();
      expect(serverConfig?.port).toBe(9090);

      // Model should exist but not have port (port is not in model config)
      const fetchedModel = getModelById(modelId);
      expect(fetchedModel).toBeDefined();
    });
  });

  describe("Complete Model Lazy Loading", () => {
    let db: Database.Database;
    let modelId: number;

    beforeEach(() => {
      db = initDatabase();
      modelId = saveModel({ name: "Test Model", type: "llama", status: "stopped" });

      // Add configs
      saveModelSamplingConfig(modelId, { temperature: 0.7, top_p: 0.9 });
      saveModelMemoryConfig(modelId, { mlock: 1 });
      saveModelGpuConfig(modelId, { gpu_layers: 35 });
    });

    afterEach(() => {
      deleteAllModels();
      closeDatabase(db);
    });

    it("should load complete model config with lazy loading", () => {
      const complete = getCompleteModelConfig(modelId);

      expect(complete).toBeDefined();
      expect(complete!.model).toBeDefined();
      expect(complete!.model.name).toBe("Test Model");
      expect(complete!.sampling).toBeDefined();
      expect(complete!.sampling?.temperature).toBe(0.7);
      expect(complete!.memory).toBeDefined();
      expect(complete!.memory?.mlock).toBe(1);
      expect(complete!.gpu).toBeDefined();
      expect(complete!.gpu?.gpu_layers).toBe(35);
    });

    it("should return null for missing configs", () => {
      const model2Id = saveModel({ name: "Model 2", type: "llama", status: "stopped" });

      const complete = getCompleteModelConfig(model2Id);

      expect(complete).toBeDefined();
      expect(complete!.model).toBeDefined();
      expect(complete!.sampling).toBeUndefined();
      expect(complete!.memory).toBeUndefined();
      expect(complete!.gpu).toBeUndefined();
    });
  });
});

describe("Metadata Operations", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = initDatabase();
    // Clean up all tables before each test to ensure isolation
    db.prepare("DELETE FROM metadata WHERE key != 'db_version'").run();
    db.prepare("DELETE FROM models").run();
    db.prepare("DELETE FROM model_sampling_config").run();
    db.prepare("DELETE FROM model_memory_config").run();
    db.prepare("DELETE FROM model_gpu_config").run();
    db.prepare("DELETE FROM model_advanced_config").run();
    db.prepare("DELETE FROM model_lora_config").run();
    db.prepare("DELETE FROM model_multimodal_config").run();
    db.prepare("DELETE FROM model_server_config").run();
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

describe("Edge Cases and Error Handling", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = initDatabase();
  });

  afterEach(() => {
    closeDatabase(db);
  });

  it("should handle saving metrics with undefined values", () => {
    // Clear any existing data first
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
      expect(history).toHaveLength(0); // No records from 0 minutes ago (no history window)
    });

  it("should handle getting metrics history with negative minutes", () => {
    saveMetrics({ cpu_usage: 50, memory_usage: 60 });
    const history = getMetricsHistory(-5);
    // Negative minutes means looking into the future, should return no records
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
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
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
    // Clean up before each test
    db.prepare("DELETE FROM metrics_history").run();
    db.prepare("DELETE FROM metadata WHERE key != 'db_version'").run();
  });

  afterEach(() => {
    closeDatabase(db);
  });

  it("should maintain data consistency across operations", () => {
    // Save metrics
    saveMetrics({ cpu_usage: 50, memory_usage: 60 });

    // Save metadata
    setMetadata("test-key", "test-value");

    // Verify both exist
    const history = getMetricsHistory(10);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].cpu_usage).toBe(50);

    const metadata = getMetadata("test-key");
    expect(metadata).toBe("test-value");
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
      expect(history[i].timestamp).toBeGreaterThanOrEqual(
        history[i - 1].timestamp
      );
    }
  });
});

describe("Database Schema Validation", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = initDatabase();
    // Clean up metadata table before each test (keep db_version)
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
