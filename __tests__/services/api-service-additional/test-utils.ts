/**
 * Shared test utilities for api-service-additional tests
 */

import { apiClient } from "@/utils/api-client";
import { useStore } from "@/lib/store";

export const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
export const mockStore = useStore as jest.Mocked<typeof useStore>;

export function setupMocks(): void {
  mockStore.getState.mockReturnValue({
    setModels: jest.fn(),
    addModel: jest.fn(),
    updateModel: jest.fn(),
    removeModel: jest.fn(),
    setMetrics: jest.fn(),
    setLogs: jest.fn(),
    clearLogs: jest.fn(),
    updateSettings: jest.fn(),
  } as unknown);
}

export function createMockApiResponse<T>(data: T, success = true) {
  return {
    success,
    data,
    timestamp: new Date().toISOString(),
  };
}

export function createMockErrorResponse(code: string, message: string) {
  return {
    success: false,
    error: { code, message },
    timestamp: new Date().toISOString(),
  };
}

export function createMockMetricsHistory(limit?: number, hours?: number) {
  const params: Record<string, unknown> = {};
  if (limit !== undefined) params.limit = limit;
  if (hours !== undefined) params.hours = hours;
  return params;
}
