import { saveModelConfig } from "@/actions/config-actions";
import * as db from "@/lib/database";

jest.mock("@/lib/database");

describe("config-actions - save config part 2", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("saveModelConfig with advanced", () => {
    it("should save advanced config successfully", async () => {
      const mockConfig: Record<string, unknown> = {
        kv_unified: 1,
        pooling: "none",
      };
      (db.saveModelAdvancedConfig as jest.Mock).mockResolvedValue(1);

      await saveModelConfig(1, "advanced", mockConfig);

      expect(db.saveModelAdvancedConfig).toHaveBeenCalledWith(1, mockConfig);
    });

    it("should handle save errors for advanced config", async () => {
      const mockConfig: Record<string, unknown> = { test: 1 };
      const error = new Error("Save failed");
      (db.saveModelAdvancedConfig as jest.Mock).mockRejectedValue(error);

      await expect(
        saveModelConfig(1, "advanced", mockConfig)
      ).rejects.toThrow("Save failed");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error saving advanced config:",
        error
      );
    });

    it("should handle different config values for advanced", async () => {
      const configs = [
        { kv_unified: 0 },
        { kv_unified: 1 },
        { kv_unified: 2 },
      ];

      (db.saveModelAdvancedConfig as jest.Mock)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(3);

      await Promise.all(
        configs.map((config) => saveModelConfig(1, "advanced", config))
      );

      expect(db.saveModelAdvancedConfig).toHaveBeenCalledTimes(3);
    });
  });

  describe("saveModelConfig with lora", () => {
    it("should save lora config successfully", async () => {
      const mockConfig: Record<string, unknown> = {
        lora: "/path/to/lora",
        lora_scaled: "1.0",
      };
      (db.saveModelLoraConfig as jest.Mock).mockResolvedValue(1);

      await saveModelConfig(1, "lora", mockConfig);

      expect(db.saveModelLoraConfig).toHaveBeenCalledWith(1, mockConfig);
    });

    it("should handle save errors for lora config", async () => {
      const mockConfig: Record<string, unknown> = { test: 1 };
      const error = new Error("Save failed");
      (db.saveModelLoraConfig as jest.Mock).mockRejectedValue(error);

      await expect(
        saveModelConfig(1, "lora", mockConfig)
      ).rejects.toThrow("Save failed");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error saving lora config:",
        error
      );
    });

    it("should handle different config values for lora", async () => {
      const configs = [
        { lora: "/path1" },
        { lora: "/path2" },
        { lora: "/path3" },
      ];

      (db.saveModelLoraConfig as jest.Mock)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(3);

      await Promise.all(
        configs.map((config) => saveModelConfig(1, "lora", config))
      );

      expect(db.saveModelLoraConfig).toHaveBeenCalledTimes(3);
    });
  });

  describe("saveModelConfig with multimodal", () => {
    it("should save multimodal config successfully", async () => {
      const mockConfig: Record<string, unknown> = {
        mmproj: "/path/to/mmproj",
        mmproj_auto: 1,
      };
      (db.saveModelMultimodalConfig as jest.Mock).mockResolvedValue(1);

      await saveModelConfig(1, "multimodal", mockConfig);

      expect(db.saveModelMultimodalConfig).toHaveBeenCalledWith(1, mockConfig);
    });

    it("should handle save errors for multimodal config", async () => {
      const mockConfig: Record<string, unknown> = { test: 1 };
      const error = new Error("Save failed");
      (db.saveModelMultimodalConfig as jest.Mock).mockRejectedValue(error);

      await expect(
        saveModelConfig(1, "multimodal", mockConfig)
      ).rejects.toThrow("Save failed");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error saving multimodal config:",
        error
      );
    });

    it("should handle different config values for multimodal", async () => {
      const configs = [
        { mmproj: "/path1" },
        { mmproj: "/path2" },
        { mmproj: "/path3" },
      ];

      (db.saveModelMultimodalConfig as jest.Mock)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(3);

      await Promise.all(
        configs.map((config) => saveModelConfig(1, "multimodal", config))
      );

      expect(db.saveModelMultimodalConfig).toHaveBeenCalledTimes(3);
    });
  });
});
