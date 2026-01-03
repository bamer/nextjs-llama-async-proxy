import {
  getModelsAction,
  getModelByIdAction,
  getModelSamplingConfigAction,
  getModelMemoryConfigAction,
  getModelGpuConfigAction,
  getModelAdvancedConfigAction,
  getModelLoraConfigAction,
  getModelMultimodalConfigAction,
  saveModelAction,
  saveModelSamplingConfigAction,
  saveModelMemoryConfigAction,
  saveModelGpuConfigAction,
  saveModelAdvancedConfigAction,
  saveModelLoraConfigAction,
  saveModelMultimodalConfigAction,
  updateModelAction,
  deleteModelAction,
} from "@/actions/model-actions";
import * as db from "@/lib/database";
import type {
  ModelConfig,
  ModelSamplingConfig,
  ModelMemoryConfig,
  ModelGpuConfig,
  ModelAdvancedConfig,
  ModelLoraConfig,
  ModelMultimodalConfig,
} from "@/lib/database";

jest.mock("@/lib/database");

describe("model-actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getModelsAction", () => {
    it("should get all models", async () => {
      const mockModels: ModelConfig[] = [
        { id: 1, name: "model1", type: "llama", status: "idle" },
        { id: 2, name: "model2", type: "gpt", status: "running" },
      ];
      (db.getModels as jest.Mock).mockResolvedValue(mockModels);

      const result = await getModelsAction();

      expect(result).toEqual(mockModels);
      expect(db.getModels).toHaveBeenCalledWith(undefined);
    });

    it("should get models with filters", async () => {
      const mockModels: ModelConfig[] = [{ id: 1, name: "model1", type: "llama", status: "idle" }];
      const filters: Record<string, unknown> = { status: "idle" };
      (db.getModels as jest.Mock).mockResolvedValue(mockModels);

      const result = await getModelsAction(filters);

      expect(result).toEqual(mockModels);
      expect(db.getModels).toHaveBeenCalledWith(filters);
    });

    it("should return empty array when no models exist", async () => {
      (db.getModels as jest.Mock).mockResolvedValue([]);

      const result = await getModelsAction();

      expect(result).toEqual([]);
    });
  });

  describe("getModelByIdAction", () => {
    it("should get model by id", async () => {
      const mockModel: ModelConfig = { id: 1, name: "model1", type: "llama", status: "idle" };
      (db.getModelById as jest.Mock).mockResolvedValue(mockModel);

      const result = await getModelByIdAction(1);

      expect(result).toEqual(mockModel);
      expect(db.getModelById).toHaveBeenCalledWith(1);
    });

    it("should return null when model not found", async () => {
      (db.getModelById as jest.Mock).mockResolvedValue(null);

      const result = await getModelByIdAction(999);

      expect(result).toBeNull();
    });
  });

  describe("get config actions", () => {
    it("getModelSamplingConfigAction should call database function", async () => {
      const mockConfig: ModelSamplingConfig = { id: 1, model_id: 1, temperature: 0.7 };
      (db.getModelSamplingConfig as jest.Mock).mockResolvedValue(mockConfig);

      const result = await getModelSamplingConfigAction(1);

      expect(result).toEqual(mockConfig);
      expect(db.getModelSamplingConfig).toHaveBeenCalledWith(1);
    });

    it("getModelMemoryConfigAction should call database function", async () => {
      const mockConfig: ModelMemoryConfig = { id: 1, model_id: 1, cache_ram: 2 };
      (db.getModelMemoryConfig as jest.Mock).mockResolvedValue(mockConfig);

      const result = await getModelMemoryConfigAction(1);

      expect(result).toEqual(mockConfig);
      expect(db.getModelMemoryConfig).toHaveBeenCalledWith(1);
    });

    it("getModelGpuConfigAction should call database function", async () => {
      const mockConfig: ModelGpuConfig = { id: 1, model_id: 1, gpu_layers: 35 };
      (db.getModelGpuConfig as jest.Mock).mockResolvedValue(mockConfig);

      const result = await getModelGpuConfigAction(1);

      expect(result).toEqual(mockConfig);
      expect(db.getModelGpuConfig).toHaveBeenCalledWith(1);
    });

    it("getModelAdvancedConfigAction should call database function", async () => {
      const mockConfig: ModelAdvancedConfig = { id: 1, model_id: 1, context_shift: 0 };
      (db.getModelAdvancedConfig as jest.Mock).mockResolvedValue(mockConfig);

      const result = await getModelAdvancedConfigAction(1);

      expect(result).toEqual(mockConfig);
      expect(db.getModelAdvancedConfig).toHaveBeenCalledWith(1);
    });

    it("getModelLoraConfigAction should call database function", async () => {
      const mockConfig: ModelLoraConfig = { id: 1, model_id: 1, lora: "" };
      (db.getModelLoraConfig as jest.Mock).mockResolvedValue(mockConfig);

      const result = await getModelLoraConfigAction(1);

      expect(result).toEqual(mockConfig);
      expect(db.getModelLoraConfig).toHaveBeenCalledWith(1);
    });

    it("getModelMultimodalConfigAction should call database function", async () => {
      const mockConfig: ModelMultimodalConfig = { id: 1, model_id: 1, mmproj: "" };
      (db.getModelMultimodalConfig as jest.Mock).mockResolvedValue(mockConfig);

      const result = await getModelMultimodalConfigAction(1);

      expect(result).toEqual(mockConfig);
      expect(db.getModelMultimodalConfig).toHaveBeenCalledWith(1);
    });

    it("should handle null config from sampling", async () => {
      (db.getModelSamplingConfig as jest.Mock).mockResolvedValue(null);

      const result = await getModelSamplingConfigAction(1);

      expect(result).toBeNull();
    });

    it("should handle null config from memory", async () => {
      (db.getModelMemoryConfig as jest.Mock).mockResolvedValue(null);

      const result = await getModelMemoryConfigAction(1);

      expect(result).toBeNull();
    });

    it("should handle null config from GPU", async () => {
      (db.getModelGpuConfig as jest.Mock).mockResolvedValue(null);

      const result = await getModelGpuConfigAction(1);

      expect(result).toBeNull();
    });
  });

  describe("save config actions", () => {
    it("saveModelSamplingConfigAction should call database function", async () => {
      const mockConfig: ModelSamplingConfig = { temperature: 0.7, top_p: 0.9, top_k: 40 };
      (db.saveModelSamplingConfig as jest.Mock).mockResolvedValue(1);

      const result = await saveModelSamplingConfigAction(1, mockConfig);

      expect(result).toBe(1);
      expect(db.saveModelSamplingConfig).toHaveBeenCalledWith(1, mockConfig);
    });

    it("saveModelMemoryConfigAction should call database function", async () => {
      const mockConfig: ModelMemoryConfig = { cache_ram: 2, mmap: 1, mlock: 0 };
      (db.saveModelMemoryConfig as jest.Mock).mockResolvedValue(2);

      const result = await saveModelMemoryConfigAction(1, mockConfig);

      expect(result).toBe(2);
      expect(db.saveModelMemoryConfig).toHaveBeenCalledWith(1, mockConfig);
    });

    it("saveModelGpuConfigAction should call database function", async () => {
      const mockConfig: ModelGpuConfig = { gpu_layers: 35, main_gpu: 0 };
      (db.saveModelGpuConfig as jest.Mock).mockResolvedValue(3);

      const result = await saveModelGpuConfigAction(1, mockConfig);

      expect(result).toBe(3);
      expect(db.saveModelGpuConfig).toHaveBeenCalledWith(1, mockConfig);
    });

    it("saveModelAdvancedConfigAction should call database function", async () => {
      const mockConfig: ModelAdvancedConfig = { context_shift: 0, offline: 0 };
      (db.saveModelAdvancedConfig as jest.Mock).mockResolvedValue(4);

      const result = await saveModelAdvancedConfigAction(1, mockConfig);

      expect(result).toBe(4);
      expect(db.saveModelAdvancedConfig).toHaveBeenCalledWith(1, mockConfig);
    });

    it("saveModelLoraConfigAction should call database function", async () => {
      const mockConfig: ModelLoraConfig = { lora: "", draft_max: 16 };
      (db.saveModelLoraConfig as jest.Mock).mockResolvedValue(5);

      const result = await saveModelLoraConfigAction(1, mockConfig);

      expect(result).toBe(5);
      expect(db.saveModelLoraConfig).toHaveBeenCalledWith(1, mockConfig);
    });

    it("saveModelMultimodalConfigAction should call database function", async () => {
      const mockConfig: ModelMultimodalConfig = { mmproj: "", image_max_tokens: 0 };
      (db.saveModelMultimodalConfig as jest.Mock).mockResolvedValue(6);

      const result = await saveModelMultimodalConfigAction(1, mockConfig);

      expect(result).toBe(6);
      expect(db.saveModelMultimodalConfig).toHaveBeenCalledWith(1, mockConfig);
    });
  });

  describe("saveModelAction", () => {
    it("should save a new model", async () => {
      const modelConfig: ModelConfig = { name: "test", type: "llama", status: "idle", model_path: "/path/to/model" };
      (db.saveModel as jest.Mock).mockResolvedValue(1);

      const result = await saveModelAction(modelConfig);

      expect(result).toBe(1);
      expect(db.saveModel).toHaveBeenCalledWith(modelConfig);
    });

    it("should return new model ID", async () => {
      const modelConfig: ModelConfig = { name: "test", type: "llama", status: "idle", model_path: "/path/to/model" };
      (db.saveModel as jest.Mock).mockResolvedValue(42);

      const result = await saveModelAction(modelConfig);

      expect(result).toBe(42);
    });
  });

  describe("updateModelAction", () => {
    it("should update a model", async () => {
      const updates: Partial<ModelConfig> = { status: "running" };
      (db.updateModel as jest.Mock).mockResolvedValue(undefined);

      await updateModelAction(1, updates);

      expect(db.updateModel).toHaveBeenCalledWith(1, updates);
    });

    it("should handle partial updates", async () => {
      const updates: Partial<ModelConfig> = { status: "idle" };
      (db.updateModel as jest.Mock).mockResolvedValue(undefined);

      await updateModelAction(1, updates);

      expect(db.updateModel).toHaveBeenCalledWith(1, updates);
    });
  });

  describe("deleteModelAction", () => {
    it("should delete a model", async () => {
      (db.deleteModel as jest.Mock).mockResolvedValue(undefined);

      await deleteModelAction(1);

      expect(db.deleteModel).toHaveBeenCalledWith(1);
    });

    it("should handle deletion of non-existent model", async () => {
      (db.deleteModel as jest.Mock).mockResolvedValue(undefined);

      await expect(deleteModelAction(999)).resolves.not.toThrow();
    });
  });

  describe("Error handling", () => {
    it("should handle database errors in getModelsAction", async () => {
      const error = new Error("Database connection failed");
      (db.getModels as jest.Mock).mockRejectedValue(error);

      await expect(getModelsAction()).rejects.toEqual(error);
    });

    it("should handle database errors in getModelByIdAction", async () => {
      const error = new Error("Database connection failed");
      (db.getModelById as jest.Mock).mockRejectedValue(error);

      await expect(getModelByIdAction(1)).rejects.toEqual(error);
    });

    it("should handle database errors in saveModelAction", async () => {
      const modelConfig: ModelConfig = { name: "test", type: "llama", status: "idle", model_path: "/path" };
      const error = new Error("Save failed");
      (db.saveModel as jest.Mock).mockRejectedValue(error);

      await expect(saveModelAction(modelConfig)).rejects.toEqual(error);
    });
  });

  describe("Integration workflows", () => {
    it("should support full CRUD workflow", async () => {
      // Create
      const newModel: ModelConfig = { name: "test", type: "llama", status: "idle", model_path: "/path" };
      (db.saveModel as jest.Mock).mockResolvedValue(1);
      const modelId = await saveModelAction(newModel);
      expect(modelId).toBe(1);

      // Read
      const mockModel: ModelConfig = { id: 1, name: "test", type: "llama", status: "idle", model_path: "/path" };
      (db.getModelById as jest.Mock).mockResolvedValue(mockModel);
      const retrievedModel = await getModelByIdAction(1);
      expect(retrievedModel).toEqual(mockModel);

      // Update
      const updates: Partial<ModelConfig> = { status: "running" };
      (db.updateModel as jest.Mock).mockResolvedValue(undefined);
      await updateModelAction(1, updates);
      expect(db.updateModel).toHaveBeenCalledWith(1, updates);

      // Delete
      (db.deleteModel as jest.Mock).mockResolvedValue(undefined);
      await deleteModelAction(1);
      expect(db.deleteModel).toHaveBeenCalledWith(1);
    });

    it("should support config management workflow", async () => {
      const modelId = 1;

      // Save sampling config
      const samplingConfig: ModelSamplingConfig = { temperature: 0.7, top_p: 0.9 };
      (db.saveModelSamplingConfig as jest.Mock).mockResolvedValue(1);
      await saveModelSamplingConfigAction(modelId, samplingConfig);
      expect(db.saveModelSamplingConfig).toHaveBeenCalledWith(modelId, samplingConfig);

      // Get sampling config
      (db.getModelSamplingConfig as jest.Mock).mockResolvedValue({ id: 1, model_id: 1, ...samplingConfig });
      const retrievedConfig = await getModelSamplingConfigAction(modelId);
      expect(retrievedConfig).toEqual({ id: 1, model_id: 1, ...samplingConfig });
    });
  });
});
