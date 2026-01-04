import { analyzeModel, shouldAnalyze } from "@/server/services/fit-params-service";
import { setupDefaultMocks, mockExecSuccess, mockFileNotExists, mockExecFailure } from "./test-utils";

describe("FitParamsService - analyzeModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultMocks();
  });

  it("analyzes model successfully", async () => {
    const modelPath = "/path/to/model.gguf";
    const mockOutput = "-c 4096\n-ngl 35\ncpu memory: 2.1 GB\ngpu memory:1.8 GB";

    mockExecSuccess(mockOutput);

    const result = await analyzeModel(modelPath);

    expect(result.success).toBe(true);
    expect(result.recommended_ctx_size).toBe(4096);
    expect(result.recommended_gpu_layers).toBe(35);
    expect(result.metadata.file_size_bytes).toBeGreaterThan(0);
    expect(result.error).toBeNull();
  });

  it("handles model file not found", async () => {
    mockFileNotExists();

    const result = await analyzeModel("/path/to/model.gguf");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Model file not found");
  });

  it("handles fit-params binary not found", async () => {
    const { existsSync } = require("fs");
    (existsSync as jest.Mock).mockImplementation((p) => {
      if (String(p).includes("llama-fit-params")) return false;
      return true;
    });

    const result = await analyzeModel("/path/to/model.gguf");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Fit-params binary not found");
  });

  it("handles command execution failure", async () => {
    mockExecFailure("Command failed");

    const result = await analyzeModel("/path/to/model.gguf");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Command failed");
  });

  it("handles timeout", async () => {
    mockExecFailure("Command timed out");

    const result = await analyzeModel("/path/to/model.gguf");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Command timed out");
  });
});
