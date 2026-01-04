import { parseModelFilename, parseFitParamsOutput } from "@/server/services/fit-params-service";
import * as path from "path";
import { setupDefaultMocks, mockExecSuccess, mockFileNotExists, mockExecFailure } from "./test-utils";

const mockedPath = require("path") as jest.Mocked<typeof path>;

describe("FitParamsService - parseModelFilename", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultMocks();
  });

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
    mockFileNotExists();
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
