import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSystemMetrics } from '@/hooks/useSystemMetrics';

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      cpuUsage: 50,
      memoryUsage: 60,
      memoryUsed: 4294967296,
      memoryTotal: 17179869184,
      uptime: 1234567890,
      cpuCores: 8,
      loadAverage: [0.5, 0.6, 0.7],
      timestamp: 1609459200000,
    }),
  })
) as jest.Mock;

describe('useSystemMetrics', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with loading state true', () => {
    const { result } = renderHook(() => useSystemMetrics());
    
    expect(result.current.loading).toBe(true);
    expect(result.current.metrics).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should fetch metrics on mount', async () => {
    const { result } = renderHook(() => useSystemMetrics());
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/system/metrics');
      expect(result.current.loading).toBe(false);
      expect(result.current.metrics).toBeDefined();
    });
  });

  it('should set metrics from API response', async () => {
    const { result } = renderHook(() => useSystemMetrics());
    
    await waitFor(() => {
      expect(result.current.metrics).not.toBeNull();
      if (result.current.metrics) {
        expect(result.current.metrics.cpuUsage).toBe(50);
        expect(result.current.metrics.memoryUsage).toBe(60);
        expect(result.current.metrics.memoryUsed).toBe(4294967296);
        expect(result.current.metrics.memoryTotal).toBe(17179869184);
        expect(result.current.metrics.uptime).toBe(1234567890);
        expect(result.current.metrics.cpuCores).toBe(8);
        expect(result.current.metrics.loadAverage).toEqual([0.5, 0.6, 0.7]);
        expect(result.current.metrics.timestamp).toBe(1609459200000);
      }
    });
  });

  it('should handle fetch errors', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
      })
    );
    
    const { result } = renderHook(() => useSystemMetrics());
    
    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
      expect(result.current.metrics).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  it('should handle network errors', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('Network error'))
    );
    
    const { result } = renderHook(() => useSystemMetrics());
    
    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
      expect(result.current.metrics).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  it('should poll metrics every 30 seconds', async () => {
    const { result } = renderHook(() => useSystemMetrics());
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    
    // Fast-forward 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });
    
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should cleanup interval on unmount', async () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    
    const { unmount } = renderHook(() => useSystemMetrics());
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    
    unmount();
    
    expect(clearIntervalSpy).toHaveBeenCalled();
    
    clearIntervalSpy.mockRestore();
  });

  it('should reset metrics on error', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('Fetch error'))
    );
    
    const { result } = renderHook(() => useSystemMetrics());
    
    await waitFor(() => {
      expect(result.current.metrics).toBeNull();
      expect(result.current.error).toBe('Fetch error');
    });
  });

  it('should handle partial metrics data', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          cpuUsage: 50,
          memoryUsage: 60,
          // Missing other fields
        }),
      })
    );
    
    const { result } = renderHook(() => useSystemMetrics());
    
    await waitFor(() => {
      expect(result.current.metrics).toBeDefined();
      if (result.current.metrics) {
        expect(result.current.metrics.cpuUsage).toBe(50);
        expect(result.current.metrics.memoryUsage).toBe(60);
      }
    });
  });
});
