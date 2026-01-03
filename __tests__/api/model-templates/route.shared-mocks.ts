/**
 * Shared mock exports for model-templates route tests
 * NOTE: Actual jest.mock calls are in jest.setup.ts
 */

import { NextRequest } from "next/server";
import { promises as fs } from "fs";

// Export mocked utilities for test usage
export { fs, NextRequest };

// Export validation mocks from global
export const validateRequestBody = (global as any).validateRequestBody;
export const validateConfig = (global as any).validateConfig;

// Helper to create mock request
export function createMockRequest(body: unknown): NextRequest {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
}

// Export sync fs methods for tests that need them
import fsSync from "fs";
export const { writeFileSync } = fsSync as jest.Mocked<typeof fsSync>;
