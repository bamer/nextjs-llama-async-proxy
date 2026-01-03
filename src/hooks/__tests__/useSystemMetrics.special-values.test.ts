/**
 * Special value tests for useSystemMetrics hook
 * Testing NaN and Infinity metric values
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useSystemMetrics } from '../useSystemMetrics';
import {
  mockSuccessResponse,
  setupBeforeEach,
  setupAfterEach,
} from './useSystemMetrics.test.helpers';

describe('useSystemMetrics - Special Values', () => {
  beforeEach(setupBeforeEach);
  afterEach(setupAfterEach);

  it('should handle NaN values', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockSuccessResponse({
        cpuUsage: NaN,
        memoryUsage: NaN,
        memoryUsed: NaN,
        memoryTotal: NaN,
        uptime: NaN,
        cpuCores: NaN,
        timestamp: NaN,
      })
    );

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(isNaN(result.current.metrics?.cpuUsage as number)).toBe(true);
  });

  it('should handle Infinity values', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockSuccessResponse({
        cpuUsage: Infinity,
        memoryUsage: Infinity,
        memoryUsed: Infinity,
        memoryTotal: Infinity,
        uptime: Infinity,
        cpuCores: Infinity,
        timestamp: Infinity,
      })
    );

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics?.cpuUsage).toBe(Infinity);
  });
});
