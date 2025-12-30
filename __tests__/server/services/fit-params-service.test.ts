import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import {
  analyzeModel,
  analyzeModels,
  parseModelFilename,
  parseFitParamsOutput,
  shouldAnalyze,
  FitParamsResult,
  ModelMetadata,
} from "@/server/services/fit-params-service";

// Mock external dependencies
jest.mock("child_process", () => ({
  exec: jest.fn(),
}));
jest.mock("util", () => ({
  promisify: jest.fn((fn) => fn),
}));
jest.mock("fs");
jest.mock("path");
jest.mock("winston", () => ({
  createLogger: jest.fn(() => ({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    json: jest.fn(),
    colorize: jest.fn(),
    simple: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
}));
jest.mock("winston-daily-rotate-file");
jest.mock("@/lib/logger", () => ({
  getLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  })),
}));

const mockedExec = require("child_process").exec as jest.MockedFunction<any>;
const mockedFs = require("fs") as jest.Mocked<typeof fs>;
const mockedPath = require("path") as jest.Mocked<typeof path>;

describe("FitParamsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.statSync.mockReturnValue({
      size: 1024 * 1024 * 1024, // 1GB
      mtimeMs: Date.now(),
    } as any);

    // Mock exec to return a promise
    mockedExec.mockImplementation(() =>
      Promise.resolve({
        stdout: "-c 4096\n-ngl 35\ncpu memory: 2.1 GB\ngpu memory: 1.8 GB",
        stderr: "",
      })
    );

    // Mock path.basename
    mockedPath.basename.mockImplementation((p) => p.split("/").pop() || "");
  });

  describe("parseModelFilename", () => {
    it("parses basic model filename correctly", () => {
      const filename = "/path/to/llama-2-7b.gguf";
      mockedPath.basename.mockReturnValue("llama-2-7b.gguf");

      const result = parseModelFilename(filename);

      expect(result).toEqual({
        file_size_bytes: 1024 * 1024 * 1024,
        quantization_type: null,
        parameter_count: 7,
        architecture: "llama",
        context_window: null,
      });
    });

    it("parses quantization type correctly", () => {
      const filename = "/path/to/model.Q4_K.gguf";
      mockedPath.basename.mockReturnValue("model.Q4_K.gguf");

      const result = parseModelFilename(filename);

      expect(result.quantization_type).toBe("Q4_K");
    });

    it("parses context window correctly", () => {
      const filename = "/path/to/model-8k.gguf";
      mockedPath.basename.mockReturnValue("model-8k.gguf");

      const result = parseModelFilename(filename);

      expect(result.context_window).toBe(8192);
    });

    it("handles file that doesn't exist", () => {
      mockedFs.existsSync.mockReturnValue(false);
      const filename = "/path/to/nonexistent.gguf";

      const result = parseModelFilename(filename);

      expect(result.file_size_bytes).toBe(0);
    });

    it("parses different architectures correctly", () => {
      const testCases = [
        { filename: "mistral-7b.gguf", expected: "mistral" },
        { filename: "gemma-2b.gguf", expected: "gemma" },
        { filename: "phi-3.gguf", expected: "phi" },
        { filename: "qwen-14b.gguf", expected: "qwen" },
      ];

      testCases.forEach(({ filename, expected }) => {
        mockedPath.basename.mockReturnValue(filename);
        const result = parseModelFilename(filename);
        expect(result.architecture).toBe(expected);
      });
    });

    it("handles complex filenames", () => {
      const filename = "/path/to/Mistral-7B-Instruct-v0.2.Q4_K.gguf";
      mockedPath.basename.mockReturnValue("Mistral-7B-Instruct-v0.2.Q4_K.gguf");

      const result = parseModelFilename(filename);

      expect(result).toEqual({
        file_size_bytes: 1024 * 1024 * 1024,
        quantization_type: "Q4_K",
        parameter_count: 7,
        architecture: "mistral",
        context_window: null,
      });
    });
  });

  describe("parseFitParamsOutput", () => {
    it("parses basic fit-params output correctly", () => {
      const output = `
Recommended parameters:
-c 4096
-ngl 35
-ts 0.5,0.5
cpu memory: 2.1 GB
gpu memory: 1.8 GB
`;

      const result = parseFitParamsOutput(output);

      expect(result).toEqual({
        recommended_ctx_size: 4096,
        recommended_gpu_layers: 35,
        recommended_tensor_split: "0.5,0.5",
        projected_cpu_memory_mb: 2150.4,
        projected_gpu_memory_mb: 1843.2,
        success: true,
        error: null,
        raw_output: output,
      });
    });

    it("handles output with MB instead of GB", () => {
      const output = `
cpu memory: 2048 MB
gpu memory: 1024 MB
`;

      const result = parseFitParamsOutput(output);

      expect(result.projected_cpu_memory_mb).toBe(2048);
      expect(result.projected_gpu_memory_mb).toBe(1024);
    });

    it("handles missing values gracefully", () => {
      const output = "Some random output without parameters";

      const result = parseFitParamsOutput(output);

      expect(result.recommended_ctx_size).toBeNull();
      expect(result.recommended_gpu_layers).toBeNull();
      expect(result.recommended_tensor_split).toBeNull();
      expect(result.projected_cpu_memory_mb).toBeNull();
      expect(result.projected_gpu_memory_mb).toBeNull();
      expect(result.success).toBe(true);
    });

    it("parses partial output correctly", () => {
      const output = `
-c 2048
cpu memory: 1.5 GB
`;

      const result = parseFitParamsOutput(output);

      expect(result.recommended_ctx_size).toBe(2048);
      expect(result.recommended_gpu_layers).toBeNull();
      expect(result.projected_cpu_memory_mb).toBe(1536);
    });
  });

  describe("analyzeModel", () => {
    it("analyzes model successfully", async () => {
      const modelPath = "/path/to/model.gguf";
      const mockOutput = "-c 4096\n-ngl 35\ncpu memory: 2.1 GB\ngpu memory: 1.8 GB";

      mockedExec.mockImplementation(() =>
        Promise.resolve({
          stdout: mockOutput,
          stderr: "",
        })
      );

      const result = await analyzeModel(modelPath);

      expect(result.success).toBe(true);
      expect(result.recommended_ctx_size).toBe(4096);
      expect(result.recommended_gpu_layers).toBe(35);
      expect(result.metadata.file_size_bytes).toBeGreaterThan(0);
      expect(result.error).toBeNull();
    });

    it("handles model file not found", async () => {
      mockedFs.existsSync.mockImplementation((path) => {
        if (path === "/path/to/model.gguf") return false;
        return true;
      });

      const result = await analyzeModel("/path/to/model.gguf");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Model file not found");
    });

    it("handles fit-params binary not found", async () => {
      mockedFs.existsSync.mockImplementation((path) => {
        if (String(path).includes("llama-fit-params")) return false;
        return true;
      });

      const result = await analyzeModel("/path/to/model.gguf");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Fit-params binary not found");
    });

    it("handles command execution failure", async () => {
      mockedExec.mockImplementation(() =>
        Promise.reject(new Error("Command failed"))
      );

      const result = await analyzeModel("/path/to/model.gguf");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Command failed");
    });

    it("handles timeout", async () => {
      mockedExec.mockImplementation(() =>
        Promise.reject(new Error("Command timed out"))
      );

      const result = await analyzeModel("/path/to/model.gguf");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Command timed out");
    });

    it("extracts metadata even when fit-params fails", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedExec.mockImplementation(() =>
        Promise.reject(new Error("Analysis failed"))
      );

      const result = await analyzeModel("/path/to/llama-2-7b-Q4_K.gguf");

      expect(result.success).toBe(false);
      expect(result.metadata.parameter_count).toBe(7);
      expect(result.metadata.quantization_type).toBe("Q4_K");
      expect(result.metadata.architecture).toBe("llama");
    });
  });

  describe("analyzeModels", () => {
    it("analyzes multiple models successfully", async () => {
      const modelPaths = ["/path/to/model1.gguf", "/path/to/model2.gguf"];

      mockedExec.mockImplementation(() =>
        Promise.resolve({
          stdout: "-c 4096\n-ngl 35",
          stderr: "",
        })
      );

      const results = await analyzeModels(modelPaths);

      expect(results.size).toBe(2);
      expect(results.has("/path/to/model1.gguf")).toBe(true);
      expect(results.has("/path/to/model2.gguf")).toBe(true);
      expect(results.get("/path/to/model1.gguf")?.success).toBe(true);
    });

    it("handles partial failures", async () => {
      const modelPaths = ["/path/to/model1.gguf", "/path/to/model2.gguf"];

      // Make first model succeed, second fail
      let callCount = 0;
      mockedExec.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ stdout: "-c 4096", stderr: "" });
        } else {
          return Promise.reject(new Error("Failed"));
        }
      });

      mockedFs.existsSync.mockImplementation((path) => {
        if (path === "/path/to/model2.gguf") return false;
        return true;
      });

      const results = await analyzeModels(modelPaths);

      expect(results.size).toBe(2);
      expect(results.get("/path/to/model1.gguf")?.success).toBe(true);
      expect(results.get("/path/to/model2.gguf")?.success).toBe(false);
    });

    it("handles empty model list", async () => {
      const results = await analyzeModels([]);

      expect(results.size).toBe(0);
    });
  });

  describe("shouldAnalyze", () => {
    it("returns true for never analyzed model", () => {
      const result = shouldAnalyze(null, "/path/to/model.gguf");

      expect(result).toBe(true);
    });

    it("returns true when model file is newer than last analysis", () => {
      const lastAnalyzed = Date.now() - 1000; // 1 second ago
      mockedFs.statSync.mockReturnValue({
        mtimeMs: Date.now(), // Now
      } as any);

      const result = shouldAnalyze(lastAnalyzed, "/path/to/model.gguf");

      expect(result).toBe(true);
    });

    it("returns false when model file is older than last analysis", () => {
      const lastAnalyzed = Date.now(); // Now
      mockedFs.statSync.mockReturnValue({
        mtimeMs: Date.now() - 1000, // 1 second ago
      } as any);

      const result = shouldAnalyze(lastAnalyzed, "/path/to/model.gguf");

      expect(result).toBe(false);
    });

    it("returns false when model path is null", () => {
      const result = shouldAnalyze(Date.now(), null);

      expect(result).toBe(false);
    });

    it("returns false when model file doesn't exist", () => {
      mockedFs.existsSync.mockReturnValue(false);

      const result = shouldAnalyze(Date.now(), "/path/to/nonexistent.gguf");

      expect(result).toBe(false);
    });
  });
});