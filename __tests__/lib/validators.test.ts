import { configSchema, parameterSchema, websocketSchema } from "@/lib/validators";

describe("Validators", () => {
  describe("configSchema", () => {
    it("validates correct config structure", () => {
      const validConfig = {
        models: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            name: "gpt-3.5",
            options: {
              temperature: 0.7,
              top_p: 0.9,
            },
          },
        ],
        parameters: [
          {
            category: "performance",
            paramName: "max_tokens",
          },
        ],
      };

      const result = configSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it("rejects invalid model UUID", () => {
      const invalidConfig = {
        models: [
          {
            id: "not-a-uuid",
            name: "gpt-3.5",
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
    });

    it("rejects empty model name", () => {
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
    });

    it("rejects temperature outside 0-1 range", () => {
      const invalidConfig = {
        models: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            name: "gpt-3.5",
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
    });

    it("rejects top_p outside 0-1 range", () => {
      const invalidConfig = {
        models: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            name: "gpt-3.5",
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
    });

    it("rejects empty category parameter", () => {
      const invalidConfig = {
        models: [],
        parameters: [
          {
            category: "",
            paramName: "max_tokens",
          },
        ],
      };

      const result = configSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it("rejects empty paramName", () => {
      const invalidConfig = {
        models: [],
        parameters: [
          {
            category: "performance",
            paramName: "",
          },
        ],
      };

      const result = configSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it("accepts multiple models and parameters", () => {
      const validConfig = {
        models: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            name: "gpt-3.5",
            options: {
              temperature: 0.7,
              top_p: 0.9,
            },
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440001",
            name: "gpt-4",
            options: {
              temperature: 0.2,
              top_p: 0.95,
            },
          },
        ],
        parameters: [
          {
            category: "performance",
            paramName: "max_tokens",
          },
          {
            category: "sampling",
            paramName: "top_k",
          },
        ],
      };

      const result = configSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it("accepts boundary values for temperature and top_p", () => {
      const validConfig = {
        models: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            name: "gpt-3.5",
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
  });

  describe("parameterSchema", () => {
    it("validates correct parameter", () => {
      const validParam = {
        category: "performance",
        paramName: "max_tokens",
      };

      const result = parameterSchema.safeParse(validParam);
      expect(result.success).toBe(true);
    });

    it("rejects empty category", () => {
      const invalidParam = {
        category: "",
        paramName: "max_tokens",
      };

      const result = parameterSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("rejects empty paramName", () => {
      const invalidParam = {
        category: "performance",
        paramName: "",
      };

      const result = parameterSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("rejects missing category", () => {
      const invalidParam = {
        paramName: "max_tokens",
      };

      const result = parameterSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("rejects missing paramName", () => {
      const invalidParam = {
        category: "performance",
      };

      const result = parameterSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });
  });

  describe("websocketSchema", () => {
    it("validates correct websocket message", () => {
      const validMessage = {
        message: "test message",
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        timestamp: 1234567890,
      };

      const result = websocketSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
    });

    it("rejects empty message", () => {
      const invalidMessage = {
        message: "",
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        timestamp: 1234567890,
      };

      const result = websocketSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });

    it("rejects invalid clientId UUID", () => {
      const invalidMessage = {
        message: "test message",
        clientId: "not-a-uuid",
        timestamp: 1234567890,
      };

      const result = websocketSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });

    it("rejects non-integer timestamp", () => {
      const invalidMessage = {
        message: "test message",
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        timestamp: 1234567890.5,
      };

      const result = websocketSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });

    it("rejects missing message field", () => {
      const invalidMessage = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        timestamp: 1234567890,
      };

      const result = websocketSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });

    it("rejects missing clientId field", () => {
      const invalidMessage = {
        message: "test message",
        timestamp: 1234567890,
      };

      const result = websocketSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });

    it("rejects missing timestamp field", () => {
      const invalidMessage = {
        message: "test message",
        clientId: "550e8400-e29b-41d4-a716-446655440000",
      };

      const result = websocketSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });

    it("validates zero timestamp", () => {
      const validMessage = {
        message: "test",
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        timestamp: 0,
      };

      const result = websocketSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
    });

    it("validates large timestamp", () => {
      const validMessage = {
        message: "test",
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        timestamp: 9999999999,
      };

      const result = websocketSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
    });
  });
});
