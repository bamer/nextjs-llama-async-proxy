import {
  loadModelConfig,
  saveModelConfig,
} from "@/actions/config-actions";
import * as db from "@/lib/database";

jest.mock("@/lib/database");

describe("config-actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loadModelConfig", () => {
    it("should load sampling config", async () => {
      const mockConfig = { id: 1, model_id: 1, temp: 0.7 };
      (db.getModelSamplingConfig as jest.Mock).mockResolvedValue(mockConfig);

      const result = await loadModelConfig(1, "sampling");

      expect(result).toEqual(mockConfig);
      expect(db.getModelSamplingConfig).toHaveBeenCalledWith(1);
    });

    it("should load memory config", async () => {
      const mockConfig = { id: 1, model_id: 1, batch_size: 512 };
      (db.getModelMemoryConfig as jest.Mock).mockResolvedValue(mockConfig);

      const result = await loadModelConfig(1, "memory");

      expect(result).toEqual(mockConfig);
      expect(db.getModelMemoryConfig).toHaveBeenCalledWith(1);
    });

    it("should load gpu config", async () => {
      const mockConfig = { id: 1, model_id: 1, gpu_enabled: true };
      (db.getModelGpuConfig as jest.Mock).mockResolvedValue(mockConfig);

      const result = await loadModelConfig(1, "gpu");

      expect(result).toEqual(mockConfig);
      expect(db.getModelGpuConfig).toHaveBeenCalledWith(1);
    });

    it("should load advanced config", async () => {
      const mockConfig = { id: 1, model_id: 1, custom_param: "value" };
      (db.getModelAdvancedConfig as jest.Mock).mockResolvedValue(mockConfig);

      const result = await loadModelConfig(1, "advanced");

      expect(result).toEqual(mockConfig);
      expect(db.getModelAdvancedConfig).toHaveBeenCalledWith(1);
    });

    it("should load lora config", async () => {
      const mockConfig = { id: 1, model_id: 1, lora_enabled: true };
      (db.getModelLoraConfig as jest.Mock).mockResolvedValue(mockConfig);

      const result = await loadModelConfig(1, "lora");

      expect(result).toEqual(mockConfig);
      expect(db.getModelLoraConfig).toHaveBeenCalledWith(1);
    });

    it("should load multimodal config", async () => {
      const mockConfig = { id: 1, model_id: 1, vision_enabled: true };
      (db.getModelMultimodalConfig as jest.Mock).mockResolvedValue(mockConfig);

      const result = await loadModelConfig(1, "multimodal");

      expect(result).toEqual(mockConfig);
      expect(db.getModelMultimodalConfig).toHaveBeenCalledWith(1);
    });

    it("should throw error for invalid config type", async () => {
      await expect(
        loadModelConfig(1, "invalid" as any)
      ).rejects.toThrow("Invalid config type: invalid");
    });
  });

  describe("saveModelConfig", () => {
    it("should save sampling config", async () => {
      const mockConfig = { temp: 0.7, top_p: 0.9 };
      (db.saveModelSamplingConfig as jest.Mock).mockResolvedValue(undefined);

      await saveModelConfig(1, "sampling", mockConfig);

      expect(db.saveModelSamplingConfig).toHaveBeenCalledWith(1, mockConfig);
    });

    it("should save memory config", async () => {
      const mockConfig = { batch_size: 512, context_size: 2048 };
      (db.saveModelMemoryConfig as jest.Mock).mockResolvedValue(undefined);

      await saveModelConfig(1, "memory", mockConfig);

      expect(db.saveModelMemoryConfig).toHaveBeenCalledWith(1, mockConfig);
    });

    it("should save gpu config", async () => {
      const mockConfig = { gpu_enabled: true, gpu_layers: 20 };
      (db.saveModelGpuConfig as jest.Mock).mockResolvedValue(undefined);

      await saveModelConfig(1, "gpu", mockConfig);

      expect(db.saveModelGpuConfig).toHaveBeenCalledWith(1, mockConfig);
    });

    it("should save advanced config", async () => {
      const mockConfig = { custom_param: "value" };
      (db.saveModelAdvancedConfig as jest.Mock).mockResolvedValue(undefined);

      await saveModelConfig(1, "advanced", mockConfig);

      expect(db.saveModelAdvancedConfig).toHaveBeenCalledWith(1, mockConfig);
    });

    it("should save lora config", async () => {
      const mockConfig = { lora_enabled: true, lora_path: "/path" };
      (db.saveModelLoraConfig as jest.Mock).mockResolvedValue(undefined);

      await saveModelConfig(1, "lora", mockConfig);

      expect(db.saveModelLoraConfig).toHaveBeenCalledWith(1, mockConfig);
    });

    it("should save multimodal config", async () => {
      const mockConfig = { vision_enabled: true };
      (db.saveModelMultimodalConfig as jest.Mock).mockResolvedValue(undefined);

      await saveModelConfig(1, "multimodal", mockConfig);

      expect(db.saveModelMultimodalConfig).toHaveBeenCalledWith(
        1,
        mockConfig
      );
    });

    it("should throw error for invalid config type", async () => {
      await expect(
        saveModelConfig(1, "invalid" as any, {})
      ).rejects.toThrow("Invalid config type: invalid");
    });

    it("should handle save errors", async () => {
      const mockConfig = { temp: 0.7 };
      (db.saveModelSamplingConfig as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        saveModelConfig(1, "sampling", mockConfig)
      ).rejects.toThrow("Database error");
    });
  });
});
