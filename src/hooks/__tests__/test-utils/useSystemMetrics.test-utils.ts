/**
 * Test utilities for useSystemMetrics edge case tests
 */

import { renderHook, act } from '@testing-library/react';
import { useSystemMetrics } from '../../useSystemMetrics';

const mockSuccessResponse = (data: any) => ({
  ok: true,
  json: async () => data,
});

const mockErrorResponse = (status: number, message: string) => ({
  ok: false,
  status,
  json: async () => ({ message }),
});

const mockNetworkError = () => {
  throw new Error('Network error');
};

export const renderSystemMetricsHook = () => {
  return renderHook(() => useSystemMetrics());
};

export const advanceTimersByTime = (ms: number) => {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
};

export { mockSuccessResponse, mockErrorResponse, mockNetworkError };
