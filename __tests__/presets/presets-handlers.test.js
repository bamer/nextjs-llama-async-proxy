/**
 * Presets Handlers Integration Tests
 * Tests for backend preset management functionality
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

// Mock fs module
const mockFs = {
  existsSync: jest.fn(),
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
  mkdirSync: jest.fn(),
};

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

// Setup mocks before importing
jest.unstable_mockModule("fs", () => mockFs);
jest.unstable_mockModule("./logger.js", () => mockLogger);

describe("Presets Handlers", () => {
  let presetsHandlers;
  let mockSocket;
  let mockDb;

  beforeAll(async () => {
    // Import the module after mocking
    presetsHandlers = await import("../../server/handlers/presets.js");
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue(["default.ini", "test.ini"]);
    mockFs.readFileSync.mockImplementation((path) => {
      if (path.includes("default.ini")) {
        return `LLAMA_CONFIG_VERSION = 1

[*]
ctx-size = 2048
temp = 0.7
n-gpu-layers = 0
threads = 0
batch = 512

[gpu-models]
ctx-size = 4096
temp = 0.8

[gpu-models/qwen-7b]
model = /models/qwen-7b.gguf
temp = 0.6
n-gpu-layers = 35
`;
      }
      return "LLAMA_CONFIG_VERSION = 1\n\n[*]\nctx-size = 2048\n";
    });

    // Setup mock socket with ack callback
    mockSocket = {
      on: jest.fn((event, handler) => {
        // Store handler for later testing
        mockSocket._handlers = mockSocket._handlers || {};
        mockSocket._handlers[event] = handler;
      }),
      emit: jest.fn((event, data, ack) => {
        // Call the handler immediately for testing
        if (mockSocket._handlers && mockSocket._handlers[event]) {
          mockSocket._handlers[event](data, ack);
        }
      }),
    };

    mockDb = {
      getConfig: jest.fn().mockReturnValue({
        baseModelsPath: "/models",
        serverPath: "./llama-server",
      }),
    };

    // Set global config
    globalThis.LLAMA_CONFIG = {
      baseModelsPath: "/models",
      serverPath: "./llama-server",
    };
  });

  describe("parseIni", () => {
    it("should parse basic INI content", () => {
      const content = `LLAMA_CONFIG_VERSION = 1

[*]
ctx-size = 2048
temp = 0.7

[model-name]
model = /path/to/model.gguf
`;
      const result = presetsHandlers.parseIni(content);

      expect(result).toHaveProperty("*");
      expect(result["*"]["ctx-size"]).toBe("2048");
      expect(result["*"]["temp"]).toBe("0.7");
      expect(result).toHaveProperty("model-name");
      expect(result["model-name"]["model"]).toBe("/path/to/model.gguf");
    });

    it("should skip empty lines and comments", () => {
      const content = `; This is a comment

[section]
value = 123

; Another comment
`;
      const result = presetsHandlers.parseIni(content);

      expect(result).toHaveProperty("section");
      expect(result["section"]["value"]).toBe("123");
    });

    it("should handle values with equals sign", () => {
      const content = `[section]
key = value = with equals
`;
      const result = presetsHandlers.parseIni(content);

      expect(result["section"]["key"]).toBe("value = with equals");
    });
  });

  describe("generateIni", () => {
    it("should generate valid INI content", () => {
      const config = {
        LLAMA_CONFIG_VERSION: "1",
        "*": {
          "ctx-size": "2048",
          temp: "0.7",
        },
        "model-name": {
          model: "/path/to/model.gguf",
        },
      };

      const result = presetsHandlers.generateIni(config);

      expect(result).toContain("LLAMA_CONFIG_VERSION = 1");
      expect(result).toContain("[*]");
      expect(result).toContain("ctx-size = 2048");
      expect(result).toContain("temp = 0.7");
      expect(result).toContain("[model-name]");
      expect(result).toContain("model = /path/to/model.gguf");
    });
  });

  describe("listPresets", () => {
    it("should return list of preset files", () => {
      const presets = presetsHandlers.listPresets();

      expect(presets).toHaveLength(2);
      expect(presets[0]).toHaveProperty("name", "default");
      expect(presets[0]).toHaveProperty("path", "default.ini");
      expect(presets[1]).toHaveProperty("name", "test");
    });

    it("should return empty array when directory does not exist", () => {
      mockFs.existsSync.mockReturnValue(false);

      const presets = presetsHandlers.listPresets();

      expect(presets).toEqual([]);
    });
  });

  describe("readPreset", () => {
    it("should read and parse preset file", () => {
      const result = presetsHandlers.readPreset("default");

      expect(result).toHaveProperty("filename", "default");
      expect(result).toHaveProperty("parsed");
      expect(result.parsed).toHaveProperty("*");
      expect(result.parsed).toHaveProperty("gpu-models");
    });

    it("should throw error when file not found", () => {
      mockFs.existsSync.mockReturnValue(false);

      expect(() => presetsHandlers.readPreset("nonexistent")).toThrow(
        "Preset file not found: nonexistent"
      );
    });
  });

  describe("getModelsFromPreset", () => {
    it("should return models with inherited defaults", () => {
      const models = presetsHandlers.getModelsFromPreset("default");

      // Model in group should inherit from global defaults
      expect(models).toHaveProperty("gpu-models/qwen-7b");

      const qwenModel = models["gpu-models/qwen-7b"];
      expect(qwenModel.ctxSize).toBe(4096); // From group
      expect(qwenModel.temperature).toBe(0.6); // Model override
      expect(qwenModel.nGpuLayers).toBe(35); // Model override
      expect(qwenModel.threads).toBe(0); // From global defaults
    });
  });

  describe("getPresetsDefaults", () => {
    it("should return global defaults from [*] section", () => {
      const defaults = presetsHandlers.getPresetsDefaults("default");

      expect(defaults.ctxSize).toBe(2048);
      expect(defaults.temperature).toBe(0.7);
      expect(defaults.nGpuLayers).toBe(0);
      expect(defaults.threads).toBe(0);
      expect(defaults.batchSize).toBe(512);
    });

    it("should return default values when no [*] section", () => {
      mockFs.readFileSync.mockReturnValue("LLAMA_CONFIG_VERSION = 1\n");

      const defaults = presetsHandlers.getPresetsDefaults("test");

      expect(defaults.ctxSize).toBe(2048); // Default value
      expect(defaults.temperature).toBe(0.7); // Default value
    });
  });

  describe("validateIni", () => {
    it("should validate correct INI content", () => {
      const content = `LLAMA_CONFIG_VERSION = 1

[*]
ctx-size = 2048
temp = 0.7

[model-name]
model = /path/to/model.gguf
`;
      const result = presetsHandlers.validateIni(content);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect missing model path", () => {
      const content = `LLAMA_CONFIG_VERSION = 1

[model-name]
ctx-size = 2048
`;
      const result = presetsHandlers.validateIni(content);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should detect invalid numeric values", () => {
      const content = `LLAMA_CONFIG_VERSION = 1

[*]
ctx-size = not-a-number
`;
      const result = presetsHandlers.validateIni(content);

      expect(result.valid).toBe(false);
    });
  });

  describe("registerPresetsHandlers", () => {
    it("should register socket event handlers", () => {
      presetsHandlers.registerPresetsHandlers(mockSocket, mockDb);

      expect(mockSocket.on).toHaveBeenCalledWith("presets:list", expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith("presets:read", expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith("presets:save", expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith("presets:create", expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith("presets:delete", expect.any(Function));
    });

    it("should handle presets:list event", () => {
      presetsHandlers.registerPresetsHandlers(mockSocket, mockDb);

      const ackMock = jest.fn();
      mockSocket.emit("presets:list", {}, ackMock);

      expect(ackMock).toHaveBeenCalled();
      const response = ackMock.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.presets).toHaveLength(2);
    });

    it("should handle presets:create event", () => {
      presetsHandlers.registerPresetsHandlers(mockSocket, mockDb);

      const ackMock = jest.fn();
      mockSocket.emit("presets:create", { filename: "new-preset" }, ackMock);

      expect(mockFs.writeFileSync).toHaveBeenCalled();
      expect(ackMock).toHaveBeenCalled();
    });

    it("should handle presets:delete event", () => {
      presetsHandlers.registerPresetsHandlers(mockSocket, mockDb);

      const ackMock = jest.fn();
      mockSocket.emit("presets:delete", { filename: "test" }, ackMock);

      expect(mockFs.unlinkSync).toHaveBeenCalled();
      expect(ackMock).toHaveBeenCalled();
    });
  });
});

describe("Presets Backend VRAM Estimation", () => {
  let presetsHandlers;

  beforeAll(async () => {
    presetsHandlers = await import("../../server/handlers/presets.js");
  });

  describe("estimateVram", () => {
    it("should estimate VRAM based on model size", () => {
      // 4GB model file
      const fileSize = 4 * 1024 * 1024 * 1024;
      const vram = presetsHandlers.estimateVram(fileSize);

      // VRAM should be approximately fileSize * 1.5 for overhead
      expect(vram).toBeGreaterThan(fileSize);
      expect(vram).toBeLessThan(fileSize * 2);
    });

    it("should handle small models", () => {
      const fileSize = 100 * 1024 * 1024; // 100MB
      const vram = presetsHandlers.estimateVram(fileSize);

      expect(vram).toBeGreaterThan(0);
    });
  });
});

describe("Presets Backend Parameter Conversion", () => {
  let presetsHandlers;

  beforeAll(async () => {
    presetsHandlers = await import("../../server/handlers/presets.js");
  });

  describe("modelToIniSection", () => {
    it("should convert model config to INI section", () => {
      const config = {
        model: "/path/to/model.gguf",
        ctxSize: 4096,
        temperature: 0.7,
        nGpuLayers: 35,
        threads: 8,
        batchSize: 512,
      };

      const result = presetsHandlers.modelToIniSection("model-name", config);

      expect(result.model).toBe("/path/to/model.gguf");
      expect(result["ctx-size"]).toBe("4096");
      expect(result.temp).toBe("0.7");
      expect(result["n-gpu-layers"]).toBe("35");
      expect(result.threads).toBe("8");
      expect(result.batch).toBe("512");
    });

    it("should handle undefined values", () => {
      const config = {
        model: "/path/to/model.gguf",
      };

      const result = presetsHandlers.modelToIniSection("model-name", config);

      expect(result.model).toBe("/path/to/model.gguf");
      // Only defined values should be in result
      expect(Object.keys(result)).toHaveLength(1);
    });
  });

  describe("iniSectionToModel", () => {
    it("should convert INI section to model config", () => {
      const section = {
        model: "/path/to/model.gguf",
        "ctx-size": "4096",
        temp: "0.7",
        "n-gpu-layers": "35",
        threads: "8",
        batch: "512",
      };

      const defaults = {
        "ctx-size": 2048,
        temp: 0.7,
        threads: 4,
        batch: 512,
      };

      const result = presetsHandlers.iniSectionToModel(section, defaults);

      expect(result.model).toBe("/path/to/model.gguf");
      expect(result.ctxSize).toBe(4096);
      expect(result.temperature).toBe(0.7);
      expect(result.nGpuLayers).toBe(35);
      expect(result.threads).toBe(8);
      expect(result.batchSize).toBe(512);
    });

    it("should use defaults when values not in section", () => {
      const section = {
        model: "/path/to/model.gguf",
      };

      const defaults = {
        "ctx-size": 2048,
        temp: 0.7,
        threads: 4,
        batch: 512,
      };

      const result = presetsHandlers.iniSectionToModel(section, defaults);

      expect(result.ctxSize).toBe(2048); // From defaults
      expect(result.temperature).toBe(0.7); // From defaults
    });
  });
});
