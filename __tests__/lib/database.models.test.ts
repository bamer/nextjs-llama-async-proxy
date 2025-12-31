import Database from "better-sqlite3";
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
  saveModelMemoryConfig,
  getModelMemoryConfig,
  saveModelGpuConfig,
  getCompleteModelConfig,
  clearAllTables,
} from "@/lib/database";

describe("Models Core Operations", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = initDatabase();
    clearAllTables(); // Clean up any existing data
  });

  afterEach(() => {
    clearAllTables(); // Clean up after each test
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

describe("Complete Model Lazy Loading", () => {
  let db: Database.Database;
  let modelId: number;

  beforeEach(() => {
    db = initDatabase();
    clearAllTables(); // Clean up any existing data
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
