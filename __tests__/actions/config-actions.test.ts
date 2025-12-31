import {
  loadModelConfig,
  saveModelConfig,
} from "@/actions/config-actions";
import * as db from "@/lib/database";

jest.mock("@/lib/database");

// Spy on console.error
const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

describe("config-actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockClear();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("loadModelConfig", () => {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any - Testing runtime validation
      await expect(
        loadModelConfig(1, "invalid" as any)
      ).rejects.toThrow("Invalid config type: invalid");
    });

    it("should throw error with correct message for invalid config type", async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any - Testing runtime validation
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
      (db.getModelMemoryConfig as jest.Mock).mockResolvedValue(
        mockMemoryConfig
      );

      const samplingResult = await loadModelConfig(1, "sampling");
      const memoryResult = await loadModelConfig(1, "memory");

      expect(samplingResult).toEqual(mockSamplingConfig);
      expect(memoryResult).toEqual(mockMemoryConfig);
    });
  });

  describe("saveModelConfig", () => {
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

        expect(db.saveModelMultimodalConfig).toHaveBeenCalledWith(
          1,
          mockConfig
        );
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

    it("should throw error for invalid config type in save", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any - Testing runtime validation
      await expect(
        saveModelConfig(1, "invalid" as any, {})
      ).rejects.toThrow("Invalid config type: invalid");
    });

    it("should throw error with correct message for invalid config type", async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any - Testing runtime validation
        await saveModelConfig(1, "unknown" as any, {});
        fail("Expected error to be thrown");
      } catch (error) {
        expect((error as Error).message).toBe("Invalid config type: unknown");
      }
    });

    it("should handle empty config objects", async () => {
      (db.saveModelSamplingConfig as jest.Mock).mockResolvedValue(1);

      await expect(
        saveModelConfig(1, "sampling", {})
      ).resolves.not.toThrow();

      expect(db.saveModelSamplingConfig).toHaveBeenCalledWith(1, {});
    });

    it("should handle null/undefined values in config", async () => {
      const configWithNulls = {
        temperature: null,
        top_p: undefined,
      };
      (db.saveModelSamplingConfig as jest.Mock).mockResolvedValue(1);

      await saveModelConfig(1, "sampling", configWithNulls);

      expect(db.saveModelSamplingConfig).toHaveBeenCalledWith(
        1,
        configWithNulls
      );
    });

    it("should handle complex nested config objects", async () => {
      const complexConfig = {
        nested: {
          value: 1,
          array: [1, 2, 3],
        },
        string: "test",
        boolean: true,
        number: 123,
      };
      (db.saveModelSamplingConfig as jest.Mock).mockResolvedValue(1);

      await saveModelConfig(1, "sampling", complexConfig);

      expect(db.saveModelSamplingConfig).toHaveBeenCalledWith(1, complexConfig);
    });

    it("should handle transaction-like scenarios", async () => {
      (db.saveModelSamplingConfig as jest.Mock).mockResolvedValue(1);
      (db.saveModelMemoryConfig as jest.Mock).mockResolvedValue(2);
      (db.saveModelGpuConfig as jest.Mock).mockResolvedValue(3);

      await Promise.all([
        saveModelConfig(1, "sampling", { temp: 0.7 }),
        saveModelConfig(1, "memory", { cache_ram: 1000 }),
        saveModelConfig(1, "gpu", { gpu_layers: 20 }),
      ]);

      expect(db.saveModelSamplingConfig).toHaveBeenCalled();
      expect(db.saveModelMemoryConfig).toHaveBeenCalled();
      expect(db.saveModelGpuConfig).toHaveBeenCalled();
    });
  });

  describe("Error handling and logging", () => {
    it("should log error when loading config fails", async () => {
      const error = new Error("Load error");
      (db.getModelSamplingConfig as jest.Mock).mockRejectedValue(error);

      try {
        await loadModelConfig(1, "sampling");
        fail("Expected error to be thrown");
      } catch (_e) {
        // Error should be thrown and logged
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Error loading sampling config:",
          error
        );
      }
    });

    it("should log error when saving config fails", async () => {
      const error = new Error("Save error");
      (db.saveModelSamplingConfig as jest.Mock).mockRejectedValue(error);

      try {
        await saveModelConfig(1, "sampling", {});
        fail("Expected error to be thrown");
      } catch (_e) {
        // Error should be thrown and logged
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Error saving sampling config:",
          error
        );
      }
    });

    it("should preserve original error stack trace", async () => {
      const originalError = new Error("Original error");
      (db.getModelSamplingConfig as jest.Mock).mockRejectedValue(originalError);

      try {
        await loadModelConfig(1, "sampling");
        fail("Expected error to be thrown");
      } catch (error) {
        expect((error as Error).stack).toBeDefined();
        expect((error as Error).message).toBe("Original error");
      }
    });
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

      const result = await loadModelConfig(Number.MAX_SAFE_INTEGER, "sampling");

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
