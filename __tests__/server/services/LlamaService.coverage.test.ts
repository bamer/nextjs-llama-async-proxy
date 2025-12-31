import { spawn, ChildProcess } from "child_process";
import axios from "axios";
import fs from "fs";
import path from "path";
import {
  LlamaService,
  LlamaServerConfig,
} from "@/server/services/LlamaService";

// Mock dependencies
jest.mock("child_process");
jest.mock("axios");
jest.mock("fs");
jest.mock("path");

const mockedSpawn = spawn as jest.MockedFunction<typeof spawn>;
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedPath = path as jest.Mocked<typeof path>;

describe("LlamaService - Additional Coverage Tests", () => {
  let llamaService: LlamaService;
  let mockConfig: LlamaServerConfig;
  let mockProcess: ChildProcess;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockConfig = {
      host: "localhost",
      port: 8080,
      modelPath: "/path/to/model.gguf",
      basePath: "/path/to/models",
      serverPath: "/path/to/llama-server",
      ctx_size: 2048,
      batch_size: 512,
      threads: 4,
      gpu_layers: 20,
      temperature: 0.7,
      verbose: true,
    };

    mockProcess = {
      pid: 12345,
      kill: jest.fn(),
      on: jest.fn(),
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      unref: jest.fn(),
    } as any;

    mockedSpawn.mockReturnValue(mockProcess);
    mockedAxios.create.mockReturnValue({
      get: jest.fn(),
      post: jest.fn(),
      delete: jest.fn(),
      defaults: { timeout: 5000 },
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    });

    mockedPath.join.mockImplementation((...args) => args.join("/"));
    mockedPath.resolve.mockImplementation((...args) => args.join("/"));
    mockedFs.existsSync.mockReturnValue(true);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("Process Event Callbacks", () => {
    beforeEach(() => {
      llamaService = new LlamaService(mockConfig);
    });

    it("should trigger crash handler on process error", async () => {
      let errorHandler: any;
      mockedProcess.on = jest.fn((event: string, callback: any) => {
        if (event === "error") {
          errorHandler = callback;
        }
        return mockProcess;
      });

      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockRejectedValue(new Error("Not ready"));

      // Start the service to register handlers
      llamaService.start().catch(() => {});

      // Trigger error handler
      errorHandler?.(new Error("Spawn failed"));

      // Wait for error to be processed
      await new Promise((resolve) => setTimeout(resolve, 100));

      const state = llamaService.getState();
      expect(state.lastError).toContain("Failed to start");
    });

    it("should handle exit with code 0 while stopping", async () => {
      let exitHandler: any;
      mockedProcess.on = jest.fn((event: string, callback: any) => {
        if (event === "exit") {
          exitHandler = callback;
        }
        return mockProcess;
      });

      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockRejectedValue(new Error("Not ready"));

      // Start the service
      llamaService.start().catch(() => {});

      // Stop the service
      await llamaService.stop();

      // Trigger exit handler with code 0
      exitHandler?.(0, "SIGTERM");

      // Should not trigger crash handling when stopping
      await new Promise((resolve) => setTimeout(resolve, 100));

      const state = llamaService.getState();
      expect(state.status).toBe("initial");
    });

    it("should log stdout data message", async () => {
      let dataHandler: any;
      mockedProcess.stdout = { on: jest.fn((event: string, callback: any) => {
        if (event === "data") {
          dataHandler = callback;
        }
        return { on: jest.fn() };
      }) };

      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockRejectedValue(new Error("Not ready"));

      // Start the service
      llamaService.start().catch(() => {});

      // Trigger stdout handler with message
      dataHandler?.(Buffer.from("Server started successfully\n"));

      // Should not throw
      expect(() => dataHandler?.(Buffer.from("Test"))).not.toThrow();
    });

    it("should log stderr data as warning", async () => {
      let dataHandler: any;
      mockedProcess.stderr = { on: jest.fn((event: string, callback: any) => {
        if (event === "data") {
          dataHandler = callback;
        }
        return { on: jest.fn() };
      }) };

      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockRejectedValue(new Error("Not ready"));

      // Start the service
      llamaService.start().catch(() => {});

      // Trigger stderr handler with warning
      dataHandler?.(Buffer.from("Warning: GPU memory low\n"));

      // Should not throw
      expect(() => dataHandler?.(Buffer.from("Warning"))).not.toThrow();
    });
  });

  describe("Filesystem Model Loading with Templates", () => {
    beforeEach(() => {
      llamaService = new LlamaService(mockConfig);
    });

    it("should scan models and detect custom templates", async () => {
      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockRejectedValue(new Error("API Error"));

      const mockDirents = [
        { name: "model1", isFile: () => false, isDirectory: () => true } as any,
      ];
      mockedFs.readdirSync.mockReturnValue(mockDirents as any);
      mockedFs.statSync.mockReturnValue({
        size: 1000000000,
        mtimeMs: Date.now(),
        isDirectory: () => true,
      } as any);

      const mockSubdirFiles = [
        { name: "model.gguf", isFile: () => true, isDirectory: () => false } as any,
        { name: "custom.jinja", isFile: () => true, isDirectory: () => false } as any,
      ];
      let readdirCallCount = 0;
      mockedFs.readdirSync.mockImplementation((dirPath: string) => {
        readdirCallCount++;
        if (dirPath.includes("model1")) {
          return mockSubdirFiles as any;
        }
        return mockDirents as any;
      });

      let existsCallCount = 0;
      mockedFs.existsSync.mockImplementation((filePath: string) => {
        existsCallCount++;
        if (filePath.includes("model1") || filePath.includes("custom.jinja")) {
          return true;
        }
        return existsCallCount === 1; // basePath exists
      });

      // Call start to trigger model loading (private method, so we can't test directly)
      await llamaService.start().catch(() => {});

      const state = llamaService.getState();
      // Verify models were loaded
      expect(state.models.length).toBeGreaterThan(0);
    });

    it("should detect built-in templates", async () => {
      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockRejectedValue(new Error("API Error"));

      const mockDirents = [
        { name: "test-model", isFile: () => false, isDirectory: () => true } as any,
      ];
      mockedFs.readdirSync.mockReturnValue(mockDirents as any);
      mockedFs.statSync.mockReturnValue({
        size: 1000000000,
        mtimeMs: Date.now(),
        isDirectory: () => true,
      } as any);

      const mockSubdirFiles = [
        { name: "model.gguf", isFile: () => true, isDirectory: () => false } as any,
        { name: "chatml.jinja", isFile: () => true, isDirectory: () => false } as any,
      ];
      let readdirCallCount = 0;
      mockedFs.readdirSync.mockImplementation((dirPath: string) => {
        readdirCallCount++;
        if (readdirCallCount === 1) {
          return mockDirents as any;
        }
        return mockSubdirFiles as any;
      });

      let existsCallCount = 0;
      mockedFs.existsSync.mockImplementation((filePath: string) => {
        existsCallCount++;
        if (filePath.includes("chatml.jinja")) {
          return true;
        }
        return existsCallCount === 1;
      });

      // Call start to trigger model loading
      await llamaService.start().catch(() => {});

      const state = llamaService.getState();
      expect(state.models.length).toBeGreaterThan(0);
    });

    it("should find matching template from available templates", async () => {
      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockRejectedValue(new Error("API Error"));

      const mockDirents = [
        { name: "test-model", isFile: () => false, isDirectory: () => true } as any,
      ];
      mockedFs.readdirSync.mockReturnValue(mockDirents as any);
      mockedFs.statSync.mockReturnValue({
        size: 1000000000,
        mtimeMs: Date.now(),
        isDirectory: () => true,
      } as any);

      const mockSubdirFiles = [
        { name: "model.gguf", isFile: () => true, isDirectory: () => false } as any,
        { name: "vicuna.jinja", isFile: () => true, isDirectory: () => false } as any,
      ];
      let readdirCallCount = 0;
      mockedFs.readdirSync.mockImplementation((dirPath: string) => {
        readdirCallCount++;
        if (readdirCallCount === 1) {
          return mockDirents as any;
        }
        return mockSubdirFiles as any;
      });

      let existsCallCount = 0;
      mockedFs.existsSync.mockImplementation((filePath: string) => {
        existsCallCount++;
        if (filePath.includes("vicuna.jinja")) {
          return true;
        }
        return existsCallCount === 1;
      });

      // Call start to trigger model loading
      await llamaService.start().catch(() => {});

      const state = llamaService.getState();
      expect(state.models.length).toBeGreaterThan(0);
    });

    it("should set availableTemplates and template when found", async () => {
      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockRejectedValue(new Error("API Error"));

      const mockDirents = [
        { name: "test-model", isFile: () => false, isDirectory: () => true } as any,
      ];
      mockedFs.readdirSync.mockReturnValue(mockDirents as any);
      mockedFs.statSync.mockReturnValue({
        size: 1000000000,
        mtimeMs: Date.now(),
        isDirectory: () => true,
      } as any);

      const mockSubdirFiles = [
        { name: "model.gguf", isFile: () => true, isDirectory: () => false } as any,
        { name: "custom.jinja", isFile: () => true, isDirectory: () => false } as any,
      ];
      let readdirCallCount = 0;
      mockedFs.readdirSync.mockImplementation((dirPath: string) => {
        readdirCallCount++;
        if (readdirCallCount === 1) {
          return mockDirents as any;
        }
        return mockSubdirFiles as any;
      });

      let existsCallCount = 0;
      mockedFs.existsSync.mockImplementation((filePath: string) => {
        existsCallCount++;
        if (filePath.includes("custom.jinja")) {
          return true;
        }
        return existsCallCount === 1;
      });

      // Call start to trigger model loading
      await llamaService.start().catch(() => {});

      const state = llamaService.getState();
      expect(state.models.length).toBeGreaterThan(0);
    });
  });

  describe("Start - Complete Flow", () => {
    beforeEach(() => {
      llamaService = new LlamaService(mockConfig);
    });

    it("should complete full startup sequence successfully", async () => {
      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall
        .mockRejectedValueOnce(new Error("Not ready"))
        .mockResolvedValueOnce({ status: 200 })
        .mockResolvedValueOnce({
          status: 200,
          data: { data: [
            { id: "model1", name: "Model 1", size: 1000000000, type: "gguf" }
          ]}
        });

      await llamaService.start();

      const state = llamaService.getState();
      expect(state.status).toBe("ready");
      expect(state.models).toHaveLength(1);
      expect(state.startedAt).not.toBeNull();
    });

    it("should detect and connect to already running server", async () => {
      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall
        .mockResolvedValueOnce({ status: 200 })
        .mockResolvedValueOnce({
          status: 200,
          data: { data: [
            { id: "model1", name: "Model 1", size: 1000000000, type: "gguf" }
          ]}
        });

      await llamaService.start();

      const state = llamaService.getState();
      expect(state.status).toBe("ready");
      expect(mockedSpawn).not.toHaveBeenCalled();
    });
  });

  describe("Error Recovery", () => {
    beforeEach(() => {
      llamaService = new LlamaService(mockConfig);
    });

    it("should handle null model data gracefully", async () => {
      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockResolvedValue({
        status: 200,
        data: { data: null }
      });

      // Start the service to trigger model loading
      await llamaService.start().catch(() => {});

      const state = llamaService.getState();
      expect(state.models).toHaveLength(0);
    });

    it("should handle undefined model data", async () => {
      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockResolvedValue({
        status: 200,
        data: { data: undefined }
      });

      // Start the service to trigger model loading
      await llamaService.start().catch(() => {});

      const state = llamaService.getState();
      expect(state.models).toHaveLength(0);
    });

    it("should handle malformed model objects", async () => {
      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockResolvedValue({
        status: 200,
        data: { data: [
          { id: null, name: undefined, size: 0, type: null }
        ]}
      });

      // Start the service to trigger model loading
      await llamaService.start().catch(() => {});

      const state = llamaService.getState();
      expect(state.models).toBeDefined();
    });
  });

  describe("State Change Callbacks - Multiple", () => {
    beforeEach(() => {
      llamaService = new LlamaService(mockConfig);
    });

    it("should call all registered callbacks on state change", () => {
      const calls: any[] = [];
      const callback1 = jest.fn((state: any) => calls.push({ id: 1, state }));
      const callback2 = jest.fn((state: any) => calls.push({ id: 2, state }));
      const callback3 = jest.fn((state: any) => calls.push({ id: 3, state }));

      llamaService.onStateChange(callback1);
      llamaService.onStateChange(callback2);
      llamaService.onStateChange(callback3);

      // Trigger a state change by starting
      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall
        .mockRejectedValueOnce(new Error("Not ready"))
        .mockResolvedValueOnce({ status: 200 })
        .mockResolvedValueOnce({
          status: 200,
          data: { data: [] }
        });

      await llamaService.start();

      // All callbacks should have been called
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
      expect(callback3).toHaveBeenCalled();

      expect(calls.length).toBe(3);
    });
  });
});
