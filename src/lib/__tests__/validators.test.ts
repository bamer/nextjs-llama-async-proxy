import {
  configSchema,
  parameterSchema,
  websocketSchema,
  Config,
  Parameter,
  LegacyWebSocket,
} from '@/lib/validators';

describe('validators', () => {
  describe('configSchema', () => {
    it('should validate a valid config', () => {
      const validConfig = {
        models: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'llama2',
            options: {
              temperature: 0.7,
              top_p: 0.9,
            },
          },
        ],
        parameters: [
          {
            category: 'generation',
            paramName: 'temperature',
          },
        ],
      };

      const result = configSchema.safeParse(validConfig);

      expect(result.success).toBe(true);
    });

    it('should reject invalid model id (not UUID)', () => {
      const invalidConfig = {
        models: [
          {
            id: 'not-a-uuid',
            name: 'llama2',
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
        expect(result.error.issues[0].path).toContain('models');
        expect(result.error.issues[0].path).toContain('id');
      }
    });

    it('should reject empty model name', () => {
      const invalidConfig = {
        models: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: '',
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
        expect(result.error.issues[0].path).toContain('name');
      }
    });

    it('should reject temperature out of range', () => {
      const invalidConfig = {
        models: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'llama2',
            options: {
              temperature: 1.5, // Should be between 0 and 1
              top_p: 0.9,
            },
          },
        ],
        parameters: [],
      };

      const result = configSchema.safeParse(invalidConfig);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('temperature');
      }
    });

    it('should reject top_p out of range', () => {
      const invalidConfig = {
        models: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'llama2',
            options: {
              temperature: 0.7,
              top_p: -0.1, // Should be between 0 and 1
            },
          },
        ],
        parameters: [],
      };

      const result = configSchema.safeParse(invalidConfig);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('top_p');
      }
    });

    it('should accept temperature at boundary values', () => {
      const validConfig = {
        models: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'llama2',
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

    it('should reject empty parameter category', () => {
      const invalidConfig = {
        models: [],
        parameters: [
          {
            category: '',
            paramName: 'temperature',
          },
        ],
      };

      const result = configSchema.safeParse(invalidConfig);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('category');
      }
    });

    it('should reject empty parameter name', () => {
      const invalidConfig = {
        models: [],
        parameters: [
          {
            category: 'generation',
            paramName: '',
          },
        ],
      };

      const result = configSchema.safeParse(invalidConfig);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('paramName');
      }
    });

    it('should accept multiple models and parameters', () => {
      const validConfig = {
        models: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'llama2',
            options: {
              temperature: 0.7,
              top_p: 0.9,
            },
          },
          {
            id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
            name: 'mistral',
            options: {
              temperature: 0.5,
              top_p: 0.8,
            },
          },
        ],
        parameters: [
          {
            category: 'generation',
            paramName: 'temperature',
          },
          {
            category: 'generation',
            paramName: 'top_p',
          },
          {
            category: 'context',
            paramName: 'max_tokens',
          },
        ],
      };

      const result = configSchema.safeParse(validConfig);

      expect(result.success).toBe(true);
    });
  });

  describe('parameterSchema', () => {
    it('should validate a valid parameter', () => {
      const validParameter = {
        category: 'generation',
        paramName: 'temperature',
      };

      const result = parameterSchema.safeParse(validParameter);

      expect(result.success).toBe(true);
    });

    it('should reject empty category', () => {
      const invalidParameter = {
        category: '',
        paramName: 'temperature',
      };

      const result = parameterSchema.safeParse(invalidParameter);

      expect(result.success).toBe(false);
    });

    it('should reject empty paramName', () => {
      const invalidParameter = {
        category: 'generation',
        paramName: '',
      };

      const result = parameterSchema.safeParse(invalidParameter);

      expect(result.success).toBe(false);
    });
  });

  describe('websocketSchema', () => {
    it('should validate a valid websocket message', () => {
      const validMessage = {
        message: 'Test message',
        clientId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: 1234567890,
      };

      const result = websocketSchema.safeParse(validMessage);

      expect(result.success).toBe(true);
    });

    it('should reject empty message', () => {
      const invalidMessage = {
        message: '',
        clientId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: 1234567890,
      };

      const result = websocketSchema.safeParse(invalidMessage);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('message');
      }
    });

    it('should reject invalid clientId (not UUID)', () => {
      const invalidMessage = {
        message: 'Test message',
        clientId: 'not-a-uuid',
        timestamp: 1234567890,
      };

      const result = websocketSchema.safeParse(invalidMessage);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('clientId');
      }
    });

    it('should reject non-integer timestamp', () => {
      const invalidMessage = {
        message: 'Test message',
        clientId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: 1234567890.5, // Not an integer
      };

      const result = websocketSchema.safeParse(invalidMessage);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('timestamp');
      }
    });

    it('should reject string timestamp', () => {
      const invalidMessage = {
        message: 'Test message',
        clientId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: '1234567890' as any,
      };

      const result = websocketSchema.safeParse(invalidMessage);

      expect(result.success).toBe(false);
    });

    it('should accept negative timestamp', () => {
      const validMessage = {
        message: 'Test message',
        clientId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: -1,
      };

      const result = websocketSchema.safeParse(validMessage);

      expect(result.success).toBe(true);
    });
  });

  describe('type exports', () => {
    it('should export Config type', () => {
      const config: Config = {
        models: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'test',
            options: { temperature: 0.5, top_p: 0.9 },
          },
        ],
        parameters: [],
      };

      expect(config).toBeDefined();
    });

    it('should export Parameter type', () => {
      const parameter: Parameter = {
        category: 'test',
        paramName: 'test',
      };

      expect(parameter).toBeDefined();
    });

    it('should export LegacyWebSocket type', () => {
      const wsMessage: LegacyWebSocket = {
        message: 'test',
        clientId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: 1234567890,
      };

      expect(wsMessage).toBeDefined();
    });
  });

  describe('parse vs safeParse', () => {
    it('should throw error with parse for invalid data', () => {
      const invalidConfig = {
        models: [
          {
            id: 'not-a-uuid',
            name: 'llama2',
            options: { temperature: 0.7, top_p: 0.9 },
          },
        ],
        parameters: [],
      };

      expect(() => configSchema.parse(invalidConfig)).toThrow();
    });

    it('should not throw error with safeParse for invalid data', () => {
      const invalidConfig = {
        models: [
          {
            id: 'not-a-uuid',
            name: 'llama2',
            options: { temperature: 0.7, top_p: 0.9 },
          },
        ],
        parameters: [],
      };

      expect(() => configSchema.safeParse(invalidConfig)).not.toThrow();
    });

    it('should return typed data with safeParse success', () => {
      const validConfig = {
        models: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'llama2',
            options: { temperature: 0.7, top_p: 0.9 },
          },
        ],
        parameters: [],
      };

      const result = configSchema.safeParse(validConfig);

      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.models[0].id).toBe('550e8400-e29b-41d4-a716-446655440000');
      }
    });
  });
});
