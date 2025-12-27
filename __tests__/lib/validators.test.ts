/**
 * Comprehensive Tests for src/lib/validators.ts Zod Schemas
 *
 * Objective: Test all Zod schemas with high coverage (>80%) including:
 * - configSchema: Configuration validation for models and parameters
 * - parameterSchema: Individual parameter validation
 * - websocketSchema: WebSocket message validation
 */

import { describe, it, expect } from "@jest/globals";
import {
  configSchema,
  parameterSchema,
  websocketSchema,
  ConfigSchema,
  ParameterSchema,
  WebSocketSchema,
} from "@/lib/validators";

describe("configSchema", () => {
  /**
   * Positive Test: Valid configuration with single model passes validation
   * Expected result: Schema should accept valid configuration with all required fields
   */
  it("should accept valid configuration with single model", () => {
    const validConfig = {
      models: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "llama2-7b",
          options: {
            temperature: 0.7,
            top_p: 0.9,
          },
        },
      ],
      parameters: [
        {
          category: "generation",
          paramName: "temperature",
        },
      ],
    };

    const result = configSchema.safeParse(validConfig);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.models[0].id).toBe(validConfig.models[0].id);
    }
  });

  /**
   * Positive Test: Valid configuration with multiple models and parameters passes validation
   * Expected result: Schema should accept multiple models and parameters in arrays
   */
  it("should accept valid configuration with multiple models and parameters", () => {
    const validConfig = {
      models: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "llama2-7b",
          options: {
            temperature: 0.7,
            top_p: 0.9,
          },
        },
        {
          id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
          name: "mistral-7b",
          options: {
            temperature: 0.5,
            top_p: 0.8,
          },
        },
      ],
      parameters: [
        {
          category: "generation",
          paramName: "temperature",
        },
        {
          category: "generation",
          paramName: "top_p",
        },
      ],
    };

    const result = configSchema.safeParse(validConfig);

    expect(result.success).toBe(true);
  });

  /**
   * Positive Test: Empty arrays for models and parameters are valid
   * Expected result: Schema should accept empty arrays as valid configuration
   */
  it("should accept empty arrays for models and parameters", () => {
    const validConfig = {
      models: [],
      parameters: [],
    };

    const result = configSchema.safeParse(validConfig);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.models).toEqual([]);
      expect(result.data.parameters).toEqual([]);
    }
  });

  /**
   * Positive Test: Boundary values (0 and 1) for temperature and top_p are accepted
   * Expected result: Schema should accept values at the minimum and maximum boundaries
   */
  it("should accept boundary values for temperature and top_p", () => {
    const validConfig = {
      models: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "test-model",
          options: {
            temperature: 0,
            top_p: 1,
          },
        },
      ],
      parameters: [],
    };

    const result = configSchema.safeParse(validConfig);

    expect(result.success).toBe(true);
  });

  /**
   * Negative Test: Invalid model ID (not UUID format) is rejected
   * Expected result: Schema should reject non-UUID strings with helpful error message
   */
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
      expect(result.error.issues[0].path).toContain("id");
      expect(result.error.issues[0].message).toMatch(/UUID/);
    }
  });

  /**
   * Negative Test: Empty model name is rejected
   * Expected result: Schema should reject empty string for model name
   */
  it("should reject empty model name", () => {
    const invalidConfig = {
      models: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "",
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
      expect(result.error.issues[0].path).toContain("name");
    }
  });

  /**
   * Negative Test: Temperature value above 1 is rejected
   * Expected result: Schema should reject temperature > 1 with range error
   */
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
    }
  });

  /**
   * Negative Test: Temperature value below 0 is rejected
   * Expected result: Schema should reject temperature < 0 with range error
   */
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
    }
  });

  /**
   * Negative Test: Top_p value above 1 is rejected
   * Expected result: Schema should reject top_p > 1 with range error
   */
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
    }
  });

  /**
   * Negative Test: Top_p value below 0 is rejected
   * Expected result: Schema should reject top_p < 0 with range error
   */
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
    }
  });

  /**
   * Negative Test: Empty parameter category is rejected
   * Expected result: Schema should reject empty string for parameter category
   */
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
    }
  });

  /**
   * Negative Test: Empty parameter name is rejected
   * Expected result: Schema should reject empty string for parameter name
   */
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
    }
  });

  /**
   * Negative Test: Missing required models field is rejected
   * Expected result: Schema should require models array
   */
  it("should reject missing models field", () => {
    const invalidConfig = {
      parameters: [],
    };

    const result = configSchema.safeParse(invalidConfig);

    expect(result.success).toBe(false);
  });

  /**
   * Negative Test: Missing required parameters field is rejected
   * Expected result: Schema should require parameters array
   */
  it("should reject missing parameters field", () => {
    const invalidConfig = {
      models: [],
    };

    const result = configSchema.safeParse(invalidConfig);

    expect(result.success).toBe(false);
  });

  /**
   * Negative Test: Wrong type for models (not an array) is rejected
   * Expected result: Schema should reject non-array value for models
   */
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

  /**
   * Negative Test: Wrong type for temperature (not a number) is rejected
   * Expected result: Schema should reject string value for temperature
   */
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

  /**
   * Type Test: Verify inferred ConfigSchema type matches expected structure
   * Expected result: TypeScript should accept properly typed config object
   */
  it("should correctly infer ConfigSchema type", () => {
    const typedConfig: ConfigSchema = {
      models: [],
      parameters: [],
    };

    const result = configSchema.safeParse(typedConfig);

    expect(result.success).toBe(true);
  });
});

describe("parameterSchema", () => {
  /**
   * Positive Test: Valid parameter passes validation
   * Expected result: Schema should accept valid parameter with non-empty strings
   */
  it("should accept valid parameter", () => {
    const validParameter = {
      category: "generation",
      paramName: "temperature",
    };

    const result = parameterSchema.safeParse(validParameter);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe(validParameter.category);
      expect(result.data.paramName).toBe(validParameter.paramName);
    }
  });

  /**
   * Positive Test: Various valid category values are accepted
   * Expected result: Schema should accept different valid category names
   */
  it("should accept various valid category values", () => {
    const validCategories = [
      "generation",
      "sampling",
      "context",
      "performance",
      "model",
    ];

    validCategories.forEach((category) => {
      const result = parameterSchema.safeParse({
        category,
        paramName: "test",
      });
      expect(result.success).toBe(true);
    });
  });

  /**
   * Positive Test: Parameter name with various valid formats is accepted
   * Expected result: Schema should accept valid parameter names
   */
  it("should accept parameter names with various formats", () => {
    const validNames = [
      "temperature",
      "top_p",
      "max_tokens",
      "model-name",
      "model_name",
    ];

    validNames.forEach((paramName) => {
      const result = parameterSchema.safeParse({
        category: "generation",
        paramName,
      });
      expect(result.success).toBe(true);
    });
  });

  /**
   * Negative Test: Empty category string is rejected
   * Expected result: Schema should reject empty category
   */
  it("should reject empty category", () => {
    const invalidParameter = {
      category: "",
      paramName: "temperature",
    };

    const result = parameterSchema.safeParse(invalidParameter);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("category");
    }
  });

  /**
   * Negative Test: Empty paramName string is rejected
   * Expected result: Schema should reject empty parameter name
   */
  it("should reject empty paramName", () => {
    const invalidParameter = {
      category: "generation",
      paramName: "",
    };

    const result = parameterSchema.safeParse(invalidParameter);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("paramName");
    }
  });

  /**
   * Negative Test: Missing category field is rejected
   * Expected result: Schema should require category field
   */
  it("should reject missing category field", () => {
    const invalidParameter = {
      paramName: "temperature",
    };

    const result = parameterSchema.safeParse(invalidParameter);

    expect(result.success).toBe(false);
  });

  /**
   * Negative Test: Missing paramName field is rejected
   * Expected result: Schema should require paramName field
   */
  it("should reject missing paramName field", () => {
    const invalidParameter = {
      category: "generation",
    };

    const result = parameterSchema.safeParse(invalidParameter);

    expect(result.success).toBe(false);
  });

  /**
   * Negative Test: Wrong type for category (not a string) is rejected
   * Expected result: Schema should reject non-string category
   */
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

  /**
   * Negative Test: Wrong type for paramName (not a string) is rejected
   * Expected result: Schema should reject non-string parameter name
   */
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

  /**
   * Type Test: Verify inferred ParameterSchema type matches expected structure
   * Expected result: TypeScript should accept properly typed parameter object
   */
  it("should correctly infer ParameterSchema type", () => {
    const typedParameter: ParameterSchema = {
      category: "test",
      paramName: "test",
    };

    const result = parameterSchema.safeParse(typedParameter);

    expect(result.success).toBe(true);
  });
});

describe("websocketSchema", () => {
  /**
   * Positive Test: Valid WebSocket message passes validation
   * Expected result: Schema should accept valid message with UUID and integer timestamp
   */
  it("should accept valid WebSocket message", () => {
    const validMessage = {
      message: "Test message content",
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: 1234567890,
    };

    const result = websocketSchema.safeParse(validMessage);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).toBe(validMessage.message);
      expect(result.data.clientId).toBe(validMessage.clientId);
      expect(result.data.timestamp).toBe(validMessage.timestamp);
    }
  });

  /**
   * Positive Test: Zero timestamp is accepted
   * Expected result: Schema should accept 0 as valid timestamp (Unix epoch)
   */
  it("should accept zero timestamp", () => {
    const validMessage = {
      message: "test",
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: 0,
    };

    const result = websocketSchema.safeParse(validMessage);

    expect(result.success).toBe(true);
  });

  /**
   * Positive Test: Negative timestamp is accepted (for dates before Unix epoch)
   * Expected result: Schema should accept negative integer timestamps
   */
  it("should accept negative timestamp", () => {
    const validMessage = {
      message: "test",
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: -86400,
    };

    const result = websocketSchema.safeParse(validMessage);

    expect(result.success).toBe(true);
  });

  /**
   * Positive Test: Large timestamp value is accepted
   * Expected result: Schema should accept large integer timestamps
   */
  it("should accept large timestamp", () => {
    const validMessage = {
      message: "test",
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: 9999999999999,
    };

    const result = websocketSchema.safeParse(validMessage);

    expect(result.success).toBe(true);
  });

  /**
   * Positive Test: Multi-line message is accepted
   * Expected result: Schema should accept messages with line breaks
   */
  it("should accept multi-line message", () => {
    const validMessage = {
      message: "Line 1\nLine 2\nLine 3",
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: 1234567890,
    };

    const result = websocketSchema.safeParse(validMessage);

    expect(result.success).toBe(true);
  });

  /**
   * Positive Test: Message with special characters is accepted
   * Expected result: Schema should accept messages with special characters
   */
  it("should accept message with special characters", () => {
    const validMessage = {
      message: "Test with emojis 🎉 and symbols @#$%",
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: 1234567890,
    };

    const result = websocketSchema.safeParse(validMessage);

    expect(result.success).toBe(true);
  });

  /**
   * Negative Test: Empty message string is rejected
   * Expected result: Schema should reject empty message
   */
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
    }
  });

  /**
   * Negative Test: Invalid clientId (not UUID format) is rejected
   * Expected result: Schema should reject non-UUID client ID
   */
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
      expect(result.error.issues[0].message).toMatch(/UUID/);
    }
  });

  /**
   * Negative Test: Non-integer timestamp (decimal) is rejected
   * Expected result: Schema should reject decimal timestamp
   */
  it("should reject non-integer timestamp", () => {
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

  /**
   * Negative Test: String timestamp is rejected
   * Expected result: Schema should reject string timestamp
   */
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

  /**
   * Negative Test: Missing message field is rejected
   * Expected result: Schema should require message field
   */
  it("should reject missing message field", () => {
    const invalidMessage = {
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: 1234567890,
    };

    const result = websocketSchema.safeParse(invalidMessage);

    expect(result.success).toBe(false);
  });

  /**
   * Negative Test: Missing clientId field is rejected
   * Expected result: Schema should require clientId field
   */
  it("should reject missing clientId field", () => {
    const invalidMessage = {
      message: "test",
      timestamp: 1234567890,
    };

    const result = websocketSchema.safeParse(invalidMessage);

    expect(result.success).toBe(false);
  });

  /**
   * Negative Test: Missing timestamp field is rejected
   * Expected result: Schema should require timestamp field
   */
  it("should reject missing timestamp field", () => {
    const invalidMessage = {
      message: "test",
      clientId: "550e8400-e29b-41d4-a716-446655440000",
    };

    const result = websocketSchema.safeParse(invalidMessage);

    expect(result.success).toBe(false);
  });

  /**
   * Negative Test: Wrong type for message (not string) is rejected
   * Expected result: Schema should reject non-string message
   */
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

  /**
   * Negative Test: Wrong type for clientId (not string) is rejected
   * Expected result: Schema should reject non-string client ID
   */
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

  /**
   * Negative Test: NaN timestamp is rejected
   * Expected result: Schema should reject NaN as timestamp
   */
  it("should reject NaN timestamp", () => {
    const invalidMessage = {
      message: "test",
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: NaN,
    };

    const result = websocketSchema.safeParse(invalidMessage);

    expect(result.success).toBe(false);
  });

  /**
   * Negative Test: Infinity timestamp is rejected
   * Expected result: Schema should reject Infinity as timestamp
   */
  it("should reject Infinity timestamp", () => {
    const invalidMessage = {
      message: "test",
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: Infinity,
    };

    const result = websocketSchema.safeParse(invalidMessage);

    expect(result.success).toBe(false);
  });

  /**
   * Type Test: Verify inferred WebSocketSchema type matches expected structure
   * Expected result: TypeScript should accept properly typed WebSocket message object
   */
  it("should correctly infer WebSocketSchema type", () => {
    const typedMessage: WebSocketSchema = {
      message: "test message",
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: 1234567890,
    };

    const result = websocketSchema.safeParse(typedMessage);

    expect(result.success).toBe(true);
  });
});

describe("Validation Methods (parse vs safeParse)", () => {
  /**
   * Positive Test: parse() returns validated data on success
   * Expected result: parse() should return typed data without wrapper
   */
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

  /**
   * Negative Test: parse() throws error on invalid data
   * Expected result: parse() should throw ZodError for invalid input
   */
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

  /**
   * Positive Test: safeParse() does not throw on invalid data
   * Expected result: safeParse() should return success: false without throwing
   */
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

  /**
   * Positive Test: safeParse() returns result object on success
   * Expected result: safeParse() should return object with success and data
   */
  it("should return result object with safeParse", () => {
    const validConfig = {
      models: [],
      parameters: [],
    };

    const result = configSchema.safeParse(validConfig);

    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("data");
    if (result.success) {
      expect(result.data).toBeDefined();
      expect(result.data.models).toEqual([]);
    }
  });

  /**
   * Negative Test: safeParse() returns error object on failure
   * Expected result: safeParse() should return object with error details
   */
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

  /**
   * Error Message Test: Verify error messages are helpful
   * Expected result: Error messages should contain field name and validation rule
   */
  it("should provide helpful error messages", () => {
    const invalidConfig = {
      models: [
        {
          id: "not-a-uuid",
          name: "",
          options: { temperature: 1.5, top_p: -0.1 },
        },
      ],
      parameters: [],
    };

    const result = configSchema.safeParse(invalidConfig);

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      // Should mention "UUID" somewhere
      expect(messages.some((msg) => msg.toLowerCase().includes("uuid"))).toBe(
        true
      );
      // Should mention length constraint
      expect(
        messages.some((msg) => msg.includes(">=") && msg.includes("characters"))
      ).toBe(true);
      // Should mention range constraints
      expect(
        messages.some((msg) => msg.includes("<=") || msg.includes(">="))
      ).toBe(true);
    }
  });

  /**
   * Error Path Test: Verify error paths point to correct fields
   * Expected result: Error issues should have correct path arrays
   */
  it("should provide correct error paths", () => {
    const invalidConfig = {
      models: [
        {
          id: "not-a-uuid",
          name: "",
          options: { temperature: 1.5, top_p: -0.1 },
        },
      ],
      parameters: [],
    };

    const result = configSchema.safeParse(invalidConfig);

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join("."));
      // Should include paths to invalid fields
      expect(paths.some((path) => path.includes("models.0.id"))).toBe(true);
      expect(paths.some((path) => path.includes("models.0.name"))).toBe(true);
      expect(
        paths.some((path) => path.includes("models.0.options.temperature"))
      ).toBe(true);
    }
  });
});

describe("Edge Cases and Additional Validation", () => {
  /**
   * Edge Case: Empty config (all arrays empty)
   * Expected result: Should accept empty configuration
   */
  it("should handle empty configuration", () => {
    const emptyConfig = {
      models: [],
      parameters: [],
    };

    const result = configSchema.safeParse(emptyConfig);

    expect(result.success).toBe(true);
  });

  /**
   * Edge Case: Very long model name
   * Expected result: Should accept long strings (no max length specified)
   */
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

  /**
   * Edge Case: Very long message in WebSocket
   * Expected result: Should accept long messages
   */
  it("should accept very long WebSocket message", () => {
    const longMessage = "x".repeat(10000);
    const validMessage = {
      message: longMessage,
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: 1234567890,
    };

    const result = websocketSchema.safeParse(validMessage);

    expect(result.success).toBe(true);
  });

  /**
   * Edge Case: Multiple validation errors in single object
   * Expected result: Should collect all errors, not stop at first
   */
  it("should collect multiple validation errors", () => {
    const invalidConfig = {
      models: [
        {
          id: "not-a-uuid",
          name: "",
          options: { temperature: 1.5, top_p: -0.1 },
        },
      ],
      parameters: [
        {
          category: "",
          paramName: "",
        },
      ],
    };

    const result = configSchema.safeParse(invalidConfig);

    expect(result.success).toBe(false);
    if (!result.success) {
      // Should have multiple errors
      expect(result.error.issues.length).toBeGreaterThan(1);
    }
  });

  /**
   * Edge Case: Null/undefined values
   * Expected result: Should reject null/undefined for required fields
   */
  it("should reject null values for required fields", () => {
    const nullConfig = {
      models: null as any,
      parameters: null as any,
    };

    const result = configSchema.safeParse(nullConfig);

    expect(result.success).toBe(false);
  });

  /**
   * Edge Case: Different UUID versions
   * Expected result: Should accept various valid UUID versions
   */
  it("should accept various valid UUID versions", () => {
    const validUUIDs = [
      "00000000-0000-0000-0000-000000000000",
      "550e8400-e29b-41d4-a716-446655440000",
      "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    ];

    validUUIDs.forEach((uuid) => {
      const config = {
        models: [
          {
            id: uuid,
            name: "test",
            options: { temperature: 0.5, top_p: 0.9 },
          },
        ],
        parameters: [],
      };
      const result = configSchema.safeParse(config);
      expect(result.success).toBe(true);
    });
  });

  /**
   * Type Test: Verify all exported types work correctly
   * Expected result: TypeScript should accept all exported types
   */
  it("should use all exported types correctly", () => {
    const config: ConfigSchema = {
      models: [],
      parameters: [],
    };

    const parameter: ParameterSchema = {
      category: "test",
      paramName: "test",
    };

    const wsMessage: WebSocketSchema = {
      message: "test",
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: Date.now(),
    };

    expect(config).toBeDefined();
    expect(parameter).toBeDefined();
    expect(wsMessage).toBeDefined();
  });
});
