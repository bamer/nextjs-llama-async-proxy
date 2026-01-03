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

describe("LlamaService - Build Args", () => {
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

  describe("Basic Options", () => {
    let llamaService: LlamaService;

    beforeEach(() => {
      llamaService = new LlamaService(mockConfig);
    });

    it("should include model path", () => {
      const args = (llamaService as any).processManager.buildArgs();
      expect(args).toContain("-m");
      expect(args).toContain("/path/to/model.gguf");
    });

    it("should use models directory when no model path", () => {
      const configWithoutModelPath = { ...mockConfig };
      delete configWithoutModelPath.modelPath;
      llamaService = new LlamaService(configWithoutModelPath);
      const args = (llamaService as any).processManager.buildArgs();
      expect(args).toContain("--models-dir");
      expect(args).toContain("/path/to/models");
    });

    it("should include host and port", () => {
      const args = (llamaService as any).processManager.buildArgs();
      expect(args).toContain("--host");
      expect(args).toContain("localhost");
      expect(args).toContain("--port");
      expect(args).toContain("8080");
    });
  });

  describe("Advanced Options", () => {
    it("should include ctx_size", () => {
      const config = { ...mockConfig, ctx_size: 4096 };
      const llamaService = new LlamaService(config);
      const args = (llamaService as any).processManager.buildArgs();
      expect(args).toContain("-c");
      expect(args).toContain("4096");
    });

    it("should include batch_size", () => {
      const config = { ...mockConfig, batch_size: 1024 };
      const llamaService = new LlamaService(config);
      const args = (llamaService as any).processManager.buildArgs();
      expect(args).toContain("-b");
      expect(args).toContain("1024");
    });

    it("should include threads", () => {
      const config = { ...mockConfig, threads: 8 };
      const llamaService = new LlamaService(config);
      const args = (llamaService as any).processManager.buildArgs();
      expect(args).toContain("-t");
      expect(args).toContain("8");
    });

    it("should include gpu_layers", () => {
      const config = { ...mockConfig, gpu_layers: 30 };
      const llamaService = new LlamaService(config);
      const args = (llamaService as any).processManager.buildArgs();
      expect(args).toContain("-ngl");
      expect(args).toContain("30");
    });
  });

  describe("Sampling Options", () => {
    it("should include temperature", () => {
      const config = { ...mockConfig, temperature: 0.8 };
      const llamaService = new LlamaService(config);
      const args = (llamaService as any).processManager.buildArgs();
      expect(args).toContain("--temp");
      expect(args).toContain("0.8");
    });

    it("should include top_k", () => {
      const config = { ...mockConfig, top_k: 40 };
      const llamaService = new LlamaService(config);
      const args = (llamaService as any).processManager.buildArgs();
      expect(args).toContain("--top-k");
      expect(args).toContain("40");
    });

    it("should include top_p", () => {
      const config = { ...mockConfig, top_p: 0.95 };
      const llamaService = new LlamaService(config);
      const args = (llamaService as any).processManager.buildArgs();
      expect(args).toContain("--top-p");
      expect(args).toContain("0.95");
    });

    it("should include repeat_penalty", () => {
      const config = { ...mockConfig, repeat_penalty: 1.1 };
      const llamaService = new LlamaService(config);
      const args = (llamaService as any).processManager.buildArgs();
      expect(args).toContain("--repeat-penalty");
      expect(args).toContain("1.1");
    });
  });

  describe("Additional Options", () => {
    it("should include embedding flag", () => {
      const config = { ...mockConfig, embedding: true };
      const llamaService = new LlamaService(config);
      const args = (llamaService as any).processManager.buildArgs();
      expect(args).toContain("--embedding");
    });

    it("should include verbose flag", () => {
      const config = { ...mockConfig, verbose: true };
      const llamaService = new LlamaService(config);
      const args = (llamaService as any).processManager.buildArgs();
      expect(args).toContain("--verbose");
    });

    it("should include penalize_nl flag", () => {
      const config = { ...mockConfig, penalize_nl: true };
      const llamaService = new LlamaService(config);
      const args = (llamaService as any).processManager.buildArgs();
      expect(args).toContain("--penalize-nl");
    });

    it("should include ignore_eos flag", () => {
      const config = { ...mockConfig, ignore_eos: true };
      const llamaService = new LlamaService(config);
      const args = (llamaService as any).processManager.buildArgs();
      expect(args).toContain("--ignore-eos");
    });
  });

  describe("Custom Server Args", () => {
    it("should include custom server arguments", () => {
      const config = {
        ...mockConfig,
        serverArgs: ["--custom-flag", "custom-value", "--another-flag"],
      };
      const llamaService = new LlamaService(config);
      const args = (llamaService as any).processManager.buildArgs();
      expect(args).toContain("--custom-flag");
      expect(args).toContain("custom-value");
      expect(args).toContain("--another-flag");
    });
  });
});
