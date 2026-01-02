/**
 * Test scenarios for metrics threshold values (boundary values)
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useSystemMetrics } from '../../useSystemMetrics';
import { mockSuccessResponse } from '../test-utils/useSystemMetrics.test-utils';
import {
  mockZeroMetricValues,
  mockNegativeMetricValues,
  mockLargeMetricValues,
  mockDecimalMetricValues,
  mockNanMetricValues,
  mockInfinityMetricValues,
} from '../mocks/useSystemMetrics.mocks';

const waitForLoadingComplete = async (result: any) => {
  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });
};

export const scenarioHandleZeroValues = async () => {
  (global.fetch as jest.Mock).mockResolvedValue(mockSuccessResponse(mockZeroMetricValues));

  const { result } = renderHook(() => useSystemMetrics());

  await waitForLoadingComplete(result);

  expect(result.current.metrics?.cpuUsage).toBe(0);
  expect(result.current.metrics?.memoryUsage).toBe(0);
  expect(result.current.metrics?.memoryUsed).toBe(0);
};

export const scenarioHandleNegativeValues = async () => {
  (global.fetch as jest.Mock).mockResolvedValue(mockSuccessResponse(mockNegativeMetricValues));

  const { result } = renderHook(() => useSystemMetrics());

  await waitForLoadingComplete(result);

  expect(result.current.metrics?.cpuUsage).toBe(-10);
  expect(result.current.metrics?.uptime).toBe(-100);
};

export const scenarioHandleVeryLargeValues = async () => {
  (global.fetch as jest.Mock).mockResolvedValue(mockSuccessResponse(mockLargeMetricValues));

  const { result } = renderHook(() => useSystemMetrics());

  await waitForLoadingComplete(result);

  expect(result.current.metrics?.cpuUsage).toBe(Number.MAX_SAFE_INTEGER);
};

export const scenarioHandleDecimalValues = async () => {
  (global.fetch as jest.Mock).mockResolvedValue(mockSuccessResponse(mockDecimalMetricValues));

  const { result } = renderHook(() => useSystemMetrics());

  await waitForLoadingComplete(result);

  expect(result.current.metrics?.cpuUsage).toBe(50.5);
  expect(result.current.metrics?.timestamp).toBe(123456.789);
};

export const scenarioHandleNanValues = async () => {
  (global.fetch as jest.Mock).mockResolvedValue(mockSuccessResponse(mockNanMetricValues));

  const { result } = renderHook(() => useSystemMetrics());

  await waitForLoadingComplete(result);

  expect(isNaN(result.current.metrics?.cpuUsage as number)).toBe(true);
};

export const scenarioHandleInfinityValues = async () => {
  (global.fetch as jest.Mock).mockResolvedValue(mockSuccessResponse(mockInfinityMetricValues));

  const { result } = renderHook(() => useSystemMetrics());

  await waitForLoadingComplete(result);

  expect(result.current.metrics?.cpuUsage).toBe(Infinity);
};

export const thresholdValueScenarios = {
  boundaryValues: {
    'should handle zero values': scenarioHandleZeroValues,
    'should handle negative values': scenarioHandleNegativeValues,
    'should handle very large values': scenarioHandleVeryLargeValues,
    'should handle decimal values': scenarioHandleDecimalValues,
    'should handle NaN values': scenarioHandleNanValues,
    'should handle Infinity values': scenarioHandleInfinityValues,
  },
};
