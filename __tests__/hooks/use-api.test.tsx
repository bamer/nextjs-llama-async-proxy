import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';

jest.mock('@/services/api-service');

jest.mock('@/lib/store', () => ({
  useStore: jest.fn(),
}));

const { apiService } = require('@/services/api-service');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useApi', () => {
  let wrapper: ReturnType<typeof createWrapper>;

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

  it('should set up models query with correct key', () => {
    const useQuerySpy = jest.spyOn(require('@tanstack/react-query'), 'useQuery');

    renderHook(() => useApi(), { wrapper });

    const lastCall = useQuerySpy.mock.calls[useQuerySpy.mock.calls.length - 4];
    expect(lastCall[0]).toHaveProperty('queryKey');
    expect(lastCall[0].queryKey).toEqual(['models']);

    useQuerySpy.mockRestore();
  });

  it('should set up metrics query with correct key', () => {
    const useQuerySpy = jest.spyOn(require('@tanstack/react-query'), 'useQuery');

    renderHook(() => useApi(), { wrapper });

    const lastCall = useQuerySpy.mock.calls[useQuerySpy.mock.calls.length - 3];
    expect(lastCall[0]).toHaveProperty('queryKey');
    expect(lastCall[0].queryKey).toEqual(['metrics']);

    useQuerySpy.mockRestore();
  });

  it('should set up logs query with correct key', () => {
    const useQuerySpy = jest.spyOn(require('@tanstack/react-query'), 'useQuery');

    renderHook(() => useApi(), { wrapper });

    const lastCall = useQuerySpy.mock.calls[useQuerySpy.mock.calls.length - 2];
    expect(lastCall[0]).toHaveProperty('queryKey');
    expect(lastCall[0].queryKey).toEqual(['logs']);

    useQuerySpy.mockRestore();
  });

  it('should set up config query with correct key', () => {
    const useQuerySpy = jest.spyOn(require('@tanstack/react-query'), 'useQuery');

    renderHook(() => useApi(), { wrapper });

    const lastCall = useQuerySpy.mock.calls[useQuerySpy.mock.calls.length - 1];
    expect(lastCall[0]).toHaveProperty('queryKey');
    expect(lastCall[0].queryKey).toEqual(['config']);

    useQuerySpy.mockRestore();
  });

  it('should call apiService.getModels for models query', () => {
    renderHook(() => useApi(), { wrapper });

    expect(apiService.getModels).toHaveBeenCalled();
  });

  it('should call apiService.getMetrics for metrics query', () => {
    renderHook(() => useApi(), { wrapper });

    expect(apiService.getMetrics).toHaveBeenCalled();
  });

  it('should call apiService.getLogs with limit for logs query', () => {
    renderHook(() => useApi(), { wrapper });

    expect(apiService.getLogs).toHaveBeenCalledWith({ limit: 50 });
  });

  it('should call apiService.getConfig for config query', () => {
    renderHook(() => useApi(), { wrapper });

    expect(apiService.getConfig).toHaveBeenCalled();
  });

  it('should set refetchInterval for models query', () => {
    const useQuerySpy = jest.spyOn(require('@tanstack/react-query'), 'useQuery');

    renderHook(() => useApi(), { wrapper });

    const lastCall = useQuerySpy.mock.calls[useQuerySpy.mock.calls.length - 4];
    expect(lastCall[0].refetchInterval).toBe(30000);

    useQuerySpy.mockRestore();
  });

  it('should set refetchInterval for metrics query', () => {
    const useQuerySpy = jest.spyOn(require('@tanstack/react-query'), 'useQuery');

    renderHook(() => useApi(), { wrapper });

    const lastCall = useQuerySpy.mock.calls[useQuerySpy.mock.calls.length - 3];
    expect(lastCall[0].refetchInterval).toBe(10000);

    useQuerySpy.mockRestore();
  });

  it('should set refetchInterval for logs query', () => {
    const useQuerySpy = jest.spyOn(require('@tanstack/react-query'), 'useQuery');

    renderHook(() => useApi(), { wrapper });

    const lastCall = useQuerySpy.mock.calls[useQuerySpy.mock.calls.length - 2];
    expect(lastCall[0].refetchInterval).toBe(15000);

    useQuerySpy.mockRestore();
  });

  it('should not set refetchInterval for config query', () => {
    const useQuerySpy = jest.spyOn(require('@tanstack/react-query'), 'useQuery');

    renderHook(() => useApi(), { wrapper });

    const lastCall = useQuerySpy.mock.calls[useQuerySpy.mock.calls.length - 1];
    expect(lastCall[0].refetchInterval).toBeUndefined();

    useQuerySpy.mockRestore();
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
    apiService.getModels.mockResolvedValue([{ id: '1', name: 'Model 1' }]);

    const { result } = renderHook(() => useApi(), { wrapper });

    await waitFor(() => expect(result.current.models.isSuccess).toBe(true));

    apiService.getModels.mockResolvedValue([{ id: '2', name: 'Model 2' }]);

    await act(async () => {
      await result.current.queryClient.refetchQueries({ queryKey: ['models'] });
    });

    await waitFor(() => expect(result.current.models.data).toEqual([{ id: '2', name: 'Model 2' }]));
  });

  it('should not create multiple query clients on re-renders', () => {
    const { result, rerender } = renderHook(() => useApi(), { wrapper });

    const firstQueryClient = result.current.queryClient;

    rerender();

    expect(result.current.queryClient).toBe(firstQueryClient);
  });

  it('should maintain consistent query keys across re-renders', () => {
    const { result, rerender } = renderHook(() => useApi(), { wrapper });

    const initialModelsKey = result.current.models.queryKey;
    const initialMetricsKey = result.current.metrics.queryKey;
    const initialLogsKey = result.current.logs.queryKey;
    const initialConfigKey = result.current.config.queryKey;

    rerender();

    expect(result.current.models.queryKey).toBe(initialModelsKey);
    expect(result.current.metrics.queryKey).toBe(initialMetricsKey);
    expect(result.current.logs.queryKey).toBe(initialLogsKey);
    expect(result.current.config.queryKey).toBe(initialConfigKey);
  });

  it('should have correct refetch intervals based on data type', () => {
    const { result } = renderHook(() => useApi(), { wrapper });

    expect(result.current.models.refetchInterval).toBe(30000);
    expect(result.current.metrics.refetchInterval).toBe(10000);
    expect(result.current.logs.refetchInterval).toBe(15000);
    expect(result.current.config.refetchInterval).toBeUndefined();
  });
});
