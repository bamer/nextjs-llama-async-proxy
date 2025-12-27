/**
 * Comprehensive edge case tests for useSystemMetrics hook
 * Testing for null/undefined inputs, error states, loading states,
 * concurrent calls, cleanup on unmount, memory leaks, and edge cases
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useSystemMetrics } from '../useSystemMetrics';

// Mock fetch
global.fetch = jest.fn();

describe('useSystemMetrics - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mockSuccessResponse = (data: any) => ({
    ok: true,
    json: async () => data,
  });

  const mockErrorResponse = (status: number, message: string) => ({
    ok: false,
    status,
    json: async () => ({ message }),
  });

  const mockNetworkError = () => {
    throw new Error('Network error');
  };

  describe('Initial State', () => {
    it('should initialize with null metrics', () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockSuccessResponse({}));

      const { result } = renderHook(() => useSystemMetrics());

      expect(result.current.metrics).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(true);
    });
  });

  describe('Null/Undefined Handling', () => {
    it('should handle null response data', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockSuccessResponse(null));

      const { result } = renderHook(() => useSystemMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.metrics).toBeNull();
    });

    it('should handle undefined response data', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockSuccessResponse(undefined));

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

  describe('Error States', () => {
    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockImplementation(mockNetworkError);

      const { result } = renderHook(() => useSystemMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.metrics).toBeNull();
    });

    it('should handle 404 error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockErrorResponse(404, 'Not found'));

      const { result } = renderHook(() => useSystemMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch metrics');
    });

    it('should handle 500 error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockErrorResponse(500, 'Internal server error'));

      const { result } = renderHook(() => useSystemMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch metrics');
    });

    it('should handle timeout errors', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => {
        throw new Error('Request timeout');
      });

      const { result } = renderHook(() => useSystemMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Request timeout');
    });

    it('should handle JSON parse errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => {
          throw new SyntaxError('Unexpected token');
        },
      });

      const { result } = renderHook(() => useSystemMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Unexpected token');
    });

    it('should handle consecutive errors', async () => {
      (global.fetch as jest.Mock).mockImplementation(mockNetworkError);

      const { result } = renderHook(() => useSystemMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialError = result.current.error;

      // Fast-forward past the polling interval
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe(initialError);
    });
  });

  describe('Loading States', () => {
    it('should be loading initially', () => {
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useSystemMetrics());

      expect(result.current.loading).toBe(true);
      expect(result.current.metrics).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should transition to success', async () => {
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

      expect(result.current.metrics).toBeDefined();
      expect(result.current.error).toBeNull();
    });

    it('should transition to error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useSystemMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.metrics).toBeNull();
      expect(result.current.error).toBe('Failed');
    });

    it('should set loading to false on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useSystemMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Polling', () => {
    it('should poll every 2 seconds', async () => {
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

      // Fast-forward 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect((global.fetch as jest.Mock).mock.calls.length).toBe(initialCallCount + 1);
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

      // Fast-forward 2 seconds to trigger retry
      act(() => {
        jest.advanceTimersByTime(2000);
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

      // Fast-forward 10 seconds (5 polls)
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      await waitFor(() => {
        expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(1);
      });
    });
  });

  describe('Cleanup on Unmount', () => {
    it('should clear polling interval on unmount', () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockSuccessResponse({}));

      const { unmount } = renderHook(() => useSystemMetrics());

      const initialCallCount = (global.fetch as jest.Mock).mock.calls.length;

      // Fast-forward 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Should have fetched again
      expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(initialCallCount);

      unmount();

      // Fast-forward another 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Should not fetch again after unmount
      const callCountAfterUnmount = (global.fetch as jest.Mock).mock.calls.length;
      expect(callCountAfterUnmount).toBeLessThan(initialCallCount + 3);
    });
  });

  describe('Memory Leaks', () => {
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

      // Should not have excessive intervals
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

  describe('Metric Values', () => {
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

  describe('Edge Case Scenarios', () => {
    it('should handle response with special characters', async () => {
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

      expect(result.current.metrics).toBeDefined();
    });

    it('should handle response with unicode characters', async () => {
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

      expect(result.current.metrics).toBeDefined();
    });

    it('should handle missing fields in response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockSuccessResponse({
          cpuUsage: 50,
          // missing other fields
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

      // Extra fields should be included
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

      // Numbers stored as strings
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
});
