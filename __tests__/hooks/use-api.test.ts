import { renderHook, waitFor, act } from '@testing-library/react';
import { useApi } from '@/hooks/use-api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@/services/api-service');
jest.mock('@/lib/store');

const { apiService } = require('@/services/api-service');

describe('useApi', () => {
  let queryClient: QueryClient;

  const mockModels = [
    { id: '1', name: 'Model 1', status: 'idle' },
    { id: '2', name: 'Model 2', status: 'running' },
  ];

  const mockMetrics = {
    cpuUsage: 45.6,
    memoryUsage: 67.3,
    totalRequests: 100,
    timestamp: Date.now(),
  };

  const mockLogs = [
    { id: 1, level: 'info', message: 'Log 1', timestamp: Date.now() },
    { id: 2, level: 'warn', message: 'Log 2', timestamp: Date.now() },
  ];

  const mockConfig = {
    host: 'localhost',
    port: 8080,
    modelPath: '/models',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          refetchOnWindowFocus: false,
        },
      },
    });

    apiService.getModels = jest.fn().mockResolvedValue(mockModels);
    apiService.getMetrics = jest.fn().mockResolvedValue(mockMetrics);
    apiService.getLogs = jest.fn().mockResolvedValue(mockLogs);
    apiService.getConfig = jest.fn().mockResolvedValue({ success: true, data: mockConfig });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should return query objects for all data types', () => {
    const { result } = renderHook(() => useApi(), { wrapper });

    expect(result.current).toHaveProperty('models');
    expect(result.current).toHaveProperty('metrics');
    expect(result.current).toHaveProperty('logs');
    expect(result.current).toHaveProperty('config');
    expect(result.current).toHaveProperty('queryClient');
  });

  it('should fetch models on mount', async () => {
    const { result } = renderHook(() => useApi(), { wrapper });

    expect(result.current.models.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.models.isLoading).toBe(false);
    });

    expect(apiService.getModels).toHaveBeenCalledTimes(1);
    expect(result.current.models.data).toEqual(mockModels);
  });

  it('should fetch metrics on mount', async () => {
    const { result } = renderHook(() => useApi(), { wrapper });

    expect(result.current.metrics.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.metrics.isLoading).toBe(false);
    });

    expect(apiService.getMetrics).toHaveBeenCalledTimes(1);
    expect(result.current.metrics.data).toEqual(mockMetrics);
  });

  it('should fetch logs on mount', async () => {
    const { result } = renderHook(() => useApi(), { wrapper });

    expect(result.current.logs.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.logs.isLoading).toBe(false);
    });

    expect(apiService.getLogs).toHaveBeenCalledWith({ limit: 50 });
    expect(result.current.logs.data).toEqual(mockLogs);
  });

  it('should fetch config on mount', async () => {
    const { result } = renderHook(() => useApi(), { wrapper });

    await waitFor(() => {
      expect(result.current.config.isSuccess).toBe(true);
    });

    expect(apiService.getConfig).toHaveBeenCalledTimes(1);
    expect(result.current.config.data).toEqual({ success: true, data: mockConfig });
  });

  it('should handle models fetch error', async () => {
    const errorMessage = 'Failed to fetch models';
    apiService.getModels = jest.fn().mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useApi(), { wrapper });

    await waitFor(() => {
      expect(result.current.models.isError).toBe(true);
    });

    expect(result.current.models.error).toBeTruthy();
    expect(apiService.getModels).toHaveBeenCalledTimes(1);
  });

  it('should handle metrics fetch error', async () => {
    const errorMessage = 'Failed to fetch metrics';
    apiService.getMetrics = jest.fn().mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useApi(), { wrapper });

    await waitFor(() => {
      expect(result.current.metrics.isError).toBe(true);
    });

    expect(result.current.metrics.error).toBeTruthy();
  });

  it('should handle logs fetch error', async () => {
    const errorMessage = 'Failed to fetch logs';
    apiService.getLogs = jest.fn().mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useApi(), { wrapper });

    await waitFor(() => {
      expect(result.current.logs.isError).toBe(true);
    });

    expect(result.current.logs.error).toBeTruthy();
  });

  it('should handle config fetch error', async () => {
    const errorMessage = 'Failed to fetch config';
    apiService.getConfig = jest.fn().mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useApi(), { wrapper });

    await waitFor(() => {
      expect(result.current.config.isError).toBe(true);
    });

    expect(result.current.config.error).toBeTruthy();
  });

  it('should provide queryClient instance', () => {
    const { result } = renderHook(() => useApi(), { wrapper });

    expect(result.current.queryClient).toBeInstanceOf(QueryClient);
  });

  it('should refetch models every 30 seconds', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useApi(), { wrapper });

    await waitFor(() => {
      expect(result.current.models.isSuccess).toBe(true);
    });

    const initialCallCount = apiService.getModels.mock.calls.length;

    act(() => {
      jest.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(result.current.models.isSuccess).toBe(true);
    });

    expect(apiService.getModels).toHaveBeenCalledTimes(initialCallCount + 1);

    jest.useRealTimers();
  });

  it('should refetch metrics every 10 seconds', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useApi(), { wrapper });

    await waitFor(() => {
      expect(result.current.metrics.isSuccess).toBe(true);
    });

    const initialCallCount = apiService.getMetrics.mock.calls.length;

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    await waitFor(() => {
      expect(result.current.metrics.isSuccess).toBe(true);
    });

    expect(apiService.getMetrics).toHaveBeenCalledTimes(initialCallCount + 1);

    jest.useRealTimers();
  });

  it('should refetch logs every 15 seconds', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useApi(), { wrapper });

    await waitFor(() => {
      expect(result.current.logs.isSuccess).toBe(true);
    });

    const initialCallCount = apiService.getLogs.mock.calls.length;

    act(() => {
      jest.advanceTimersByTime(15000);
    });

    await waitFor(() => {
      expect(result.current.logs.isSuccess).toBe(true);
    });

    expect(apiService.getLogs).toHaveBeenCalledTimes(initialCallCount + 1);

    jest.useRealTimers();
  });

  it('should not refetch config by default', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useApi(), { wrapper });

    await waitFor(() => {
      expect(result.current.config.isSuccess).toBe(true);
    });

    const initialCallCount = apiService.getConfig.mock.calls.length;

    act(() => {
      jest.advanceTimersByTime(60000);
    });

    expect(apiService.getConfig).toHaveBeenCalledTimes(initialCallCount);

    jest.useRealTimers();
  });

  it('should allow manual refetch of models', async () => {
    const { result } = renderHook(() => useApi(), { wrapper });

    await waitFor(() => {
      expect(result.current.models.isSuccess).toBe(true);
    });

    const initialCallCount = apiService.getModels.mock.calls.length;

    await result.current.models.refetch();

    expect(apiService.getModels).toHaveBeenCalledTimes(initialCallCount + 1);
  });

  it('should allow manual refetch of metrics', async () => {
    const { result } = renderHook(() => useApi(), { wrapper });

    await waitFor(() => {
      expect(result.current.metrics.isSuccess).toBe(true);
    });

    const initialCallCount = apiService.getMetrics.mock.calls.length;

    await result.current.metrics.refetch();

    expect(apiService.getMetrics).toHaveBeenCalledTimes(initialCallCount + 1);
  });

  it('should allow manual refetch of logs', async () => {
    const { result } = renderHook(() => useApi(), { wrapper });

    await waitFor(() => {
      expect(result.current.logs.isSuccess).toBe(true);
    });

    const initialCallCount = apiService.getLogs.mock.calls.length;

    await result.current.logs.refetch();

    expect(apiService.getLogs).toHaveBeenCalledTimes(initialCallCount + 1);
  });

  it('should allow manual refetch of config', async () => {
    const { result } = renderHook(() => useApi(), { wrapper });

    await waitFor(() => {
      expect(result.current.config.isSuccess).toBe(true);
    });

    const initialCallCount = apiService.getConfig.mock.calls.length;

    await result.current.config.refetch();

    expect(apiService.getConfig).toHaveBeenCalledTimes(initialCallCount + 1);
  });

  it('should handle concurrent queries correctly', async () => {
    const { result } = renderHook(() => useApi(), { wrapper });

    await waitFor(() => {
      expect(result.current.models.isSuccess).toBe(true);
      expect(result.current.metrics.isSuccess).toBe(true);
      expect(result.current.logs.isSuccess).toBe(true);
      expect(result.current.config.isSuccess).toBe(true);
    });

    expect(apiService.getModels).toHaveBeenCalled();
    expect(apiService.getMetrics).toHaveBeenCalled();
    expect(apiService.getLogs).toHaveBeenCalled();
    expect(apiService.getConfig).toHaveBeenCalled();
  });

  it('should handle empty data arrays', async () => {
    apiService.getModels = jest.fn().mockResolvedValue([]);
    apiService.getLogs = jest.fn().mockResolvedValue([]);

    const { result } = renderHook(() => useApi(), { wrapper });

    await waitFor(() => {
      expect(result.current.models.isSuccess).toBe(true);
      expect(result.current.logs.isSuccess).toBe(true);
    });

    expect(result.current.models.data).toEqual([]);
    expect(result.current.logs.data).toEqual([]);
  });

  it('should handle null/undefined responses', async () => {
    apiService.getMetrics = jest.fn().mockResolvedValue(null);

    const { result } = renderHook(() => useApi(), { wrapper });

    await waitFor(() => {
      expect(result.current.metrics.isSuccess).toBe(true);
    });

    expect(result.current.metrics.data).toBeNull();
  });

  it('should work with multiple hook instances', async () => {
    const { result: result1 } = renderHook(() => useApi(), { wrapper });
    const { result: result2 } = renderHook(() => useApi(), { wrapper });

    await waitFor(() => {
      expect(result1.current.models.isSuccess).toBe(true);
      expect(result2.current.models.isSuccess).toBe(true);
    });

    expect(result1.current.models.data).toEqual(result2.current.models.data);
    expect(result1.current.metrics.data).toEqual(result2.current.metrics.data);
  });

  it('should handle network timeout', async () => {
    apiService.getModels = jest.fn().mockImplementation(
      () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
    );

    const { result } = renderHook(() => useApi(), { wrapper });

    await waitFor(() => {
      expect(result.current.models.isError).toBe(true);
    }, { timeout: 200 });

    expect(result.current.models.error).toBeTruthy();
  });

  it('should handle retry behavior', async () => {
    apiService.getModels = jest.fn()
      .mockRejectedValueOnce(new Error('First attempt'))
      .mockResolvedValueOnce(mockModels);

    const retryQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: 1,
          retryDelay: 100,
        },
      },
    });

    const retryWrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={retryQueryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useApi(), { wrapper: retryWrapper });

    await waitFor(() => {
      expect(result.current.models.isSuccess).toBe(true);
    });

    expect(apiService.getModels).toHaveBeenCalledTimes(2);
  });

  it('should maintain loading state during refetch', async () => {
    const { result } = renderHook(() => useApi(), { wrapper });

    await waitFor(() => {
      expect(result.current.models.isSuccess).toBe(true);
    });

    apiService.getModels = jest.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockModels), 100))
    );

    const refetchPromise = result.current.models.refetch();

    expect(result.current.models.isFetching).toBe(true);

    await refetchPromise;

    await waitFor(() => {
      expect(result.current.models.isFetching).toBe(false);
    });
  });

  it('should handle stale data correctly', async () => {
    const { result } = renderHook(() => useApi(), { wrapper });

    await waitFor(() => {
      expect(result.current.models.isSuccess).toBe(true);
    });

    expect(result.current.models.isStale).toBe(false);

    await waitFor(() => {
      expect(result.current.models.isStale).toBe(false);
    }, { timeout: 100 });
  });

  it('should handle query invalidation', async () => {
    const { result } = renderHook(() => useApi(), { wrapper });

    await waitFor(() => {
      expect(result.current.models.isSuccess).toBe(true);
    });

    const initialCallCount = apiService.getModels.mock.calls.length;

    act(() => {
      result.current.queryClient.invalidateQueries({ queryKey: ['models'] });
    });

    await waitFor(() => {
      expect(apiService.getModels).toHaveBeenCalledTimes(initialCallCount + 1);
    });
  });

  it('should preserve data across re-renders', async () => {
    const { result, rerender } = renderHook(() => useApi(), { wrapper });

    await waitFor(() => {
      expect(result.current.models.isSuccess).toBe(true);
    });

    const initialData = result.current.models.data;

    rerender();

    expect(result.current.models.data).toEqual(initialData);
  });

  it('should handle cache sharing between hooks', async () => {
    const { result: result1 } = renderHook(() => useApi(), { wrapper });

    await waitFor(() => {
      expect(result1.current.models.isSuccess).toBe(true);
    });

    const initialCallCount = apiService.getModels.mock.calls.length;

    const { result: result2 } = renderHook(() => useApi(), { wrapper });

    await waitFor(() => {
      expect(result2.current.models.isSuccess).toBe(true);
    });

    expect(apiService.getModels).toHaveBeenCalledTimes(initialCallCount);
  });
});
