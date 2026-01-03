/**
 * Initial state and null/undefined handling tests for useSystemMetrics hook
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useSystemMetrics } from '../useSystemMetrics';
import {
  mockSuccessResponse,
  setupBeforeEach,
  setupAfterEach,
} from './useSystemMetrics.test.helpers';

describe('useSystemMetrics - Initial State', () => {
  beforeEach(setupBeforeEach);
  afterEach(setupAfterEach);

  it('should initialize with null metrics', () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockSuccessResponse({}));

    const { result } = renderHook(() => useSystemMetrics());

    expect(result.current.metrics).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(true);
  });
});

describe('useSystemMetrics - Null/Undefined Handling', () => {
  beforeEach(setupBeforeEach);
  afterEach(setupAfterEach);

  it('should handle null response data', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockSuccessResponse(null));

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics).toBeNull();
  });

  it('should handle undefined response data', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockSuccessResponse(undefined)
    );

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics).toBeUndefined();
  });

  it('should handle null metric values', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockSuccessResponse({
        cpuUsage: null,
        memoryUsage: null,
        memoryUsed: null,
        memoryTotal: null,
        uptime: null,
        cpuCores: null,
        timestamp: null,
      })
    );

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics?.cpuUsage).toBeNull();
    expect(result.current.metrics?.memoryUsage).toBeNull();
  });

  it('should handle undefined metric values', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockSuccessResponse({
        cpuUsage: undefined,
        memoryUsage: undefined,
        memoryUsed: undefined,
        memoryTotal: undefined,
        uptime: undefined,
        cpuCores: undefined,
        timestamp: undefined,
      })
    );

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics?.cpuUsage).toBeUndefined();
  });

  it('should handle null loadAverage', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockSuccessResponse({
        cpuUsage: 50,
        memoryUsage: 60,
        memoryUsed: 8,
        memoryTotal: 16,
        uptime: 100,
        cpuCores: 8,
        loadAverage: null,
        timestamp: 123456,
      })
    );

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics?.loadAverage).toBeNull();
  });

  it('should handle undefined loadAverage', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockSuccessResponse({
        cpuUsage: 50,
        memoryUsage: 60,
        memoryUsed: 8,
        memoryTotal: 16,
        uptime: 100,
        cpuCores: 8,
        loadAverage: undefined,
        timestamp: 123456,
      })
    );

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics?.loadAverage).toBeUndefined();
  });
});
