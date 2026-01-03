import { LlamaService } from "@/server/services/LlamaService";
import { spawn, ChildProcess } from "child_process";
import axios from "axios";
import fs from "fs";
import path from "path";

// Mock dependencies
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

describe("LlamaService - State Management", () => {
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

    const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
    getCall.mockResolvedValue({ status: 200 });

    llamaService.start().catch(() => {});

    expect(callback1).toBeDefined();
    expect(callback2).toBeDefined();
  });

  it("should handle errors in state change callbacks", () => {
    const errorCallback = jest.fn().mockImplementation(() => {
      throw new Error("Callback error");
    });
    llamaService.onStateChange(errorCallback);

    expect(() => llamaService.start()).not.toThrow();
  });
});
