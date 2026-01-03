import { loadModelConfig } from "@/actions/config-actions";
import * as db from "@/lib/database";

jest.mock("@/lib/database");

describe("config-actions - load sampling config", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("loadModelConfig with sampling", () => {
    it("should load sampling config successfully", async () => {
      const mockConfig = {
        id: 1,
        model_id: 1,
        temperature: 0.7,
      };
      (db.getModelSamplingConfig as jest.Mock).mockResolvedValue(mockConfig);

      const result = await loadModelConfig(1, "sampling");

      expect(result).toEqual(mockConfig);
      expect(db.getModelSamplingConfig).toHaveBeenCalledWith(1);
    });

    it("should return null when sampling config not found", async () => {
      (db.getModelSamplingConfig as jest.Mock).mockResolvedValue(null);

      const result = await loadModelConfig(999, "sampling");

      expect(result).toBeNull();
      expect(db.getModelSamplingConfig).toHaveBeenCalledWith(999);
    });

    it("should handle database errors when loading sampling config", async () => {
      const error = new Error("Database connection failed");
      (db.getModelSamplingConfig as jest.Mock).mockRejectedValue(error);

      await expect(loadModelConfig(1, "sampling")).rejects.toThrow(
        "Database connection failed"
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error loading sampling config:",
        error
      );
    });

    it("should handle different model IDs for sampling config", async () => {
      const mockConfigs = [
        { id: 1, model_id: 1, value: 1 },
        { id: 2, model_id: 2, value: 2 },
        { id: 3, model_id: 3, value: 3 },
      ];

      (db.getModelSamplingConfig as jest.Mock)
        .mockResolvedValueOnce(mockConfigs[0])
        .mockResolvedValueOnce(mockConfigs[1])
        .mockResolvedValueOnce(mockConfigs[2]);

      const results = await Promise.all([
        loadModelConfig(1, "sampling"),
        loadModelConfig(2, "sampling"),
        loadModelConfig(3, "sampling"),
      ]);

      expect(results).toEqual(mockConfigs);
      expect(db.getModelSamplingConfig).toHaveBeenCalledTimes(3);
    });
  });
});
