/**
 * Test utilities for models-start API tests
 * Provides shared mocks, helpers, and setup functions
 */

import { NextRequest } from "next/server";
import { POST as StartModel } from "../../../app/api/models/[name]/start/route";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: jest.fn().mockResolvedValue(data),
    }),
  },
}));

export interface MockModel {
  id?: string;
  name: string;
  available: boolean;
}

export interface MockLlamaService {
  getState: jest.Mock;
}

export interface MockRegistry {
  get: jest.Mock;
}

/**
 * Creates a mock successful response from llama-server
 */
export function createMockSuccessResponse(content = "Hi") {
  return {
    ok: true,
    json: jest.fn().mockResolvedValue({
      choices: [{ message: { content } }],
    }),
  };
}

/**
 * Creates a mock error response from llama-server
 */
export function createMockErrorResponse(status: number, error: string) {
  return {
    ok: false,
    status,
    json: jest.fn().mockResolvedValue({ error }),
  };
}

/**
 * Creates mock models array
 */
export function createMockModels(...models: MockModel[]): MockModel[] {
  return models.map((model) => ({
    id: model.name,
    ...model,
  }));
}

/**
 * Creates a mock llama service with given state
 */
export function createMockLlamaService(
  status: string,
  models: MockModel[]
): MockLlamaService {
  return {
    getState: jest.fn().mockReturnValue({ status, models }),
  };
}

/**
 * Creates a mock registry
 */
export function createMockRegistry(
  llamaService: MockLlamaService | null
): MockRegistry {
  return {
    get: jest.fn().mockReturnValue(llamaService),
  };
}

/**
 * Sets up global mocks for llama service registry
 */
export function setupMockRegistry(mockRegistry: MockRegistry): void {
  (global as unknown as { registry: unknown }).registry = mockRegistry;
}

/**
 * Creates a mock NextRequest
 */
export function createMockRequest(
  body: Record<string, unknown> = {}
): NextRequest {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
}

/**
 * Creates mock params for the API route
 */
export function createMockParams(name: string): Promise<{ name: string }> {
  return Promise.resolve({ name });
}

/**
 * Sets up test environment with common mocks
 */
export function setupTestEnvironment(
  status: string,
  models: MockModel[]
): {
  llamaService: MockLlamaService;
  registry: MockRegistry;
} {
  const llamaService = createMockLlamaService(status, models);
  const registry = createMockRegistry(llamaService);
  setupMockRegistry(registry);
  return { llamaService, registry };
}

/**
 * Standard test setup and teardown helpers
 */
export function setupBeforeEach(): void {
  jest.clearAllMocks();
  global.fetch = jest.fn();
}

export function teardownAfterEach(): void {
  jest.restoreAllMocks();
}

/**
 * Helper to wait for async operations
 */
export const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Export the route handler for testing
 */
export { StartModel };
