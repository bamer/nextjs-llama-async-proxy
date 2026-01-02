/**
 * Test scenarios for metrics polling behavior
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useSystemMetrics } from '../../useSystemMetrics';
import { mockSuccessResponse, advanceTimersByTime } from '../test-utils/useSystemMetrics.test-utils';

const waitForLoadingComplete = async (result: any) => {
  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });
};

export const scenarioPollEvery30Seconds = async () => {
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

  const initialCallCount = (global.fetch as jest.Mock).mock.calls.length;

  advanceTimersByTime(30000);

  await waitFor(() => {
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(initialCallCount + 1);
  });
};

export const scenarioContinuePollingAfterError = async () => {
  (global.fetch as jest.Mock)
    .mockRejectedValueOnce(new Error('Failed'))
    .mockResolvedValueOnce(
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

  await waitFor(() => {
    expect(result.current.error).toBe('Failed');
  });

  advanceTimersByTime(30000);

  await waitFor(() => {
    expect(result.current.metrics).toBeDefined();
  });
};

export const scenarioHandleMultiplePollCycles = async () => {
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

  advanceTimersByTime(60000);

  await waitFor(() => {
    expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(1);
  });
};

export const pollingScenarios = {
  polling: {
    'should poll every 30 seconds': scenarioPollEvery30Seconds,
    'should continue polling after error': scenarioContinuePollingAfterError,
    'should handle multiple poll cycles': scenarioHandleMultiplePollCycles,
  },
};
