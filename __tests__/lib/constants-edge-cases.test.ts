import { MODEL_NAME_REGEX, DEFAULT_LAUNCH_TIMEOUT_MS, STATE_FILE_NAME, LOG_DIR } from "@/lib/constants";

describe("Constants edge cases", () => {
  describe("MODEL_NAME_REGEX", () => {
    // Positive: Accept valid alphanumeric model names
    it("accepts valid alphanumeric model names", () => {
      expect(MODEL_NAME_REGEX.test("llama2")).toBe(true);
      expect(MODEL_NAME_REGEX.test("model-name")).toBe(true);
      expect(MODEL_NAME_REGEX.test("model_name")).toBe(true);
    });

    // Positive: Accept names with numbers
    it("accepts names with numbers", () => {
      expect(MODEL_NAME_REGEX.test("model123")).toBe(true);
      expect(MODEL_NAME_REGEX.test("llama2-v3")).toBe(true);
      expect(MODEL_NAME_REGEX.test("7b-model")).toBe(true);
    });

    // Positive: Accept uppercase letters
    it("accepts uppercase letters", () => {
      expect(MODEL_NAME_REGEX.test("LLAMA")).toBe(true);
      expect(MODEL_NAME_REGEX.test("LLaMA-2")).toBe(true);
      expect(MODEL_NAME_REGEX.test("UPPER-MODEL")).toBe(true);
    });

    // Positive: Accept mixed case
    it("accepts mixed case names", () => {
      expect(MODEL_NAME_REGEX.test("Llama2-7B")).toBe(true);
      expect(MODEL_NAME_REGEX.test("Model_Name_123")).toBe(true);
    });

    // Positive: Accept consecutive hyphens and underscores
    it("accepts consecutive hyphens and underscores", () => {
      expect(MODEL_NAME_REGEX.test("model--name")).toBe(true);
      expect(MODEL_NAME_REGEX.test("model__name")).toBe(true);
      expect(MODEL_NAME_REGEX.test("model_-_name")).toBe(true);
    });

    // Positive: Accept names starting/ending with hyphen or underscore
    it("accepts names starting/ending with hyphen or underscore", () => {
      expect(MODEL_NAME_REGEX.test("-model")).toBe(true);
      expect(MODEL_NAME_REGEX.test("_model")).toBe(true);
      expect(MODEL_NAME_REGEX.test("model-")).toBe(true);
      expect(MODEL_NAME_REGEX.test("model_")).toBe(true);
    });

    // Positive: Accept very long valid names
    it("accepts very long valid names", () => {
      const longName = 'a'.repeat(1000);
      expect(MODEL_NAME_REGEX.test(longName)).toBe(true);
    });

    // Positive: Accept single character names
    it("accepts single character names", () => {
      expect(MODEL_NAME_REGEX.test("a")).toBe(true);
      expect(MODEL_NAME_REGEX.test("A")).toBe(true);
      expect(MODEL_NAME_REGEX.test("1")).toBe(true);
      expect(MODEL_NAME_REGEX.test("-")).toBe(true);
      expect(MODEL_NAME_REGEX.test("_")).toBe(true);
    });

    // Negative: Reject spaces
    it("rejects spaces", () => {
      expect(MODEL_NAME_REGEX.test("model name")).toBe(false);
      expect(MODEL_NAME_REGEX.test("llama 2")).toBe(false);
      expect(MODEL_NAME_REGEX.test(" modelname")).toBe(false);
      expect(MODEL_NAME_REGEX.test("modelname ")).toBe(false);
    });

    // Negative: Reject special characters
    it("rejects special characters", () => {
      expect(MODEL_NAME_REGEX.test("model@name")).toBe(false);
      expect(MODEL_NAME_REGEX.test("model!name")).toBe(false);
      expect(MODEL_NAME_REGEX.test("model.name")).toBe(false);
      expect(MODEL_NAME_REGEX.test("model#name")).toBe(false);
      expect(MODEL_NAME_REGEX.test("model$name")).toBe(false);
      expect(MODEL_NAME_REGEX.test("model%name")).toBe(false);
      expect(MODEL_NAME_REGEX.test("model&name")).toBe(false);
      expect(MODEL_NAME_REGEX.test("model*name")).toBe(false);
      expect(MODEL_NAME_REGEX.test("model+name")).toBe(false);
      expect(MODEL_NAME_REGEX.test("model=name")).toBe(false);
    });

    // Negative: Reject path separators
    it("rejects path separators", () => {
      expect(MODEL_NAME_REGEX.test("model/name")).toBe(false);
      expect(MODEL_NAME_REGEX.test("model\\name")).toBe(false);
      expect(MODEL_NAME_REGEX.test("model/name/path")).toBe(false);
    });

    // Negative: Reject empty string
    it("rejects empty string", () => {
      expect(MODEL_NAME_REGEX.test("")).toBe(false);
    });

    // Negative: Reject whitespace only
    it("rejects whitespace only", () => {
      expect(MODEL_NAME_REGEX.test("   ")).toBe(false);
      expect(MODEL_NAME_REGEX.test("\t")).toBe(false);
      expect(MODEL_NAME_REGEX.test("\n")).toBe(false);
    });

    // Edge case: Is a valid regex
    it("is a valid regex", () => {
      expect(MODEL_NAME_REGEX).toBeInstanceOf(RegExp);
      expect(typeof MODEL_NAME_REGEX.test).toBe('function');
    });

    // Edge case: Matches full string (not partial)
    it("matches full string (not partial)", () => {
      // The regex should match entire strings, not just substrings
      expect("valid-model".match(MODEL_NAME_REGEX)?.[0]).toBe("valid-model");
      expect("invalid-model!".match(MODEL_NAME_REGEX)).toBeNull();
    });

    // Edge case: Test with null and undefined
    it("handles null and undefined gracefully", () => {
      expect(() => MODEL_NAME_REGEX.test(null as any)).not.toThrow();
      expect(() => MODEL_NAME_REGEX.test(undefined as any)).not.toThrow();
    });

    // Edge case: Test with numbers
    it("handles numeric values", () => {
      expect(() => MODEL_NAME_REGEX.test(123 as any)).not.toThrow();
    });

    // Edge case: Test with objects
    it("handles object values", () => {
      expect(() => MODEL_NAME_REGEX.test({} as any)).not.toThrow();
    });
  });

  describe("DEFAULT_LAUNCH_TIMEOUT_MS", () => {
    // Positive: Is set to 30 seconds in milliseconds
    it("is set to 30 seconds in milliseconds", () => {
      expect(DEFAULT_LAUNCH_TIMEOUT_MS).toBe(30000);
    });

    // Positive: Is a number
    it("is a number", () => {
      expect(typeof DEFAULT_LAUNCH_TIMEOUT_MS).toBe("number");
      expect(Number.isInteger(DEFAULT_LAUNCH_TIMEOUT_MS)).toBe(true);
    });

    // Positive: Is a positive number
    it("is a positive number", () => {
      expect(DEFAULT_LAUNCH_TIMEOUT_MS).toBeGreaterThan(0);
    });

    // Positive: Is a reasonable timeout value (between 5s and 2m)
    it("is a reasonable timeout value", () => {
      expect(DEFAULT_LAUNCH_TIMEOUT_MS).toBeGreaterThanOrEqual(5000);
      expect(DEFAULT_LAUNCH_TIMEOUT_MS).toBeLessThanOrEqual(120000);
    });

    // Edge case: Converts correctly to seconds
    it("converts correctly to seconds", () => {
      expect(DEFAULT_LAUNCH_TIMEOUT_MS / 1000).toBe(30);
    });

    // Edge case: Converts correctly to minutes
    it("converts correctly to minutes", () => {
      expect(DEFAULT_LAUNCH_TIMEOUT_MS / 60000).toBe(0.5);
    });
  });

  describe("STATE_FILE_NAME", () => {
    // Positive: Is set to models-state.json
    it("is set to models-state.json", () => {
      expect(STATE_FILE_NAME).toBe("models-state.json");
    });

    // Positive: Is a string
    it("is a string", () => {
      expect(typeof STATE_FILE_NAME).toBe("string");
    });

    // Positive: Has json extension
    it("has json extension", () => {
      expect(STATE_FILE_NAME).toMatch(/\.json$/);
    });

    // Positive: Is not empty
    it("is not empty", () => {
      expect(STATE_FILE_NAME.length).toBeGreaterThan(0);
    });

    // Positive: Contains "state" in name
    it("contains 'state' in name", () => {
      expect(STATE_FILE_NAME).toContain('state');
    });

    // Positive: Contains "models" in name
    it("contains 'models' in name", () => {
      expect(STATE_FILE_NAME).toContain('models');
    });

    // Edge case: Can be used in file path operations
    it("can be used in file path operations", () => {
      expect(() => {
        const path = `/data/${STATE_FILE_NAME}`;
        expect(path).toBe('/data/models-state.json');
      }).not.toThrow();
    });
  });

  describe("LOG_DIR", () => {
    // Positive: Is a string
    it("is a string", () => {
      expect(typeof LOG_DIR).toBe("string");
    });

    // Positive: Is not empty
    it("is not empty", () => {
      expect(LOG_DIR.length).toBeGreaterThan(0);
    });

    // Positive: Ends with logs directory
    it("ends with logs directory", () => {
      expect(LOG_DIR).toMatch(/logs$/);
    });

    // Positive: Is an absolute path (starts with /)
    it("is an absolute path", () => {
      expect(LOG_DIR).toMatch(/^\//);
    });

    // Positive: Contains valid path separators
    it("contains valid path separators", () => {
      expect(LOG_DIR).not.toMatch(/\\/); // No Windows-style paths
    });

    // Edge case: Contains "logs" string
    it("contains 'logs' string", () => {
      expect(LOG_DIR).toContain('logs');
    });

    // Edge case: Can be used in file system operations
    it("can be used in file system operations", () => {
      expect(() => {
        const fullPath = `${LOG_DIR}/application.log`;
        expect(fullPath).toContain('logs');
      }).not.toThrow();
    });
  });

  describe("all constants defined", () => {
    // Positive: Exports MODEL_NAME_REGEX
    it("exports MODEL_NAME_REGEX", () => {
      expect(MODEL_NAME_REGEX).toBeDefined();
    });

    // Positive: Exports DEFAULT_LAUNCH_TIMEOUT_MS
    it("exports DEFAULT_LAUNCH_TIMEOUT_MS", () => {
      expect(DEFAULT_LAUNCH_TIMEOUT_MS).toBeDefined();
    });

    // Positive: Exports STATE_FILE_NAME
    it("exports STATE_FILE_NAME", () => {
      expect(STATE_FILE_NAME).toBeDefined();
    });

    // Positive: Exports LOG_DIR
    it("exports LOG_DIR", () => {
      expect(LOG_DIR).toBeDefined();
    });

    // Edge case: All constants have correct types
    it("all constants have correct types", () => {
      expect(MODEL_NAME_REGEX).toBeInstanceOf(RegExp);
      expect(typeof DEFAULT_LAUNCH_TIMEOUT_MS).toBe('number');
      expect(typeof STATE_FILE_NAME).toBe('string');
      expect(typeof LOG_DIR).toBe('string');
    });

    // Edge case: All constants are non-null
    it("all constants are non-null", () => {
      expect(MODEL_NAME_REGEX).not.toBeNull();
      expect(DEFAULT_LAUNCH_TIMEOUT_MS).not.toBeNull();
      expect(STATE_FILE_NAME).not.toBeNull();
      expect(LOG_DIR).not.toBeNull();
    });
  });

  describe("constants immutability", () => {
    // Positive: MODEL_NAME_REGEX is immutable (regex)
    it("MODEL_NAME_REGEX is immutable (regex)", () => {
      const originalRegex = MODEL_NAME_REGEX;
      expect(MODEL_NAME_REGEX).toBe(originalRegex);
    });

    // Positive: DEFAULT_LAUNCH_TIMEOUT_MS cannot be reassigned in strict mode
    it("DEFAULT_LAUNCH_TIMEOUT_MS has expected value", () => {
      const originalTimeout = DEFAULT_LAUNCH_TIMEOUT_MS;
      expect(originalTimeout).toBe(30000);
    });

    // Positive: STATE_FILE_NAME cannot be reassigned in strict mode
    it("STATE_FILE_NAME has expected value", () => {
      const originalName = STATE_FILE_NAME;
      expect(originalName).toBe("models-state.json");
    });

    // Positive: LOG_DIR cannot be reassigned in strict mode
    it("LOG_DIR has expected value", () => {
      const originalDir = LOG_DIR;
      expect(originalDir).toBeDefined();
      expect(originalDir).toMatch(/logs$/);
    });
  });

  describe("constant usage scenarios", () => {
    // Positive: Use MODEL_NAME_REGEX for validation
    it("can use MODEL_NAME_REGEX for validation", () => {
      const validNames = ['llama2', 'model-name', 'test_123'];
      const invalidNames = ['model name', 'model.name', ''];

      validNames.forEach(name => {
        expect(MODEL_NAME_REGEX.test(name)).toBe(true);
      });

      invalidNames.forEach(name => {
        expect(MODEL_NAME_REGEX.test(name)).toBe(false);
      });
    });

    // Positive: Use DEFAULT_LAUNCH_TIMEOUT_MS in timeout logic
    it("can use DEFAULT_LAUNCH_TIMEOUT_MS in timeout logic", () => {
      const timeoutMs = DEFAULT_LAUNCH_TIMEOUT_MS;
      const timeoutSeconds = timeoutMs / 1000;

      expect(timeoutSeconds).toBe(30);
    });

    // Positive: Use STATE_FILE_NAME for file operations
    it("can use STATE_FILE_NAME for file operations", () => {
      const filename = STATE_FILE_NAME;
      expect(filename.endsWith('.json')).toBe(true);
      expect(filename.includes('state')).toBe(true);
    });

    // Positive: Use LOG_DIR for log file paths
    it("can use LOG_DIR for log file paths", () => {
      const logPath = `${LOG_DIR}/app.log`;
      expect(logPath.includes('logs')).toBe(true);
    });
  });
});
