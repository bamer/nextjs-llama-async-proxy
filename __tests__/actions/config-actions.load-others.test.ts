import { loadModelConfig } from "@/actions/config-actions";
import * as db from "@/lib/database";

jest.mock("@/lib/database");

describe("config-actions - load other configs", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("loadModelConfig with advanced", () => {
    it("should load advanced config successfully", async () => {
      const mockConfig = {
        id: 1,
        model_id: 1,
        kv_unified: 1,
      };
      (db.getModelAdvancedConfig as jest.Mock).mockResolvedValue(mockConfig);

      const result = await loadModelConfig(1, "advanced");

      expect(result).toEqual(mockConfig);
      expect(db.getModelAdvancedConfig).toHaveBeenCalledWith(1);
    });

    it("should return null when advanced config not found", async () => {
      (db.getModelAdvancedConfig as jest.Mock).mockResolvedValue(null);

      const result = await loadModelConfig(999, "advanced");

      expect(result).toBeNull();
      expect(db.getModelAdvancedConfig).toHaveBeenCalledWith(999);
    });

    it("should handle database errors when loading advanced config", async () => {
      const error = new Error("Database connection failed");
      (db.getModelAdvancedConfig as jest.Mock).mockRejectedValue(error);

      await expect(loadModelConfig(1, "advanced")).rejects.toThrow(
        "Database connection failed"
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error loading advanced config:",
        error
      );
    });
  });

  describe("loadModelConfig with lora", () => {
    it("should load lora config successfully", async () => {
      const mockConfig = {
        id: 1,
        model_id: 1,
        lora: "/path/to/lora",
      };
      (db.getModelLoraConfig as jest.Mock).mockResolvedValue(mockConfig);

      const result = await loadModelConfig(1, "lora");

      expect(result).toEqual(mockConfig);
      expect(db.getModelLoraConfig).toHaveBeenCalledWith(1);
    });

    it("should return null when lora config not found", async () => {
      (db.getModelLoraConfig as jest.Mock).mockResolvedValue(null);

      const result = await loadModelConfig(999, "lora");

      expect(result).toBeNull();
      expect(db.getModelLoraConfig).toHaveBeenCalledWith(999);
    });

    it("should handle database errors when loading lora config", async () => {
      const error = new Error("Database connection failed");
      (db.getModelLoraConfig as jest.Mock).mockRejectedValue(error);

      await expect(loadModelConfig(1, "lora")).rejects.toThrow(
        "Database connection failed"
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error loading lora config:",
        error
      );
    });
  });

  describe("loadModelConfig with multimodal", () => {
    it("should load multimodal config successfully", async () => {
      const mockConfig = {
        id: 1,
        model_id: 1,
        mmproj: "/path/to/mmproj",
      };
      (db.getModelMultimodalConfig as jest.Mock).mockResolvedValue(mockConfig);

      const result = await loadModelConfig(1, "multimodal");

      expect(result).toEqual(mockConfig);
      expect(db.getModelMultimodalConfig).toHaveBeenCalledWith(1);
    });

    it("should return null when multimodal config not found", async () => {
      (db.getModelMultimodalConfig as jest.Mock).mockResolvedValue(null);

      const result = await loadModelConfig(999, "multimodal");

      expect(result).toBeNull();
      expect(db.getModelMultimodalConfig).toHaveBeenCalledWith(999);
    });

    it("should handle database errors when loading multimodal config", async () => {
      const error = new Error("Database connection failed");
      (db.getModelMultimodalConfig as jest.Mock).mockRejectedValue(error);

      await expect(loadModelConfig(1, "multimodal")).rejects.toThrow(
        "Database connection failed"
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error loading multimodal config:",
        error
      );
    });
  });

  it("should throw error for invalid config type", async () => {
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      loadModelConfig(1, "invalid" as any)
    ).rejects.toThrow("Invalid config type: invalid");
  });

  it("should throw error with correct message for invalid config type", async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await loadModelConfig(1, "unknown" as any);
      fail("Expected error to be thrown");
    } catch (error) {
      expect((error as Error).message).toBe("Invalid config type: unknown");
    }
  });

  it("should handle multiple sequential calls to loadModelConfig", async () => {
    const mockSamplingConfig = { id: 1, model_id: 1, temperature: 0.7 };
    const mockMemoryConfig = { id: 2, model_id: 1, cache_ram: 1000 };

    (db.getModelSamplingConfig as jest.Mock).mockResolvedValue(
      mockSamplingConfig
    );
    (db.getModelMemoryConfig as jest.Mock).mockResolvedValue(mockMemoryConfig);

    const samplingResult = await loadModelConfig(1, "sampling");
    const memoryResult = await loadModelConfig(1, "memory");

    expect(samplingResult).toEqual(mockSamplingConfig);
    expect(memoryResult).toEqual(mockMemoryConfig);
  });
});
