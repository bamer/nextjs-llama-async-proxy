import fs from "fs";
import path from "path";
import {
  initDatabase,
  closeDatabase,
  saveModel,
  saveModelSamplingConfig,
  saveModelMemoryConfig,
  saveModelGpuConfig,
  saveModelAdvancedConfig,
  saveModelLoraConfig,
  saveModelMultimodalConfig,
  saveServerConfig,
  getModelMemoryConfig,
  getModelGpuConfig,
  getModelAdvancedConfig,
  getModelLoraConfig,
  getModelMultimodalConfig,
  getServerConfig,
  updateModel,
  updateModelSamplingConfig,
  deleteModel,
  type ModelConfig,
  type ModelMemoryConfig,
  type ModelGpuConfig,
  type ModelAdvancedConfig,
  type ModelLoraConfig,
  type ModelMultimodalConfig,
  type ModelServerConfig,
} from "@/lib/database";

const TEST_DB_PATH = path.join(process.cwd(), "data", "test-missing-coverage.db");

function cleanupTestDatabase(): void {
  if (fs.existsSync(TEST_DB_PATH)) {
    try {
      fs.unlinkSync(TEST_DB_PATH);
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

describe("Database Missing Coverage - Memory Config", () => {
  let modelId: number;

  beforeEach(() => {
    cleanupTestDatabase();
    ensureDataDirectory();
    const db = initDatabase();
    const modelData: Omit<ModelConfig, "id" | "created_at" | "updated_at"> = {
      name: "TestModel",
      type: "llama",
      status: "stopped",
    };
    modelId = saveModel(modelData);
    closeDatabase(db);
  });

  afterEach(() => {
    cleanupTestDatabase();
  });

  it("should save memory config with all fields", () => {
    const configId = saveModelMemoryConfig(modelId, {
      cache_ram: 8192,
      cache_type_k: "q8_0",
      cache_type_v: "q8_0",
      mmap: 1,
      mlock: 1,
      numa: "distribute",
      defrag_thold: 100,
    });

    expect(configId).toBeGreaterThan(0);
    const config = getModelMemoryConfig(modelId);
    expect(config).not.toBeNull();
    expect(config?.cache_ram).toBe(8192);
    expect(config?.cache_type_k).toBe("q8_0");
    expect(config?.mmap).toBe(1);
  });

  it("should save memory config with default values", () => {
    const configId = saveModelMemoryConfig(modelId, {});

    expect(configId).toBeGreaterThan(0);
    const config = getModelMemoryConfig(modelId);
    expect(config?.cache_ram).toBe(-1);
    expect(config?.mmap).toBe(0);
  });

  it("should return null for non-existent memory config", () => {
    const config = getModelMemoryConfig(99999);
    expect(config).toBeNull();
  });

  it("should handle partial memory config updates", () => {
    saveModelMemoryConfig(modelId, {
      cache_ram: 4096,
      mmap: 1,
    });

    const config = getModelMemoryConfig(modelId);
    expect(config?.cache_ram).toBe(4096);
    expect(config?.mmap).toBe(1);
    expect(config?.cache_type_k).toBeNull();
  });
});

describe("Database Missing Coverage - GPU Config", () => {
  let modelId: number;

  beforeEach(() => {
    cleanupTestDatabase();
    ensureDataDirectory();
    const db = initDatabase();
    const modelData: Omit<ModelConfig, "id" | "created_at" | "updated_at"> = {
      name: "TestModel",
      type: "llama",
      status: "stopped",
    };
    modelId = saveModel(modelData);
    closeDatabase(db);
  });

  afterEach(() => {
    cleanupTestDatabase();
  });

  it("should save GPU config with all fields", () => {
    const configId = saveModelGpuConfig(modelId, {
      device: "cuda:0",
      list_devices: 1,
      gpu_layers: 35,
      split_mode: "row",
      tensor_split: "0.5,0.5",
      main_gpu: 0,
      kv_offload: 1,
      repack: 0,
      no_host: 0,
    });

    expect(configId).toBeGreaterThan(0);
    const config = getModelGpuConfig(modelId);
    expect(config).not.toBeNull();
    expect(config?.device).toBe("cuda:0");
    expect(config?.gpu_layers).toBe(35);
    expect(config?.split_mode).toBe("row");
  });

  it("should save GPU config with defaults", () => {
    const configId = saveModelGpuConfig(modelId, {});

    expect(configId).toBeGreaterThan(0);
    const config = getModelGpuConfig(modelId);
    expect(config?.gpu_layers).toBe(-1);
    expect(config?.kv_offload).toBe(0);
  });

  it("should return null for non-existent GPU config", () => {
    const config = getModelGpuConfig(99999);
    expect(config).toBeNull();
  });

  it("should handle GPU config with null device", () => {
    saveModelGpuConfig(modelId, {
      gpu_layers: 20,
    });

    const config = getModelGpuConfig(modelId);
    expect(config?.gpu_layers).toBe(20);
    expect(config?.device).toBeNull();
  });
});

describe("Database Missing Coverage - Advanced Config", () => {
  let modelId: number;

  beforeEach(() => {
    cleanupTestDatabase();
    ensureDataDirectory();
    const db = initDatabase();
    const modelData: Omit<ModelConfig, "id" | "created_at" | "updated_at"> = {
      name: "TestModel",
      type: "llama",
      status: "stopped",
    };
    modelId = saveModel(modelData);
    closeDatabase(db);
  });

  afterEach(() => {
    cleanupTestDatabase();
  });

  it("should save advanced config with all fields", () => {
    const configId = saveModelAdvancedConfig(modelId, {
      swa_full: 1,
      override_tensor: "q8_0",
      cpu_moe: 1,
      n_cpu_moe: 4,
      kv_unified: 1,
      pooling: "mean",
      context_shift: 1,
      rpc: "http://localhost:8000",
      offline: 0,
      override_kv: "some_kv",
      op_offload: 1,
      fit: "auto",
      fit_target: 2048,
      fit_ctx: 8192,
      check_tensors: 1,
      sleep_idle_seconds: 60,
      polling: "interval",
      polling_batch: "auto",
      reasoning_format: "thinking",
      reasoning_budget: 1000,
      custom_params: '{"key":"value"}',
    });

    expect(configId).toBeGreaterThan(0);
    const config = getModelAdvancedConfig(modelId);
    expect(config).not.toBeNull();
    expect(config?.swa_full).toBe(1);
    expect(config?.cpu_moe).toBe(1);
    expect(config?.n_cpu_moe).toBe(4);
  });

  it("should save advanced config with defaults", () => {
    const configId = saveModelAdvancedConfig(modelId, {});

    expect(configId).toBeGreaterThan(0);
    const config = getModelAdvancedConfig(modelId);
    expect(config?.swa_full).toBe(0);
    expect(config?.cpu_moe).toBe(0);
  });

  it("should return null for non-existent advanced config", () => {
    const config = getModelAdvancedConfig(99999);
    expect(config).toBeNull();
  });

  it("should save advanced config with null values", () => {
    saveModelAdvancedConfig(modelId, {
      swa_full: 1,
      override_tensor: null,
      rpc: null,
    });

    const config = getModelAdvancedConfig(modelId);
    expect(config?.swa_full).toBe(1);
    expect(config?.override_tensor).toBeNull();
    expect(config?.rpc).toBeNull();
  });
});

describe("Database Missing Coverage - LoRA Config", () => {
  let modelId: number;

  beforeEach(() => {
    cleanupTestDatabase();
    ensureDataDirectory();
    const db = initDatabase();
    const modelData: Omit<ModelConfig, "id" | "created_at" | "updated_at"> = {
      name: "TestModel",
      type: "llama",
      status: "stopped",
    };
    modelId = saveModel(modelData);
    closeDatabase(db);
  });

  afterEach(() => {
    cleanupTestDatabase();
  });

  it("should save LoRA config with all fields", () => {
    const configId = saveModelLoraConfig(modelId, {
      lora: "adapter.gguf",
      lora_scaled: "0.5",
      lora_init_without_apply: 1,
    });

    expect(configId).toBeGreaterThan(0);
    const config = getModelLoraConfig(modelId);
    expect(config).not.toBeNull();
    expect(config?.lora).toBe("adapter.gguf");
    expect(config?.lora_scaled).toBe("0.5");
  });

  it("should save LoRA config with empty object", () => {
    const configId = saveModelLoraConfig(modelId, {});

    expect(configId).toBeGreaterThan(0);
    const config = getModelLoraConfig(modelId);
    expect(config).not.toBeNull();
  });

  it("should return null for non-existent LoRA config", () => {
    const config = getModelLoraConfig(99999);
    expect(config).toBeNull();
  });
});

describe("Database Missing Coverage - Multimodal Config", () => {
  let modelId: number;

  beforeEach(() => {
    cleanupTestDatabase();
    ensureDataDirectory();
    const db = initDatabase();
    const modelData: Omit<ModelConfig, "id" | "created_at" | "updated_at"> = {
      name: "TestModel",
      type: "llama",
      status: "stopped",
    };
    modelId = saveModel(modelData);
    closeDatabase(db);
  });

  afterEach(() => {
    cleanupTestDatabase();
  });

  it("should save multimodal config with all fields", () => {
    const configId = saveModelMultimodalConfig(modelId, {
      mmproj: "mmproj.gguf",
    });

    expect(configId).toBeGreaterThan(0);
    const config = getModelMultimodalConfig(modelId);
    expect(config).not.toBeNull();
    expect(config?.mmproj).toBe("mmproj.gguf");
  });

  it("should save multimodal config with empty object", () => {
    const configId = saveModelMultimodalConfig(modelId, {});

    expect(configId).toBeGreaterThan(0);
    const config = getModelMultimodalConfig(modelId);
    expect(config).not.toBeNull();
  });

  it("should return null for non-existent multimodal config", () => {
    const config = getModelMultimodalConfig(99999);
    expect(config).toBeNull();
  });
});

describe("Database Missing Coverage - Server Config", () => {
  beforeEach(() => {
    cleanupTestDatabase();
    ensureDataDirectory();
  });

  afterEach(() => {
    cleanupTestDatabase();
  });

  it("should return null when no server config exists", () => {
    const config = getServerConfig();
    expect(config).toBeNull();
  });
});


describe("Database Missing Coverage - Update Operations", () => {
  let modelId: number;

  beforeEach(() => {
    cleanupTestDatabase();
    ensureDataDirectory();
    const db = initDatabase();
    const modelData: Omit<ModelConfig, "id" | "created_at" | "updated_at"> = {
      name: "TestModel",
      type: "llama",
      status: "stopped",
      ctx_size: 4096,
    };
    modelId = saveModel(modelData);
    closeDatabase(db);
  });

  afterEach(() => {
    cleanupTestDatabase();
  });

  it("should update model core fields", () => {
    updateModel(modelId, {
      status: "running",
      ctx_size: 8192,
      threads: 8,
    });

    const db = initDatabase();
    const model = db
      .prepare("SELECT * FROM models WHERE id = ?")
      .get(modelId) as any;
    closeDatabase(db);

    expect(model.status).toBe("running");
    expect(model.ctx_size).toBe(8192);
    expect(model.threads).toBe(8);
  });

  it("should update model with single field", () => {
    updateModel(modelId, { status: "loading" });

    const db = initDatabase();
    const model = db
      .prepare("SELECT status FROM models WHERE id = ?")
      .get(modelId) as any;
    closeDatabase(db);

    expect(model.status).toBe("loading");
  });


});

describe("Database Missing Coverage - Delete Operations", () => {
  let modelId: number;

  beforeEach(() => {
    cleanupTestDatabase();
    ensureDataDirectory();
    const db = initDatabase();
    const modelData: Omit<ModelConfig, "id" | "created_at" | "updated_at"> = {
      name: "TestModel",
      type: "llama",
      status: "stopped",
    };
    modelId = saveModel(modelData);
    closeDatabase(db);
  });

  afterEach(() => {
    cleanupTestDatabase();
  });

  it("should delete model", () => {
    deleteModel(modelId);

    const db = initDatabase();
    const model = db
      .prepare("SELECT * FROM models WHERE id = ?")
      .get(modelId);
    closeDatabase(db);

    expect(model).toBeUndefined();
  });

  it("should cascade delete configs when model is deleted", () => {
    saveModelMemoryConfig(modelId, { cache_ram: 8192 });
    saveModelGpuConfig(modelId, { gpu_layers: 35 });

    deleteModel(modelId);

    const db = initDatabase();
    const memoryConfig = db
      .prepare("SELECT * FROM model_memory_config WHERE model_id = ?")
      .get(modelId);
    const gpuConfig = db
      .prepare("SELECT * FROM model_gpu_config WHERE model_id = ?")
      .get(modelId);
    closeDatabase(db);

    expect(memoryConfig).toBeUndefined();
    expect(gpuConfig).toBeUndefined();
  });

  it("should handle deleting non-existent model", () => {
    expect(() => deleteModel(99999)).not.toThrow();
  });
});

describe("Database Missing Coverage - Null and Empty Values", () => {
  let modelId: number;

  beforeEach(() => {
    cleanupTestDatabase();
    ensureDataDirectory();
    const db = initDatabase();
    const modelData: Omit<ModelConfig, "id" | "created_at" | "updated_at"> = {
      name: "TestModel",
      type: "llama",
      status: "stopped",
    };
    modelId = saveModel(modelData);
    closeDatabase(db);
  });

  afterEach(() => {
    cleanupTestDatabase();
  });

  it("should handle memory config with explicit null values", () => {
    saveModelMemoryConfig(modelId, {
      cache_type_k: null,
      cache_type_v: null,
      numa: null,
    });

    const config = getModelMemoryConfig(modelId);
    expect(config?.cache_type_k).toBeNull();
    expect(config?.cache_type_v).toBeNull();
    expect(config?.numa).toBeNull();
  });

  it("should handle GPU config with no device specified", () => {
    saveModelGpuConfig(modelId, {
      gpu_layers: 32,
      device: null,
    });

    const config = getModelGpuConfig(modelId);
    expect(config?.gpu_layers).toBe(32);
    expect(config?.device).toBeNull();
  });

  it("should handle advanced config with empty string values", () => {
    saveModelAdvancedConfig(modelId, {
      override_tensor: "",
      rpc: "",
    });

    const config = getModelAdvancedConfig(modelId);
    expect(config?.override_tensor).toBe("");
    expect(config?.rpc).toBe("");
  });

  it("should handle LoRA config with only one field", () => {
    saveModelLoraConfig(modelId, {
      lora: "adapter.gguf",
    });

    const config = getModelLoraConfig(modelId);
    expect(config?.lora).toBe("adapter.gguf");
    expect(config?.lora_scaled).toBeNull();
  });
});

describe("Database Missing Coverage - Edge Cases", () => {
  let modelId: number;

  beforeEach(() => {
    cleanupTestDatabase();
    ensureDataDirectory();
    const db = initDatabase();
    const modelData: Omit<ModelConfig, "id" | "created_at" | "updated_at"> = {
      name: "TestModel",
      type: "llama",
      status: "stopped",
    };
    modelId = saveModel(modelData);
    closeDatabase(db);
  });

  afterEach(() => {
    cleanupTestDatabase();
  });

  it("should handle GPU config with special split mode", () => {
    saveModelGpuConfig(modelId, {
      split_mode: "layer",
      tensor_split: "0.3,0.7",
    });

    const config = getModelGpuConfig(modelId);
    expect(config?.split_mode).toBe("layer");
    expect(config?.tensor_split).toBe("0.3,0.7");
  });

  it("should handle advanced config with JSON custom params", () => {
    const customParams = '{"batch_size":32,"precision":"fp16"}';
    saveModelAdvancedConfig(modelId, {
      custom_params: customParams,
    });

    const config = getModelAdvancedConfig(modelId);
    expect(config?.custom_params).toBe(customParams);
  });

  it("should handle multimodal config with mmproj path", () => {
    saveModelMultimodalConfig(modelId, {
      mmproj: "/models/mmproj.gguf",
    });

    const config = getModelMultimodalConfig(modelId);
    expect(config?.mmproj).toBe("/models/mmproj.gguf");
  });

  it("should handle multiple updates to same config", () => {
    saveModelMemoryConfig(modelId, { cache_ram: 4096 });
    updateModelSamplingConfig(modelId, { temperature: 0.7 });
    updateModelSamplingConfig(modelId, { temperature: 0.8 });

    saveModelGpuConfig(modelId, { gpu_layers: 20 });

    const memConfig = getModelMemoryConfig(modelId);
    const gpuConfig = getModelGpuConfig(modelId);

    expect(memConfig?.cache_ram).toBe(4096);
    expect(gpuConfig?.gpu_layers).toBe(20);
  });

  it("should handle advanced config with high reasoning budget", () => {
    saveModelAdvancedConfig(modelId, {
      reasoning_budget: 999999,
      reasoning_format: "extended",
    });

    const config = getModelAdvancedConfig(modelId);
    expect(config?.reasoning_budget).toBe(999999);
    expect(config?.reasoning_format).toBe("extended");
  });

  it("should handle LoRA config with scaled paths", () => {
    saveModelLoraConfig(modelId, {
      lora: "lora1.gguf,lora2.gguf",
      lora_scaled: "0.5,0.3",
    });

    const config = getModelLoraConfig(modelId);
    expect(config?.lora).toContain(",");
    expect(config?.lora_scaled).toContain(",");
  });
});
