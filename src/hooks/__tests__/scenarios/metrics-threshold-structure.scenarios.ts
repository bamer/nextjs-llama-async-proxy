/**
 * Test scenarios for metrics threshold structure (null/undefined, arrays, data structure)
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useSystemMetrics } from '../../useSystemMetrics';
import { mockSuccessResponse } from '../test-utils/useSystemMetrics.test-utils';
import {
  mockNullResponseData,
  mockUndefinedResponseData,
  mockNullMetricValues,
  mockUndefinedMetricValues,
  mockNullLoadAverage,
  mockUndefinedLoadAverage,
  mockLoadAverageArray,
  mockEmptyLoadAverageArray,
  mockLargeLoadAverageArray,
  mockStringNumbersMetrics,
  mockPartialMetrics,
  mockExtraFieldsMetrics,
  createLargeResponseData,
} from '../mocks/useSystemMetrics.mocks';

const waitForLoadingComplete = async (result: any) => {
  await waitFor(() => expect(result.current.loading).toBe(false));
};

export const scenarioHandleNullResponseData = async () => {
  (global.fetch as jest.Mock).mockResolvedValue(mockSuccessResponse(mockNullResponseData));
  const { result } = renderHook(() => useSystemMetrics());
  await waitForLoadingComplete(result);
  expect(result.current.metrics).toBeNull();
};

export const scenarioHandleUndefinedResponseData = async () => {
  (global.fetch as jest.Mock).mockResolvedValue(mockSuccessResponse(mockUndefinedResponseData));
  const { result } = renderHook(() => useSystemMetrics());
  await waitForLoadingComplete(result);
  expect(result.current.metrics).toBeUndefined();
};

export const scenarioHandleNullMetricValues = async () => {
  (global.fetch as jest.Mock).mockResolvedValue(mockSuccessResponse(mockNullMetricValues));
  const { result } = renderHook(() => useSystemMetrics());
  await waitForLoadingComplete(result);
  expect(result.current.metrics?.cpuUsage).toBeNull();
  expect(result.current.metrics?.memoryUsage).toBeNull();
};

export const scenarioHandleUndefinedMetricValues = async () => {
  (global.fetch as jest.Mock).mockResolvedValue(mockSuccessResponse(mockUndefinedMetricValues));
  const { result } = renderHook(() => useSystemMetrics());
  await waitForLoadingComplete(result);
  expect(result.current.metrics?.cpuUsage).toBeUndefined();
};

export const scenarioHandleNullLoadAverage = async () => {
  (global.fetch as jest.Mock).mockResolvedValue(mockSuccessResponse(mockNullLoadAverage));
  const { result } = renderHook(() => useSystemMetrics());
  await waitForLoadingComplete(result);
  expect(result.current.metrics?.loadAverage).toBeNull();
};

export const scenarioHandleUndefinedLoadAverage = async () => {
  (global.fetch as jest.Mock).mockResolvedValue(mockSuccessResponse(mockUndefinedLoadAverage));
  const { result } = renderHook(() => useSystemMetrics());
  await waitForLoadingComplete(result);
  expect(result.current.metrics?.loadAverage).toBeUndefined();
};

export const scenarioHandleLoadAverageArray = async () => {
  (global.fetch as jest.Mock).mockResolvedValue(mockSuccessResponse(mockLoadAverageArray));
  const { result } = renderHook(() => useSystemMetrics());
  await waitForLoadingComplete(result);
  expect(result.current.metrics?.loadAverage).toEqual([0.5, 1.0, 1.5]);
};

export const scenarioHandleEmptyLoadAverageArray = async () => {
  (global.fetch as jest.Mock).mockResolvedValue(mockSuccessResponse(mockEmptyLoadAverageArray));
  const { result } = renderHook(() => useSystemMetrics());
  await waitForLoadingComplete(result);
  expect(result.current.metrics?.loadAverage).toEqual([]);
};

export const scenarioHandleLargeLoadAverageArray = async () => {
  (global.fetch as jest.Mock).mockResolvedValue(mockSuccessResponse(mockLargeLoadAverageArray));
  const { result } = renderHook(() => useSystemMetrics());
  await waitForLoadingComplete(result);
  expect(result.current.metrics?.loadAverage).toHaveLength(1000);
};

export const scenarioHandleStringNumbers = async () => {
  (global.fetch as jest.Mock).mockResolvedValue(mockSuccessResponse(mockStringNumbersMetrics));
  const { result } = renderHook(() => useSystemMetrics());
  await waitForLoadingComplete(result);
  expect(result.current.metrics?.cpuUsage).toBe('50');
};

export const scenarioHandlePartialMetrics = async () => {
  (global.fetch as jest.Mock).mockResolvedValue(mockSuccessResponse(mockPartialMetrics));
  const { result } = renderHook(() => useSystemMetrics());
  await waitForLoadingComplete(result);
  expect(result.current.metrics?.cpuUsage).toBe(50);
  expect(result.current.metrics?.memoryUsage).toBeUndefined();
};

export const scenarioHandleExtraFields = async () => {
  (global.fetch as jest.Mock).mockResolvedValue(mockSuccessResponse(mockExtraFieldsMetrics));
  const { result } = renderHook(() => useSystemMetrics());
  await waitForLoadingComplete(result);
  expect((result.current.metrics as any).extraField).toBe('extra');
};

export const scenarioHandleLargeResponse = async () => {
  const largeData = createLargeResponseData(1000000);
  (global.fetch as jest.Mock).mockResolvedValue(mockSuccessResponse(largeData));
  const { result } = renderHook(() => useSystemMetrics());
  await waitForLoadingComplete(result);
  expect(result.current.metrics).toBeDefined();
  const { unmount } = renderHook(() => useSystemMetrics());
  unmount();
};

export const thresholdStructureScenarios = {
  nullUndefinedHandling: {
    'should handle null response data': scenarioHandleNullResponseData,
    'should handle undefined response data': scenarioHandleUndefinedResponseData,
    'should handle null metric values': scenarioHandleNullMetricValues,
    'should handle undefined metric values': scenarioHandleUndefinedMetricValues,
    'should handle null loadAverage': scenarioHandleNullLoadAverage,
    'should handle undefined loadAverage': scenarioHandleUndefinedLoadAverage,
  },
  arrayHandling: {
    'should handle loadAverage array': scenarioHandleLoadAverageArray,
    'should handle empty loadAverage array': scenarioHandleEmptyLoadAverageArray,
    'should handle very large loadAverage array': scenarioHandleLargeLoadAverageArray,
  },
  dataStructure: {
    'should handle string numbers': scenarioHandleStringNumbers,
    'should handle partial metrics': scenarioHandlePartialMetrics,
    'should handle extra fields': scenarioHandleExtraFields,
    'should handle large response': scenarioHandleLargeResponse,
  },
};
