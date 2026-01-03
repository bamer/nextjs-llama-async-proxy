import { LlamaService, LlamaServerConfig } from "@/server/services/LlamaService";
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

describe("LlamaService - Constructor", () => {
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
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("should initialize with config and create axios client", () => {
    const llamaService = new LlamaService(mockConfig);

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

    const llamaService = new LlamaService(minimalConfig);

    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: "http://0.0.0.0:3000",
      timeout: 5000,
      validateStatus: expect.any(Function),
    });
  });
});
