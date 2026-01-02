/**
 * Test scenarios for metrics error handling
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useSystemMetrics } from '../../useSystemMetrics';
import { mockSuccessResponse, mockErrorResponse, mockNetworkError } from '../test-utils/useSystemMetrics.test-utils';

const waitForLoadingComplete = async (result: any) => {
  await waitFor(() => expect(result.current.loading).toBe(false));
};

export const scenarioHandleNetworkError = async () => {
  (global.fetch as jest.Mock).mockImplementation(mockNetworkError);
  const { result } = renderHook(() => useSystemMetrics());
  await waitForLoadingComplete(result);
  expect(result.current.error).toBe('Network error');
  expect(result.current.metrics).toBeNull();
};

export const scenarioHandle404Error = async () => {
  (global.fetch as jest.Mock).mockResolvedValue(mockErrorResponse(404, 'Not found'));
  const { result } = renderHook(() => useSystemMetrics());
  await waitForLoadingComplete(result);
  expect(result.current.error).toBe('Failed to fetch metrics');
};

export const scenarioHandle500Error = async () => {
  (global.fetch as jest.Mock).mockResolvedValue(mockErrorResponse(500, 'Internal server error'));
  const { result } = renderHook(() => useSystemMetrics());
  await waitForLoadingComplete(result);
  expect(result.current.error).toBe('Failed to fetch metrics');
};

export const scenarioHandleTimeoutError = async () => {
  (global.fetch as jest.Mock).mockImplementation(() => {
    throw new Error('Request timeout');
  });
  const { result } = renderHook(() => useSystemMetrics());
  await waitForLoadingComplete(result);
  expect(result.current.error).toBe('Request timeout');
};

export const scenarioHandleJsonParseError = async () => {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => {
      throw new SyntaxError('Unexpected token');
    },
  });
  const { result } = renderHook(() => useSystemMetrics());
  await waitForLoadingComplete(result);
  expect(result.current.error).toBe('Unexpected token');
};

export const scenarioHandleConsecutiveErrors = async () => {
  (global.fetch as jest.Mock).mockImplementation(mockNetworkError);
  const { result } = renderHook(() => useSystemMetrics());
  await waitForLoadingComplete(result);
  const initialError = result.current.error;
  jest.advanceTimersByTime(30000);
  await waitForLoadingComplete(result);
  expect(result.current.error).toBe(initialError);
};

export const scenarioLoadingInitially = () => {
  (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
  const { result } = renderHook(() => useSystemMetrics());
  expect(result.current.loading).toBe(true);
  expect(result.current.metrics).toBeNull();
  expect(result.current.error).toBeNull();
};

export const scenarioTransitionToSuccess = async () => {
  (global.fetch as jest.Mock).mockResolvedValue(
    mockSuccessResponse({
      cpuUsage: 50,
      memoryUsage: 60,
      memoryUsed: 8,
      memoryTotal: 16,
      uptime: 100,
      cpuCores: 8,
      timestamp: 123456,
    })
  );
  const { result } = renderHook(() => useSystemMetrics());
  await waitForLoadingComplete(result);
  expect(result.current.metrics).toBeDefined();
  expect(result.current.error).toBeNull();
};

export const scenarioTransitionToError = async () => {
  (global.fetch as jest.Mock).mockRejectedValue(new Error('Failed'));
  const { result } = renderHook(() => useSystemMetrics());
  await waitForLoadingComplete(result);
  expect(result.current.metrics).toBeNull();
  expect(result.current.error).toBe('Failed');
};

export const scenarioSetLoadingToFalseOnError = async () => {
  (global.fetch as jest.Mock).mockRejectedValue(new Error('Failed'));
  const { result } = renderHook(() => useSystemMetrics());
  await waitForLoadingComplete(result);
  expect(result.current.loading).toBe(false);
};

export const errorScenarios = {
  errorHandling: {
    'should handle network errors': scenarioHandleNetworkError,
    'should handle 404 error': scenarioHandle404Error,
    'should handle 500 error': scenarioHandle500Error,
    'should handle timeout errors': scenarioHandleTimeoutError,
    'should handle JSON parse errors': scenarioHandleJsonParseError,
  },
  consecutiveErrors: {
    'should handle consecutive errors': scenarioHandleConsecutiveErrors,
  },
  loadingStates: {
    'should be loading initially': scenarioLoadingInitially,
    'should transition to success': scenarioTransitionToSuccess,
    'should transition to error': scenarioTransitionToError,
    'should set loading to false on error': scenarioSetLoadingToFalseOnError,
  },
};
