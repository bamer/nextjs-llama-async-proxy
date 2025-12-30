import fs from "fs";
import path from "path";
import {
  initDatabase,
  closeDatabase,
  saveModel,
  getModels,
  getModelById,
  deleteModel,
  deleteAllModels,
  saveModelSamplingConfig,
  getModelSamplingConfig,
  saveModelMemoryConfig,
  getModelMemoryConfig,
  saveModelGpuConfig,
  getModelGpuConfig,
  saveServerConfig,
  getServerConfig,
  getCompleteModelConfig,
  saveModelLoraConfig,
  getModelLoraConfig,
  saveModelMultimodalConfig,
  getModelMultimodalConfig,
  getModelAdvancedConfig,
  type ModelConfig,
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

describe("Normalized Database - Cascade Delete Behavior", () => {
  let modelId1: number;
  let modelId2: number;

  beforeEach(() => {
    cleanupTestDatabase();
    ensureDataDirectory();
    const modelData1: Omit<ModelConfig, "id" | "created_at" | "updated_at"> = {
      name: "Llama-3-8B",
      type: "llama",
      status: "stopped",
    };
    const modelData2: Omit<ModelConfig, "id" | "created_at" | "updated_at"> = {
      name: "Mistral-7B",
      type: "mistrall",
      status: "stopped",
    };
    modelId1 = saveModel(modelData1);
    modelId2 = saveModel(modelData2);

    saveModelSamplingConfig(modelId1, { temperature: 0.7 });
    saveModelSamplingConfig(modelId2, { temperature: 0.9 });
    saveModelMemoryConfig(modelId1, { cache_ram: 8192 });
    saveModelMemoryConfig(modelId2, { cache_ram: 16384 });
    saveServerConfig({ host: "127.0.0.1", port: 8080 });
  });

  afterEach(() => {
    cleanupTestDatabase();
  });

  it("should cascade delete all configs EXCEPT server config", () => {
    expect(getModelSamplingConfig(modelId1)).not.toBeNull();
    expect(getModelMemoryConfig(modelId1)).not.toBeNull();
    expect(getServerConfig()).not.toBeNull();

    deleteModel(modelId1);

    expect(getModelById(modelId1)).toBeNull();
    expect(getModelSamplingConfig(modelId1)).toBeNull();
    expect(getModelMemoryConfig(modelId1)).toBeNull();

    const serverConfig = getServerConfig();
    expect(serverConfig).not.toBeNull();
    expect(serverConfig?.host).toBe("127.0.0.1");
  });

  it("should cascade delete configs for multiple models independently", () => {
    deleteModel(modelId1);

    expect(getModelById(modelId1)).toBeNull();
    expect(getModelSamplingConfig(modelId1)).toBeNull();
    expect(getModelMemoryConfig(modelId1)).toBeNull();

    expect(getModelById(modelId2)).not.toBeNull();
    expect(getModelSamplingConfig(modelId2)).not.toBeNull();
    expect(getModelMemoryConfig(modelId2)).not.toBeNull();
  });

  it("should handle deleting all models", () => {
    expect(getModels()).toHaveLength(2);
    expect(getServerConfig()).not.toBeNull();

    deleteAllModels();

    expect(getModels()).toHaveLength(0);

    expect(getModelSamplingConfig(modelId1)).toBeNull();
    expect(getModelSamplingConfig(modelId2)).toBeNull();

    expect(getServerConfig()).not.toBeNull();
  });
});

describe("Normalized Database - Full Model Save with Multiple Configs", () => {
  beforeEach(() => {
    cleanupTestDatabase();
    ensureDataDirectory();
  });

  afterEach(() => {
    cleanupTestDatabase();
  });

  it("should save model with all configurations", () => {
    const modelData: Omit<ModelConfig, "id" | "created_at" | "updated_at"> = {
      name: "Llama-3-8B",
      type: "llama",
      status: "stopped",
    };

    const modelId = saveModel(modelData);

    saveModelSamplingConfig(modelId, { temperature: 0.7, top_k: 50 });
    saveModelMemoryConfig(modelId, { cache_ram: 8192, mmap: 1 });
    saveModelGpuConfig(modelId, { device: "cuda:0", gpu_layers: 35 });

    const completeConfig = getCompleteModelConfig(modelId);

    expect(completeConfig).not.toBeNull();
    expect(completeConfig?.sampling?.temperature).toBe(0.7);
    expect(completeConfig?.memory?.cache_ram).toBe(8192);
    expect(completeConfig?.gpu?.device).toBe("cuda:0");
  });

  it("should allow partial config saves (lazy loading)", () => {
    const modelData: Omit<ModelConfig, "id" | "created_at" | "updated_at"> = {
      name: "Llama-3-8B",
      type: "llama",
      status: "stopped",
    };

    const modelId = saveModel(modelData);

    saveModelSamplingConfig(modelId, { temperature: 0.7 });
    saveModelMemoryConfig(modelId, { cache_ram: 8192 });

    expect(getModelSamplingConfig(modelId)).not.toBeNull();
    expect(getModelMemoryConfig(modelId)).not.toBeNull();
    expect(getModelGpuConfig(modelId)).toBeNull();
  });

  it("should maintain consistency across all config tables", () => {
    const modelData: Omit<ModelConfig, "id" | "created_at" | "updated_at"> = {
      name: "Llama-3-8B",
      type: "llama",
      status: "stopped",
    };

    const modelId = saveModel(modelData);

    saveModelSamplingConfig(modelId, { temperature: 0.7 });
    saveModelMemoryConfig(modelId, { cache_ram: 8192 });
    saveModelGpuConfig(modelId, { gpu_layers: 35 });

    const sampling = getModelSamplingConfig(modelId);
    const memory = getModelMemoryConfig(modelId);
    const gpu = getModelGpuConfig(modelId);

    expect(sampling?.model_id).toBe(modelId);
    expect(memory?.model_id).toBe(modelId);
    expect(gpu?.model_id).toBe(modelId);
  });
});

describe("Normalized Database - Edge Cases", () => {
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

  it("should handle unlimited cache_ram (-1)", () => {
    saveModelMemoryConfig(modelId, { cache_ram: -1 });
    const retrieved = getModelMemoryConfig(modelId);

    expect(retrieved?.cache_ram).toBe(-1);
  });

  it("should handle auto GPU layers (-1)", () => {
    saveModelGpuConfig(modelId, { gpu_layers: -1 });
    const retrieved = getModelGpuConfig(modelId);

    expect(retrieved?.gpu_layers).toBe(-1);
  });

  it("should return null for non-existent advanced config", () => {
    const config = require("../../src/lib/database").getModelAdvancedConfig(99999);
    expect(config).toBeNull();
  });

  it("should return null for non-existent LoRA config", () => {
    const config = getModelLoraConfig(99999);
    expect(config).toBeNull();
  });

  it("should return null for non-existent multimodal config", () => {
    const config = getModelMultimodalConfig(99999);
    expect(config).toBeNull();
  });
});
