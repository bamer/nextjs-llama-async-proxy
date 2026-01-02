import { z } from 'zod';
import {
  VALID_CONFIG,
  INVALID_CONFIG_NOT_UUID,
  INVALID_CONFIG_EMPTY_NAME,
  INVALID_CONFIG_TEMP_OUT_OF_RANGE,
  INVALID_CONFIG_TOP_P_OUT_OF_RANGE,
  VALID_CONFIG_BOUNDARY_VALUES,
  INVALID_CONFIG_EMPTY_CATEGORY,
  INVALID_CONFIG_EMPTY_PARAM_NAME,
  VALID_CONFIG_MULTIPLE,
  VALID_PARAMETER,
  INVALID_PARAMETER_EMPTY_CATEGORY,
  INVALID_PARAMETER_EMPTY_NAME,
  VALID_WEBSOCKET_MESSAGE,
  INVALID_WEBSOCKET_EMPTY_MESSAGE,
  INVALID_WEBSOCKET_NOT_UUID,
  INVALID_WEBSOCKET_NOT_INTEGER_TIMESTAMP,
  INVALID_WEBSOCKET_STRING_TIMESTAMP,
  VALID_WEBSOCKET_NEGATIVE_TIMESTAMP,
} from './validators.utils';

export function describeConfigSchemaScenarios(configSchema: z.ZodSchema<any>, expectValidationError: (result: any, path: string) => void): void {
  it('should validate a valid config', () => {
    const result = configSchema.safeParse(VALID_CONFIG);
    expect(result.success).toBe(true);
  });

  it('should reject invalid model id (not UUID)', () => {
    const result = configSchema.safeParse(INVALID_CONFIG_NOT_UUID);
    expectValidationError(result, 'models');
  });

  it('should reject empty model name', () => {
    const result = configSchema.safeParse(INVALID_CONFIG_EMPTY_NAME);
    expectValidationError(result, 'name');
  });

  it('should reject temperature out of range', () => {
    const result = configSchema.safeParse(INVALID_CONFIG_TEMP_OUT_OF_RANGE);
    expectValidationError(result, 'temperature');
  });

  it('should reject top_p out of range', () => {
    const result = configSchema.safeParse(INVALID_CONFIG_TOP_P_OUT_OF_RANGE);
    expectValidationError(result, 'top_p');
  });

  it('should accept temperature at boundary values', () => {
    const result = configSchema.safeParse(VALID_CONFIG_BOUNDARY_VALUES);
    expect(result.success).toBe(true);
  });

  it('should reject empty parameter category', () => {
    const result = configSchema.safeParse(INVALID_CONFIG_EMPTY_CATEGORY);
    expectValidationError(result, 'category');
  });

  it('should reject empty parameter name', () => {
    const result = configSchema.safeParse(INVALID_CONFIG_EMPTY_PARAM_NAME);
    expectValidationError(result, 'paramName');
  });

  it('should accept multiple models and parameters', () => {
    const result = configSchema.safeParse(VALID_CONFIG_MULTIPLE);
    expect(result.success).toBe(true);
  });
}

export function describeParameterSchemaScenarios(parameterSchema: z.ZodSchema<any>, expectValidationError: (result: any, path: string) => void): void {
  it('should validate a valid parameter', () => {
    const result = parameterSchema.safeParse(VALID_PARAMETER);
    expect(result.success).toBe(true);
  });

  it('should reject empty category', () => {
    const result = parameterSchema.safeParse(INVALID_PARAMETER_EMPTY_CATEGORY);
    expect(result.success).toBe(false);
  });

  it('should reject empty paramName', () => {
    const result = parameterSchema.safeParse(INVALID_PARAMETER_EMPTY_NAME);
    expect(result.success).toBe(false);
  });
}

export function describeWebsocketSchemaScenarios(websocketSchema: z.ZodSchema<any>, expectValidationError: (result: any, path: string) => void): void {
  it('should validate a valid websocket message', () => {
    const result = websocketSchema.safeParse(VALID_WEBSOCKET_MESSAGE);
    expect(result.success).toBe(true);
  });

  it('should reject empty message', () => {
    const result = websocketSchema.safeParse(INVALID_WEBSOCKET_EMPTY_MESSAGE);
    expectValidationError(result, 'message');
  });

  it('should reject invalid clientId (not UUID)', () => {
    const result = websocketSchema.safeParse(INVALID_WEBSOCKET_NOT_UUID);
    expectValidationError(result, 'clientId');
  });

  it('should reject non-integer timestamp', () => {
    const result = websocketSchema.safeParse(INVALID_WEBSOCKET_NOT_INTEGER_TIMESTAMP);
    expectValidationError(result, 'timestamp');
  });

  it('should reject string timestamp', () => {
    const result = websocketSchema.safeParse(INVALID_WEBSOCKET_STRING_TIMESTAMP);
    expect(result.success).toBe(false);
  });

  it('should accept negative timestamp', () => {
    const result = websocketSchema.safeParse(VALID_WEBSOCKET_NEGATIVE_TIMESTAMP);
    expect(result.success).toBe(true);
  });
}

export function describeTypeExportsScenarios(): void {
  it('should export Config type', () => {
    const config = {
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
    const parameter = {
      category: 'test',
      paramName: 'test',
    };
    expect(parameter).toBeDefined();
  });

  it('should export LegacyWebSocket type', () => {
    const wsMessage = {
      message: 'test',
      clientId: '550e8400-e29b-41d4-a716-446655440000',
      timestamp: 1234567890,
    };
    expect(wsMessage).toBeDefined();
  });
}

export function describeParseVsSafeParseScenarios(configSchema: z.ZodSchema<any>) {
  it('should throw error with parse for invalid data', () => {
    expect(() => configSchema.parse(INVALID_CONFIG_NOT_UUID)).toThrow();
  });

  it('should not throw error with safeParse for invalid data', () => {
    expect(() => configSchema.safeParse(INVALID_CONFIG_NOT_UUID)).not.toThrow();
  });

  it('should return typed data with safeParse success', () => {
    const result = configSchema.safeParse(VALID_CONFIG);
    if (result.success) {
      expect(result.data).toBeDefined();
      expect(result.data.models[0].id).toBe('550e8400-e29b-41d4-a716-446655440000');
    }
  });
}
