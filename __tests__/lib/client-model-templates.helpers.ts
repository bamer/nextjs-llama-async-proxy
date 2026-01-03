/**
 * Shared test helpers for client-model-templates tests
 */

import {
  __resetCache__,
} from "@/lib/client-model-templates";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

export { mockFetch };

/**
 * Common setup for client-model-templates tests
 */
export function beforeEachSetup(): void {
  jest.clearAllMocks();
  __resetCache__();
  mockFetch.mockClear();
}
