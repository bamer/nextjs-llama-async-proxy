import { renderHook, waitFor } from '@testing-library/react';
import { useSystemMetrics } from '@/hooks/useSystemMetrics';

describe('useSystemMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with null metrics and loading true', () => {
    const { result } = renderHook(() => useSystemMetrics());

    expect(result.current.metrics).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should fetch metrics on mount', async () => {
    const mockMetrics = {
      cpuUsage: 50,
      memoryUsage: 60,
      memoryUsed: 8000000000,
      memoryTotal: 16000000000,
      uptime: 86400,
      cpuCores: 4,
      timestamp: 1704067200000,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMetrics,
    });

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics).toEqual(mockMetrics);
    expect(result.current.error).toBeNull();
  });

  it('should set error on fetch failure with ok:false', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics).toBeNull();
  });

  it('should handle fetch network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    );

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });

    expect(result.current.metrics).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should handle non-Error exceptions as Unknown error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce('String error');

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.error).toBe('Unknown error');
    });
  });

  it('should call /api/system/metrics endpoint', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/system/metrics');
    });
  });

  it('should set loading to false after fetch', async () => {
    const mockMetrics = {
      cpuUsage: 50,
      memoryUsage: 60,
      memoryUsed: 8000000000,
      memoryTotal: 16000000000,
      uptime: 86400,
      cpuCores: 4,
      timestamp: 1704067200000,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMetrics,
    });

    const { result } = renderHook(() => useSystemMetrics());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});
