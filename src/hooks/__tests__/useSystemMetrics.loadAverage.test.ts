/**
 * LoadAverage array tests for useSystemMetrics hook
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useSystemMetrics } from '../useSystemMetrics';
import {
  mockSuccessResponse,
  setupBeforeEach,
  setupAfterEach,
} from './useSystemMetrics.test.helpers';

describe('useSystemMetrics - LoadAverage Arrays', () => {
  beforeEach(setupBeforeEach);
  afterEach(setupAfterEach);

  it('should handle loadAverage array', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockSuccessResponse({
        cpuUsage: 50,
        memoryUsage: 60,
        memoryUsed: 8,
        memoryTotal: 16,
        uptime: 100,
        cpuCores: 8,
        loadAverage: [0.5, 1.0, 1.5],
        timestamp: 123456,
      })
    );

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics?.loadAverage).toEqual([0.5, 1.0, 1.5]);
  });

  it('should handle empty loadAverage array', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockSuccessResponse({
        cpuUsage: 50,
        memoryUsage: 60,
        memoryUsed: 8,
        memoryTotal: 16,
        uptime: 100,
        cpuCores: 8,
        loadAverage: [],
        timestamp: 123456,
      })
    );

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics?.loadAverage).toEqual([]);
  });

  it('should handle very large loadAverage array', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockSuccessResponse({
        cpuUsage: 50,
        memoryUsage: 60,
        memoryUsed: 8,
        memoryTotal: 16,
        uptime: 100,
        cpuCores: 8,
        loadAverage: Array.from({ length: 1000 }, () => Math.random()),
        timestamp: 123456,
      })
    );

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics?.loadAverage).toHaveLength(1000);
  });
});
