/**
 * Shared test utilities for models-stop API tests
 */

import { NextRequest } from "next/server";

export function createMockRequest(): NextRequest {
  return {} as unknown as NextRequest;
}

export function createMockParams(name: string) {
  return Promise.resolve({ name });
}

export function createEmptyParams() {
  return Promise.resolve({ name: "" });
}

export function createRejectedParams(error: string) {
  return Promise.reject(new Error(error));
}
