/**
 * Shared test utilities for useSystemMetrics tests
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useSystemMetrics } from '../useSystemMetrics';

// Mock fetch
global.fetch = jest.fn();

export const mockSuccessResponse = (data: any) => ({
  ok: true,
  json: async () => data,
});

export const mockErrorResponse = (status: number, message: string) => ({
  ok: false,
  status,
  json: async () => ({ message }),
});

export const mockNetworkError = () => {
  throw new Error('Network error');
};

export const setupBeforeEach = () => {
  jest.clearAllMocks();
  jest.useFakeTimers();
};

export const setupAfterEach = () => {
  jest.useRealTimers();
};
