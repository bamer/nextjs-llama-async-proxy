import { loadModelConfig } from "@/actions/config-actions";
import * as db from "@/lib/database";

jest.mock("@/lib/database");

describe("config-actions - edge cases", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("Edge cases", () => {
    it("should handle zero model ID", async () => {
      (db.getModelSamplingConfig as jest.Mock).mockResolvedValue(null);

      const result = await loadModelConfig(0, "sampling");

      expect(result).toBeNull();
      expect(db.getModelSamplingConfig).toHaveBeenCalledWith(0);
    });

    it("should handle negative model ID", async () => {
      (db.getModelSamplingConfig as jest.Mock).mockResolvedValue(null);

      const result = await loadModelConfig(-1, "sampling");

      expect(result).toBeNull();
      expect(db.getModelSamplingConfig).toHaveBeenCalledWith(-1);
    });

    it("should handle very large model ID", async () => {
      (db.getModelSamplingConfig as jest.Mock).mockResolvedValue(null);

      const result = await loadModelConfig(
        Number.MAX_SAFE_INTEGER,
        "sampling"
      );

      expect(result).toBeNull();
      expect(db.getModelSamplingConfig).toHaveBeenCalledWith(
        Number.MAX_SAFE_INTEGER
      );
    });

    it("should handle concurrent requests", async () => {
      (db.getModelSamplingConfig as jest.Mock).mockResolvedValue({
        id: 1,
        model_id: 1,
      });
      (db.getModelMemoryConfig as jest.Mock).mockResolvedValue({
        id: 2,
        model_id: 1,
      });
      (db.getModelGpuConfig as jest.Mock).mockResolvedValue({
        id: 3,
        model_id: 1,
      });

      const results = await Promise.all([
        loadModelConfig(1, "sampling"),
        loadModelConfig(1, "memory"),
        loadModelConfig(1, "gpu"),
      ]);

      expect(results).toHaveLength(3);
    });
  });
});
