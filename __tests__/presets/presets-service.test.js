/** @jest-environment jsdom */
/**
 * Presets Service Integration Tests
 * Tests for frontend presets service functionality
 */

import {
  jest,
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from "@jest/globals";

// Mock the socket module
const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  connected: true,
};

describe("PresetsService", () => {
  let PresetsService;
  let presetsService;

  beforeAll(async () => {
    // Import the module
    await import("../../public/js/services/presets.js"); // Import for side effects (populating window)
    PresetsService = window.PresetsService; // Access from global window
  });

  beforeEach(() => {
    // Create fresh instance for each test
    presetsService = new PresetsService(mockSocket);
    jest.clearAllMocks();
  });

  describe("listPresets", () => {
    it("should return list of presets", async () => {
      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === "presets:list") {
          callback({
            success: true,
            data: {
              presets: [
                { name: "default", path: "default.ini" },
                { name: "production", path: "production.ini" },
              ],
            },
          });
        }
      });

      const presets = await presetsService.listPresets();

      expect(mockSocket.emit).toHaveBeenCalledWith("presets:list", {}, expect.any(Function));
      expect(presets).toHaveLength(2);
      expect(presets[0].name).toBe("default");
    });

    it("should throw error on failure", async () => {
      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === "presets:list") {
          callback({
            success: false,
            error: { message: "Failed to list presets" },
          });
        }
      });

      await expect(presetsService.listPresets()).rejects.toThrow("Failed to list presets");
    });
  });

  describe("createPreset", () => {
    it("should create new preset", async () => {
      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === "presets:create") {
          callback({
            success: true,
            data: { filename: data.filename, path: `config/${data.filename}.ini` },
          });
        }
      });

      const result = await presetsService.createPreset("new-preset");

      expect(mockSocket.emit).toHaveBeenCalledWith(
        "presets:create",
        { filename: "new-preset", description: "" },
        expect.any(Function)
      );
      expect(result.filename).toBe("new-preset");
    });

    it("should accept description parameter", async () => {
      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === "presets:create") {
          callback({ success: true, data: { filename: data.filename } });
        }
      });

      await presetsService.createPreset("new-preset", "My description");

      expect(mockSocket.emit).toHaveBeenCalledWith(
        "presets:create",
        { filename: "new-preset", description: "My description" },
        expect.any(Function)
      );
    });
  });

  describe("deletePreset", () => {
    it("should delete preset", async () => {
      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === "presets:delete") {
          callback({
            success: true,
            data: { filename: data.filename },
          });
        }
      });

      const result = await presetsService.deletePreset("old-preset");

      expect(mockSocket.emit).toHaveBeenCalledWith(
        "presets:delete",
        { filename: "old-preset" },
        expect.any(Function)
      );
      expect(result.filename).toBe("old-preset");
    });
  });

  describe("savePreset", () => {
    it("should save preset with config", async () => {
      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === "presets:save") {
          callback({
            success: true,
            data: { filename: data.filename, path: `config/${data.filename}.ini` },
          });
        }
      });

      const config = {
        "*": { "ctx-size": "4096", temp: "0.7" },
        "model-name": { model: "/path/to/model.gguf" },
      };

      const result = await presetsService.savePreset("my-preset", config);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        "presets:save",
        { filename: "my-preset", config },
        expect.any(Function)
      );
      expect(result.filename).toBe("my-preset");
    });
  });

  describe("getModelsFromPreset", () => {
    it("should return models with config", async () => {
      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === "presets:get-models") {
          callback({
            success: true,
            data: {
              models: {
                "gpu-models/qwen-7b": {
                  model: "/models/qwen-7b.gguf",
                  ctxSize: 4096,
                  temperature: 0.6,
                  nGpuLayers: 35,
                },
              },
            },
          });
        }
      });

      const models = await presetsService.getModelsFromPreset("default");

      expect(mockSocket.emit).toHaveBeenCalledWith(
        "presets:get-models",
        { filename: "default" },
        expect.any(Function)
      );
      expect(models).toHaveProperty("gpu-models/qwen-7b");
      expect(models["gpu-models/qwen-7b"].ctxSize).toBe(4096);
    });
  });

  describe("getDefaults", () => {
    it("should return global defaults", async () => {
      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === "presets:get-defaults") {
          callback({
            success: true,
            data: {
              defaults: {
                ctxSize: 2048,
                temperature: 0.7,
                nGpuLayers: 0,
                threads: 0,
                batchSize: 512,
              },
            },
          });
        }
      });

      const defaults = await presetsService.getDefaults("default");

      expect(defaults.ctxSize).toBe(2048);
      expect(defaults.temperature).toBe(0.7);
    });
  });

  describe("updateDefaults", () => {
    it("should update global defaults", async () => {
      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === "presets:update-defaults") {
          callback({
            success: true,
            data: {
              filename: data.filename,
              defaults: {
                ctxSize: 4096,
                temperature: 0.8,
              },
            },
          });
        }
      });

      const config = { ctxSize: 4096, temperature: 0.8 };
      const result = await presetsService.updateDefaults("default", config);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        "presets:update-defaults",
        { filename: "default", config },
        expect.any(Function)
      );
      expect(result.defaults.ctxSize).toBe(4096);
    });
  });

  describe("addModel", () => {
    it("should add model to preset", async () => {
      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === "presets:add-model") {
          callback({
            success: true,
            data: {
              filename: data.filename,
              modelName: data.modelName,
              config: data.config,
            },
          });
        }
      });

      const config = {
        model: "/models/new-model.gguf",
        ctxSize: 4096,
        temperature: 0.7,
      };

      const result = await presetsService.addModel("default", "gpu-models/new-model", config);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        "presets:add-model",
        { filename: "default", modelName: "gpu-models/new-model", config },
        expect.any(Function)
      );
      expect(result.modelName).toBe("gpu-models/new-model");
    });
  });

  describe("updateModel", () => {
    it("should update model in preset", async () => {
      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === "presets:update-model") {
          callback({
            success: true,
            data: {
              filename: data.filename,
              modelName: data.modelName,
              config: data.config,
            },
          });
        }
      });

      const config = { temperature: 0.9 };
      const result = await presetsService.updateModel("default", "gpu-models/qwen-7b", config);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        "presets:update-model",
        { filename: "default", modelName: "gpu-models/qwen-7b", config },
        expect.any(Function)
      );
    });
  });

  describe("removeModel", () => {
    it("should remove model from preset", async () => {
      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === "presets:remove-model") {
          callback({
            success: true,
            data: {
              filename: data.filename,
              modelName: data.modelName,
            },
          });
        }
      });

      const result = await presetsService.removeModel("default", "gpu-models/qwen-7b");

      expect(mockSocket.emit).toHaveBeenCalledWith(
        "presets:remove-model",
        { filename: "default", modelName: "gpu-models/qwen-7b" },
        expect.any(Function)
      );
      expect(result.modelName).toBe("gpu-models/qwen-7b");
    });
  });

  describe("validateIni", () => {
    it("should validate INI content", async () => {
      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === "presets:validate") {
          callback({
            success: true,
            data: {
              valid: true,
              errors: [],
              warnings: [],
            },
          });
        }
      });

      const content = `LLAMA_CONFIG_VERSION = 1

[*]
ctx-size = 2048
`;
      const result = await presetsService.validateIni(content);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should return errors for invalid content", async () => {
      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === "presets:validate") {
          callback({
            success: true,
            data: {
              valid: false,
              errors: ["Missing required 'model' parameter"],
              warnings: [],
            },
          });
        }
      });

      const content = `LLAMA_CONFIG_VERSION = 1

[model-name]
ctx-size = 2048
`;
      const result = await presetsService.validateIni(content);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("getAvailableModels", () => {
    it("should return available models from baseModelsPath", async () => {
      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === "presets:available-models") {
          callback({
            success: true,
            data: {
              models: [
                {
                  name: "qwen-7b",
                  path: "/models/qwen-7b.gguf",
                  size: 4294967296,
                  vram: 6448742400,
                },
                {
                  name: "llama3-8b",
                  path: "/models/llama3-8b.gguf",
                  size: 4294967296,
                  vram: 6448742400,
                },
              ],
            },
          });
        }
      });

      const models = await presetsService.getAvailableModels();

      expect(mockSocket.emit).toHaveBeenCalledWith(
        "presets:available-models",
        {},
        expect.any(Function)
      );
      expect(models).toHaveLength(2);
      expect(models[0].name).toBe("qwen-7b");
      expect(models[0]).toHaveProperty("path");
      expect(models[0]).toHaveProperty("size");
      expect(models[0]).toHaveProperty("vram");
    });
  });

  describe("getLlamaParameters", () => {
    it("should return llama parameters organized by category", async () => {
      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === "presets:llama-parameters") {
          callback({
            success: true,
            data: {
              parameters: {
                "Model Settings": [
                  { name: "ctx-size", type: "int", default: "2048", description: "Context size" },
                  { name: "n-gpu-layers", type: "int", default: "0", description: "GPU layers" },
                ],
                Performance: [
                  { name: "threads", type: "int", default: "0", description: "Number of threads" },
                ],
                Sampling: [
                  { name: "temp", type: "float", default: "0.7", description: "Temperature" },
                ],
              },
            },
          });
        }
      });

      const params = await presetsService.getLlamaParameters();

      expect(params).toHaveProperty("Model Settings");
      expect(params).toHaveProperty("Performance");
      expect(params).toHaveProperty("Sampling");
      expect(params["Model Settings"][0].name).toBe("ctx-size");
    });
  });

  describe("validateConfig", () => {
    it("should validate complete configuration", async () => {
      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === "presets:validate-config") {
          callback({
            success: true,
            data: {
              valid: true,
              errors: [],
              warnings: ["Consider setting ctx-size to at least 4096"],
            },
          });
        }
      });

      const config = {
        "*": { "ctx-size": "2048", temp: "0.7" },
      };

      const result = await presetsService.validateConfig("default", config);

      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe("getInheritance", () => {
    it("should return merged config with inheritance info", async () => {
      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === "presets:inheritance") {
          callback({
            success: true,
            data: {
              finalConfig: {
                ctxSize: 4096,
                temperature: 0.6,
                threads: 0,
              },
              sources: {
                ctxSize: "group",
                temperature: "model",
                threads: "global",
              },
            },
          });
        }
      });

      const result = await presetsService.getInheritance("default", "gpu-models/qwen-7b");

      expect(result.finalConfig.ctxSize).toBe(4096);
      expect(result.sources.ctxSize).toBe("group");
      expect(result.sources.temperature).toBe("model");
      expect(result.sources.threads).toBe("global");
    });
  });

  describe("estimateVram", () => {
    it("should estimate VRAM for a model", async () => {
      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === "presets:estimate-vram") {
          callback({
            success: true,
            data: { vram: 6448742400 },
          });
        }
      });

      const vram = await presetsService.estimateVram("/models/qwen-7b.gguf");

      expect(mockSocket.emit).toHaveBeenCalledWith(
        "presets:estimate-vram",
        { modelPath: "/models/qwen-7b.gguf" },
        expect.any(Function)
      );
      expect(vram).toBe(6448742400);
    });
  });

  describe("duplicatePreset", () => {
    it("should duplicate preset with new name", async () => {
      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === "presets:duplicate") {
          callback({
            success: true,
            data: { source: data.sourceName, target: data.targetName },
          });
        }
      });

      await presetsService.duplicatePreset("source-preset", "target-preset");

      expect(mockSocket.emit).toHaveBeenCalledWith(
        "presets:duplicate",
        { sourceName: "source-preset", targetName: "target-preset" },
        expect.any(Function)
      );
    });
  });

  describe("exportPreset", () => {
    it("should export preset as raw INI content", async () => {
      const expectedContent = `LLAMA_CONFIG_VERSION = 1

[*]
ctx-size = 2048
temp = 0.7
`;

      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === "presets:export") {
          callback({
            success: true,
            data: { content: expectedContent },
          });
        }
      });

      const content = await presetsService.exportPreset("default");

      expect(mockSocket.emit).toHaveBeenCalledWith(
        "presets:export",
        { filename: "default" },
        expect.any(Function)
      );
      expect(content).toBe(expectedContent);
    });
  });
});
