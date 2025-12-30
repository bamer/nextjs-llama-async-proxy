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
  type ModelConfig,
} from "../../src/lib/database";

const TEST_DB_PATH = path.join(process.cwd(), "data", "llama-dashboard.db");

function cleanupTestDatabase(): void {
  // Remove main database file
  if (fs.existsSync(TEST_DB_PATH)) {
    try {
      fs.unlinkSync(TEST_DB_PATH);
    } catch (error) {
      // Ignore errors if database is locked
    }
  }

  // Remove WAL and SHM files
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

describe("Normalized Database - Core Models Table", () => {
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

    saveModelSamplingConfig(modelId, { temperature: 0.8 });

    let samplingConfig = getModelSamplingConfig(modelId);
    expect(samplingConfig).not.toBeNull();

    deleteModel(modelId);

    const deletedModel = getModelById(modelId);
    expect(deletedModel).toBeNull();

    samplingConfig = getModelSamplingConfig(modelId);
    expect(samplingConfig).toBeNull();
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

  it("should delete all models", () => {
    saveModel({ name: "Model1", type: "llama", status: "stopped" });
    saveModel({ name: "Model2", type: "llama", status: "stopped" });

    expect(getModels()).toHaveLength(2);

    deleteAllModels();

    expect(getModels()).toHaveLength(0);
  });
});
