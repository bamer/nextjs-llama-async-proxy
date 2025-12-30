import Database from "better-sqlite3";
import {
  initDatabase,
  closeDatabase,
  saveModel,
  deleteAllModels,
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
} from "@/lib/database";

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
    const fetchedModel = require("@/lib/database").getModelById(modelId);
    expect(fetchedModel).toBeDefined();
  });
});
