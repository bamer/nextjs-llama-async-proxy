import fs from "fs";
import path from "path";
import {
  initDatabase,
  closeDatabase,
  saveModel,
  deleteModel,
  deleteAllModels,
  saveModelSamplingConfig,
  getModelSamplingConfig,
  updateModelSamplingConfig,
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
  type ModelConfig,
  type ModelSamplingConfig,
  type ModelMemoryConfig,
  type ModelGpuConfig,
  type ModelAdvancedConfig,
  type ModelLoraConfig,
  type ModelMultimodalConfig,
} from "../../src/lib/database";

const TEST_DB_PATH = path.join(process.cwd(), "data", "llama-dashboard.db");

function cleanupTestDatabase(): void {
  if (fs.existsSync(TEST_DB_PATH)) {
    try {
      fs.unlinkSync(TEST_DB_PATH);
    } catch (error) {
      // Ignore errors if database is locked
    }
  }

  const walPath = `${TEST_DB_PATH}-wal`;
  const shmPath = `${TEST_DB_PATH}-shm`;

  if (fs.existsSync(walPath)) {
    try {
      fs.unlinkSync(walPath);
    } catch (error) {
      // Ignore errors
    }
  }

  if (fs.existsSync(shmPath)) {
    try {
      fs.unlinkSync(shmPath);
    } catch (error) {
      // Ignore errors
    }
  }
}

function ensureDataDirectory(): void {
  const dataDir = path.dirname(TEST_DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

describe("Normalized Database - Sampling Config", () => {
  let modelId: number;

  beforeEach(() => {
    cleanupTestDatabase();
    ensureDataDirectory();
    const modelData: Omit<ModelConfig, "id" | "created_at" | "updated_at"> = {
      name: "Llama-3-8B",
      type: "llama",
      status: "stopped",
    };
    modelId = saveModel(modelData);
  });

  afterEach(() => {
    cleanupTestDatabase();
  });

  it("should save sampling configuration", () => {
    const samplingConfig: Omit<ModelSamplingConfig, "id" | "model_id" | "created_at" | "updated_at"> = {
      temperature: 0.7,
      top_k: 50,
      top_p: 0.95,
    };

    const configId = saveModelSamplingConfig(modelId, samplingConfig);

    expect(configId).toBeDefined();
    expect(configId).toBeGreaterThan(0);
  });

  it("should get sampling configuration", () => {
    const samplingConfig: Omit<ModelSamplingConfig, "id" | "model_id" | "created_at" | "updated_at"> = {
      temperature: 0.7,
      top_k: 50,
      top_p: 0.95,
    };

    saveModelSamplingConfig(modelId, samplingConfig);
    const retrievedConfig = getModelSamplingConfig(modelId);

    expect(retrievedConfig).not.toBeNull();
    expect(retrievedConfig?.temperature).toBe(0.7);
    expect(retrievedConfig?.top_k).toBe(50);
    expect(retrievedConfig?.top_p).toBe(0.95);
  });

  it("should update sampling configuration", () => {
    saveModelSamplingConfig(modelId, { temperature: 0.7 });
    updateModelSamplingConfig(modelId, { temperature: 0.9, top_k: 100 });

    const updatedConfig = getModelSamplingConfig(modelId);

    expect(updatedConfig?.temperature).toBe(0.9);
    expect(updatedConfig?.top_k).toBe(100);
  });

  it("should cascade delete sampling config on model delete", () => {
    saveModelSamplingConfig(modelId, { temperature: 0.7 });

    let config = getModelSamplingConfig(modelId);
    expect(config).not.toBeNull();

    deleteModel(modelId);

    config = getModelSamplingConfig(modelId);
    expect(config).toBeNull();
  });

  it("should return null for non-existent sampling config", () => {
    const config = getModelSamplingConfig(99999);
    expect(config).toBeNull();
  });
});

describe("Normalized Database - Memory Config", () => {
  let modelId: number;

  beforeEach(() => {
    cleanupTestDatabase();
    ensureDataDirectory();
    const modelData: Omit<ModelConfig, "id" | "created_at" | "updated_at"> = {
      name: "Llama-3-8B",
      type: "llama",
      status: "stopped",
    };
    modelId = saveModel(modelData);
  });

  afterEach(() => {
    cleanupTestDatabase();
  });

  it("should save memory configuration", () => {
    const config: Omit<ModelMemoryConfig, "id" | "model_id" | "created_at" | "updated_at"> = {
      cache_ram: 8192,
      cache_type_k: "f16",
      mmap: 1,
    };

    const configId = saveModelMemoryConfig(modelId, config);

    expect(configId).toBeDefined();
    expect(configId).toBeGreaterThan(0);
  });

  it("should get memory configuration", () => {
    saveModelMemoryConfig(modelId, { cache_ram: 8192, mmap: 1 });
    const retrieved = getModelMemoryConfig(modelId);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.cache_ram).toBe(8192);
    expect(retrieved?.mmap).toBe(1);
  });

  it("should cascade delete memory config on model delete", () => {
    saveModelMemoryConfig(modelId, { cache_ram: 8192 });

    let config = getModelMemoryConfig(modelId);
    expect(config).not.toBeNull();

    deleteModel(modelId);

    config = getModelMemoryConfig(modelId);
    expect(config).toBeNull();
  });
});

describe("Normalized Database - GPU Config", () => {
  let modelId: number;

  beforeEach(() => {
    cleanupTestDatabase();
    ensureDataDirectory();
    const modelData: Omit<ModelConfig, "id" | "created_at" | "updated_at"> = {
      name: "Llama-3-8B",
      type: "llama",
      status: "stopped",
    };
    modelId = saveModel(modelData);
  });

  afterEach(() => {
    cleanupTestDatabase();
  });

  it("should save GPU configuration", () => {
    const config: Omit<ModelGpuConfig, "id" | "model_id" | "created_at" | "updated_at"> = {
      device: "cuda:0",
      gpu_layers: 35,
      split_mode: "layer",
    };

    const configId = saveModelGpuConfig(modelId, config);

    expect(configId).toBeDefined();
    expect(configId).toBeGreaterThan(0);
  });

  it("should get GPU configuration", () => {
    saveModelGpuConfig(modelId, { device: "cuda:0", gpu_layers: 35 });
    const retrieved = getModelGpuConfig(modelId);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.device).toBe("cuda:0");
    expect(retrieved?.gpu_layers).toBe(35);
  });

  it("should cascade delete GPU config on model delete", () => {
    saveModelGpuConfig(modelId, { gpu_layers: 35 });

    let config = getModelGpuConfig(modelId);
    expect(config).not.toBeNull();

    deleteModel(modelId);

    config = getModelGpuConfig(modelId);
    expect(config).toBeNull();
  });
});
