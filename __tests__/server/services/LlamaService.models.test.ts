import { LlamaService, LlamaServerConfig } from "@/server/services/LlamaService";
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

describe("LlamaService - Models", () => {
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
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
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
            { id: "model1", name: "Test Model 1", size: 1000000000, type: "gguf", path: "/path/to/model1.gguf" },
            { id: "model2", name: "Test Model 2", size: 2000000000, type: "bin", path: "/path/to/model2.bin" },
          ],
        },
      };

      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockResolvedValue(modelsResponse);

      await (llamaService as any).modelLoader.loadModels();

      expect((llamaService as any).stateManager.state.models).toHaveLength(2);
    });

    it("should handle server API returning array directly", async () => {
      const modelsResponse = {
        status: 200,
        data: [{ id: "model1", name: "Test Model 1", size: 1000000000, type: "gguf" }],
      };

      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockResolvedValue(modelsResponse);

      await (llamaService as any).modelLoader.loadModels();

      expect((llamaService as any).stateManager.state.models).toHaveLength(1);
    });

    it("should handle empty models list from server", async () => {
      const emptyResponse = { status: 200, data: { data: [] } };

      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockResolvedValue(emptyResponse);

      await (llamaService as any).modelLoader.loadModels();

      expect((llamaService as any).stateManager.state.models).toHaveLength(0);
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

      const configNoBasePath: LlamaServerConfig = {
        host: "localhost",
        port: 8080,
        modelPath: "/path/to/model.gguf",
      };
      const serviceNoBasePath = new LlamaService(configNoBasePath);

      await (serviceNoBasePath as any).modelLoader.loadModels();

      expect((serviceNoBasePath as any).stateManager.state.models).toHaveLength(0);
    });

    it("should handle directory not found", async () => {
      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockRejectedValue(new Error("API Error"));
      mockedFs.existsSync.mockReturnValue(false);

      await (llamaService as any).modelLoader.loadModels();

      expect((llamaService as any).stateManager.state.models).toHaveLength(0);
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

      const mockSubdirFiles = [{ name: "model.gguf", isFile: () => true, isDirectory: () => false }];
      let readdirCallCount = 0;
      mockedFs.readdirSync.mockImplementation((path) => {
        readdirCallCount++;
        if (readdirCallCount === 1) {
          return mockDirents as any;
        }
        return mockSubdirFiles as any;
      });

      await (llamaService as any).modelLoader.loadModels();

      expect((llamaService as any).stateManager.state.models.length).toBeGreaterThan(0);
    });
  });
});
