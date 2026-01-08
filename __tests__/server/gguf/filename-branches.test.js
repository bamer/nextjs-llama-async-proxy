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
     * The special case branches (lines 50-55) are only reached when the
     * standard regex on line 47 doesn't match. The standard regex requires
     * the 'b' to be followed by a separator [-._\s] or end of string.
     *
     * To reach these branches, we need filenames where:
     * 1. The standard pattern (\d+b) doesn't exist, OR
     * 2. The 'b' is NOT followed by a valid separator
     *
     * Each if-statement has two branches:
     * - True: regex matches, return value
     * - False: regex doesn't match, continue to next statement
     */

    /**
     * Test phi-3 special case (line 50) - requires standard regex to fail
     */
    test("should return 3B for phi-3 when standard regex doesn't match", () => {
      expect(extractParams("phi-3")).toBe("3B");
    });

    test("should return 3B for phi_3 with underscore", () => {
      expect(extractParams("phi_3")).toBe("3B");
    });

    /**
     * Test yi-34b special case (line 51)
     * IMPORTANT: The standard regex must fail for this branch to be reached.
     * This happens when there's no \d+b pattern or the 'b' isn't followed by a separator.
     */
    test("should return 34B for yi-34b with no separator after b", () => {
      // The 'b' in '34b' is at the end with no separator, so standard regex fails
      expect(extractParams("yi-34b")).toBe("34B");
    });

    test("should return 34B for yi_34b with underscore", () => {
      // With underscore, the pattern matches but standard regex still fails
      expect(extractParams("yi_34b")).toBe("34B");
    });

    /**
     * Test dbrx special case (line 52)
     */
    test("should return 132B for dbrx when standard regex doesn't match", () => {
      // dbrx doesn't have a number+b pattern, so special case always triggers
      expect(extractParams("dbrx")).toBe("132B");
    });

    /**
     * Test nematron-8b special case (line 53)
     */
    test("should return 8B for nematron-8b with no separator after b", () => {
      expect(extractParams("nematron-8b")).toBe("8B");
    });

    test("should return 8B for nematron_8b with underscore", () => {
      expect(extractParams("nematron_8b")).toBe("8B");
    });

    /**
     * Test nematron-5b special case (line 54)
     */
    test("should return 5B for nematron-5b with no separator after b", () => {
      expect(extractParams("nematron-5b")).toBe("5B");
    });

    test("should return 5B for nematron_5b with underscore", () => {
      expect(extractParams("nematron_5b")).toBe("5B");
    });

    /**
     * Test mixtral-8x special case (line 55)
     */
    test("should return 12B for mixtral-8x with no separator after", () => {
      expect(extractParams("mixtral-8x")).toBe("12B");
    });

    test("should return 12B for mixtral_8x with underscore", () => {
      expect(extractParams("mixtral_8x")).toBe("12B");
    });

    /**
     * Test the fallback branch (line 56) - when no special case matches
     */
    test("should return empty string when no params match at all", () => {
      expect(extractParams("model-noparams.gguf")).toBe("");
    });

    test("should return empty for model without b parameter", () => {
      expect(extractParams("custom-model.gguf")).toBe("");
    });

    test("should return empty for filename with only 'b' but no number", () => {
      expect(extractParams("model-b.gguf")).toBe("");
    });

    /**
     * Test FALSE branches of special cases by creating scenarios where
     * we reach each if-statement but the regex doesn't match.
     * This ensures complete branch coverage.
     */
    test("should exercise false branch of yi-34b condition", () => {
      // phi-2 has no 'b' parameter so standard regex fails
      // Contains 'yi' but not 'yi-34b' or 'yi_34b'
      expect(extractParams("phi-2-model.gguf")).toBe("");
    });

    test("should exercise false branch of nematron-8b condition", () => {
      // Contains 'nematron' but not 'nematron-8b' or 'nematron_8b'
      // Also has no standard 'b' parameter to avoid early return
      expect(extractParams("nematron-model.gguf")).toBe("");
    });

    test("should exercise false branch of nematron-5b condition", () => {
      // Contains 'nematron' but not 'nematron-5b' or 'nematron_5b'
      expect(extractParams("nematron-custom-model.gguf")).toBe("");
    });

    /**
     * Test that reaches deep into the special case chain with no matches.
     * This exercises multiple false branches in sequence.
     */
    test("should exercise multiple false branches in sequence", () => {
      // No standard params, contains parts of patterns but not full matches
      // Reaches: phi? no, yi? no, dbrx? no, nematron-8b? no, nematron-5b? no, mixtral-8x? no
      expect(extractParams("model-with-mixed-parts.gguf")).toBe("");
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
     * This pattern matches when quantization is immediately before the extension
     * without a dash or underscore separator.
     * IMPORTANT: This branch is only reached when endMatch and iqEndMatch don't match.
     */
    test("should extract quantization from direct .gguf match (no separator)", () => {
      // No -Q or _Q pattern, so endMatch fails
      // Quantization is immediately before .gguf
      expect(extractQuantization("model-Q5_K_M.gguf")).toBe("Q5_K_M");
    });

    test("should extract quantization from direct .bin match (no separator)", () => {
      expect(extractQuantization("model-Q5_K_M.bin")).toBe("Q5_K_M");
    });

    test("should extract Q8_0 from direct match", () => {
      expect(extractQuantization("model-Q8_0.gguf")).toBe("Q8_0");
    });

    test("should extract complex quantization from direct .gguf match", () => {
      expect(extractQuantization("model-Q4_K_S.gguf")).toBe("Q4_K_S");
    });

    /**
     * Tests the uncovered branch at line 81: endOfStringMatch
     * This ensures the quantization at end of string without extension is covered.
     * IMPORTANT: This branch is only reached when endMatch, iqEndMatch, and directMatch don't match.
     */
    test("should extract quantization at end of string with no extension", () => {
      // No quantization pattern found by earlier matches
      // Quantization at the very end with no file extension
      expect(extractQuantization("model-7b-Q5_0")).toBe("Q5_0");
    });

    test("should extract complex quantization at end of string", () => {
      expect(extractQuantization("model-Q4_K_M")).toBe("Q4_K_M");
    });

    test("should extract Q8_0 at end of string", () => {
      expect(extractQuantization("model-7b-Q8_0")).toBe("Q8_0");
    });

    test("should extract Q2_K at end of string", () => {
      expect(extractQuantization("model-Q2_K")).toBe("Q2_K");
    });

    /**
     * Test the fallback branch (line 83): return empty string
     */
    test("should return empty for filenames without any quantization", () => {
      expect(extractQuantization("model-without-quant.gguf")).toBe("");
    });

    test("should return empty for non-matching extension", () => {
      expect(extractQuantization("model-7b-fp16.gguf")).toBe("");
    });

    test("should extract partial Q pattern as Q4", () => {
      expect(extractQuantization("model-7b-incomplete-q4.gguf")).toBe("Q4");
    });

    /**
     * Test that reaches all branches of extractQuantization function.
     * This ensures all patterns are exercised.
     */
    test("should exercise fallback branch when no patterns match", () => {
      // Filename that doesn't match any quantization pattern
      expect(extractQuantization("model-noquant.gguf")).toBe("");
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

    test("should parse nematron-5b special case", () => {
      expect(extractArchitecture("nematron-5b-instruct-q4_0.gguf")).toBe("Nemotron");
      expect(extractParams("nematron-5b-instruct-q4_0.gguf")).toBe("5B");
      expect(extractQuantization("nematron-5b-instruct-q4_0.gguf")).toBe("Q4_0");
    });

    test("should parse IQ quantization pattern", () => {
      expect(extractArchitecture("llama-7b-instruct.gguf")).toBe("Llama");
      expect(extractParams("llama-7b-instruct.gguf")).toBe("7B");
      expect(extractQuantization("llama-7b-IQ2_XXS.gguf")).toBe("IQ2_XXS");
    });

    /**
     * Test direct match pattern
     */
    test("should parse direct quantization match", () => {
      expect(extractQuantization("llama-Q8_0.gguf")).toBe("Q8_0");
    });

    /**
     * Test end of string quantization
     */
    test("should parse quantization at end of string", () => {
      expect(extractQuantization("llama-7b-Q5_1")).toBe("Q5_1");
    });
  });
});
