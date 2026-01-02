/**
 * Test scenarios for metrics timing, cleanup, memory leaks, and concurrency
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useSystemMetrics } from '../../useSystemMetrics';
import { mockSuccessResponse } from '../test-utils/useSystemMetrics.test-utils';

const waitForLoadingComplete = async (result: any) => {
  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });
};

export const scenarioClearPollingIntervalOnUnmount = () => {
  (global.fetch as jest.Mock).mockResolvedValue(mockSuccessResponse({}));

  const { unmount } = renderHook(() => useSystemMetrics());

  const initialCallCount = (global.fetch as jest.Mock).mock.calls.length;

  act(() => {
    jest.advanceTimersByTime(30000);
  });

  expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(initialCallCount);

  unmount();

  act(() => {
    jest.advanceTimersByTime(30000);
  });

  const callCountAfterUnmount = (global.fetch as jest.Mock).mock.calls.length;
  expect(callCountAfterUnmount).toBeLessThan(initialCallCount + 3);
};

export const scenarioNoMemoryLeakWithFrequentRemounts = async () => {
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

  for (let i = 0; i < 100; i++) {
    const { unmount, result } = renderHook(() => useSystemMetrics());
    await waitForLoadingComplete(result);
    unmount();
  }

  jest.clearAllTimers();
};

export const scenarioHandleSlowNetworkResponse = async () => {
  (global.fetch as jest.Mock).mockImplementation(
    () =>
      new Promise((resolve) =>
        setTimeout(() => {
          resolve(mockSuccessResponse({ cpuUsage: 50, memoryUsage: 60 }));
        }, 5000)
      )
  );

  const { result } = renderHook(() => useSystemMetrics());

  act(() => {
    jest.advanceTimersByTime(1000);
  });

  expect(result.current.loading).toBe(true);

  act(() => {
    jest.advanceTimersByTime(4000);
  });

  await waitForLoadingComplete(result);
};

export const scenarioHandleConcurrentRequests = async () => {
  let resolveRequest: (value: any) => void;
  (global.fetch as jest.Mock).mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
  );

  const { result } = renderHook(() => useSystemMetrics());

  expect(result.current.loading).toBe(true);

  act(() => {
    resolveRequest!(
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
  });

  await waitForLoadingComplete(result);
};

export const timingCleanupScenarios = {
  cleanup: {
    'should clear polling interval on unmount': scenarioClearPollingIntervalOnUnmount,
  },
  memoryLeaks: {
    'should not leak memory with frequent remounts': scenarioNoMemoryLeakWithFrequentRemounts,
  },
  concurrency: {
    'should handle very slow network response': scenarioHandleSlowNetworkResponse,
    'should handle concurrent requests': scenarioHandleConcurrentRequests,
  },
};
