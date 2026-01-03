/**
 * Numeric value tests for useSystemMetrics hook
 * Testing zero, negative, large, and decimal metric values
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useSystemMetrics } from '../useSystemMetrics';
import {
  mockSuccessResponse,
  setupBeforeEach,
  setupAfterEach,
} from './useSystemMetrics.test.helpers';

describe('useSystemMetrics - Numeric Values', () => {
  beforeEach(setupBeforeEach);
  afterEach(setupAfterEach);

  it('should handle zero values', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockSuccessResponse({
        cpuUsage: 0,
        memoryUsage: 0,
        memoryUsed: 0,
        memoryTotal: 0,
        uptime: 0,
        cpuCores: 0,
        timestamp: 0,
      })
    );

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics?.cpuUsage).toBe(0);
    expect(result.current.metrics?.memoryUsage).toBe(0);
    expect(result.current.metrics?.memoryUsed).toBe(0);
  });

  it('should handle negative values', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockSuccessResponse({
        cpuUsage: -10,
        memoryUsage: -20,
        memoryUsed: -5,
        memoryTotal: -10,
        uptime: -100,
        cpuCores: -2,
        timestamp: -1000,
      })
    );

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics?.cpuUsage).toBe(-10);
    expect(result.current.metrics?.uptime).toBe(-100);
  });

  it('should handle very large values', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockSuccessResponse({
        cpuUsage: Number.MAX_SAFE_INTEGER,
        memoryUsage: Number.MAX_SAFE_INTEGER,
        memoryUsed: Number.MAX_SAFE_INTEGER,
        memoryTotal: Number.MAX_SAFE_INTEGER,
        uptime: Number.MAX_SAFE_INTEGER,
        cpuCores: Number.MAX_SAFE_INTEGER,
        timestamp: Number.MAX_SAFE_INTEGER,
      })
    );

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics?.cpuUsage).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('should handle decimal values', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockSuccessResponse({
        cpuUsage: 50.5,
        memoryUsage: 60.7,
        memoryUsed: 8.3,
        memoryTotal: 16.9,
        uptime: 100.2,
        cpuCores: 8,
        timestamp: 123456.789,
      })
    );

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics?.cpuUsage).toBe(50.5);
    expect(result.current.metrics?.timestamp).toBe(123456.789);
  });
});
