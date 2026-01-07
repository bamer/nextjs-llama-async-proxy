/**
 * @jest-environment node
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { tmpdir } from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Models Scan Handlers Integration", () => {
  let testDir;
  let originalJoin;

  beforeAll(() => {
    originalJoin = path.join;
  });

  beforeEach(() => {
    // Create a fresh test directory
    testDir = path.join(
      tmpdir(),
      `test-models-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    );
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Cleanup test directory
    if (testDir && fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  afterAll(() => {
    // Restore path.join
    path.join = originalJoin;
  });

  // Helper to create mock socket
  function createMockSocket() {
    const handlers = {};
    const emitCalls = [];
    return {
      on: function (event, handler) {
        handlers[event] = handler;
      },
      emit: function (event, data) {
        emitCalls.push({ event, data });
      },
      handlers,
      emitCalls,
    };
  }

  // Helper to create mock io
  function createMockIo() {
    const emitCalls = [];
    return {
      emit: function (event, data) {
        emitCalls.push({ event, data });
      },
      emitCalls,
    };
  }

  // Helper to create mock db with tracking
  function createMockDb(initialModels = []) {
    let models = [...initialModels];
    let config = { baseModelsPath: testDir };
    let saveModelCalls = [];
    let updateModelCalls = [];
    let cleanupCalls = 0;
    return {
      getConfig: function () {
        return config;
      },
      setConfig: function (newConfig) {
        config = { ...config, ...newConfig };
      },
      getModels: function () {
        return models;
      },
      saveModel: function (model) {
        const newModel = {
          id: `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...model,
        };
        models.push(newModel);
        saveModelCalls.push(model);
        return newModel;
      },
      updateModel: function (id, updates) {
        updateModelCalls.push({ id, updates });
        const idx = models.findIndex((m) => m.id === id);
        if (idx !== -1) {
          models[idx] = { ...models[idx], ...updates };
        }
      },
      cleanupMissingFiles: function () {
        cleanupCalls++;
        return 0;
      },
      _setModels: function (newModels) {
        models = newModels;
      },
      saveModelCalls,
      updateModelCalls,
      cleanupCalls,
    };
  }

  // Helper to create mock ggufParser with tracking
  function createMockGgufParser(response = null) {
    const defaultResponse = response || {
      architecture: "llama",
      size: 1024000000,
      params: "7B",
      quantization: "Q4_K_M",
      ctxSize: 4096,
      embeddingLength: 4096,
      blockCount: 32,
      headCount: 32,
      headCountKv: 8,
      ffnDim: 14336,
      fileType: 1,
    };
    const calls = [];
    const fn = function (filePath) {
      calls.push(filePath);
      return Promise.resolve(defaultResponse);
    };
    fn.calls = calls;
    fn.defaultResponse = defaultResponse;
    fn.setResponse = function (resp) {
      Object.assign(fn.defaultResponse, resp);
    };
    return fn;
  }

  describe("registerModelsScanHandlers", () => {
    it("should register models:scan and models:cleanup event handlers", async () => {
      const { registerModelsScanHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/models/scan.js");

      const mockSocket = createMockSocket();
      const mockIo = createMockIo();
      const mockDb = createMockDb();
      const mockGgufParser = createMockGgufParser();

      registerModelsScanHandlers(mockSocket, mockIo, mockDb, mockGgufParser);

      // Verify handlers were registered
      expect(typeof mockSocket.handlers["models:scan"]).toBe("function");
      expect(typeof mockSocket.handlers["models:cleanup"]).toBe("function");
    });
  });

  describe("models:scan event", () => {
    it("should return zero counts when models directory does not exist", async () => {
      const { registerModelsScanHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/models/scan.js");

      const mockSocket = createMockSocket();
      const mockIo = createMockIo();
      const mockDb = createMockDb();
      // Set config to a non-existent directory
      mockDb.setConfig({ baseModelsPath: "/nonexistent/path" });
      const mockGgufParser = createMockGgufParser();

      registerModelsScanHandlers(mockSocket, mockIo, mockDb, mockGgufParser);
      await mockSocket.handlers["models:scan"]({ requestId: 123 });

      // Verify emit was called with zero counts
      expect(mockSocket.emitCalls.length).toBe(1);
      expect(mockSocket.emitCalls[0].event).toBe("models:scan:result");
      expect(mockSocket.emitCalls[0].data.success).toBe(true);
      expect(mockSocket.emitCalls[0].data.data).toEqual({ scanned: 0, updated: 0, total: 0 });
      expect(mockSocket.emitCalls[0].data.requestId).toBe(123);

      // Verify broadcast
      expect(mockIo.emitCalls.length).toBe(1);
      expect(mockIo.emitCalls[0].event).toBe("models:scanned");
      expect(mockIo.emitCalls[0].data).toEqual({ scanned: 0, updated: 0, total: 0 });
    });

    it("should return zero counts when models directory is empty", async () => {
      const { registerModelsScanHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/models/scan.js");

      const mockSocket = createMockSocket();
      const mockIo = createMockIo();
      const mockDb = createMockDb();
      const mockGgufParser = createMockGgufParser();

      registerModelsScanHandlers(mockSocket, mockIo, mockDb, mockGgufParser);
      await mockSocket.handlers["models:scan"]({ requestId: 456 });

      expect(mockSocket.emitCalls[0].data.data).toEqual({ scanned: 0, updated: 0, total: 0 });
    });

    it("should scan and save new valid model files", async () => {
      // Create a real GGUF file with valid magic number
      const modelPath = path.join(testDir, "test-model.gguf");
      const modelBuffer = Buffer.alloc(8);
      // Write GGUF magic number (0x46554747 = "GGUF" in little endian)
      modelBuffer.writeUInt32LE(0x46554747, 0);
      // Write version (3)
      modelBuffer.writeUInt32LE(3, 4);
      fs.writeFileSync(modelPath, modelBuffer);

      const { registerModelsScanHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/models/scan.js");

      const mockSocket = createMockSocket();
      const mockIo = createMockIo();
      const mockDb = createMockDb();
      const mockGgufParser = createMockGgufParser({
        architecture: "llama",
        size: 4096000000,
        params: "7B",
        quantization: "Q4_K_M",
        ctxSize: 4096,
        embeddingLength: 4096,
        blockCount: 32,
        headCount: 32,
        headCountKv: 8,
        ffnDim: 14336,
        fileType: 1,
      });

      registerModelsScanHandlers(mockSocket, mockIo, mockDb, mockGgufParser);
      await mockSocket.handlers["models:scan"]({ requestId: 789 });

      // Verify saveModel was called
      expect(mockDb.saveModelCalls.length).toBe(1);
      expect(mockDb.saveModelCalls[0].name).toBe("test-model");
      expect(mockDb.saveModelCalls[0].type).toBe("llama");
      expect(mockDb.saveModelCalls[0].status).toBe("unloaded");

      // Verify emit result
      expect(mockSocket.emitCalls[0].data.data).toEqual({ scanned: 1, updated: 0, total: 1 });
    });

    it("should exclude mmproj files from scanning", async () => {
      const { registerModelsScanHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/models/scan.js");

      const mockSocket = createMockSocket();
      const mockIo = createMockIo();
      const mockDb = createMockDb();
      const mockGgufParser = createMockGgufParser();

      // Create a mmproj file
      const modelPath = path.join(testDir, "mmproj-model.gguf");
      const modelBuffer = Buffer.alloc(8);
      modelBuffer.writeUInt32LE(0x46554747, 0);
      modelBuffer.writeUInt32LE(3, 4);
      fs.writeFileSync(modelPath, modelBuffer);

      registerModelsScanHandlers(mockSocket, mockIo, mockDb, mockGgufParser);
      await mockSocket.handlers["models:scan"]({ requestId: 100 });

      expect(mockGgufParser.calls.length).toBe(0);
      expect(mockDb.saveModelCalls.length).toBe(0);
    });

    it("should exclude factory files from scanning", async () => {
      const { registerModelsScanHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/models/scan.js");

      const mockSocket = createMockSocket();
      const mockIo = createMockIo();
      const mockDb = createMockDb();
      const mockGgufParser = createMockGgufParser();

      // Create a factory file
      fs.writeFileSync(path.join(testDir, "model.factory"), "factory data");

      registerModelsScanHandlers(mockSocket, mockIo, mockDb, mockGgufParser);
      await mockSocket.handlers["models:scan"]({ requestId: 101 });

      expect(mockDb.saveModelCalls.length).toBe(0);
    });

    it("should exclude files ending with -proj from scanning", async () => {
      const { registerModelsScanHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/models/scan.js");

      const mockSocket = createMockSocket();
      const mockIo = createMockIo();
      const mockDb = createMockDb();
      const mockGgufParser = createMockGgufParser();

      // Create a file that ends with -proj (no extension to match $-proj pattern)
      const modelPath = path.join(testDir, "my-proj");
      fs.writeFileSync(modelPath, "projector data");

      registerModelsScanHandlers(mockSocket, mockIo, mockDb, mockGgufParser);
      await mockSocket.handlers["models:scan"]({ requestId: 102 });

      expect(mockDb.saveModelCalls.length).toBe(0);
    });

    it("should exclude files starting with underscore from scanning", async () => {
      const { registerModelsScanHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/models/scan.js");

      const mockSocket = createMockSocket();
      const mockIo = createMockIo();
      const mockDb = createMockDb();
      const mockGgufParser = createMockGgufParser();

      // Create a _ prefixed file
      const modelPath = path.join(testDir, "_hidden-model.gguf");
      const modelBuffer = Buffer.alloc(8);
      modelBuffer.writeUInt32LE(0x46554747, 0);
      modelBuffer.writeUInt32LE(3, 4);
      fs.writeFileSync(modelPath, modelBuffer);

      registerModelsScanHandlers(mockSocket, mockIo, mockDb, mockGgufParser);
      await mockSocket.handlers["models:scan"]({ requestId: 103 });

      expect(mockDb.saveModelCalls.length).toBe(0);
    });

    it("should reject GGUF files with invalid magic number", async () => {
      const { registerModelsScanHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/models/scan.js");

      const mockSocket = createMockSocket();
      const mockIo = createMockIo();
      const mockDb = createMockDb();
      const mockGgufParser = createMockGgufParser();

      // Create a file with invalid magic number
      const modelPath = path.join(testDir, "invalid.gguf");
      const modelBuffer = Buffer.alloc(8);
      modelBuffer.writeUInt32LE(0xdeadbeef, 0); // Invalid magic
      modelBuffer.writeUInt32LE(3, 4);
      fs.writeFileSync(modelPath, modelBuffer);

      registerModelsScanHandlers(mockSocket, mockIo, mockDb, mockGgufParser);
      await mockSocket.handlers["models:scan"]({ requestId: 104 });

      expect(mockDb.saveModelCalls.length).toBe(0);
    });

    it("should skip files that fail to read during magic number check", async () => {
      const { registerModelsScanHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/models/scan.js");

      const mockSocket = createMockSocket();
      const mockIo = createMockIo();
      const mockDb = createMockDb();
      const mockGgufParser = createMockGgufParser();

      // Create a file that's not readable (no read permission would cause this)
      // We'll simulate this by creating the file but making readSync throw
      const originalReadSync = fs.readSync;
      const modelPath = path.join(testDir, "corrupt.gguf");
      fs.writeFileSync(modelPath, Buffer.alloc(8));

      // Temporarily make readSync throw for this test
      let readSyncThrows = false;
      const throwingReadSync = function (fd, buffer, offset, length, position) {
        if (readSyncThrows) {
          throw new Error("Read error");
        }
        return originalReadSync(fd, buffer, offset, length, position);
      };
      fs.readSync = throwingReadSync;

      try {
        readSyncThrows = true;
        registerModelsScanHandlers(mockSocket, mockIo, mockDb, mockGgufParser);
        await mockSocket.handlers["models:scan"]({ requestId: 105 });

        expect(mockDb.saveModelCalls.length).toBe(0);
      } finally {
        fs.readSync = originalReadSync;
      }
    });

    it("should update existing models when GGUF data needs refresh", async () => {
      const { registerModelsScanHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/models/scan.js");

      const modelPath = path.join(testDir, "existing-model.gguf");
      const modelBuffer = Buffer.alloc(8);
      modelBuffer.writeUInt32LE(0x46554747, 0);
      modelBuffer.writeUInt32LE(3, 4);
      fs.writeFileSync(modelPath, modelBuffer);

      const mockSocket = createMockSocket();
      const mockIo = createMockIo();
      const mockDb = createMockDb([
        {
          id: "model_123",
          model_path: modelPath,
          name: "existing-model",
          type: "llama",
          status: "unloaded",
          file_size: null,
          params: null,
          quantization: null,
          ctx_size: 4096,
          block_count: 0,
        },
      ]);
      const mockGgufParser = createMockGgufParser({
        architecture: "llama",
        size: 4096000000,
        params: "7B",
        quantization: "Q4_K_M",
        ctxSize: 4096,
        embeddingLength: 4096,
        blockCount: 32,
        headCount: 32,
        headCountKv: 8,
        ffnDim: 14336,
        fileType: 1,
      });

      registerModelsScanHandlers(mockSocket, mockIo, mockDb, mockGgufParser);
      await mockSocket.handlers["models:scan"]({ requestId: 106 });

      expect(mockDb.updateModelCalls.length).toBe(1);
      expect(mockDb.updateModelCalls[0].id).toBe("model_123");
      expect(mockDb.updateModelCalls[0].updates.file_size).toBe(4096000000);

      expect(mockSocket.emitCalls[0].data.data).toEqual({ scanned: 0, updated: 1, total: 1 });
    });

    it("should not update existing models when data is complete", async () => {
      const { registerModelsScanHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/models/scan.js");

      const modelPath = path.join(testDir, "complete-model.gguf");
      const modelBuffer = Buffer.alloc(8);
      modelBuffer.writeUInt32LE(0x46554747, 0);
      modelBuffer.writeUInt32LE(3, 4);
      fs.writeFileSync(modelPath, modelBuffer);

      const mockSocket = createMockSocket();
      const mockIo = createMockIo();
      const mockDb = createMockDb([
        {
          id: "model_456",
          model_path: modelPath,
          name: "complete-model",
          type: "llama",
          status: "unloaded",
          file_size: 4096000000,
          params: "7B",
          quantization: "Q4_K_M",
          ctx_size: 8192,
          block_count: 32,
        },
      ]);
      const mockGgufParser = createMockGgufParser({
        architecture: "llama",
        size: 4096000000,
        params: "7B",
        quantization: "Q4_K_M",
        ctxSize: 4096,
        embeddingLength: 4096,
        blockCount: 32,
        headCount: 32,
        headCountKv: 8,
        ffnDim: 14336,
        fileType: 1,
      });

      registerModelsScanHandlers(mockSocket, mockIo, mockDb, mockGgufParser);
      await mockSocket.handlers["models:scan"]({ requestId: 107 });

      expect(mockDb.updateModelCalls.length).toBe(0);
    });

    it("should handle nested directory structure", async () => {
      const { registerModelsScanHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/models/scan.js");

      // Create nested directory structure
      const subDir = fs.mkdirSync(path.join(testDir, "subdir"), { recursive: true });
      const modelPath = path.join(testDir, "subdir", "nested-model.gguf");
      const modelBuffer = Buffer.alloc(8);
      modelBuffer.writeUInt32LE(0x46554747, 0);
      modelBuffer.writeUInt32LE(3, 4);
      fs.writeFileSync(modelPath, modelBuffer);

      const mockSocket = createMockSocket();
      const mockIo = createMockIo();
      const mockDb = createMockDb();
      const mockGgufParser = createMockGgufParser({
        architecture: "llama",
        size: 2048000000,
        params: "3B",
        quantization: "Q4_K_S",
        ctxSize: 4096,
        embeddingLength: 2048,
        blockCount: 16,
        headCount: 16,
        headCountKv: 8,
        ffnDim: 7168,
        fileType: 1,
      });

      registerModelsScanHandlers(mockSocket, mockIo, mockDb, mockGgufParser);
      await mockSocket.handlers["models:scan"]({ requestId: 108 });

      expect(mockDb.saveModelCalls.length).toBe(1);
      expect(mockDb.saveModelCalls[0].model_path).toBe(modelPath);
    });

    it("should handle errors gracefully during scanning", async () => {
      const { registerModelsScanHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/models/scan.js");

      const modelPath = path.join(testDir, "error-model.gguf");
      const modelBuffer = Buffer.alloc(8);
      modelBuffer.writeUInt32LE(0x46554747, 0);
      modelBuffer.writeUInt32LE(3, 4);
      fs.writeFileSync(modelPath, modelBuffer);

      const mockSocket = createMockSocket();
      const mockIo = createMockIo();
      const mockDb = createMockDb();
      // Create a ggufParser that fails
      const failingGgufParser = function (filePath) {
        return Promise.reject(new Error("GGUF parsing failed"));
      };

      registerModelsScanHandlers(mockSocket, mockIo, mockDb, failingGgufParser);
      await mockSocket.handlers["models:scan"]({ requestId: 109 });

      // Should not crash
      expect(mockSocket.emitCalls[0].data.success).toBe(true);
      expect(mockSocket.emitCalls[0].data.data).toEqual({ scanned: 0, updated: 0, total: 0 });
    });

    it("should use default requestId when not provided", async () => {
      const { registerModelsScanHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/models/scan.js");

      const mockSocket = createMockSocket();
      const mockIo = createMockIo();
      const mockDb = createMockDb();
      const mockGgufParser = createMockGgufParser();

      registerModelsScanHandlers(mockSocket, mockIo, mockDb, mockGgufParser);
      await mockSocket.handlers["models:scan"]();

      expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
      expect(typeof mockSocket.emitCalls[0].data.requestId).toBe("number");
    });

    it("should handle getConfig errors gracefully", async () => {
      const { registerModelsScanHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/models/scan.js");

      const mockSocket = createMockSocket();
      const mockIo = createMockIo();
      const mockDb = createMockDb();
      mockDb.getConfig = function () {
        throw new Error("Config error");
      };
      const mockGgufParser = createMockGgufParser();

      registerModelsScanHandlers(mockSocket, mockIo, mockDb, mockGgufParser);
      await mockSocket.handlers["models:scan"]({ requestId: 401 });

      expect(mockSocket.emitCalls[0].data.success).toBe(false);
      expect(mockSocket.emitCalls[0].data.error.message).toBe("Config error");
    });
  });

  describe("models:cleanup event", () => {
    it("should cleanup missing model files", async () => {
      const { registerModelsScanHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/models/scan.js");

      const mockSocket = createMockSocket();
      const mockIo = createMockIo();
      const mockDb = createMockDb();
      mockDb.cleanupMissingFiles = function () {
        mockDb.cleanupCalls++;
        return 5;
      };
      const mockGgufParser = createMockGgufParser();

      registerModelsScanHandlers(mockSocket, mockIo, mockDb, mockGgufParser);
      mockSocket.handlers["models:cleanup"]({ requestId: 200 });

      expect(mockDb.cleanupCalls).toBe(1);
      expect(mockSocket.emitCalls[0].event).toBe("models:cleanup:result");
      expect(mockSocket.emitCalls[0].data.success).toBe(true);
      expect(mockSocket.emitCalls[0].data.data.deletedCount).toBe(5);
      expect(mockSocket.emitCalls[0].data.requestId).toBe(200);
    });

    it("should handle cleanup errors gracefully", async () => {
      const { registerModelsScanHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/models/scan.js");

      const mockSocket = createMockSocket();
      const mockIo = createMockIo();
      const mockDb = createMockDb();
      mockDb.cleanupMissingFiles = function () {
        throw new Error("Cleanup failed");
      };
      const mockGgufParser = createMockGgufParser();

      registerModelsScanHandlers(mockSocket, mockIo, mockDb, mockGgufParser);
      mockSocket.handlers["models:cleanup"]({ requestId: 201 });

      expect(mockSocket.emitCalls[0].data.success).toBe(false);
      expect(mockSocket.emitCalls[0].data.error.message).toBe("Cleanup failed");
    });

    it("should use default requestId when not provided", async () => {
      const { registerModelsScanHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/models/scan.js");

      const mockSocket = createMockSocket();
      const mockIo = createMockIo();
      const mockDb = createMockDb();
      mockDb.cleanupMissingFiles = function () {
        return 0;
      };
      const mockGgufParser = createMockGgufParser();

      registerModelsScanHandlers(mockSocket, mockIo, mockDb, mockGgufParser);
      mockSocket.handlers["models:cleanup"]();

      expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
    });
  });

  describe("case insensitive operations", () => {
    it("should handle uppercase file extensions", async () => {
      const { registerModelsScanHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/models/scan.js");

      // Create a file with uppercase extension
      const modelPath = path.join(testDir, "UPPERCASE.GGUF");
      const modelBuffer = Buffer.alloc(8);
      modelBuffer.writeUInt32LE(0x46554747, 0);
      modelBuffer.writeUInt32LE(3, 4);
      fs.writeFileSync(modelPath, modelBuffer);

      const mockSocket = createMockSocket();
      const mockIo = createMockIo();
      const mockDb = createMockDb();
      const mockGgufParser = createMockGgufParser({
        architecture: "llama",
        size: 1024000000,
        params: "1B",
        quantization: "Q4_K_M",
        ctxSize: 2048,
        embeddingLength: 2048,
        blockCount: 16,
        headCount: 16,
        headCountKv: 8,
        ffnDim: 7168,
        fileType: 1,
      });

      registerModelsScanHandlers(mockSocket, mockIo, mockDb, mockGgufParser);
      await mockSocket.handlers["models:scan"]({ requestId: 300 });

      expect(mockDb.saveModelCalls.length).toBe(1);
    });

    it("should handle mixed case exclude patterns", async () => {
      const { registerModelsScanHandlers } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/models/scan.js");

      // Create a file with mixed case mmproj
      const modelPath = path.join(testDir, "MMPROJ-model.gguf");
      const modelBuffer = Buffer.alloc(8);
      modelBuffer.writeUInt32LE(0x46554747, 0);
      modelBuffer.writeUInt32LE(3, 4);
      fs.writeFileSync(modelPath, modelBuffer);

      const mockSocket = createMockSocket();
      const mockIo = createMockIo();
      const mockDb = createMockDb();
      const mockGgufParser = createMockGgufParser();

      registerModelsScanHandlers(mockSocket, mockIo, mockDb, mockGgufParser);
      await mockSocket.handlers["models:scan"]({ requestId: 301 });

      expect(mockDb.saveModelCalls.length).toBe(0);
    });
  });
});
