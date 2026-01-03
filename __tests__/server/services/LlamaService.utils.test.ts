import { LlamaService } from "@/server/services/LlamaService";
import { spawn } from "child_process";
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

const mockConfig: any = {
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

describe("LlamaService - Utils", () => {
  let llamaService: LlamaService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockedPath.join.mockImplementation((...args) => args.join("/"));
    mockedPath.resolve.mockImplementation((...args) => args.join("/"));
    mockedFs.existsSync.mockReturnValue(true);
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

  describe("Crash Handling", () => {
    it("should handle crash and retry with backoff", async () => {
      (llamaService as any).stateManager.state.status = "crashed";
      (llamaService as any).stateManager.state.retries = 0;

      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockRejectedValue(new Error("Not ready"));

      const startPromise = (llamaService as any).retryHandler.handleCrash();
      jest.advanceTimersByTime(1000);
      await startPromise;

      expect((llamaService as any).stateManager.state.retries).toBe(1);
      expect((llamaService as any).stateManager.state.status).toBe("crashed");
    });

    it("should stop retrying after max retries exceeded", async () => {
      (llamaService as any).stateManager.state.retries = 5;
      (llamaService as any).stateManager.state.status = "crashed";

      await (llamaService as any).retryHandler.handleCrash();

      expect((llamaService as any).stateManager.state.status).toBe("error");
      expect((llamaService as any).stateManager.state.lastError).toBe("Max retries exceeded");
    });
  });

  describe("Update State", () => {
    it("should update status and emit state change", () => {
      (llamaService as any).stateManager.updateState("ready");
      expect((llamaService as any).stateManager.state.status).toBe("ready");
    });

    it("should update error message when provided", () => {
      (llamaService as any).stateManager.updateState("error", "Test error");
      expect((llamaService as any).stateManager.state.lastError).toBe("Test error");
    });

    it("should reset retries when status is ready", () => {
      (llamaService as any).stateManager.state.retries = 3;
      (llamaService as any).stateManager.updateState("ready");
      expect((llamaService as any).stateManager.state.retries).toBe(0);
    });
  });

  describe("Uptime Tracking", () => {
    it("should start uptime tracking", () => {
      (llamaService as any).stateManager.startUptimeTracking();
      expect((llamaService as any).stateManager.uptimeInterval).not.toBeNull();
      expect((llamaService as any).stateManager.state.startedAt).toBeInstanceOf(Date);
    });

    it("should update uptime every second", () => {
      (llamaService as any).stateManager.startUptimeTracking();
      jest.advanceTimersByTime(2000);
      expect((llamaService as any).stateManager.state.uptime).toBeGreaterThanOrEqual(1);
    });

    it("should stop uptime tracking on stop", () => {
      (llamaService as any).stateManager.startUptimeTracking();
      const interval = (llamaService as any).stateManager.uptimeInterval;
      llamaService.stop().catch(() => {});
      jest.advanceTimersByTime(1000);
      expect((llamaService as any).stateManager.uptimeInterval).toBeNull();
    });
  });

  describe("Logger", () => {
    it("should log info messages", () => {
      expect(() => (llamaService as any).logger.info("Test info")).not.toThrow();
    });

    it("should log warn messages", () => {
      expect(() => (llamaService as any).logger.warn("Test warning")).not.toThrow();
    });

    it("should log error messages", () => {
      expect(() => (llamaService as any).logger.error("Test error")).not.toThrow();
    });

    it("should log debug messages", () => {
      expect(() => (llamaService as any).logger.debug("Test debug")).not.toThrow();
    });
  });
});
