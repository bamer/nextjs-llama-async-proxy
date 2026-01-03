import { saveModelConfig } from "@/actions/config-actions";
import * as db from "@/lib/database";

jest.mock("@/lib/database");

describe("config-actions - save config part 1", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("saveModelConfig with sampling", () => {
    it("should save sampling config successfully", async () => {
      const mockConfig: Record<string, unknown> = {
        temperature: 0.7,
        top_p: 0.9,
      };
      (db.saveModelSamplingConfig as jest.Mock).mockResolvedValue(1);

      await saveModelConfig(1, "sampling", mockConfig);

      expect(db.saveModelSamplingConfig).toHaveBeenCalledWith(1, mockConfig);
    });

    it("should handle save errors for sampling config", async () => {
      const mockConfig: Record<string, unknown> = { test: 1 };
      const error = new Error("Save failed");
      (db.saveModelSamplingConfig as jest.Mock).mockRejectedValue(error);

      await expect(
        saveModelConfig(1, "sampling", mockConfig)
      ).rejects.toThrow("Save failed");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error saving sampling config:",
        error
      );
    });

    it("should handle different config values for sampling", async () => {
      const configs = [
        { temperature: 0.5 },
        { temperature: 0.7 },
        { temperature: 0.9 },
      ];

      (db.saveModelSamplingConfig as jest.Mock)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(3);

      await Promise.all(
        configs.map((config) => saveModelConfig(1, "sampling", config))
      );

      expect(db.saveModelSamplingConfig).toHaveBeenCalledTimes(3);
    });
  });

  describe("saveModelConfig with memory", () => {
    it("should save memory config successfully", async () => {
      const mockConfig: Record<string, unknown> = {
        cache_ram: 1000,
        mmap: 1,
      };
      (db.saveModelMemoryConfig as jest.Mock).mockResolvedValue(1);

      await saveModelConfig(1, "memory", mockConfig);

      expect(db.saveModelMemoryConfig).toHaveBeenCalledWith(1, mockConfig);
    });

    it("should handle save errors for memory config", async () => {
      const mockConfig: Record<string, unknown> = { test: 1 };
      const error = new Error("Save failed");
      (db.saveModelMemoryConfig as jest.Mock).mockRejectedValue(error);

      await expect(
        saveModelConfig(1, "memory", mockConfig)
      ).rejects.toThrow("Save failed");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error saving memory config:",
        error
      );
    });

    it("should handle different config values for memory", async () => {
      const configs = [
        { cache_ram: 500 },
        { cache_ram: 1000 },
        { cache_ram: 2000 },
      ];

      (db.saveModelMemoryConfig as jest.Mock)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(3);

      await Promise.all(
        configs.map((config) => saveModelConfig(1, "memory", config))
      );

      expect(db.saveModelMemoryConfig).toHaveBeenCalledTimes(3);
    });
  });

  describe("saveModelConfig with gpu", () => {
    it("should save gpu config successfully", async () => {
      const mockConfig: Record<string, unknown> = {
        gpu_layers: 20,
        device: "cuda",
      };
      (db.saveModelGpuConfig as jest.Mock).mockResolvedValue(1);

      await saveModelConfig(1, "gpu", mockConfig);

      expect(db.saveModelGpuConfig).toHaveBeenCalledWith(1, mockConfig);
    });

    it("should handle save errors for gpu config", async () => {
      const mockConfig: Record<string, unknown> = { test: 1 };
      const error = new Error("Save failed");
      (db.saveModelGpuConfig as jest.Mock).mockRejectedValue(error);

      await expect(
        saveModelConfig(1, "gpu", mockConfig)
      ).rejects.toThrow("Save failed");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error saving gpu config:",
        error
      );
    });

    it("should handle different config values for gpu", async () => {
      const configs = [
        { gpu_layers: 10 },
        { gpu_layers: 20 },
        { gpu_layers: 30 },
      ];

      (db.saveModelGpuConfig as jest.Mock)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(3);

      await Promise.all(
        configs.map((config) => saveModelConfig(1, "gpu", config))
      );

      expect(db.saveModelGpuConfig).toHaveBeenCalledTimes(3);
    });
  });
});
