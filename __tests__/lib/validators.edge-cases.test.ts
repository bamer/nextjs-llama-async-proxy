/**
 * Edge Case Tests for Legacy Validator Schemas
 *
 * Tests edge cases and special scenarios for:
 * - configSchema: Configuration validation
 * - parameterSchema: Parameter validation
 * - websocketSchema: WebSocket message validation
 */

import { describe, it, expect } from "@jest/globals";
import {
  configSchema,
  parameterSchema,
  websocketSchema,
} from "@/lib/validators";

describe("Edge Cases - configSchema", () => {
  it("should handle empty configuration", () => {
    const emptyConfig = {
      models: [],
      parameters: [],
    };

    const result = configSchema.safeParse(emptyConfig);

    expect(result.success).toBe(true);
  });

  it("should accept very long model name", () => {
    const longName = "a".repeat(1000);
    const validConfig = {
      models: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: longName,
          options: { temperature: 0.7, top_p: 0.9 },
        },
      ],
      parameters: [],
    };

    const result = configSchema.safeParse(validConfig);

    expect(result.success).toBe(true);
  });

  it("should handle extra fields in model object", () => {
    const configWithExtraField = {
      models: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "test-model",
          options: {
            temperature: 0.7,
            top_p: 0.9,
          },
          extraField: "should not be here" as any,
        },
      ],
      parameters: [],
    };

    const result = configSchema.safeParse(configWithExtraField);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.models[0]).not.toHaveProperty("extraField");
    }
  });
});

describe("Edge Cases - parameterSchema", () => {
  it("should accept whitespace-only category (documents current behavior)", () => {
    const invalidParameter = {
      category: "   ",
      paramName: "temperature",
    };

    const result = parameterSchema.safeParse(invalidParameter);

    expect(result.success).toBe(true);
  });
});

describe("Edge Cases - websocketSchema", () => {
  it("should accept very long message", () => {
    const longMessage = "x".repeat(10000);
    const validMessage = {
      message: longMessage,
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: 1234567890,
    };

    const result = websocketSchema.safeParse(validMessage);

    expect(result.success).toBe(true);
  });
});

describe("Validation Methods - parse vs safeParse", () => {
  it("should return validated data with parse on success", () => {
    const validConfig = {
      models: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "test-model",
          options: { temperature: 0.7, top_p: 0.9 },
        },
      ],
      parameters: [],
    };

    const result = configSchema.parse(validConfig);

    expect(result).toBeDefined();
    expect(result.models[0].id).toBe(validConfig.models[0].id);
  });

  it("should throw error with parse for invalid data", () => {
    const invalidConfig = {
      models: [
        {
          id: "not-a-uuid",
          name: "test-model",
          options: { temperature: 0.7, top_p: 0.9 },
        },
      ],
      parameters: [],
    };

    expect(() => configSchema.parse(invalidConfig)).toThrow();
    expect(() => configSchema.parse(invalidConfig)).toThrow("UUID");
  });

  it("should not throw error with safeParse for invalid data", () => {
    const invalidConfig = {
      models: [
        {
          id: "not-a-uuid",
          name: "test-model",
          options: { temperature: 0.7, top_p: 0.9 },
        },
      ],
      parameters: [],
    };

    expect(() => configSchema.safeParse(invalidConfig)).not.toThrow();
  });

  it("should return result object with safeParse", () => {
    const validConfig = {
      models: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "test-model",
          options: { temperature: 0.7, top_p: 0.9 },
        },
      ],
      parameters: [],
    };

    const result = configSchema.safeParse(validConfig);

    expect(result).toHaveProperty("success");
    if (result.success) {
      expect(result).toHaveProperty("data");
      expect(result.data).toBeDefined();
    }
  });

  it("should return error details with safeParse on failure", () => {
    const invalidConfig = {
      models: [
        {
          id: "not-a-uuid",
          name: "test-model",
          options: { temperature: 0.7, top_p: 0.9 },
        },
      ],
      parameters: [],
    };

    const result = configSchema.safeParse(invalidConfig);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result).toHaveProperty("error");
      expect(result.error).toHaveProperty("issues");
      expect(Array.isArray(result.error.issues)).toBe(true);
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});
