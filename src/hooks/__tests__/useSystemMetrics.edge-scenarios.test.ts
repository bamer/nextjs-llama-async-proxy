/**
 * Edge case scenarios tests for useSystemMetrics hook
 * Testing complex response scenarios and concurrent requests
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useSystemMetrics } from '../useSystemMetrics';
import {
  mockSuccessResponse,
  setupBeforeEach,
  setupAfterEach,
} from './useSystemMetrics.test.helpers';

describe('useSystemMetrics - Edge Case Scenarios', () => {
  beforeEach(setupBeforeEach);
  afterEach(setupAfterEach);

  it('should handle missing fields in response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockSuccessResponse({
        cpuUsage: 50,
      })
    );

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics?.cpuUsage).toBe(50);
    expect(result.current.metrics?.memoryUsage).toBeUndefined();
  });

  it('should handle response with extra fields', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockSuccessResponse({
        cpuUsage: 50,
        memoryUsage: 60,
        memoryUsed: 8,
        memoryTotal: 16,
        uptime: 100,
        cpuCores: 8,
        timestamp: 123456,
        extraField: 'extra',
        anotherExtra: 123,
      })
    );

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect((result.current.metrics as any).extraField).toBe('extra');
  });

  it('should handle very slow network response', async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => {
            resolve(mockSuccessResponse({ cpuUsage: 50, memoryUsage: 60 }));
          }, 5000)
        )
    );

    const { result } = renderHook(() => useSystemMetrics());

    // Should still be loading after 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.loading).toBe(true);

    // Should complete after 5 seconds
    act(() => {
      jest.advanceTimersByTime(4000);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should handle incomplete JSON response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ cpuUsage: 50, incomplete: true }),
    });

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics?.cpuUsage).toBe(50);
  });

  it('should handle response with string numbers', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockSuccessResponse({
        cpuUsage: '50' as any,
        memoryUsage: '60' as any,
        memoryUsed: '8' as any,
        memoryTotal: '16' as any,
        uptime: '100' as any,
        cpuCores: '8' as any,
        timestamp: '123456' as any,
      })
    );

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics?.cpuUsage).toBe('50');
  });

  it('should handle concurrent requests', async () => {
    let resolveRequest: (value: any) => void;
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        })
    );

    const { result } = renderHook(() => useSystemMetrics());

    // Request is pending
    expect(result.current.loading).toBe(true);

    // Resolve the request
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

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});
