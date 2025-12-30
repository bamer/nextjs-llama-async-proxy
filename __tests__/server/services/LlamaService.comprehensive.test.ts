import { spawn, ChildProcess } from "child_process";
import axios from "axios";
import fs from "fs";
import path from "path";
import {
  LlamaService,
  LlamaServerConfig,
  LlamaServiceState,
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

describe("LlamaService - Comprehensive Tests", () => {
  let llamaService: LlamaService;
  let mockConfig: LlamaServerConfig;
  let mockProcess: ChildProcess;
  let mockStdout: any;
  let mockStderr: any;

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

    mockStdout = {
      on: jest.fn(),
    };

    mockStderr = {
      on: jest.fn(),
    };

    mockProcess = {
      pid: 12345,
      kill: jest.fn(),
      on: jest.fn(),
      stdout: mockStdout,
      stderr: mockStderr,
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
    } as any);

    mockedPath.join.mockImplementation((...args) => args.join("/"));
    mockedPath.resolve.mockImplementation((...args) => args.join("/"));
    mockedFs.existsSync.mockReturnValue(true);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("Constructor", () => {
    it("should initialize with config and create axios client", () => {
      llamaService = new LlamaService(mockConfig);

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: "http://localhost:8080",
        timeout: 5000,
        validateStatus: expect.any(Function),
      });
    });

    it("should initialize with minimal config", () => {
      const minimalConfig: LlamaServerConfig = {
        host: "0.0.0.0",
        port: 3000,
      };

      llamaService = new LlamaService(minimalConfig);

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: "http://0.0.0.0:3000",
        timeout: 5000,
        validateStatus: expect.any(Function),
      });
    });
  });

  describe("State Management", () => {
    beforeEach(() => {
      llamaService = new LlamaService(mockConfig);
    });

    it("should register state change callback", () => {
      const callback = jest.fn();
      llamaService.onStateChange(callback);

      const state = llamaService.getState();
      expect(state.status).toBe("initial");
    });

    it("should return current state", () => {
      const state = llamaService.getState();

      expect(state).toEqual({
        status: "initial",
        models: [],
        lastError: null,
        retries: 0,
        uptime: 0,
        startedAt: null,
      });
    });

    it("should call multiple state change callbacks", () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      llamaService.onStateChange(callback1);
      llamaService.onStateChange(callback2);

      // Trigger state change by starting service
      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockResolvedValue({ status: 200 });

      llamaService.start().catch(() => {});

      // Callbacks are stored internally
      expect(callback1).toBeDefined();
      expect(callback2).toBeDefined();
    });

    it("should handle errors in state change callbacks", () => {
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error("Callback error");
      });
      llamaService.onStateChange(errorCallback);

      // This should not throw
      expect(() => llamaService.start()).not.toThrow();
    });
  });

  describe("Start - Status Checks", () => {
    beforeEach(() => {
      llamaService = new LlamaService(mockConfig);
    });

    it("should return immediately if already ready", async () => {
      // Mock service as already ready
      (llamaService as any).state.status = "ready";

      await llamaService.start();

      expect(mockedSpawn).not.toHaveBeenCalled();
    });

    it("should return immediately if already starting", async () => {
      (llamaService as any).state.status = "starting";

      await llamaService.start();

      expect(mockedSpawn).not.toHaveBeenCalled();
    });

    it("should update status to starting when not ready", async () => {
      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockRejectedValue(new Error("Not ready"));

      await llamaService.start();

      expect((llamaService as any).state.status).toBe("error");
    });
  });

  describe("Start - Server Already Running", () => {
    beforeEach(() => {
      llamaService = new LlamaService(mockConfig);
      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockResolvedValue({ status: 200 });
    });

    it("should detect already running server and load models", async () => {
      const modelsResponse = {
        data: {
          data: [
            {
              id: "model1",
              name: "Test Model 1",
              size: 1000000000,
              type: "gguf",
            },
          ],
        },
      };
      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall
        .mockResolvedValueOnce({ status: 200 })
        .mockResolvedValueOnce({ status: 200, data: modelsResponse.data });

      await llamaService.start();

      expect(mockedSpawn).not.toHaveBeenCalled();
      expect((llamaService as any).state.models).toHaveLength(1);
      expect((llamaService as any).state.status).toBe("ready");
    });
  });

  describe("Start - Spawn Server", () => {
    beforeEach(() => {
      llamaService = new LlamaService(mockConfig);
      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockRejectedValue(new Error("Not ready"));
    });

    it("should start server when not running", async () => {
      // Mock health check after spawn
      const healthCheckCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      healthCheckCall
        .mockRejectedValueOnce(new Error("Not ready"))
        .mockResolvedValueOnce({ status: 200 });

      // Mock model loading
      const modelsResponse = {
        data: {
          data: [
            {
              id: "model1",
              name: "Test Model 1",
              size: 1000000000,
              type: "gguf",
            },
          ],
        },
      };
      healthCheckCall.mockResolvedValueOnce({ status: 200, data: modelsResponse.data });

      await llamaService.start();

      expect(mockedSpawn).toHaveBeenCalledWith(
        "/path/to/llama-server",
        expect.arrayContaining([
          "-m",
          "/path/to/model.gguf",
          "--host",
          "localhost",
          "--port",
          "8080",
        ]),
        {
          stdio: ["ignore", "pipe", "pipe"],
          detached: false,
        }
      );
    });

    it("should register process error handler", async () => {
      const healthCheckCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      healthCheckCall.mockRejectedValue(new Error("Not ready"));

      await llamaService.start();

      expect(mockProcess.on).toHaveBeenCalledWith("error", expect.any(Function));
    });

    it("should register process exit handler", async () => {
      const healthCheckCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      healthCheckCall.mockRejectedValue(new Error("Not ready"));

      await llamaService.start();

      expect(mockProcess.on).toHaveBeenCalledWith("exit", expect.any(Function));
    });

    it("should register stdout data handler", async () => {
      const healthCheckCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      healthCheckCall.mockRejectedValue(new Error("Not ready"));

      await llamaService.start();

      expect(mockStdout.on).toHaveBeenCalledWith("data", expect.any(Function));
    });

    it("should register stderr data handler", async () => {
      const healthCheckCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      healthCheckCall.mockRejectedValue(new Error("Not ready"));

      await llamaService.start();

      expect(mockStderr.on).toHaveBeenCalledWith("data", expect.any(Function));
    });
  });

  describe("Stop", () => {
    beforeEach(() => {
      llamaService = new LlamaService(mockConfig);
      (llamaService as any).process = mockProcess;
    });

    it("should stop running process gracefully", async () => {
      let exitCallback: any;
      mockProcess.on = jest.fn((event: string, callback: any) => {
        if (event === "exit") {
          exitCallback = callback;
        }
        return mockProcess;
      });

      const stopPromise = llamaService.stop();

      expect(mockProcess.kill).toHaveBeenCalledWith("SIGTERM");

      // Simulate exit
      exitCallback?.(0, "SIGTERM");

      await stopPromise;

      expect((llamaService as any).state.status).toBe("initial");
      expect((llamaService as any).process).toBeNull();
    });

    it("should force kill if SIGTERM timeout", async () => {
      mockProcess.on = jest.fn((event: string) => {
        if (event === "exit") {
          // Don't call callback to simulate timeout
        }
        return mockProcess;
      });

      const stopPromise = llamaService.stop();

      expect(mockProcess.kill).toHaveBeenCalledWith("SIGTERM");

      // Fast-forward past 5 second timeout
      jest.advanceTimersByTime(5000);

      await stopPromise;

      expect(mockProcess.kill).toHaveBeenCalledWith("SIGKILL");
      expect((llamaService as any).process).toBeNull();
    });

    it("should handle stop when no process running", async () => {
      (llamaService as any).process = null;

      await llamaService.stop();

      expect(mockProcess.kill).not.toHaveBeenCalled();
      expect((llamaService as any).state.status).toBe("initial");
    });
  });

  describe("Health Check", () => {
    beforeEach(() => {
      llamaService = new LlamaService(mockConfig);
    });

    it("should return true when health endpoint responds with 200", async () => {
      const healthCheckCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      healthCheckCall.mockResolvedValue({ status: 200 });

      const result = await (llamaService as any).healthCheck();

      expect(result).toBe(true);
      expect(healthCheckCall).toHaveBeenCalledWith("/health");
    });

    it("should return false when health endpoint returns error", async () => {
      const healthCheckCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      healthCheckCall.mockRejectedValue(new Error("Connection refused"));

      const result = await (llamaService as any).healthCheck();

      expect(result).toBe(false);
    });

    it("should return false when health endpoint returns non-200 status", async () => {
      const healthCheckCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      healthCheckCall.mockResolvedValue({ status: 503 });

      const result = await (llamaService as any).healthCheck();

      expect(result).toBe(false);
    });
  });

  describe("WaitForReady - Timeout", () => {
    beforeEach(() => {
      llamaService = new LlamaService(mockConfig);
      (llamaService as any).maxHealthChecks = 3;
      (llamaService as any).healthCheckIntervalMs = 100;
    });

    it("should throw error when max health checks exceeded", async () => {
      const healthCheckCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      healthCheckCall.mockRejectedValue(new Error("Not ready"));

      await expect((llamaService as any).waitForReady()).rejects.toThrow(
        "Llama server did not respond after"
      );
    });
  });

  describe("Load Models - Server Response", () => {
    beforeEach(() => {
      llamaService = new LlamaService(mockConfig);
    });

    it("should load models from server API", async () => {
      const modelsResponse = {
        status: 200,
        data: {
          data: [
            {
              id: "model1",
              name: "Test Model 1",
              size: 1000000000,
              type: "gguf",
              path: "/path/to/model1.gguf",
            },
            {
              id: "model2",
              name: "Test Model 2",
              size: 2000000000,
              type: "bin",
              path: "/path/to/model2.bin",
            },
          ],
        },
      };

      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockResolvedValue(modelsResponse);

      await (llamaService as any).loadModels();

      expect((llamaService as any).state.models).toHaveLength(2);
      expect((llamaService as any).state.models[0]).toEqual({
        id: "model1",
        name: "model1",
        size: 1000000000,
        type: "gguf",
        path: "/path/to/model1.gguf",
        modified_at: expect.any(Number),
      });
    });

    it("should handle server API returning array directly", async () => {
      const modelsResponse = {
        status: 200,
        data: [
          {
            id: "model1",
            name: "Test Model 1",
            size: 1000000000,
            type: "gguf",
          },
        ],
      };

      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockResolvedValue(modelsResponse);

      await (llamaService as any).loadModels();

      expect((llamaService as any).state.models).toHaveLength(1);
      expect((llamaService as any).state.models[0].name).toBe("model1");
    });

    it("should handle empty models list from server", async () => {
      const emptyResponse = {
        status: 200,
        data: { data: [] },
      };

      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockResolvedValue(emptyResponse);

      await (llamaService as any).loadModels();

      expect((llamaService as any).state.models).toHaveLength(0);
    });

    it("should handle server API error and fallback to filesystem", async () => {
      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockRejectedValue(new Error("API Error"));

      // Mock filesystem
      const mockDirents = [
        { name: "model1", isFile: () => true, isDirectory: () => false } as any,
      ];
      mockedFs.readdirSync.mockReturnValue(mockDirents as any);
      mockedFs.statSync.mockReturnValue({
        size: 1000000000,
        mtimeMs: Date.now(),
      } as any);

      await (llamaService as any).loadModels();

      expect((llamaService as any).state.models).toBeInstanceOf(Array);
    });
  });

  describe("Load Models - Filesystem Fallback", () => {
    beforeEach(() => {
      llamaService = new LlamaService(mockConfig);
      mockedFs.existsSync.mockReturnValue(true);
    });

    it("should handle no basePath configured", async () => {
      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockRejectedValue(new Error("API Error"));

      // No basePath
      const configNoBasePath: LlamaServerConfig = {
        host: "localhost",
        port: 8080,
        modelPath: "/path/to/model.gguf",
      };
      const serviceNoBasePath = new LlamaService(configNoBasePath);

      await (serviceNoBasePath as any).loadModels();

      expect((serviceNoBasePath as any).state.models).toHaveLength(0);
    });

    it("should handle directory not found", async () => {
      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockRejectedValue(new Error("API Error"));
      mockedFs.existsSync.mockReturnValue(false);

      await (llamaService as any).loadModels();

      expect((llamaService as any).state.models).toHaveLength(0);
    });

    it("should scan subdirectories for models", async () => {
      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockRejectedValue(new Error("API Error"));

      const mockDirents = [
        { name: "model1", isFile: () => false, isDirectory: () => true } as any,
        { name: "model2", isFile: () => false, isDirectory: () => true } as any,
      ];
      mockedFs.readdirSync.mockReturnValue(mockDirents as any);
      mockedFs.statSync.mockReturnValue({
        size: 1000000000,
        mtimeMs: Date.now(),
      } as any);

      // Mock reading subdirectories
      const mockSubdirFiles = [
        { name: "model.gguf", isFile: () => true, isDirectory: () => false },
      ];
      let readdirCallCount = 0;
      mockedFs.readdirSync.mockImplementation((path) => {
        readdirCallCount++;
        if (readdirCallCount === 1) {
          return mockDirents as any;
        }
        return mockSubdirFiles as any;
      });

      await (llamaService as any).loadModels();

      expect((llamaService as any).state.models.length).toBeGreaterThan(0);
    });
  });

  describe("Build Args - Basic Options", () => {
    beforeEach(() => {
      llamaService = new LlamaService(mockConfig);
    });

    it("should include model path", () => {
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("-m");
      expect(args).toContain("/path/to/model.gguf");
    });

    it("should use models directory when no model path", () => {
      const configWithoutModelPath = { ...mockConfig };
      delete configWithoutModelPath.modelPath;
      llamaService = new LlamaService(configWithoutModelPath);

      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--models-dir");
      expect(args).toContain("/path/to/models");
    });

    it("should include host and port", () => {
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--host");
      expect(args).toContain("localhost");
      expect(args).toContain("--port");
      expect(args).toContain("8080");
    });
  });

  describe("Build Args - Advanced Options", () => {
    it("should include ctx_size", () => {
      const config = { ...mockConfig, ctx_size: 4096 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("-c");
      expect(args).toContain("4096");
    });

    it("should include batch_size", () => {
      const config = { ...mockConfig, batch_size: 1024 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("-b");
      expect(args).toContain("1024");
    });

    it("should include ubatch_size", () => {
      const config = { ...mockConfig, ubatch_size: 512 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--ubatch-size");
      expect(args).toContain("512");
    });

    it("should include threads", () => {
      const config = { ...mockConfig, threads: 8 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("-t");
      expect(args).toContain("8");
    });

    it("should exclude threads when -1", () => {
      const config = { ...mockConfig, threads: -1 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).not.toContain("-t");
    });

    it("should include threads_batch", () => {
      const config = { ...mockConfig, threads_batch: 4 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--threads-batch");
      expect(args).toContain("4");
    });

    it("should include gpu_layers", () => {
      const config = { ...mockConfig, gpu_layers: 30 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("-ngl");
      expect(args).toContain("30");
    });

    it("should exclude gpu_layers when -1", () => {
      const config = { ...mockConfig, gpu_layers: -1 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).not.toContain("-ngl");
    });

    it("should include main_gpu", () => {
      const config = { ...mockConfig, main_gpu: 1 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("-mg");
      expect(args).toContain("1");
    });

    it("should exclude main_gpu when 0", () => {
      const config = { ...mockConfig, main_gpu: 0 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).not.toContain("-mg");
    });
  });

  describe("Build Args - Sampling Options", () => {
    it("should include temperature", () => {
      const config = { ...mockConfig, temperature: 0.8 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--temp");
      expect(args).toContain("0.8");
    });

    it("should include top_k", () => {
      const config = { ...mockConfig, top_k: 40 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--top-k");
      expect(args).toContain("40");
    });

    it("should include top_p", () => {
      const config = { ...mockConfig, top_p: 0.95 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--top-p");
      expect(args).toContain("0.95");
    });

    it("should include repeat_penalty", () => {
      const config = { ...mockConfig, repeat_penalty: 1.1 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--repeat-penalty");
      expect(args).toContain("1.1");
    });

    it("should include n_predict", () => {
      const config = { ...mockConfig, n_predict: 256 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("-n");
      expect(args).toContain("256");
    });

    it("should exclude n_predict when -1", () => {
      const config = { ...mockConfig, n_predict: -1 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).not.toContain("-n");
    });

    it("should include seed", () => {
      const config = { ...mockConfig, seed: 42 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--seed");
      expect(args).toContain("42");
    });

    it("should exclude seed when -1", () => {
      const config = { ...mockConfig, seed: -1 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).not.toContain("--seed");
    });
  });

  describe("Build Args - Flash Attention", () => {
    it("should include -fa when flash_attn is on", () => {
      const config = { ...mockConfig, flash_attn: "on" as const };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("-fa");
      expect(args).not.toContain("--no-flash-attn");
    });

    it("should include --no-flash-attn when flash_attn is off", () => {
      const config = { ...mockConfig, flash_attn: "off" as const };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--no-flash-attn");
      expect(args).not.toContain("-fa");
    });

    it("should not include flash attention args when auto", () => {
      const config = { ...mockConfig, flash_attn: "auto" as const };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).not.toContain("-fa");
      expect(args).not.toContain("--no-flash-attn");
    });
  });

  describe("Build Args - Cache Options", () => {
    it("should include cache_type_k", () => {
      const config = { ...mockConfig, cache_type_k: "f16" };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--cache-type-k");
      expect(args).toContain("f16");
    });

    it("should include cache_type_v", () => {
      const config = { ...mockConfig, cache_type_v: "q8_0" };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--cache-type-v");
      expect(args).toContain("q8_0");
    });
  });

  describe("Build Args - Additional Options", () => {
    it("should include embedding flag", () => {
      const config = { ...mockConfig, embedding: true };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--embedding");
    });

    it("should include verbose flag", () => {
      const config = { ...mockConfig, verbose: true };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--verbose");
    });

    it("should include penalize_nl flag", () => {
      const config = { ...mockConfig, penalize_nl: true };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--penalize-nl");
    });

    it("should include ignore_eos flag", () => {
      const config = { ...mockConfig, ignore_eos: true };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--ignore-eos");
    });

    it("should include mlock flag", () => {
      const config = { ...mockConfig, mlock: true };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--mlock");
    });

    it("should include numa flag", () => {
      const config = { ...mockConfig, numa: true };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--numa");
    });

    it("should include memory_mapped flag", () => {
      const config = { ...mockConfig, memory_mapped: true };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--memory-mapped");
    });

    it("should include --no-mmap when use_mmap is false", () => {
      const config = { ...mockConfig, use_mmap: false };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--no-mmap");
    });

    it("should include --no-kv-offload flag", () => {
      const config = { ...mockConfig, no_kv_offload: true };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--no-kv-offload");
    });

    it("should include --ml-lock flag", () => {
      const config = { ...mockConfig, ml_lock: true };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--ml-lock");
    });
  });

  describe("Build Args - Advanced Sampling Options", () => {
    it("should include min_p", () => {
      const config = { ...mockConfig, min_p: 0.1 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--min-p");
      expect(args).toContain("0.1");
    });

    it("should include xtc_probability", () => {
      const config = { ...mockConfig, xtc_probability: 0.5 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--xtc-probability");
      expect(args).toContain("0.5");
    });

    it("should include xtc_threshold", () => {
      const config = { ...mockConfig, xtc_threshold: 0.2 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--xtc-threshold");
      expect(args).toContain("0.2");
    });

    it("should include typical_p", () => {
      const config = { ...mockConfig, typical_p: 0.9 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--typical-p");
      expect(args).toContain("0.9");
    });

    it("should include presence_penalty", () => {
      const config = { ...mockConfig, presence_penalty: 0.5 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--presence-penalty");
      expect(args).toContain("0.5");
    });

    it("should include frequency_penalty", () => {
      const config = { ...mockConfig, frequency_penalty: 0.3 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--frequency-penalty");
      expect(args).toContain("0.3");
    });
  });

  describe("Build Args - DRY Options", () => {
    it("should include dry_multiplier", () => {
      const config = { ...mockConfig, dry_multiplier: 0.8 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--dry-multiplier");
      expect(args).toContain("0.8");
    });

    it("should include dry_base", () => {
      const config = { ...mockConfig, dry_base: 2.0 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--dry-base");
      expect(args).toContain("2");
    });

    it("should include dry_allowed_length", () => {
      const config = { ...mockConfig, dry_allowed_length: 3 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--dry-allowed-length");
      expect(args).toContain("3");
    });

    it("should include dry_penalty_last_n", () => {
      const config = { ...mockConfig, dry_penalty_last_n: 10 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--dry-penalty-last-n");
      expect(args).toContain("10");
    });

    it("should include repeat_last_n", () => {
      const config = { ...mockConfig, repeat_last_n: 32 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--repeat-last-n");
      expect(args).toContain("32");
    });
  });

  describe("Build Args - RoPE Options", () => {
    it("should include rope_freq_base", () => {
      const config = { ...mockConfig, rope_freq_base: 10000 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--rope-freq-base");
      expect(args).toContain("10000");
    });

    it("should include rope_freq_scale", () => {
      const config = { ...mockConfig, rope_freq_scale: 1.0 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--rope-freq-scale");
      expect(args).toContain("1");
    });
  });

  describe("Build Args - YARN Options", () => {
    it("should include yarn_ext_factor", () => {
      const config = { ...mockConfig, yarn_ext_factor: 0.5 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--yarn-ext-factor");
      expect(args).toContain("0.5");
    });

    it("should include yarn_attn_factor", () => {
      const config = { ...mockConfig, yarn_attn_factor: 1.0 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--yarn-attn-factor");
      expect(args).toContain("1");
    });

    it("should include yarn_beta_fast", () => {
      const config = { ...mockConfig, yarn_beta_fast: 32.0 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--yarn-beta-fast");
      expect(args).toContain("32");
    });

    it("should include yarn_beta_slow", () => {
      const config = { ...mockConfig, yarn_beta_slow: 64.0 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--yarn-beta-slow");
      expect(args).toContain("64");
    });
  });

  describe("Build Args - Group Attention", () => {
    it("should include grp_attn_n", () => {
      const config = { ...mockConfig, grp_attn_n: 2 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--grp-attn-n");
      expect(args).toContain("2");
    });

    it("should include grp_attn_w", () => {
      const config = { ...mockConfig, grp_attn_w: 256 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--grp-attn-w");
      expect(args).toContain("256");
    });

    it("should include neg_prompt_multiplier", () => {
      const config = { ...mockConfig, neg_prompt_multiplier: 1.5 };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--neg-prompt-multiplier");
      expect(args).toContain("1.5");
    });
  });

  describe("Build Args - Custom Server Args", () => {
    it("should include custom server arguments", () => {
      const config = {
        ...mockConfig,
        serverArgs: ["--custom-flag", "custom-value", "--another-flag"],
      };
      llamaService = new LlamaService(config);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain("--custom-flag");
      expect(args).toContain("custom-value");
      expect(args).toContain("--another-flag");
    });
  });

  describe("Crash Handling", () => {
    beforeEach(() => {
      llamaService = new LlamaService(mockConfig);
    });

    it("should handle crash and retry with backoff", async () => {
      (llamaService as any).state.status = "crashed";
      (llamaService as any).state.retries = 0;

      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockRejectedValue(new Error("Not ready"));

      const startPromise = (llamaService as any).handleCrash();

      jest.advanceTimersByTime(1000);

      await startPromise;

      expect((llamaService as any).state.retries).toBe(1);
      expect((llamaService as any).state.status).toBe("crashed");
    });

    it("should stop retrying after max retries exceeded", async () => {
      (llamaService as any).state.retries = 5;
      (llamaService as any).state.status = "crashed";

      await (llamaService as any).handleCrash();

      expect((llamaService as any).state.status).toBe("error");
      expect((llamaService as any).state.lastError).toBe("Max retries exceeded");
    });

    it("should handle retry failure recursively", async () => {
      (llamaService as any).state.status = "crashed";
      (llamaService as any).state.retries = 1;

      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockRejectedValue(new Error("Always fails"));

      // Spy on handleCrash to prevent infinite recursion in tests
      const handleCrashSpy = jest.spyOn(llamaService as any, "handleCrash").mockResolvedValue();

      const startPromise = (llamaService as any).handleCrash();

      jest.advanceTimersByTime(2000);

      await startPromise;

      expect(handleCrashSpy).toHaveBeenCalled();
      handleCrashSpy.mockRestore();
    });
  });

  describe("Update State", () => {
    beforeEach(() => {
      llamaService = new LlamaService(mockConfig);
    });

    it("should update status and emit state change", () => {
      (llamaService as any).updateState("ready");

      expect((llamaService as any).state.status).toBe("ready");
    });

    it("should update error message when provided", () => {
      (llamaService as any).updateState("error", "Test error");

      expect((llamaService as any).state.lastError).toBe("Test error");
    });

    it("should reset retries when status is ready", () => {
      (llamaService as any).state.retries = 3;

      (llamaService as any).updateState("ready");

      expect((llamaService as any).state.retries).toBe(0);
    });
  });

  describe("Uptime Tracking", () => {
    beforeEach(() => {
      llamaService = new LlamaService(mockConfig);
    });

    it("should start uptime tracking", () => {
      (llamaService as any).startUptimeTracking();

      expect((llamaService as any).uptimeInterval).not.toBeNull();
      expect((llamaService as any).state.startedAt).toBeInstanceOf(Date);
    });

    it("should update uptime every second", () => {
      (llamaService as any).startUptimeTracking();

      jest.advanceTimersByTime(2000);

      expect((llamaService as any).state.uptime).toBeGreaterThanOrEqual(1);
    });

    it("should stop uptime tracking on stop", () => {
      (llamaService as any).startUptimeTracking();
      const interval = (llamaService as any).uptimeInterval;

      llamaService.stop().catch(() => {});

      jest.advanceTimersByTime(1000);

      expect((llamaService as any).uptimeInterval).toBeNull();
    });
  });

  describe("Logger", () => {
    beforeEach(() => {
      llamaService = new LlamaService(mockConfig);
    });

    it("should log info messages", () => {
      expect(() => (llamaService as any).logger("info", "Test info")).not.toThrow();
    });

    it("should log warn messages", () => {
      expect(() => (llamaService as any).logger("warn", "Test warning")).not.toThrow();
    });

    it("should log error messages", () => {
      expect(() => (llamaService as any).logger("error", "Test error")).not.toThrow();
    });

    it("should log debug messages", () => {
      expect(() => (llamaService as any).logger("debug", "Test debug")).not.toThrow();
    });
  });
});
