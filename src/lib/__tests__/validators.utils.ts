import { z } from 'zod';

export const VALID_CONFIG = {
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

export const INVALID_CONFIG_NOT_UUID = {
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

export const INVALID_CONFIG_EMPTY_NAME = {
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

export const INVALID_CONFIG_TEMP_OUT_OF_RANGE = {
  models: [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'llama2',
      options: {
        temperature: 1.5,
        top_p: 0.9,
      },
    },
  ],
  parameters: [],
};

export const INVALID_CONFIG_TOP_P_OUT_OF_RANGE = {
  models: [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'llama2',
      options: {
        temperature: 0.7,
        top_p: -0.1,
      },
    },
  ],
  parameters: [],
};

export const VALID_CONFIG_BOUNDARY_VALUES = {
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

export const INVALID_CONFIG_EMPTY_CATEGORY = {
  models: [],
  parameters: [
    {
      category: '',
      paramName: 'temperature',
    },
  ],
};

export const INVALID_CONFIG_EMPTY_PARAM_NAME = {
  models: [],
  parameters: [
    {
      category: 'generation',
      paramName: '',
    },
  ],
};

export const VALID_CONFIG_MULTIPLE = {
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

export const VALID_PARAMETER = {
  category: 'generation',
  paramName: 'temperature',
};

export const INVALID_PARAMETER_EMPTY_CATEGORY = {
  category: '',
  paramName: 'temperature',
};

export const INVALID_PARAMETER_EMPTY_NAME = {
  category: 'generation',
  paramName: '',
};

export const VALID_WEBSOCKET_MESSAGE = {
  message: 'Test message',
  clientId: '550e8400-e29b-41d4-a716-446655440000',
  timestamp: 1234567890,
};

export const INVALID_WEBSOCKET_EMPTY_MESSAGE = {
  message: '',
  clientId: '550e8400-e29b-41d4-a716-446655440000',
  timestamp: 1234567890,
};

export const INVALID_WEBSOCKET_NOT_UUID = {
  message: 'Test message',
  clientId: 'not-a-uuid',
  timestamp: 1234567890,
};

export const INVALID_WEBSOCKET_NOT_INTEGER_TIMESTAMP = {
  message: 'Test message',
  clientId: '550e8400-e29b-41d4-a716-446655440000',
  timestamp: 1234567890.5,
};

export const INVALID_WEBSOCKET_STRING_TIMESTAMP = {
  message: 'Test message',
  clientId: '550e8400-e29b-41d4-a716-446655440000',
  timestamp: '1234567890' as any,
};

export const VALID_WEBSOCKET_NEGATIVE_TIMESTAMP = {
  message: 'Test message',
  clientId: '550e8400-e29b-41d4-a716-446655440000',
  timestamp: -1,
};

export function expectValidationError(result: z.SafeParseReturnType<any, any>, path: string): void {
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues[0].path).toContain(path);
  }
}
