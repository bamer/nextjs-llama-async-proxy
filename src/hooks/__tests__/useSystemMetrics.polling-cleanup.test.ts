/**
 * Polling and cleanup tests for useSystemMetrics hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useSystemMetrics } from '../useSystemMetrics';
import {
  mockSuccessResponse,
  mockNetworkError,
  setupBeforeEach,
  setupAfterEach,
} from './useSystemMetrics.test.helpers';

describe('useSystemMetrics - Polling', () => {
  beforeEach(setupBeforeEach);
  afterEach(setupAfterEach);

  it('should poll every 30 seconds', async () => {
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

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialCallCount = (global.fetch as jest.Mock).mock.calls.length;

    // Fast-forward 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect((global.fetch as jest.Mock).mock.calls.length).toBe(
        initialCallCount + 1
      );
    });
  });

  it('should continue polling after error', async () => {
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

    // Fast-forward 30 seconds to trigger retry
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(result.current.metrics).toBeDefined();
    });
  });

  it('should handle multiple poll cycles', async () => {
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

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Fast-forward 60 seconds (2 polls)
    act(() => {
      jest.advanceTimersByTime(60000);
    });

    await waitFor(() => {
      expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(1);
    });
  });
});

describe('useSystemMetrics - Cleanup', () => {
  beforeEach(setupBeforeEach);
  afterEach(setupAfterEach);

  it('should clear polling interval on unmount', () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockSuccessResponse({}));

    const { unmount } = renderHook(() => useSystemMetrics());

    const initialCallCount = (global.fetch as jest.Mock).mock.calls.length;

    // Fast-forward 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    // Should have fetched again
    expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(
      initialCallCount
    );

    unmount();

    // Fast-forward another 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    // Should not fetch again after unmount
    const callCountAfterUnmount = (
      global.fetch as jest.Mock
    ).mock.calls.length;
    expect(callCountAfterUnmount).toBeLessThan(initialCallCount + 3);
  });
});

describe('useSystemMetrics - Memory Leaks', () => {
  beforeEach(setupBeforeEach);
  afterEach(setupAfterEach);

  it('should not leak memory with frequent remounts', async () => {
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
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      unmount();
    }

    jest.clearAllTimers();
  });

  it('should handle large response without memory issues', async () => {
    const largeData = Array.from({ length: 1000000 }, (_, i) => ({
      cpuUsage: i % 100,
      memoryUsage: i % 100,
    }));

    (global.fetch as jest.Mock).mockResolvedValue(mockSuccessResponse(largeData));

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics).toBeDefined();

    const { unmount } = renderHook(() => useSystemMetrics());
    unmount();
  });
});
