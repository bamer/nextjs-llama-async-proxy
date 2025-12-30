import { z } from "zod";
import {
  validateRequestBody,
  validateConfig,
  validateWithDefault,
  ValidationResult,
} from "@/lib/validation-utils";

// Mock the logger
jest.mock("@/lib/logger", () => ({
  getLogger: jest.fn(() => ({
    error: jest.fn(),
  })),
}));

describe("validation-utils", () => {
  const testSchema = z.object({
    name: z.string().min(1),
    age: z.number().min(0).max(120),
  });

  type TestType = z.infer<typeof testSchema>;

  describe("validateRequestBody", () => {
    it("should return success with valid data", () => {
      const validData = { name: "John", age: 25 };
      const result = validateRequestBody(testSchema, validData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
      expect(result.errors).toBeUndefined();
    });

    it("should return errors with invalid data", () => {
      const invalidData = { name: "", age: 150 };
      const result = validateRequestBody(testSchema, invalidData);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it("should handle unexpected errors", () => {
      // Create a schema that throws a non-Zod error
      const badSchema = {
        parse: () => {
          throw new Error("Unexpected error");
        },
      } as any;

      const result = validateRequestBody(badSchema, {});

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toEqual(["Validation failed due to an unexpected error"]);
    });
  });

  describe("validateConfig", () => {
    it("should return success with valid config", () => {
      const validConfig = { name: "Config", age: 30 };
      const result = validateConfig(testSchema, validConfig, "test config");

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validConfig);
      expect(result.errors).toBeUndefined();
    });

    it("should return errors with invalid config and custom name", () => {
      const invalidConfig = { name: "", age: -5 };
      const result = validateConfig(testSchema, invalidConfig, "my config");

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it("should use default config name", () => {
      const invalidConfig = { name: "", age: -5 };
      const result = validateConfig(testSchema, invalidConfig);

      expect(result.success).toBe(false);
    });

    it("should handle unexpected errors with config name", () => {
      const badSchema = {
        parse: () => {
          throw new Error("Unexpected config error");
        },
      } as any;

      const result = validateConfig(badSchema, {}, "bad config");

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(["Validation failed for bad config due to an unexpected error"]);
    });
  });

  describe("validateWithDefault", () => {
    it("should return validated data when valid", () => {
      const validData = { name: "Valid", age: 20 };
      const defaultValue = { name: "Default", age: 0 };

      const result = validateWithDefault(testSchema, validData, defaultValue);

      expect(result).toEqual(validData);
    });

    it("should return default value when invalid", () => {
      const invalidData = { name: "", age: 200 };
      const defaultValue = { name: "Default", age: 0 };

      const result = validateWithDefault(testSchema, invalidData, defaultValue);

      expect(result).toEqual(defaultValue);
    });

    it("should return default value on unexpected error", () => {
      const badSchema = {
        parse: () => {
          throw new Error("Unexpected");
        },
      } as any;
      const defaultValue = { name: "Default", age: 0 };

      const result = validateWithDefault(badSchema, {}, defaultValue);

      expect(result).toEqual(defaultValue);
    });
  });
});