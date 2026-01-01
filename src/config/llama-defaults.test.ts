import { describe, it, expect } from "@jest/globals";
import { DEFAULT_LLAMA_SERVER_CONFIG } from "@/config/llama-defaults";

describe("LlamaDefaults - Main Test Suite", () => {
  it("should load configuration successfully", () => {
    expect(DEFAULT_LLAMA_SERVER_CONFIG).toBeDefined();
    expect(typeof DEFAULT_LLAMA_SERVER_CONFIG).toBe("object");
  });

  it("should be a frozen object", () => {
    expect(Object.isFrozen(DEFAULT_LLAMA_SERVER_CONFIG)).toBe(true);
  });

  it("should have expected number of configuration properties", () => {
    const keyCount = Object.keys(DEFAULT_LLAMA_SERVER_CONFIG).length;
    expect(keyCount).toBeGreaterThan(60);
  });
});

// Note: Comprehensive tests are split into:
// - llama-defaults.unit.test.ts (individual property tests)
// - llama-defaults.integration.test.ts (configuration completeness)
// - llama-defaults.edge-case.test.ts (edge cases and special values)
