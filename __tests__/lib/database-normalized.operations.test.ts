import fs from "fs";
import path from "path";
import {
  initDatabase,
  closeDatabase,
  saveModel,
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
  type ModelAdvancedConfig,
  type ModelLoraConfig,
  type ModelMultimodalConfig,
  type ModelServerConfig,
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

describe("Normalized Database - Advanced Config", () => {
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

  it("should save advanced configuration", () => {
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
});

describe("Normalized Database - LoRA Config", () => {
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

  it("should save LoRA configuration", () => {
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
});

describe("Normalized Database - Multimodal Config", () => {
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

  it("should save multimodal configuration", () => {
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
});

describe("Normalized Database - Server Config (Independent)", () => {
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
    saveServerConfig({ host: "127.0.0.1", port: 8080 });
    let serverConfig = getServerConfig();
    expect(serverConfig).not.toBeNull();

    const modelData: Omit<ModelConfig, "id" | "created_at" | "updated_at"> = {
      name: "Llama-3-8B",
      type: "llama",
      status: "stopped",
    };
    const modelId = saveModel(modelData);
    const { deleteModel } = require("../../src/lib/database");
    deleteModel(modelId);

    serverConfig = getServerConfig();
    expect(serverConfig).not.toBeNull();
    expect(serverConfig?.host).toBe("127.0.0.1");
  });

  it("should return null when no server config exists", () => {
    const config = getServerConfig();
    expect(config).toBeNull();
  });

  it("should use default server config values", () => {
    saveServerConfig({});
    const retrieved = getServerConfig();

    expect(retrieved?.host).toBe("127.0.0.1");
    expect(retrieved?.port).toBe(8080);
    expect(retrieved?.timeout).toBe(600);
  });
});

describe("Normalized Database - Lazy Loading", () => {
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
    saveModelAdvancedConfig(modelId, { swa_full: 1 });
    saveModelLoraConfig(modelId, { lora: "adapter.gguf" });
    saveModelMultimodalConfig(modelId, { mmproj: "mmproj.gguf" });

    const completeConfig = getCompleteModelConfig(modelId);

    expect(completeConfig).not.toBeNull();
    expect(completeConfig?.model.id).toBe(modelId);
    expect(completeConfig?.advanced?.swa_full).toBe(1);
    expect(completeConfig?.lora?.lora).toBe("adapter.gguf");
    expect(completeConfig?.multimodal?.mmproj).toBe("mmproj.gguf");
  });

  it("should return null for non-existent model in getCompleteModelConfig", () => {
    const completeConfig = getCompleteModelConfig(99999);
    expect(completeConfig).toBeNull();
  });

  it("should load subset of configs when multiple exist", () => {
    saveModelAdvancedConfig(modelId, { swa_full: 1 });
    saveModelLoraConfig(modelId, { lora: "adapter.gguf" });

    const completeConfig = getCompleteModelConfig(modelId);

    expect(completeConfig?.advanced).toBeDefined();
    expect(completeConfig?.lora).toBeDefined();
    expect(completeConfig?.multimodal).toBeUndefined();
  });
});
