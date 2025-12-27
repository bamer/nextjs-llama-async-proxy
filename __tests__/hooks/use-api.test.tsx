import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';

jest.mock('@/services/api-service', () => ({
  apiService: {
    getModels: jest.fn(() => Promise.resolve([])),
    getMetrics: jest.fn(() => Promise.resolve({})),
    getLogs: jest.fn(() => Promise.resolve([])),
    getConfig: jest.fn(() => Promise.resolve({})),
  },
}));

jest.mock('@/lib/store', () => ({
  useStore: jest.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useApi', () => {
  let wrapper: ReturnType<typeof createWrapper>;
  const { apiService } = require('@/services/api-service');

  beforeEach(() => {
    jest.clearAllMocks();
    wrapper = createWrapper();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useApi(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.models).toBeDefined();
    expect(result.current.metrics).toBeDefined();
    expect(result.current.logs).toBeDefined();
    expect(result.current.config).toBeDefined();
    expect(result.current.queryClient).toBeDefined();
  });

  it('should have queryClient available', () => {
    const { result } = renderHook(() => useApi(), { wrapper });

    expect(result.current.queryClient).toBeInstanceOf(QueryClient);
  });

  it('should return models query object', () => {
    const { result } = renderHook(() => useApi(), { wrapper });

    expect(result.current.models).toHaveProperty('data');
    expect(result.current.models).toHaveProperty('isLoading');
    expect(result.current.models).toHaveProperty('isError');
    expect(result.current.models).toHaveProperty('error');
  });

  it('should return metrics query object', () => {
    const { result } = renderHook(() => useApi(), { wrapper });

    expect(result.current.metrics).toHaveProperty('data');
    expect(result.current.metrics).toHaveProperty('isLoading');
    expect(result.current.metrics).toHaveProperty('isError');
    expect(result.current.metrics).toHaveProperty('error');
  });

  it('should return logs query object', () => {
    const { result } = renderHook(() => useApi(), { wrapper });

    expect(result.current.logs).toHaveProperty('data');
    expect(result.current.logs).toHaveProperty('isLoading');
    expect(result.current.logs).toHaveProperty('isError');
    expect(result.current.logs).toHaveProperty('error');
  });

  it('should return config query object', () => {
    const { result } = renderHook(() => useApi(), { wrapper });

    expect(result.current.config).toHaveProperty('data');
    expect(result.current.config).toHaveProperty('isLoading');
    expect(result.current.config).toHaveProperty('isError');
    expect(result.current.config).toHaveProperty('error');
  });

  it('should call apiService.getModels for models query', async () => {
    renderHook(() => useApi(), { wrapper });

    await waitFor(() => {
      expect(apiService.getModels).toHaveBeenCalled();
    });
  });

  it('should call apiService.getMetrics for metrics query', async () => {
    renderHook(() => useApi(), { wrapper });

    await waitFor(() => {
      expect(apiService.getMetrics).toHaveBeenCalled();
    });
  });

  it('should call apiService.getLogs with limit for logs query', async () => {
    renderHook(() => useApi(), { wrapper });

    await waitFor(() => {
      expect(apiService.getLogs).toHaveBeenCalledWith({ limit: 50 });
    });
  });

  it('should call apiService.getConfig for config query', async () => {
    renderHook(() => useApi(), { wrapper });

    await waitFor(() => {
      expect(apiService.getConfig).toHaveBeenCalled();
    });
  });

  it('should handle models query loading state', async () => {
    apiService.getModels.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
    );

    const { result } = renderHook(() => useApi(), { wrapper });

    expect(result.current.models.isLoading).toBe(true);

    await waitFor(() => expect(result.current.models.isLoading).toBe(false));
  });

  it('should handle models query error state', async () => {
    apiService.getModels.mockRejectedValue(new Error('Failed to fetch'));

    const { result } = renderHook(() => useApi(), { wrapper });

    await waitFor(() => expect(result.current.models.isError).toBe(true));
    expect(result.current.models.error).toBeDefined();
  });

  it('should handle metrics query loading state', async () => {
    apiService.getMetrics.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({}), 100))
    );

    const { result } = renderHook(() => useApi(), { wrapper });

    expect(result.current.metrics.isLoading).toBe(true);

    await waitFor(() => expect(result.current.metrics.isLoading).toBe(false));
  });

  it('should handle metrics query error state', async () => {
    apiService.getMetrics.mockRejectedValue(new Error('Failed to fetch'));

    const { result } = renderHook(() => useApi(), { wrapper });

    await waitFor(() => expect(result.current.metrics.isError).toBe(true));
    expect(result.current.metrics.error).toBeDefined();
  });

  it('should handle logs query loading state', async () => {
    apiService.getLogs.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
    );

    const { result } = renderHook(() => useApi(), { wrapper });

    expect(result.current.logs.isLoading).toBe(true);

    await waitFor(() => expect(result.current.logs.isLoading).toBe(false));
  });

  it('should handle logs query error state', async () => {
    apiService.getLogs.mockRejectedValue(new Error('Failed to fetch'));

    const { result } = renderHook(() => useApi(), { wrapper });

    await waitFor(() => expect(result.current.logs.isError).toBe(true));
    expect(result.current.logs.error).toBeDefined();
  });

  it('should handle config query loading state', async () => {
    apiService.getConfig.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({}), 100))
    );

    const { result } = renderHook(() => useApi(), { wrapper });

    expect(result.current.config.isLoading).toBe(true);

    await waitFor(() => expect(result.current.config.isLoading).toBe(false));
  });

  it('should handle config query error state', async () => {
    apiService.getConfig.mockRejectedValue(new Error('Failed to fetch'));

    const { result } = renderHook(() => useApi(), { wrapper });

    await waitFor(() => expect(result.current.config.isError).toBe(true));
    expect(result.current.config.error).toBeDefined();
  });

  it('should allow manual refetch via queryClient', async () => {
    // Mock implementation that returns different values on successive calls
    let callCount = 0;
    apiService.getModels.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve([{ id: '1', name: 'Model 1' }]);
      } else {
        return Promise.resolve([{ id: '2', name: 'Model 2' }]);
      }
    });

    const { result } = renderHook(() => useApi(), { wrapper });

    await waitFor(() => expect(result.current.models.isSuccess).toBe(true));
    expect(result.current.models.data).toEqual([{ id: '1', name: 'Model 1' }]);

    await act(async () => {
      await result.current.queryClient.refetchQueries({ queryKey: ['models'] });
    });

    await waitFor(() =>
      expect(result.current.models.data).toEqual([{ id: '2', name: 'Model 2' }])
    );
  });

  it('should not create multiple query clients on re-renders', () => {
    const { result, rerender } = renderHook(() => useApi(), { wrapper });

    const firstQueryClient = result.current.queryClient;

    rerender();

    expect(result.current.queryClient).toBe(firstQueryClient);
  });

  it('should have correct refetch intervals based on data type', async () => {
    apiService.getModels.mockResolvedValue([]);
    apiService.getMetrics.mockResolvedValue({});
    apiService.getLogs.mockResolvedValue([]);

    const { result } = renderHook(() => useApi(), { wrapper });

    await waitFor(() => {
      // In React Query v5, refetchInterval is not directly exposed on the result
      // Instead, we verify the queries are configured correctly by checking they fetch data
      expect(result.current.models.isSuccess).toBe(true);
      expect(result.current.metrics.isSuccess).toBe(true);
      expect(result.current.logs.isSuccess).toBe(true);
    });

    // Verify the queries have the correct configuration by checking the queryClient
    const modelsQuery = result.current.queryClient.getQueryCache().find({ queryKey: ['models'] });
    const metricsQuery = result.current.queryClient.getQueryCache().find({ queryKey: ['metrics'] });
    const logsQuery = result.current.queryClient.getQueryCache().find({ queryKey: ['logs'] });

    expect(modelsQuery?.observers[0]?.options.refetchInterval).toBe(30000);
    expect(metricsQuery?.observers[0]?.options.refetchInterval).toBe(10000);
    expect(logsQuery?.observers[0]?.options.refetchInterval).toBe(15000);
  });

  it('should not have refetchInterval for config query', async () => {
    apiService.getConfig.mockResolvedValue({});

    const { result } = renderHook(() => useApi(), { wrapper });

    await waitFor(() => {
      expect(result.current.config.isSuccess).toBe(true);
    });

    // Verify the config query has no refetchInterval
    const configQuery = result.current.queryClient.getQueryCache().find({ queryKey: ['config'] });
    expect(configQuery?.observers[0]?.options.refetchInterval).toBeUndefined();
  });
});
