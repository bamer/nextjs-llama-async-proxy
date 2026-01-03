import { loadModelConfig } from "@/actions/config-actions";
import * as db from "@/lib/database";

jest.mock("@/lib/database");

describe("config-actions - load memory and gpu config", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("loadModelConfig with memory", () => {
    it("should load memory config successfully", async () => {
      const mockConfig = {
        id: 1,
        model_id: 1,
        cache_ram: 1000,
      };
      (db.getModelMemoryConfig as jest.Mock).mockResolvedValue(mockConfig);

      const result = await loadModelConfig(1, "memory");

      expect(result).toEqual(mockConfig);
      expect(db.getModelMemoryConfig).toHaveBeenCalledWith(1);
    });

    it("should return null when memory config not found", async () => {
      (db.getModelMemoryConfig as jest.Mock).mockResolvedValue(null);

      const result = await loadModelConfig(999, "memory");

      expect(result).toBeNull();
      expect(db.getModelMemoryConfig).toHaveBeenCalledWith(999);
    });

    it("should handle database errors when loading memory config", async () => {
      const error = new Error("Database connection failed");
      (db.getModelMemoryConfig as jest.Mock).mockRejectedValue(error);

      await expect(loadModelConfig(1, "memory")).rejects.toThrow(
        "Database connection failed"
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error loading memory config:",
        error
      );
    });
  });

  describe("loadModelConfig with gpu", () => {
    it("should load gpu config successfully", async () => {
      const mockConfig = {
        id: 1,
        model_id: 1,
        gpu_layers: 20,
      };
      (db.getModelGpuConfig as jest.Mock).mockResolvedValue(mockConfig);

      const result = await loadModelConfig(1, "gpu");

      expect(result).toEqual(mockConfig);
      expect(db.getModelGpuConfig).toHaveBeenCalledWith(1);
    });

    it("should return null when gpu config not found", async () => {
      (db.getModelGpuConfig as jest.Mock).mockResolvedValue(null);

      const result = await loadModelConfig(999, "gpu");

      expect(result).toBeNull();
      expect(db.getModelGpuConfig).toHaveBeenCalledWith(999);
    });

    it("should handle database errors when loading gpu config", async () => {
      const error = new Error("Database connection failed");
      (db.getModelGpuConfig as jest.Mock).mockRejectedValue(error);

      await expect(loadModelConfig(1, "gpu")).rejects.toThrow(
        "Database connection failed"
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error loading gpu config:",
        error
      );
    });
  });
});
