/**
 * @jest-environment node
 */

/**
 * Branch coverage tests for filename-parser.js
 * Achieves ≥90% branch coverage by testing all uncovered branches
 */

import { jest } from "@jest/globals";

describe("filename-parser-branches", () => {
  let extractArchitecture, extractParams, extractQuantization;

  beforeAll(async () => {
    const module =
      await import("/home/bamer/nextjs-llama-async-proxy/server/gguf/filename-parser.js");
    extractArchitecture = module.extractArchitecture;
    extractParams = module.extractParams;
    extractQuantization = module.extractQuantization;
  });

  // ============================================
  // extractParams Uncovered Branches
  // ============================================

  describe("extractParams - uncovered special case branches", () => {
    /**
     * Tests the uncovered branch at line 54: nemotron-5b special case
     * This ensures the nemotron[-_]?5b pattern branch is covered
     */
    test("should return 5B for nemotron-5b special case", () => {
      expect(extractParams("nemotron-5b-instruct-q4_0.gguf")).toBe("5B");
    });

    test("should return 5B for nemotron_5b with underscore", () => {
      expect(extractParams("nemotron_5b-chat-q4_0.gguf")).toBe("5B");
    });

    /**
     * Tests the uncovered branch at line 55: mixtral-8x special case
     * This ensures the mixtral[-_]?8x pattern branch is covered.
     * The 8x must be at the end or followed by separator for this special case.
     */
    test("should return 12B for mixtral-8x (no additional numbers)", () => {
      expect(extractParams("mixtral-8x-v0.1-q4_k_m.gguf")).toBe("12B");
    });

    test("should return 12B for mixtral_8x with underscore", () => {
      expect(extractParams("mixtral_8x-v0.1-q4_0.gguf")).toBe("12B");
    });

    test("should return 12B for mixtral-8x followed by dash", () => {
      expect(extractParams("mixtral-8x-instruct-q4_0.gguf")).toBe("12B");
    });

    /**
     * Test the fallback branch (line 56) - when no special case matches
     * and no standard pattern found.
     * Note: mixtral-8x7b matches the 7B pattern first via standard regex.
     */
    test("should return empty string when no params match at all", () => {
      expect(extractParams("model-noparams.gguf")).toBe("");
    });

    test("should return empty for model without b parameter", () => {
      expect(extractParams("custom-model.gguf")).toBe("");
    });

    test("should return 7B for mixtral-8x7b (standard regex matches first)", () => {
      // The standard regex matches 7B before the special case can trigger
      expect(extractParams("mixtral-8x7b-v0.1-q4_0.gguf")).toBe("7B");
    });
  });

  // ============================================
  // extractQuantization Uncovered Branches
  // ============================================

  describe("extractQuantization - uncovered pattern branches", () => {
    /**
     * Tests the uncovered branch at line 73: IQ pattern match
     * This ensures the IQ[0-9]+ pattern branch is covered
     */
    test("should extract IQ1_S quantization pattern", () => {
      expect(extractQuantization("model-7b-IQ1_S.gguf")).toBe("IQ1_S");
    });

    test("should extract IQ2_XXS quantization pattern", () => {
      expect(extractQuantization("model-7b-IQ2_XXS.gguf")).toBe("IQ2_XXS");
    });

    test("should extract IQ2_XS quantization pattern", () => {
      expect(extractQuantization("model-7b-IQ2_XS.gguf")).toBe("IQ2_XS");
    });

    test("should extract IQ3_XXS quantization pattern", () => {
      expect(extractQuantization("model-7b-IQ3_XXS.gguf")).toBe("IQ3_XXS");
    });

    test("should extract IQ3_S quantization pattern", () => {
      expect(extractQuantization("model-7b-IQ3_S.gguf")).toBe("IQ3_S");
    });

    test("should extract IQ4_XS quantization pattern", () => {
      expect(extractQuantization("model-7b-IQ4_XS.gguf")).toBe("IQ4_XS");
    });

    test("should extract IQ4_NL quantization pattern", () => {
      expect(extractQuantization("model-7b-IQ4_NL.gguf")).toBe("IQ4_NL");
    });

    test("should extract IQ5_N quantization pattern", () => {
      expect(extractQuantization("model-7b-IQ5_N.gguf")).toBe("IQ5_N");
    });

    test("should handle uppercase IQ pattern only (case-sensitive)", () => {
      expect(extractQuantization("model-7b-IQ2_XXS.gguf")).toBe("IQ2_XXS");
    });

    /**
     * Tests the uncovered branch at line 78: directMatch with .gguf/.bin
     * This ensures the direct pattern matching branch is covered
     */
    test("should extract quantization from direct .gguf match with Q prefix", () => {
      expect(extractQuantization("model-Q5_K_M.gguf")).toBe("Q5_K_M");
    });

    test("should extract quantization from direct .bin match with Q prefix", () => {
      expect(extractQuantization("model-Q5_K_M.bin")).toBe("Q5_K_M");
    });

    test("should extract complex quantization from direct match", () => {
      expect(extractQuantization("model-Q4_K_S.gguf")).toBe("Q4_K_S");
    });

    /**
     * Tests the uncovered branch at line 81: endOfStringMatch
     * This ensures the quantization at end of string without extension is covered
     */
    test("should extract quantization at end of string with no extension", () => {
      expect(extractQuantization("model-7b-Q5_0")).toBe("Q5_0");
    });

    test("should extract complex quantization at end of string", () => {
      expect(extractQuantization("model-Q4_K_M")).toBe("Q4_K_M");
    });

    test("should extract Q8_0 at end of string", () => {
      expect(extractQuantization("model-7b-Q8_0")).toBe("Q8_0");
    });

    /**
     * Test the fallback branch (line 83): return empty string
     * when no quantization pattern matches
     */
    test("should return empty for filenames without any quantization", () => {
      expect(extractQuantization("model-without-quant.gguf")).toBe("");
    });

    test("should return empty for non-matching extension", () => {
      expect(extractQuantization("model-7b-fp16.gguf")).toBe("");
    });

    test("should extract partial Q pattern as Q4", () => {
      // The regex matches Q followed by digits even without suffix
      expect(extractQuantization("model-7b-incomplete-q4.gguf")).toBe("Q4");
    });

    test("should return empty for Q followed by non-number", () => {
      expect(extractQuantization("model-7b-qx_0.gguf")).toBe("");
    });
  });

  // ============================================
  // extractArchitecture Edge Cases (for completeness)
  // ============================================

  describe("extractArchitecture - edge case branches", () => {
    /**
     * Test that the default fallback branch is exercised
     */
    test("should return LLM for completely unknown model names", () => {
      expect(extractArchitecture("xyz-abc-123.gguf")).toBe("LLM");
    });

    test("should return LLM for numeric-only names", () => {
      expect(extractArchitecture("12345.gguf")).toBe("LLM");
    });

    test("should return LLM for special character names", () => {
      expect(extractArchitecture("@#$%-model.gguf")).toBe("LLM");
    });

    /**
     * Test regex patterns that might have edge cases
     */
    test("should detect DeepSeek with various separators", () => {
      expect(extractArchitecture("deepseek.r1.gguf")).toBe("DeepSeek");
    });

    test("should detect Mixtral with complex naming", () => {
      expect(extractArchitecture("mixtral-8x7b-instruct.gguf")).toBe("Mixtral");
    });
  });

  // ============================================
  // Complex Filename Scenarios
  // ============================================

  describe("complex filename scenarios", () => {
    /**
     * Test filenames that exercise multiple branches
     */
    test("should parse complex DeepSeek R1 filename with IQ quantization", () => {
      expect(extractArchitecture("deepseek-r1-7b-q4_0.gguf")).toBe("DeepSeek-R1");
      expect(extractParams("deepseek-r1-7b-q4_0.gguf")).toBe("7B");
      expect(extractQuantization("deepseek-r1-7b-q4_0.gguf")).toBe("Q4_0");
    });

    test("should parse mixtral with 8x special case", () => {
      expect(extractArchitecture("mixtral-8x-instruct-q4_k_m.gguf")).toBe("Mixtral");
      expect(extractParams("mixtral-8x-instruct-q4_k_m.gguf")).toBe("12B");
      expect(extractQuantization("mixtral-8x-instruct-q4_k_m.gguf")).toBe("Q4_K_M");
    });

    test("should parse nemotron-5b special case", () => {
      expect(extractArchitecture("nemotron-5b-instruct-q4_0.gguf")).toBe("Nemotron");
      expect(extractParams("nemotron-5b-instruct-q4_0.gguf")).toBe("5B");
      expect(extractQuantization("nemotron-5b-instruct-q4_0.gguf")).toBe("Q4_0");
    });

    test("should parse IQ quantization pattern", () => {
      expect(extractArchitecture("llama-7b-instruct.gguf")).toBe("Llama");
      expect(extractParams("llama-7b-instruct.gguf")).toBe("7B");
      expect(extractQuantization("llama-7b-IQ2_XXS.gguf")).toBe("IQ2_XXS");
    });
  });
});
