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

jest.mock("@/lib/database");

describe("model-actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getModelsAction", () => {
    it("should get all models", async () => {
      const mockModels = [
        { id: 1, name: "model1", type: "llama", status: "idle" },
        { id: 2, name: "model2", type: "mistral", status: "running" },
      ];
      (db.getModels as jest.Mock).mockResolvedValue(mockModels);

      const result = await getModelsAction();

      expect(result).toEqual(mockModels);
      expect(db.getModels).toHaveBeenCalledWith(undefined);
    });

    it("should get models with filters", async () => {
      const mockModels = [{ id: 1, name: "model1", type: "llama", status: "idle" }];
      const filters = { status: "idle" };
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
      const mockModel = { id: 1, name: "model1", type: "llama", status: "idle" };
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
      const mockConfig = { id: 1, model_id: 1, temp: 0.7 };
      (db.getModelSamplingConfig as jest.Mock).mockResolvedValue(mockConfig);

      const result = await getModelSamplingConfigAction(1);

      expect(result).toEqual(mockConfig);
      expect(db.getModelSamplingConfig).toHaveBeenCalledWith(1);
    });

    it("getModelMemoryConfigAction should call database function", async () => {
      const mockConfig = { id: 1, model_id: 1, batch_size: 512 };
      (db.getModelMemoryConfig as jest.Mock).mockResolvedValue(mockConfig);

      const result = await getModelMemoryConfigAction(1);

      expect(result).toEqual(mockConfig);
      expect(db.getModelMemoryConfig).toHaveBeenCalledWith(1);
    });

    it("getModelGpuConfigAction should call database function", async () => {
      const mockConfig = { id: 1, model_id: 1, gpu_enabled: true };
      (db.getModelGpuConfig as jest.Mock).mockResolvedValue(mockConfig);

      const result = await getModelGpuConfigAction(1);

      expect(result).toEqual(mockConfig);
      expect(db.getModelGpuConfig).toHaveBeenCalledWith(1);
    });

    it("getModelAdvancedConfigAction should call database function", async () => {
      const mockConfig = { id: 1, model_id: 1, custom: "value" };
      (db.getModelAdvancedConfig as jest.Mock).mockResolvedValue(mockConfig);

      const result = await getModelAdvancedConfigAction(1);

      expect(result).toEqual(mockConfig);
      expect(db.getModelAdvancedConfig).toHaveBeenCalledWith(1);
    });

    it("getModelLoraConfigAction should call database function", async () => {
      const mockConfig = { id: 1, model_id: 1, lora_enabled: true };
      (db.getModelLoraConfig as jest.Mock).mockResolvedValue(mockConfig);

      const result = await getModelLoraConfigAction(1);

      expect(result).toEqual(mockConfig);
      expect(db.getModelLoraConfig).toHaveBeenCalledWith(1);
    });

    it("getModelMultimodalConfigAction should call database function", async () => {
      const mockConfig = { id: 1, model_id: 1, vision_enabled: true };
      (db.getModelMultimodalConfig as jest.Mock).mockResolvedValue(mockConfig);

      const result = await getModelMultimodalConfigAction(1);

      expect(result).toEqual(mockConfig);
      expect(db.getModelMultimodalConfig).toHaveBeenCalledWith(1);
    });
  });

  describe("save config actions", () => {
    it("saveModelSamplingConfigAction should call database function", async () => {
      const mockConfig = { temp: 0.7 };
      (db.saveModelSamplingConfig as jest.Mock).mockResolvedValue(1);

      const result = await saveModelSamplingConfigAction(1, mockConfig);

      expect(result).toBe(1);
      expect(db.saveModelSamplingConfig).toHaveBeenCalledWith(1, mockConfig);
    });

    it("saveModelMemoryConfigAction should call database function", async () => {
      const mockConfig = { batch_size: 512 };
      (db.saveModelMemoryConfig as jest.Mock).mockResolvedValue(2);

      const result = await saveModelMemoryConfigAction(1, mockConfig);

      expect(result).toBe(2);
      expect(db.saveModelMemoryConfig).toHaveBeenCalledWith(1, mockConfig);
    });

    it("saveModelGpuConfigAction should call database function", async () => {
      const mockConfig = { gpu_enabled: true };
      (db.saveModelGpuConfig as jest.Mock).mockResolvedValue(3);

      const result = await saveModelGpuConfigAction(1, mockConfig);

      expect(result).toBe(3);
      expect(db.saveModelGpuConfig).toHaveBeenCalledWith(1, mockConfig);
    });

    it("saveModelAdvancedConfigAction should call database function", async () => {
      const mockConfig = { custom: "value" };
      (db.saveModelAdvancedConfig as jest.Mock).mockResolvedValue(4);

      const result = await saveModelAdvancedConfigAction(1, mockConfig);

      expect(result).toBe(4);
      expect(db.saveModelAdvancedConfig).toHaveBeenCalledWith(1, mockConfig);
    });

    it("saveModelLoraConfigAction should call database function", async () => {
      const mockConfig = { lora_enabled: true };
      (db.saveModelLoraConfig as jest.Mock).mockResolvedValue(5);

      const result = await saveModelLoraConfigAction(1, mockConfig);

      expect(result).toBe(5);
      expect(db.saveModelLoraConfig).toHaveBeenCalledWith(1, mockConfig);
    });

    it("saveModelMultimodalConfigAction should call database function", async () => {
      const mockConfig = { vision_enabled: true };
      (db.saveModelMultimodalConfig as jest.Mock).mockResolvedValue(6);

      const result = await saveModelMultimodalConfigAction(1, mockConfig);

      expect(result).toBe(6);
      expect(db.saveModelMultimodalConfig).toHaveBeenCalledWith(1, mockConfig);
    });
  });

  describe("saveModelAction", () => {
    it("should save a new model", async () => {
      const modelConfig = { name: "test", type: "llama", status: "idle" };
      (db.saveModel as jest.Mock).mockResolvedValue(1);

      const result = await saveModelAction(modelConfig);

      expect(result).toBe(1);
      expect(db.saveModel).toHaveBeenCalledWith(modelConfig);
    });

    it("should return new model ID", async () => {
      const modelConfig = { name: "test", type: "llama", status: "idle" };
      (db.saveModel as jest.Mock).mockResolvedValue(42);

      const result = await saveModelAction(modelConfig);

      expect(result).toBe(42);
    });
  });

  describe("updateModelAction", () => {
    it("should update a model", async () => {
      const updates = { status: "running" };
      (db.updateModel as jest.Mock).mockResolvedValue(undefined);

      await updateModelAction(1, updates);

      expect(db.updateModel).toHaveBeenCalledWith(1, updates);
    });

    it("should handle partial updates", async () => {
      const updates = { status: "idle", updated_at: new Date().toISOString() };
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
});
