import { z } from "zod";
import { getLogger } from "@/lib/logger";

jest.mock("@/lib/logger");

const mockLogger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

(getLogger as jest.Mock).mockReturnValue(mockLogger);

import {
  validateRequestBody,
  validateConfig,
  validateWithDefault,
  type ValidationResult,
} from "@/lib/validation-utils";

describe("validation-utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getLogger as jest.Mock).mockReturnValue(mockLogger);
  });

  describe("validateRequestBody", () => {
    const schema = z.object({
      name: z.string(),
      age: z.number().positive(),
      email: z.string().email().optional(),
    });

    it("should validate valid data", () => {
      const data = { name: "John", age: 30 };
      const result = validateRequestBody(schema, data);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.errors).toBeUndefined();
    });

    it("should validate optional fields", () => {
      const data = { name: "Jane", age: 25, email: "jane@example.com" };
      const result = validateRequestBody(schema, data);

      expect(result.success).toBe(true);
      expect(result.data?.email).toBe("jane@example.com");
    });

    it("should reject invalid data types", () => {
      const data = { name: "John", age: "thirty" };
      const result = validateRequestBody(schema, data as any);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it("should reject missing required fields", () => {
      const data = { name: "John" };
      const result = validateRequestBody(schema, data as any);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it("should reject invalid email format", () => {
      const data = { name: "John", age: 30, email: "invalid-email" };
      const result = validateRequestBody(schema, data as any);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it("should reject negative age", () => {
      const data = { name: "John", age: -5 };
      const result = validateRequestBody(schema, data as any);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it("should log validation errors", () => {
      const data = { name: "John", age: "invalid" };
      validateRequestBody(schema, data as any);

      expect(mockLogger.error).toHaveBeenCalledWith(
        "[Validation] Request body validation failed:",
        expect.any(Array)
      );
    });

    it("should return formatted error messages", () => {
      const data = { name: "John", age: "invalid" };
      const result = validateRequestBody(schema, data as any);

      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain("age");
    });

    it("should handle unexpected errors", () => {
      const badSchema = {
        parse: jest.fn().mockImplementation(() => {
          throw new Error("Unexpected error");
        }),
      } as any;

      const result = validateRequestBody(badSchema, {});

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        "Validation failed due to an unexpected error"
      );
    });
  });

  describe("validateConfig", () => {
    const configSchema = z.object({
      apiUrl: z.string().url(),
      timeout: z.number().positive().default(5000),
      debug: z.boolean().default(false),
    });

    it("should validate valid configuration", () => {
      const config = { apiUrl: "https://api.example.com", timeout: 3000 };
      const result = validateConfig(configSchema, config);

      expect(result.success).toBe(true);
      expect(result.data?.timeout).toBe(3000);
    });

    it("should apply default values", () => {
      const config = { apiUrl: "https://api.example.com" };
      const result = validateConfig(configSchema, config);

      expect(result.success).toBe(true);
      expect(result.data?.timeout).toBe(5000);
      expect(result.data?.debug).toBe(false);
    });

    it("should reject invalid URL format", () => {
      const config = { apiUrl: "not-a-url" };
      const result = validateConfig(configSchema, config as any);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it("should use custom config name in error logging", () => {
      const config = { apiUrl: "invalid" };
      validateConfig(configSchema, config as any, "MyConfig");

      expect(mockLogger.error).toHaveBeenCalledWith(
        "[Validation] MyConfig validation failed:",
        expect.any(Array)
      );
    });

    it("should use default config name in error logging", () => {
      const config = { apiUrl: "invalid" };
      validateConfig(configSchema, config as any);

      expect(mockLogger.error).toHaveBeenCalledWith(
        "[Validation] configuration validation failed:",
        expect.any(Array)
      );
    });

    it("should handle unexpected validation errors", () => {
      const badSchema = {
        parse: jest.fn().mockImplementation(() => {
          throw new TypeError("Type error");
        }),
      } as any;

      const result = validateConfig(badSchema, {}, "TestConfig");

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        "Validation failed for TestConfig due to an unexpected error"
      );
    });
  });

  describe("validateWithDefault", () => {
    const schema = z.object({
      name: z.string(),
      value: z.number(),
    });

    const defaultValue = { name: "default", value: 0 };

    it("should return validated data on success", () => {
      const data = { name: "test", value: 42 };
      const result = validateWithDefault(schema, data, defaultValue);

      expect(result).toEqual(data);
    });

    it("should return default on validation failure", () => {
      const data = { name: "test" };
      const result = validateWithDefault(schema, data as any, defaultValue);

      expect(result).toEqual(defaultValue);
    });

    it("should return default for null/undefined input", () => {
      const result = validateWithDefault(schema, null, defaultValue);

      expect(result).toEqual(defaultValue);
    });

    it("should handle complex default values", () => {
      const complexDefault = {
        name: "complex",
        value: 999,
      };

      const data = { name: "invalid", value: "bad" };
      const result = validateWithDefault(schema, data as any, complexDefault);

      expect(result).toEqual(complexDefault);
    });

    it("should log errors when returning default", () => {
      const data = { name: "test", value: "not-a-number" };
      validateWithDefault(schema, data as any, defaultValue);

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it("should not log errors on successful validation", () => {
      const data = { name: "test", value: 42 };
      mockLogger.error.mockClear();

      validateWithDefault(schema, data, defaultValue);

      expect(mockLogger.error).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle empty objects", () => {
      const schema = z.object({});
      const result = validateRequestBody(schema, {});

      expect(result.success).toBe(true);
    });

    it("should handle deeply nested validation errors", () => {
      const nestedSchema = z.object({
        user: z.object({
          profile: z.object({
            email: z.string().email(),
          }),
        }),
      });

      const data = { user: { profile: { email: "invalid" } } };
      const result = validateRequestBody(nestedSchema, data as any);

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain("user.profile.email");
    });

    it("should handle array validation", () => {
      const schema = z.object({
        items: z.array(z.string()),
      });

      const validData = { items: ["a", "b", "c"] };
      const validResult = validateRequestBody(schema, validData);
      expect(validResult.success).toBe(true);

      const invalidData = { items: ["a", 2, "c"] };
      const invalidResult = validateRequestBody(schema, invalidData as any);
      expect(invalidResult.success).toBe(false);
    });

    it("should format multiple errors", () => {
      const schema = z.object({
        name: z.string(),
        email: z.string().email(),
        age: z.number().positive(),
      });

      const data = { name: 123, email: "invalid", age: -5 };
      const result = validateRequestBody(schema, data as any);

      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(1);
    });
  });
});
