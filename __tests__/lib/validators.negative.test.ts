/**
 * Negative Validation Tests for Legacy Validator Schemas
 *
 * Tests negative validation scenarios for:
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

describe("configSchema - Negative Validation", () => {
  it("should reject invalid model ID (not UUID format)", () => {
    const invalidConfig = {
      models: [
        {
          id: "not-a-uuid",
          name: "test-model",
          options: {
            temperature: 0.7,
            top_p: 0.9,
          },
        },
      ],
      parameters: [],
    };

    const result = configSchema.safeParse(invalidConfig);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("models");
      expect(result.error.issues[0].path).toContain("id");
      expect(result.error.issues[0].message).toContain("UUID");
    }
  });

  it("should reject temperature value above 1", () => {
    const invalidConfig = {
      models: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "test-model",
          options: {
            temperature: 1.5,
            top_p: 0.9,
          },
        },
      ],
      parameters: [],
    };

    const result = configSchema.safeParse(invalidConfig);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("temperature");
      expect(result.error.issues[0].message).toMatch(/<=1/);
    }
  });

  it("should reject temperature value below 0", () => {
    const invalidConfig = {
      models: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "test-model",
          options: {
            temperature: -0.5,
            top_p: 0.9,
          },
        },
      ],
      parameters: [],
    };

    const result = configSchema.safeParse(invalidConfig);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("temperature");
      expect(result.error.issues[0].message).toMatch(/>=0/);
    }
  });

  it("should reject top_p value above 1", () => {
    const invalidConfig = {
      models: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "test-model",
          options: {
            temperature: 0.7,
            top_p: 2.0,
          },
        },
      ],
      parameters: [],
    };

    const result = configSchema.safeParse(invalidConfig);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("top_p");
      expect(result.error.issues[0].message).toMatch(/<=1/);
    }
  });

  it("should reject top_p value below 0", () => {
    const invalidConfig = {
      models: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "test-model",
          options: {
            temperature: 0.7,
            top_p: -0.1,
          },
        },
      ],
      parameters: [],
    };

    const result = configSchema.safeParse(invalidConfig);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("top_p");
      expect(result.error.issues[0].message).toMatch(/>=0/);
    }
  });

  it("should reject empty parameter category", () => {
    const invalidConfig = {
      models: [],
      parameters: [
        {
          category: "",
          paramName: "temperature",
        },
      ],
    };

    const result = configSchema.safeParse(invalidConfig);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("category");
      expect(result.error.issues[0].message).toMatch(/>=1 characters/);
    }
  });

  it("should reject empty parameter name", () => {
    const invalidConfig = {
      models: [],
      parameters: [
        {
          category: "generation",
          paramName: "",
        },
      ],
    };

    const result = configSchema.safeParse(invalidConfig);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("paramName");
      expect(result.error.issues[0].message).toMatch(/>=1 characters/);
    }
  });

  it("should reject missing models field", () => {
    const invalidConfig = {
      parameters: [],
    };

    const result = configSchema.safeParse(invalidConfig);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "models")).toBe(
        true
      );
    }
  });

  it("should reject missing parameters field", () => {
    const invalidConfig = {
      models: [],
    };

    const result = configSchema.safeParse(invalidConfig);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.path[0] === "parameters")
      ).toBe(true);
    }
  });

  it("should reject wrong type for models (not array)", () => {
    const invalidConfig = {
      models: "not-an-array" as any,
      parameters: [],
    };

    const result = configSchema.safeParse(invalidConfig);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("models");
      expect(result.error.issues[0].message).toContain("array");
    }
  });

  it("should reject wrong type for temperature (not number)", () => {
    const invalidConfig = {
      models: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "test-model",
          options: {
            temperature: "0.7" as any,
            top_p: 0.9,
          },
        },
      ],
      parameters: [],
    };

    const result = configSchema.safeParse(invalidConfig);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("temperature");
      expect(result.error.issues[0].message).toContain("number");
    }
  });

  it("should reject missing options object in model", () => {
    const invalidConfig = {
      models: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "test-model",
        } as any,
      ],
      parameters: [],
    };

    const result = configSchema.safeParse(invalidConfig);

    expect(result.success).toBe(false);
  });
});

describe("parameterSchema - Negative Validation", () => {
  it("should reject empty category", () => {
    const invalidParameter = {
      category: "",
      paramName: "temperature",
    };

    const result = parameterSchema.safeParse(invalidParameter);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("category");
      expect(result.error.issues[0].message).toMatch(/>=1 characters/);
    }
  });

  it("should reject empty paramName", () => {
    const invalidParameter = {
      category: "generation",
      paramName: "",
    };

    const result = parameterSchema.safeParse(invalidParameter);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("paramName");
      expect(result.error.issues[0].message).toMatch(/>=1 characters/);
    }
  });

  it("should reject missing category field", () => {
    const invalidParameter = {
      paramName: "temperature",
    };

    const result = parameterSchema.safeParse(invalidParameter);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("category");
    }
  });

  it("should reject missing paramName field", () => {
    const invalidParameter = {
      category: "generation",
    };

    const result = parameterSchema.safeParse(invalidParameter);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("paramName");
    }
  });

  it("should reject wrong type for category (not string)", () => {
    const invalidParameter = {
      category: 123 as any,
      paramName: "temperature",
    };

    const result = parameterSchema.safeParse(invalidParameter);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("category");
      expect(result.error.issues[0].message).toContain("string");
    }
  });

  it("should reject wrong type for paramName (not string)", () => {
    const invalidParameter = {
      category: "generation",
      paramName: null as any,
    };

    const result = parameterSchema.safeParse(invalidParameter);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("paramName");
      expect(result.error.issues[0].message).toContain("string");
    }
  });
});

describe("websocketSchema - Negative Validation", () => {
  it("should reject empty message", () => {
    const invalidMessage = {
      message: "",
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: 1234567890,
    };

    const result = websocketSchema.safeParse(invalidMessage);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("message");
      expect(result.error.issues[0].message).toMatch(/>=1 characters/);
    }
  });

  it("should reject invalid clientId (not UUID format)", () => {
    const invalidMessage = {
      message: "test",
      clientId: "not-a-uuid",
      timestamp: 1234567890,
    };

    const result = websocketSchema.safeParse(invalidMessage);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("clientId");
      expect(result.error.issues[0].message).toContain("UUID");
    }
  });

  it("should reject non-integer timestamp (decimal)", () => {
    const invalidMessage = {
      message: "test",
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: 1234567890.5,
    };

    const result = websocketSchema.safeParse(invalidMessage);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("timestamp");
      expect(result.error.issues[0].message).toMatch(/expected int/);
    }
  });

  it("should reject string timestamp", () => {
    const invalidMessage = {
      message: "test",
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: "1234567890" as any,
    };

    const result = websocketSchema.safeParse(invalidMessage);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("timestamp");
      expect(result.error.issues[0].message).toContain("number");
    }
  });

  it("should reject missing message field", () => {
    const invalidMessage = {
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: 1234567890,
    };

    const result = websocketSchema.safeParse(invalidMessage);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("message");
    }
  });

  it("should reject missing clientId field", () => {
    const invalidMessage = {
      message: "test",
      timestamp: 1234567890,
    };

    const result = websocketSchema.safeParse(invalidMessage);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("clientId");
    }
  });

  it("should reject missing timestamp field", () => {
    const invalidMessage = {
      message: "test",
      clientId: "550e8400-e29b-41d4-a716-446655440000",
    };

    const result = websocketSchema.safeParse(invalidMessage);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("timestamp");
    }
  });

  it("should reject wrong type for message (not string)", () => {
    const invalidMessage = {
      message: 123 as any,
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: 1234567890,
    };

    const result = websocketSchema.safeParse(invalidMessage);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("message");
      expect(result.error.issues[0].message).toContain("string");
    }
  });

  it("should reject wrong type for clientId (not string)", () => {
    const invalidMessage = {
      message: "test",
      clientId: 12345 as any,
      timestamp: 1234567890,
    };

    const result = websocketSchema.safeParse(invalidMessage);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("clientId");
      expect(result.error.issues[0].message).toContain("string");
    }
  });

  it("should reject NaN timestamp", () => {
    const invalidMessage = {
      message: "test",
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: NaN,
    };

    const result = websocketSchema.safeParse(invalidMessage);

    expect(result.success).toBe(false);
  });

  it("should reject Infinity timestamp", () => {
    const invalidMessage = {
      message: "test",
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: Infinity,
    };

    const result = websocketSchema.safeParse(invalidMessage);

    expect(result.success).toBe(false);
  });
});
