import { LlamaService, LlamaServerConfig } from "@/server/services/LlamaService";
import { spawn, ChildProcess } from "child_process";
import axios from "axios";
import fs from "fs";
import path from "path";

jest.mock("child_process");
jest.mock("axios");
jest.mock("fs");
jest.mock("path");

const mockedSpawn = spawn as jest.MockedFunction<typeof spawn>;
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedPath = path as jest.Mocked<typeof path>;

const mockConfig: LlamaServerConfig = {
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

describe("LlamaService - Lifecycle", () => {
  let llamaService: LlamaService;
  let mockProcess: any;
  let mockStdout: any;
  let mockStderr: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockedPath.join.mockImplementation((...args) => args.join("/"));
    mockedPath.resolve.mockImplementation((...args) => args.join("/"));
    mockedFs.existsSync.mockReturnValue(true);

    mockStdout = { on: jest.fn() };
    mockStderr = { on: jest.fn() };
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
    llamaService = new LlamaService(mockConfig);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("Start - Status Checks", () => {
    it("should return immediately if already ready", async () => {
      (llamaService as any).stateManager.state.status = "ready";
      await llamaService.start();
      expect(mockedSpawn).not.toHaveBeenCalled();
    });

    it("should return immediately if already starting", async () => {
      (llamaService as any).stateManager.state.status = "starting";
      await llamaService.start();
      expect(mockedSpawn).not.toHaveBeenCalled();
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
            { id: "model1", name: "Test Model 1", size: 1000000000, type: "gguf" },
          ],
        },
      };
      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall
        .mockResolvedValueOnce({ status: 200 })
        .mockResolvedValueOnce({ status: 200, data: modelsResponse.data });

      await llamaService.start();

      expect(mockedSpawn).not.toHaveBeenCalled();
      expect((llamaService as any).stateManager.state.models).toHaveLength(1);
      expect((llamaService as any).stateManager.state.status).toBe("ready");
    });
  });

  describe("Start - Spawn Server", () => {
    beforeEach(() => {
      llamaService = new LlamaService(mockConfig);
      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockRejectedValue(new Error("Not ready"));
    });

    it("should start server when not running", async () => {
      const healthCheckCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      healthCheckCall
        .mockRejectedValueOnce(new Error("Not ready"))
        .mockResolvedValueOnce({ status: 200 });

      const modelsResponse = {
        data: { data: [{ id: "model1", name: "Test Model 1", size: 1000000000, type: "gguf" }] },
      };
      healthCheckCall.mockResolvedValueOnce({ status: 200, data: modelsResponse.data });

      await llamaService.start();

      expect(mockedSpawn).toHaveBeenCalledWith(
        "/path/to/llama-server",
        expect.arrayContaining(["-m", "/path/to/model.gguf", "--host", "localhost", "--port", "8080"]),
        { stdio: ["ignore", "pipe", "pipe"], detached: false }
      );
    });

    it("should register process handlers", async () => {
      const healthCheckCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      healthCheckCall.mockRejectedValue(new Error("Not ready"));
      await llamaService.start();
      expect(mockProcess.on).toHaveBeenCalledWith("error", expect.any(Function));
      expect(mockProcess.on).toHaveBeenCalledWith("exit", expect.any(Function));
    });
  });

  describe("Stop", () => {
    beforeEach(() => {
      llamaService = new LlamaService(mockConfig);
      (llamaService as any).processManager.process = mockProcess;
    });

    it("should stop running process gracefully", async () => {
      let exitCallback: any;
      mockProcess.on = jest.fn((event: string, callback: any) => {
        if (event === "exit") exitCallback = callback;
        return mockProcess;
      });

      const stopPromise = llamaService.stop();
      expect(mockProcess.kill).toHaveBeenCalledWith("SIGTERM");
      exitCallback?.(0, "SIGTERM");
      await stopPromise;

      expect((llamaService as any).stateManager.state.status).toBe("initial");
      expect((llamaService as any).processManager.process).toBeNull();
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
      jest.advanceTimersByTime(5000);
      await stopPromise;

      expect(mockProcess.kill).toHaveBeenCalledWith("SIGKILL");
    });

    it("should handle stop when no process running", async () => {
      (llamaService as any).processManager.process = null;
      await llamaService.stop();
      expect(mockProcess.kill).not.toHaveBeenCalled();
    });
  });
});
