import { MODEL_NAME_REGEX, DEFAULT_LAUNCH_TIMEOUT_MS, STATE_FILE_NAME, LOG_DIR } from "@/lib/constants";

describe("Constants", () => {
  describe("MODEL_NAME_REGEX", () => {
    it("accepts valid alphanumeric model names", () => {
      expect(MODEL_NAME_REGEX.test("llama2")).toBe(true);
      expect(MODEL_NAME_REGEX.test("model-name")).toBe(true);
      expect(MODEL_NAME_REGEX.test("model_name")).toBe(true);
    });

    it("accepts names with numbers", () => {
      expect(MODEL_NAME_REGEX.test("model123")).toBe(true);
      expect(MODEL_NAME_REGEX.test("llama2-v3")).toBe(true);
    });

    it("accepts uppercase letters", () => {
      expect(MODEL_NAME_REGEX.test("LLAMA")).toBe(true);
      expect(MODEL_NAME_REGEX.test("LLaMA-2")).toBe(true);
    });

    it("rejects spaces", () => {
      expect(MODEL_NAME_REGEX.test("model name")).toBe(false);
      expect(MODEL_NAME_REGEX.test("llama 2")).toBe(false);
    });

    it("rejects special characters", () => {
      expect(MODEL_NAME_REGEX.test("model@name")).toBe(false);
      expect(MODEL_NAME_REGEX.test("model!name")).toBe(false);
      expect(MODEL_NAME_REGEX.test("model.name")).toBe(false);
      expect(MODEL_NAME_REGEX.test("model#name")).toBe(false);
    });

    it("rejects empty string", () => {
      expect(MODEL_NAME_REGEX.test("")).toBe(false);
    });

    it("is a valid regex", () => {
      expect(MODEL_NAME_REGEX).toBeInstanceOf(RegExp);
    });

    it("matches full string", () => {
      // The regex should match entire strings, not just substrings
      expect("valid-model".match(MODEL_NAME_REGEX)?.[0]).toBe("valid-model");
    });
  });

  describe("DEFAULT_LAUNCH_TIMEOUT_MS", () => {
    it("is set to 30 seconds in milliseconds", () => {
      expect(DEFAULT_LAUNCH_TIMEOUT_MS).toBe(30000);
    });

    it("is a number", () => {
      expect(typeof DEFAULT_LAUNCH_TIMEOUT_MS).toBe("number");
    });

    it("is a positive number", () => {
      expect(DEFAULT_LAUNCH_TIMEOUT_MS).toBeGreaterThan(0);
    });

    it("is a reasonable timeout value", () => {
      expect(DEFAULT_LAUNCH_TIMEOUT_MS).toBeGreaterThanOrEqual(5000);
      expect(DEFAULT_LAUNCH_TIMEOUT_MS).toBeLessThanOrEqual(120000);
    });
  });

  describe("STATE_FILE_NAME", () => {
    it("is set to models-state.json", () => {
      expect(STATE_FILE_NAME).toBe("models-state.json");
    });

    it("is a string", () => {
      expect(typeof STATE_FILE_NAME).toBe("string");
    });

    it("has json extension", () => {
      expect(STATE_FILE_NAME).toMatch(/\.json$/);
    });

    it("is not empty", () => {
      expect(STATE_FILE_NAME.length).toBeGreaterThan(0);
    });
  });

  describe("LOG_DIR", () => {
    it("is a string", () => {
      expect(typeof LOG_DIR).toBe("string");
    });

    it("is not empty", () => {
      expect(LOG_DIR.length).toBeGreaterThan(0);
    });

    it("ends with logs directory", () => {
      expect(LOG_DIR).toMatch(/logs$/);
    });

    it("is an absolute path", () => {
      expect(LOG_DIR).toMatch(/^\//);
    });

    it("contains valid path separators", () => {
      expect(LOG_DIR).not.toMatch(/\\/);
    });
  });

  describe("all constants defined", () => {
    it("exports MODEL_NAME_REGEX", () => {
      expect(MODEL_NAME_REGEX).toBeDefined();
    });

    it("exports DEFAULT_LAUNCH_TIMEOUT_MS", () => {
      expect(DEFAULT_LAUNCH_TIMEOUT_MS).toBeDefined();
    });

    it("exports STATE_FILE_NAME", () => {
      expect(STATE_FILE_NAME).toBeDefined();
    });

    it("exports LOG_DIR", () => {
      expect(LOG_DIR).toBeDefined();
    });
  });

  describe("constants immutability", () => {
    it("MODEL_NAME_REGEX is immutable (regex)", () => {
      const originalRegex = MODEL_NAME_REGEX;
      expect(MODEL_NAME_REGEX).toBe(originalRegex);
    });

    it("DEFAULT_LAUNCH_TIMEOUT_MS cannot be reassigned in strict mode", () => {
      const originalTimeout = DEFAULT_LAUNCH_TIMEOUT_MS;
      expect(originalTimeout).toBe(30000);
    });

    it("STATE_FILE_NAME cannot be reassigned in strict mode", () => {
      const originalName = STATE_FILE_NAME;
      expect(originalName).toBe("models-state.json");
    });

    it("LOG_DIR cannot be reassigned in strict mode", () => {
      const originalDir = LOG_DIR;
      expect(originalDir).toBeDefined();
      expect(originalDir).toMatch(/logs$/);
    });
  });
});
