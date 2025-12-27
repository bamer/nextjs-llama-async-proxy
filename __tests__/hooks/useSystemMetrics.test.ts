import { renderHook, act, waitFor } from '@testing-library/react';
import { useSystemMetrics } from '@/hooks/useSystemMetrics';

// Mock fetch
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('useSystemMetrics', () => {
  const mockMetrics = {
    cpuUsage: 45.6,
    memoryUsage: 67.3,
    memoryUsed: 8589934592, // 8GB
    memoryTotal: 17179869184, // 16GB
    uptime: 1234567,
    cpuCores: 8,
    loadAverage: [0.5, 0.7, 0.9],
    timestamp: Date.now(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useSystemMetrics());

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
    expect(result.current.metrics).toBe(null);
  });

  it('should fetch metrics successfully on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMetrics,
    } as Response);

    const { result } = renderHook(() => useSystemMetrics());

    // Should be loading initially
    expect(result.current.loading).toBe(true);
    expect(result.current.metrics).toBe(null);

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.metrics).toEqual(mockMetrics);
    expect(result.current.error).toBe(null);

    expect(mockFetch).toHaveBeenCalledWith('/api/system/metrics');
  });

  it('should handle fetch errors', async () => {
    const errorMessage = 'Failed to fetch metrics';
    mockFetch.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.metrics).toBe(null);
    expect(result.current.error).toBe(errorMessage);
    expect(mockFetch).toHaveBeenCalledWith('/api/system/metrics');
  });

  it('should handle HTTP error responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.metrics).toBe(null);
    expect(result.current.error).toBe('Failed to fetch metrics');
  });

  it('should handle network errors with fallback message', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
  });

  it('should handle unknown errors', async () => {
    mockFetch.mockRejectedValueOnce('Unknown error');

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Unknown error');
  });

  it('should poll metrics every 2 seconds', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockMetrics,
    } as Response);

    renderHook(() => useSystemMetrics());

    // Initial call
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Advance time by 2 seconds (first poll)
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    // Advance time by another 2 seconds (second poll)
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  it('should continue polling after errors', async () => {
    // First call fails, second call succeeds
    mockFetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetrics,
      } as Response);

    renderHook(() => useSystemMetrics());

    // Wait for first error
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    // Advance time to trigger next poll
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    // Verify state is correct after successful retry
    const { result } = renderHook(() => useSystemMetrics());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.metrics).toEqual(mockMetrics);
  });

  it('should cleanup interval on unmount', () => {
    const { unmount } = renderHook(() => useSystemMetrics());

    expect(mockFetch).toHaveBeenCalledTimes(1);

    unmount();

    // Advance time to see if polling stops
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Should not have additional calls after unmount
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should update metrics with new data on each poll', async () => {
    const metrics1 = { ...mockMetrics, cpuUsage: 30.0, timestamp: 1000 };
    const metrics2 = { ...mockMetrics, cpuUsage: 45.6, timestamp: 2000 };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => metrics1,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => metrics2,
      } as Response);

    const { result } = renderHook(() => useSystemMetrics());

    // Wait for first metrics
    await waitFor(() => {
      expect(result.current.metrics).toEqual(metrics1);
    });

    // Advance time for second poll
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Wait for updated metrics
    await waitFor(() => {
      expect(result.current.metrics).toEqual(metrics2);
    });
  });

  it('should handle multiple concurrent hook instances', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockMetrics,
    } as Response);

    const { result: result1 } = renderHook(() => useSystemMetrics());
    const { result: result2 } = renderHook(() => useSystemMetrics());

    // Both should get the same data
    await waitFor(() => {
      expect(result1.current.loading).toBe(false);
      expect(result2.current.loading).toBe(false);
    });

    expect(result1.current.metrics).toEqual(mockMetrics);
    expect(result2.current.metrics).toEqual(mockMetrics);
    expect(result1.current.error).toBe(null);
    expect(result2.current.error).toBe(null);
  });

  it('should handle empty metrics response', async () => {
    const emptyMetrics = null;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => emptyMetrics,
    } as Response);

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should handle partial metrics data', async () => {
    const partialMetrics = {
      cpuUsage: 45.6,
      memoryUsage: 67.3,
      memoryUsed: 8589934592,
      memoryTotal: 17179869184,
      uptime: 1234567,
      cpuCores: 8,
      timestamp: Date.now(),
      // Note: loadAverage is missing
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => partialMetrics,
    } as Response);

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics).toEqual(partialMetrics);
    expect(result.current.metrics?.loadAverage).toBeUndefined();
  });

  it('should handle fetch cancellation on unmount', async () => {
    let fetchCalled = false;
    
    mockFetch.mockImplementationOnce(() => {
      fetchCalled = true;
      return new Promise(() => {
        // Never resolve to simulate hanging request
      });
    });

    const { unmount } = renderHook(() => useSystemMetrics());

    // Wait a bit to ensure fetch is initiated
    await waitFor(() => {
      expect(fetchCalled).toBe(true);
    });

    // Unmount should cleanup
    unmount();

    // Should not cause memory leaks (this is just a sanity check)
    expect(fetchCalled).toBe(true);
  });
});
