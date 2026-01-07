/**
 * @jest-environment node
 */

/**
 * Tests for filename-parser.js
 */

import { jest } from "@jest/globals";

describe("filename-parser", () => {
  let extractArchitecture, extractParams, extractQuantization;

  beforeAll(async () => {
    const module =
      await import("/home/bamer/nextjs-llama-async-proxy/server/gguf/filename-parser.js");
    extractArchitecture = module.extractArchitecture;
    extractParams = module.extractParams;
    extractQuantization = module.extractQuantization;
  });

  describe("extractArchitecture", () => {
    test("should detect DeepSeek-R1", () => {
      expect(extractArchitecture("deepseek-r1-7b-q4_k_m.gguf")).toBe("DeepSeek-R1");
    });
    test("should detect DeepSeek-Coder", () => {
      expect(extractArchitecture("deepseek-coder-6.7b-q4_0.gguf")).toBe("DeepSeek-Coder");
    });
    test("should detect CodeLlama", () => {
      expect(extractArchitecture("codellama-7b-python-q4_0.gguf")).toBe("CodeLlama");
    });
    test("should detect Mistral", () => {
      expect(extractArchitecture("mistral-7b-v0.1-q4_0.gguf")).toBe("Mistral");
    });
    test("should detect Qwen", () => {
      expect(extractArchitecture("qwen2.5-7b-instruct-q4_0.gguf")).toBe("Qwen");
    });
    test("should detect Llama", () => {
      expect(extractArchitecture("llama3-8b-instruct-q4_0.gguf")).toBe("Llama");
    });
    test("should detect Gemma", () => {
      expect(extractArchitecture("gemma-7b-it-q4_0.gguf")).toBe("Gemma");
    });
    test("should detect Phi", () => {
      expect(extractArchitecture("phi-3-mini-4k-instruct-q4_0.gguf")).toBe("Phi");
    });
    test("should detect Mixtral", () => {
      expect(extractArchitecture("mixtral-8x7b-v0.1-q4_k_m.gguf")).toBe("Mixtral");
    });
    test("should return LLM for unknown", () => {
      expect(extractArchitecture("unknown-model.gguf")).toBe("LLM");
    });
    test("should be case insensitive", () => {
      expect(extractArchitecture("LLAMA3-8B-Q4_0.gguf")).toBe("Llama");
    });
  });

  describe("extractParams", () => {
    test("should extract 7B", () => {
      expect(extractParams("llama3-7b-instruct-q4_0.gguf")).toBe("7B");
    });
    test("should extract 13B", () => {
      expect(extractParams("llama2-13b-chat-q4_0.gguf")).toBe("13B");
    });
    test("should extract 34B", () => {
      expect(extractParams("qwen-34b-chat-q4_0.gguf")).toBe("34B");
    });
    test("should handle Phi-3 special case", () => {
      expect(extractParams("phi-3-mini-4k-instruct-q4_0.gguf")).toBe("3B");
    });
    test("should return empty for no params", () => {
      expect(extractParams("model.gguf")).toBe("");
    });
  });

  describe("extractQuantization", () => {
    test("should extract Q4_K_M", () => {
      expect(extractQuantization("model-7b-q4_k_m.gguf")).toBe("Q4_K_M");
    });
    test("should extract Q8_0", () => {
      expect(extractQuantization("model-7b-q8_0.gguf")).toBe("Q8_0");
    });
    test("should extract Q4_0", () => {
      expect(extractQuantization("model-7b-q4_0.gguf")).toBe("Q4_0");
    });
    test("should return empty for no quantization", () => {
      expect(extractQuantization("model.gguf")).toBe("");
    });
  });
});
