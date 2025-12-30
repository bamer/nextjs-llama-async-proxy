/**
 * Normalized Database Schema Tests
 *
 * Tests for the fully normalized database schema with:
 * - Core models table (26 fields)
 * - 6 separate config tables with FK to models.id (ON DELETE CASCADE)
 * - Independent model_server_config table (NO FK to models)
 */

import fs from "fs";
import path from "path";
import {
  initDatabase,
  closeDatabase,
  saveModel,
  getModels,
  getModelById,
  getModelByName,
  updateModel,
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
  saveServerConfig,
  getServerConfig,
  getCompleteModelConfig,
  type ModelConfig,
  type ModelSamplingConfig,
  type ModelMemoryConfig,
  type ModelGpuConfig,
  type ModelAdvancedConfig,
  type ModelLoraConfig,
  type ModelMultimodalConfig,
  type ModelServerConfig,
} from "../../src/lib/database";

// Test database path - use same path as production database.ts
const TEST_DB_PATH = path.join(process.cwd(), "data", "llama-dashboard.db");

/**
 * Cleanup test database before each test
 */
function cleanupTestDatabase(): void {
  if (fs.existsSync(TEST_DB_PATH)) {
    try {
      fs.unlinkSync(TEST_DB_PATH);
    } catch (error) {
      // Ignore errors if database is locked
    }
  }
}

/**
 * Ensure data directory exists
 */
function ensureDataDirectory(): void {
  const dataDir = path.dirname(TEST_DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// ============================================================================
// Core Models Table Tests
// ============================================================================

describe("Normalized Database Schema - Core Models Table", () => {
  beforeEach(() => {
    cleanupTestDatabase();
    ensureDataDirectory();
  });

  afterEach(() => {
    cleanupTestDatabase();
  });

  it("should save model with basic data", () => {
    const modelData: Omit<ModelConfig, "id" | "created_at" | "updated_at"> = {
      name: "Llama-3-8B",
      type: "llama",
      status: "stopped",
      model_path: "/models/llama-3-8b.gguf",
      ctx_size: 4096,
      threads: 8,
    };

    const modelId = saveModel(modelData);

    expect(modelId).toBeDefined();
    expect(modelId).toBeGreaterThan(0);
    expect(typeof modelId).toBe("number");
  });

  it("should get models as array of Model objects", () => {
    const modelData1: Omit<ModelConfig, "id" | "created_at" | "updated_at"> = {
      name: "Llama-3-8B",
      type: "llama",
      status: "stopped",
    };
    const modelData2: Omit<ModelConfig, "id" | "created_at" | "updated_at"> = {
      name: "Mistral-7B",
      type: "mistrall",
      status: "running",
    };

    saveModel(modelData1);
    saveModel(modelData2);

    const models = getModels();

    expect(models).toHaveLength(2);
    expect(models[0]).toHaveProperty("id");
    expect(typeof models[0].id).toBe("number");
    expect(models[0].name).toBe("Mistral-7B");
    expect(models[1].name).toBe("Llama-3-8B");
  });

  it("should get model by ID with numeric id parameter", () => {
    const modelData: Omit<ModelConfig, "id" | "created_at" | "updated_at"> = {
      name: "Llama-3-8B",
      type: "llama",
      status: "running",
    };

    const modelId = saveModel(modelData);
    const retrievedModel = getModelById(modelId);

    expect(retrievedModel).not.toBeNull();
    expect(retrievedModel?.id).toBe(modelId);
    expect(retrievedModel?.name).toBe("Llama-3-8B");
    expect(retrievedModel?.type).toBe("llama");
    expect(retrievedModel?.status).toBe("running");
  });

  it("should get model by name", () => {
    const modelData: Omit<ModelConfig, "id" | "created_at" | "updated_at"> = {
      name: "Llama-3-8B",
      type: "llama",
      status: "stopped",
    };

    saveModel(modelData);
    const retrievedModel = getModelByName("Llama-3-8B");

    expect(retrievedModel).not.toBeNull();
    expect(retrievedModel?.name).toBe("Llama-3-8B");
  });

  it("should update model core fields", () => {
    const modelData: Omit<ModelConfig, "id" | "created_at" | "updated_at"> = {
      name: "Llama-3-8B",
      type: "llama",
      status: "stopped",
    };

    const modelId = saveModel(modelData);
    updateModel(modelId, { status: "running", ctx_size: 8192 });

    const updatedModel = getModelById(modelId);

    expect(updatedModel?.status).toBe("running");
    expect(updatedModel?.ctx_size).toBe(8192);
  });

  it("should delete model and cascade related configs", () => {
    const modelData: Omit<ModelConfig, "id" | "created_at" | "updated_at"> = {
      name: "Llama-3-8B",
      type: "llama",
      status: "stopped",
    };

    const modelId = saveModel(modelData);

    // Save some configs
    saveModelSamplingConfig(modelId, { temperature: 0.8 });
    saveModelMemoryConfig(modelId, { cache_ram: 8192 });

    // Verify configs exist
    let samplingConfig = getModelSamplingConfig(modelId);
    let memoryConfig = getModelMemoryConfig(modelId);
    expect(samplingConfig).not.toBeNull();
    expect(memoryConfig).not.toBeNull();

    // Delete model
    deleteModel(modelId);

    // Verify model is deleted
    const deletedModel = getModelById(modelId);
    expect(deletedModel).toBeNull();

    // Verify configs are cascaded
    samplingConfig = getModelSamplingConfig(modelId);
    memoryConfig = getModelMemoryConfig(modelId);
    expect(samplingConfig).toBeNull();
    expect(memoryConfig).toBeNull();
  });

  it("should filter models by status", () => {
    saveModel({ name: "Model1", type: "llama", status: "running" });
    saveModel({ name: "Model2", type: "llama", status: "stopped" });
    saveModel({ name: "Model3", type: "llama", status: "running" });

    const runningModels = getModels({ status: "running" });
    const stoppedModels = getModels({ status: "stopped" });

    expect(runningModels).toHaveLength(2);
    expect(stoppedModels).toHaveLength(1);
  });

  it("should filter models by type", () => {
    saveModel({ name: "Llama", type: "llama", status: "stopped" });
    saveModel({ name: "Mistral", type: "mistrall", status: "stopped" });
    saveModel({ name: "GPT", type: "gpt", status: "stopped" });

    const llamaModels = getModels({ type: "llama" });
    const mistralModels = getModels({ type: "mistrall" });

    expect(llamaModels).toHaveLength(1);
    expect(mistralModels).toHaveLength(1);
  });

  it("should filter models by name with LIKE", () => {
    saveModel({ name: "Llama-3-8B", type: "llama", status: "stopped" });
    saveModel({ name: "Llama-3-70B", type: "llama", status: "stopped" });
    saveModel({ name: "Mistral-7B", type: "mistrall", status: "stopped" });

    const llamaModels = getModels({ name: "Llama" });

    expect(llamaModels).toHaveLength(2);
    expect(llamaModels[0].name).toContain("Llama");
  });

  it("should handle invalid model ID in getModelById", () => {
    const model = getModelById(99999);
    expect(model).toBeNull();
  });

  it("should handle non-existent model name", () => {
    const model = getModelByName("NonExistentModel");
    expect(model).toBeNull();
  });

  it("should set created_at and updated_at timestamps", () => {
    const modelData: Omit<ModelConfig, "id" | "created_at" | "updated_at"> = {
      name: "Llama-3-8B",
      type: "llama",
      status: "stopped",
    };

    const modelId = saveModel(modelData);
    const model = getModelById(modelId);

    expect(model?.created_at).toBeDefined();
    expect(model?.updated_at).toBeDefined();
    expect(typeof model?.created_at).toBe("number");
    expect(typeof model?.updated_at).toBe("number");
  });
});

// ============================================================================
// Sampling Config Tests
// ============================================================================

describe("Normalized Database Schema - Sampling Config", () => {
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

  it("should save sampling configuration with modelId parameter", () => {
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

  it("should handle DRY sampling parameters", () => {
    const config: Omit<ModelSamplingConfig, "id" | "model_id" | "created_at" | "updated_at"> = {
      dry_multiplier: 0.5,
      dry_base: 1.75,
      dry_allowed_length: 2,
      dry_penalty_last_n: 64,
      dry_sequence_breaker: "\\n, ., !, ?",
    };

    saveModelSamplingConfig(modelId, config);
    const retrieved = getModelSamplingConfig(modelId);

    expect(retrieved?.dry_multiplier).toBe(0.5);
    expect(retrieved?.dry_sequence_breaker).toBe("\\n, ., !, ?");
  });

  it("should handle dynamic temperature parameters", () => {
    const config: Omit<ModelSamplingConfig, "id" | "model_id" | "created_at" | "updated_at"> = {
      dynatemp_range: 0.2,
      dynatemp_exp: 1.2,
    };

    saveModelSamplingConfig(modelId, config);
    const retrieved = getModelSamplingConfig(modelId);

    expect(retrieved?.dynatemp_range).toBe(0.2);
    expect(retrieved?.dynatemp_exp).toBe(1.2);
  });

  it("should handle Mirostat sampling parameters", () => {
    const config: Omit<ModelSamplingConfig, "id" | "model_id" | "created_at" | "updated_at"> = {
      mirostat: 2,
      mirostat_lr: 0.05,
      mirostat_ent: 5.0,
    };

    saveModelSamplingConfig(modelId, config);
    const retrieved = getModelSamplingConfig(modelId);

    expect(retrieved?.mirostat).toBe(2);
    expect(retrieved?.mirostat_lr).toBe(0.05);
  });
});

// ============================================================================
// Memory Config Tests
// ============================================================================

describe("Normalized Database Schema - Memory Config", () => {
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

  it("should save memory configuration with modelId parameter", () => {
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

  it("should return null for non-existent memory config", () => {
    const config = getModelMemoryConfig(99999);
    expect(config).toBeNull();
  });

  it("should handle unlimited cache_ram (-1)", () => {
    saveModelMemoryConfig(modelId, { cache_ram: -1 });
    const retrieved = getModelMemoryConfig(modelId);

    expect(retrieved?.cache_ram).toBe(-1);
  });
});

// ============================================================================
// GPU Config Tests
// ============================================================================

describe("Normalized Database Schema - GPU Config", () => {
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

  it("should save GPU configuration with modelId parameter", () => {
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

  it("should return null for non-existent GPU config", () => {
    const config = getModelGpuConfig(99999);
    expect(config).toBeNull();
  });

  it("should handle auto GPU layers (-1)", () => {
    saveModelGpuConfig(modelId, { gpu_layers: -1 });
    const retrieved = getModelGpuConfig(modelId);

    expect(retrieved?.gpu_layers).toBe(-1);
  });
});

// ============================================================================
// Advanced Config Tests
// ============================================================================

describe("Normalized Database Schema - Advanced Config", () => {
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

  it("should save advanced configuration with modelId parameter", () => {
    const config: Omit<ModelAdvancedConfig, "id" | "model_id" | "created_at" | "updated_at"> = {
      swa_full: 1,
      cpu_moe: 1,
      n_cpu_moe: 4,
    };

    const configId = saveModelAdvancedConfig(modelId, config);

    expect(configId).toBeDefined();
    expect(configId).toBeGreaterThan(0);
  });

  it("should get advanced configuration", () => {
    saveModelAdvancedConfig(modelId, { swa_full: 1, cpu_moe: 1 });
    const retrieved = getModelAdvancedConfig(modelId);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.swa_full).toBe(1);
    expect(retrieved?.cpu_moe).toBe(1);
  });

  it("should cascade delete advanced config on model delete", () => {
    saveModelAdvancedConfig(modelId, { swa_full: 1 });

    let config = getModelAdvancedConfig(modelId);
    expect(config).not.toBeNull();

    deleteModel(modelId);

    config = getModelAdvancedConfig(modelId);
    expect(config).toBeNull();
  });

  it("should return null for non-existent advanced config", () => {
    const config = getModelAdvancedConfig(99999);
    expect(config).toBeNull();
  });
});

// ============================================================================
// LoRA Config Tests
// ============================================================================

describe("Normalized Database Schema - LoRA Config", () => {
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

  it("should save LoRA configuration with modelId parameter", () => {
    const config: Omit<ModelLoraConfig, "id" | "model_id" | "created_at" | "updated_at"> = {
      lora: "adapter.gguf",
      lora_scaled: "adapter1.gguf:1.0,adapter2.gguf:0.5",
    };

    const configId = saveModelLoraConfig(modelId, config);

    expect(configId).toBeDefined();
    expect(configId).toBeGreaterThan(0);
  });

  it("should get LoRA configuration", () => {
    saveModelLoraConfig(modelId, { lora: "adapter.gguf" });
    const retrieved = getModelLoraConfig(modelId);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.lora).toBe("adapter.gguf");
  });

  it("should handle control vector configuration", () => {
    const config: Omit<ModelLoraConfig, "id" | "model_id" | "created_at" | "updated_at"> = {
      control_vector: "control.bin",
      control_vector_scaled: "control1.bin:1.0,control2.bin:0.8",
      control_vector_layer_range: "0,31",
    };

    saveModelLoraConfig(modelId, config);
    const retrieved = getModelLoraConfig(modelId);

    expect(retrieved?.control_vector).toBe("control.bin");
    expect(retrieved?.control_vector_layer_range).toBe("0,31");
  });

  it("should cascade delete LoRA config on model delete", () => {
    saveModelLoraConfig(modelId, { lora: "adapter.gguf" });

    let config = getModelLoraConfig(modelId);
    expect(config).not.toBeNull();

    deleteModel(modelId);

    config = getModelLoraConfig(modelId);
    expect(config).toBeNull();
  });

  it("should return null for non-existent LoRA config", () => {
    const config = getModelLoraConfig(99999);
    expect(config).toBeNull();
  });
});

// ============================================================================
// Multimodal Config Tests
// ============================================================================

describe("Normalized Database Schema - Multimodal Config", () => {
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

  it("should save multimodal configuration with modelId parameter", () => {
    const config: Omit<ModelMultimodalConfig, "id" | "model_id" | "created_at" | "updated_at"> = {
      mmproj: "mmproj.gguf",
      mmproj_url: "https://example.com/mmproj.gguf",
    };

    const configId = saveModelMultimodalConfig(modelId, config);

    expect(configId).toBeDefined();
    expect(configId).toBeGreaterThan(0);
  });

  it("should get multimodal configuration", () => {
    saveModelMultimodalConfig(modelId, { mmproj: "mmproj.gguf" });
    const retrieved = getModelMultimodalConfig(modelId);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.mmproj).toBe("mmproj.gguf");
  });

  it("should cascade delete multimodal config on model delete", () => {
    saveModelMultimodalConfig(modelId, { mmproj: "mmproj.gguf" });

    let config = getModelMultimodalConfig(modelId);
    expect(config).not.toBeNull();

    deleteModel(modelId);

    config = getModelMultimodalConfig(modelId);
    expect(config).toBeNull();
  });

  it("should return null for non-existent multimodal config", () => {
    const config = getModelMultimodalConfig(99999);
    expect(config).toBeNull();
  });
});

// ============================================================================
// Server Config Tests (Independent)
// ============================================================================

describe("Normalized Database Schema - Server Config (Independent)", () => {
  beforeEach(() => {
    cleanupTestDatabase();
    ensureDataDirectory();
  });

  afterEach(() => {
    cleanupTestDatabase();
  });

  it("should save server config (NOT linked to model)", () => {
    const config: Omit<ModelServerConfig, "id" | "created_at" | "updated_at"> = {
      host: "0.0.0.0",
      port: 8080,
      timeout: 1200,
    };

    const configId = saveServerConfig(config);

    expect(configId).toBeDefined();
    expect(configId).toBeGreaterThan(0);
  });

  it("should get server config (global settings)", () => {
    saveServerConfig({ host: "0.0.0.0", port: 9090 });
    const retrieved = getServerConfig();

    expect(retrieved).not.toBeNull();
    expect(retrieved?.host).toBe("0.0.0.0");
    expect(retrieved?.port).toBe(9090);
  });

  it("should update server config", () => {
    saveServerConfig({ host: "127.0.0.1", port: 8080 });
    saveServerConfig({ host: "0.0.0.0", port: 9090 });

    const retrieved = getServerConfig();
    expect(retrieved?.host).toBe("0.0.0.0");
    expect(retrieved?.port).toBe(9090);
  });

  it("should NOT cascade delete server config on model delete", () => {
    // Save server config
    saveServerConfig({ host: "127.0.0.1", port: 8080 });
    let serverConfig = getServerConfig();
    expect(serverConfig).not.toBeNull();

    // Create and delete a model
    const modelData: Omit<ModelConfig, "id" | "created_at" | "updated_at"> = {
      name: "Llama-3-8B",
      type: "llama",
      status: "stopped",
    };
    const modelId = saveModel(modelData);
    deleteModel(modelId);

    // Server config should persist
    serverConfig = getServerConfig();
    expect(serverConfig).not.toBeNull();
    expect(serverConfig?.host).toBe("127.0.0.1");
  });

  it("should return null when no server config exists", () => {
    // Clear server config by setting up new database
    const config = getServerConfig();
    expect(config).toBeNull();
  });

  it("should use default server config values", () => {
    saveServerConfig({}); // Save with no values
    const retrieved = getServerConfig();

    expect(retrieved?.host).toBe("127.0.0.1");
    expect(retrieved?.port).toBe(8080);
    expect(retrieved?.timeout).toBe(600);
  });
});

// ============================================================================
// Lazy-Loading Tests
// ============================================================================

describe("Normalized Database Schema - Lazy Loading", () => {
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

  it("should get complete model config with all related tables", () => {
    // Save all configs
    saveModelSamplingConfig(modelId, { temperature: 0.7 });
    saveModelMemoryConfig(modelId, { cache_ram: 8192 });
    saveModelGpuConfig(modelId, { gpu_layers: 35 });
    saveModelAdvancedConfig(modelId, { swa_full: 1 });
    saveModelLoraConfig(modelId, { lora: "adapter.gguf" });
    saveModelMultimodalConfig(modelId, { mmproj: "mmproj.gguf" });

    const completeConfig = getCompleteModelConfig(modelId);

    expect(completeConfig).not.toBeNull();
    expect(completeConfig?.model.id).toBe(modelId);
    expect(completeConfig?.sampling?.temperature).toBe(0.7);
    expect(completeConfig?.memory?.cache_ram).toBe(8192);
    expect(completeConfig?.gpu?.gpu_layers).toBe(35);
    expect(completeConfig?.advanced?.swa_full).toBe(1);
    expect(completeConfig?.lora?.lora).toBe("adapter.gguf");
    expect(completeConfig?.multimodal?.mmproj).toBe("mmproj.gguf");
  });

  it("should return null for non-existent model in getCompleteModelConfig", () => {
    const completeConfig = getCompleteModelConfig(99999);
    expect(completeConfig).toBeNull();
  });

  it("should load only sampling config when only sampling exists", () => {
    saveModelSamplingConfig(modelId, { temperature: 0.7 });

    const completeConfig = getCompleteModelConfig(modelId);

    expect(completeConfig?.sampling).toBeDefined();
    expect(completeConfig?.memory).toBeUndefined();
    expect(completeConfig?.gpu).toBeUndefined();
    expect(completeConfig?.advanced).toBeUndefined();
    expect(completeConfig?.lora).toBeUndefined();
    expect(completeConfig?.multimodal).toBeUndefined();
  });

  it("should load only memory config when only memory exists", () => {
    saveModelMemoryConfig(modelId, { cache_ram: 8192 });

    const completeConfig = getCompleteModelConfig(modelId);

    expect(completeConfig?.memory).toBeDefined();
    expect(completeConfig?.sampling).toBeUndefined();
    expect(completeConfig?.gpu).toBeUndefined();
  });

  it("should load subset of configs when multiple exist", () => {
    saveModelSamplingConfig(modelId, { temperature: 0.7 });
    saveModelMemoryConfig(modelId, { cache_ram: 8192 });
    // Don't save other configs

    const completeConfig = getCompleteModelConfig(modelId);

    expect(completeConfig?.sampling).toBeDefined();
    expect(completeConfig?.memory).toBeDefined();
    expect(completeConfig?.gpu).toBeUndefined();
    expect(completeConfig?.advanced).toBeUndefined();
    expect(completeConfig?.lora).toBeUndefined();
    expect(completeConfig?.multimodal).toBeUndefined();
  });
});

// ============================================================================
// Cascade Delete Behavior Tests
// ============================================================================

describe("Normalized Database Schema - Cascade Delete Behavior", () => {
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

    // Save configs for both models
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
    // Verify all configs exist before deletion
    expect(getModelSamplingConfig(modelId1)).not.toBeNull();
    expect(getModelMemoryConfig(modelId1)).not.toBeNull();
    expect(getServerConfig()).not.toBeNull();

    // Delete model1
    deleteModel(modelId1);

    // Verify model1 configs are deleted
    expect(getModelById(modelId1)).toBeNull();
    expect(getModelSamplingConfig(modelId1)).toBeNull();
    expect(getModelMemoryConfig(modelId1)).toBeNull();

    // Verify server config persists
    const serverConfig = getServerConfig();
    expect(serverConfig).not.toBeNull();
    expect(serverConfig?.host).toBe("127.0.0.1");
  });

  it("should cascade delete configs for multiple models independently", () => {
    // Delete model1 only
    deleteModel(modelId1);

    // Verify model1 is deleted
    expect(getModelById(modelId1)).toBeNull();
    expect(getModelSamplingConfig(modelId1)).toBeNull();
    expect(getModelMemoryConfig(modelId1)).toBeNull();

    // Verify model2 still exists with its configs
    expect(getModelById(modelId2)).not.toBeNull();
    expect(getModelSamplingConfig(modelId2)).not.toBeNull();
    expect(getModelMemoryConfig(modelId2)).not.toBeNull();
  });

  it("should handle deleting all models", () => {
    // Verify models and configs exist
    expect(getModels()).toHaveLength(2);
    expect(getServerConfig()).not.toBeNull();

    // Delete all models
    deleteAllModels();

    // Verify all models are deleted
    expect(getModels()).toHaveLength(0);

    // Verify all model configs are cascaded
    expect(getModelSamplingConfig(modelId1)).toBeNull();
    expect(getModelSamplingConfig(modelId2)).toBeNull();

    // Verify server config persists
    expect(getServerConfig()).not.toBeNull();
  });
});

// ============================================================================
// Full Model Save Tests
// ============================================================================

describe("Normalized Database Schema - Full Model Save with Multiple Configs", () => {
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

    // Save all configs
    saveModelSamplingConfig(modelId, { temperature: 0.7, top_k: 50 });
    saveModelMemoryConfig(modelId, { cache_ram: 8192, mmap: 1 });
    saveModelGpuConfig(modelId, { device: "cuda:0", gpu_layers: 35 });
    saveModelAdvancedConfig(modelId, { swa_full: 1, cpu_moe: 1 });
    saveModelLoraConfig(modelId, { lora: "adapter.gguf" });
    saveModelMultimodalConfig(modelId, { mmproj: "mmproj.gguf" });

    // Verify all configs are saved
    const completeConfig = getCompleteModelConfig(modelId);

    expect(completeConfig).not.toBeNull();
    expect(completeConfig?.sampling?.temperature).toBe(0.7);
    expect(completeConfig?.memory?.cache_ram).toBe(8192);
    expect(completeConfig?.gpu?.device).toBe("cuda:0");
    expect(completeConfig?.advanced?.swa_full).toBe(1);
    expect(completeConfig?.lora?.lora).toBe("adapter.gguf");
    expect(completeConfig?.multimodal?.mmproj).toBe("mmproj.gguf");
  });

  it("should allow partial config saves (lazy loading)", () => {
    const modelData: Omit<ModelConfig, "id" | "created_at" | "updated_at"> = {
      name: "Llama-3-8B",
      type: "llama",
      status: "stopped",
    };

    const modelId = saveModel(modelData);

    // Save only sampling and memory configs
    saveModelSamplingConfig(modelId, { temperature: 0.7 });
    saveModelMemoryConfig(modelId, { cache_ram: 8192 });

    // Verify only saved configs exist
    expect(getModelSamplingConfig(modelId)).not.toBeNull();
    expect(getModelMemoryConfig(modelId)).not.toBeNull();
    expect(getModelGpuConfig(modelId)).toBeNull();
    expect(getModelAdvancedConfig(modelId)).toBeNull();
    expect(getModelLoraConfig(modelId)).toBeNull();
    expect(getModelMultimodalConfig(modelId)).toBeNull();
  });

  it("should maintain consistency across all config tables", () => {
    const modelData: Omit<ModelConfig, "id" | "created_at" | "updated_at"> = {
      name: "Llama-3-8B",
      type: "llama",
      status: "stopped",
    };

    const modelId = saveModel(modelData);

    // Save all configs
    saveModelSamplingConfig(modelId, { temperature: 0.7 });
    saveModelMemoryConfig(modelId, { cache_ram: 8192 });
    saveModelGpuConfig(modelId, { gpu_layers: 35 });

    // Verify all configs reference correct model_id
    const sampling = getModelSamplingConfig(modelId);
    const memory = getModelMemoryConfig(modelId);
    const gpu = getModelGpuConfig(modelId);

    expect(sampling?.model_id).toBe(modelId);
    expect(memory?.model_id).toBe(modelId);
    expect(gpu?.model_id).toBe(modelId);
  });
});
