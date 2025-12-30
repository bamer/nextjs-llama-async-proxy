/**
 * Basic Validation Tests for Legacy Validator Schemas
 *
 * Tests basic validation functionality for:
 * - configSchema: Configuration validation for models and parameters
 * - parameterSchema: Individual parameter validation
 * - websocketSchema: WebSocket message validation
 */

import { describe, it, expect } from "@jest/globals";
import {
  configSchema,
  parameterSchema,
  websocketSchema,
  Config,
  Parameter,
  LegacyWebSocket,
} from "@/lib/validators";

describe("configSchema - Basic Validation", () => {
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
      expect(result.data.models).toHaveLength(1);
      expect(result.data.models[0].id).toBe(validConfig.models[0].id);
      expect(result.data.models[0].name).toBe(validConfig.models[0].name);
    }
  });

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
        {
          category: "context",
          paramName: "max_tokens",
        },
      ],
    };

    const result = configSchema.safeParse(validConfig);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.models).toHaveLength(2);
      expect(result.data.parameters).toHaveLength(3);
    }
  });

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

  it("should accept decimal values within valid range", () => {
    const validConfig = {
      models: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "test-model",
          options: {
            temperature: 0.5,
            top_p: 0.95,
          },
        },
      ],
      parameters: [],
    };

    const result = configSchema.safeParse(validConfig);

    expect(result.success).toBe(true);
  });
});

describe("parameterSchema - Basic Validation", () => {
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
});

describe("websocketSchema - Basic Validation", () => {
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

  it("should accept zero timestamp", () => {
    const validMessage = {
      message: "test",
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: 0,
    };

    const result = websocketSchema.safeParse(validMessage);

    expect(result.success).toBe(true);
  });

  it("should accept negative timestamp", () => {
    const validMessage = {
      message: "test",
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: -86400,
    };

    const result = websocketSchema.safeParse(validMessage);

    expect(result.success).toBe(true);
  });

  it("should accept large timestamp", () => {
    const validMessage = {
      message: "test",
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: 9999999999999,
    };

    const result = websocketSchema.safeParse(validMessage);

    expect(result.success).toBe(true);
  });

  it("should accept multi-line message", () => {
    const validMessage = {
      message: "Line 1\nLine 2\nLine 3",
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: 1234567890,
    };

    const result = websocketSchema.safeParse(validMessage);

    expect(result.success).toBe(true);
  });

  it("should accept message with special characters", () => {
    const validMessage = {
      message: "Test with émojis 🎉 and symbols @#$%",
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: 1234567890,
    };

    const result = websocketSchema.safeParse(validMessage);

    expect(result.success).toBe(true);
  });
});

describe("Type Inference Tests", () => {
  it("should correctly infer Config type", () => {
    const typedConfig: Config = {
      models: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "test-model",
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

    const result = configSchema.safeParse(typedConfig);

    expect(result.success).toBe(true);
  });

  it("should correctly infer Parameter type", () => {
    const typedParameter: Parameter = {
      category: "generation",
      paramName: "temperature",
    };

    const result = parameterSchema.safeParse(typedParameter);

    expect(result.success).toBe(true);
  });

  it("should correctly infer LegacyWebSocket type", () => {
    const typedMessage: LegacyWebSocket = {
      message: "test message",
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: 1234567890,
    };

    const result = websocketSchema.safeParse(typedMessage);

    expect(result.success).toBe(true);
  });
});
