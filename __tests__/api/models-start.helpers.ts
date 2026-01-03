import { NextRequest } from "next/server";

jest.mock("next/server", () => {
  const actualNextServer = jest.requireActual("next/server");
  return {
    ...actualNextServer,
    NextResponse: {
      json: (data: unknown, init?: ResponseInit) => ({
        status: init?.status || 200,
        json: jest.fn().mockResolvedValue(data),
      }),
    },
  };
});

jest.mock("@/lib/logger", () => ({
  getLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));

jest.mock("@/lib/server-config", () => ({
  loadAppConfig: jest.fn(() => ({ maxConcurrentModels: 1 })),
}));

jest.mock("@/lib/validation-utils", () => ({
  validateRequestBody: jest.fn(() => ({ success: true, data: {} })),
}));

/**
 * Common test utilities for models-start API tests
 */

export const createMockLlamaService = (overrides = {}) => ({
  getState: jest.fn().mockReturnValue({
    status: "ready",
    models: [],
    ...overrides,
  }),
});

export const createMockRegistry = (
  mockLlamaService: ReturnType<typeof createMockLlamaService>
) => ({
  get: jest.fn().mockReturnValue(mockLlamaService),
});

export const createMockRequest = async (body = {}) => ({
  json: jest.fn().mockResolvedValue(body),
} as unknown as NextRequest);

export const createMockParams = (name: string) => Promise.resolve({ name });

export const createMockResponse = (overrides = {}) => ({
  ok: true,
  json: jest.fn().mockResolvedValue({}),
  ...overrides,
});

export const createMockModels = (modelName: string) => [
  {
    id: modelName,
    name: modelName,
    available: true,
  },
];

export const setupGlobalMocks = (
  mockLlamaService: ReturnType<typeof createMockLlamaService>
) => {
  (global as unknown as { registry: unknown }).registry =
    createMockRegistry(mockLlamaService);
  global.fetch = jest.fn();
};

export const cleanupEnvVars = (...vars: string[]) => {
  vars.forEach((v) => delete process.env[v]);
};
