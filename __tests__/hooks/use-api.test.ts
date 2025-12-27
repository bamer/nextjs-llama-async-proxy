import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, useQuery, useMutation, QueryCache } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import fetchMock from 'jest-fetch-mock';

jest.mock('@/utils/api-client');
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  QueryClient: jest.fn(),
}));

import { apiClient } from '@/utils/api-client';
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
const mockQueryClient = QueryClient as jest.MockedClass<typeof QueryClient>;

jest.mocked('@tanstack/react-query', () => ({
  useQuery: mockUseQuery,
  useMutation: mockUseMutation,
  QueryClient: jest.fn().mockImplementation(() => ({
    getQueryData: jest.fn(),
    setQueryData: jest.fn(),
    getMutationCache: jest.fn(),
    getQueryCache: jest.fn().mockReturnValue(new QueryCache()),
  })),
}));

const createMockQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
};

describe('use-api hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.enableMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fetchMock.disableMocks();
  });

  describe('useQuery', () => {
    it('should call queryFn and return data', async () => {
      const queryFn = jest.fn().mockResolvedValue({ data: 'test' });

      const { result } = renderHook(() => useQuery({
        queryKey: ['test'],
        queryFn,
      }));

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toEqual({ data: 'test' });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(true);
    });

    it('should return loading state initially', () => {
      const queryFn = jest.fn();
      const { result } = renderHook(() => useQuery({
        queryKey: ['test'],
        queryFn,
      }));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isSuccess).toBe(false);
    });

    it('should return error state on failure', async () => {
      const queryFn = jest.fn().mockRejectedValue(new Error('API error'));

      const { result } = renderHook(() => useQuery({
        queryKey: ['test'],
        queryFn,
      }));

      await waitFor(() => result.current.isError);

      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeDefined();
      expect(result.current.isSuccess).toBe(false);
    });

    it('should support enabled option', async () => {
      const queryFn = jest.fn().mockResolvedValue({ data: 'test' });

      const { result } = renderHook(() => useQuery({
        queryKey: ['test'],
        queryFn,
        enabled: false,
      }));

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(queryFn).not.toHaveBeenCalled();
      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should respect refetchInterval', async () => {
      const queryFn = jest.fn().mockResolvedValue({ data: 'test' });

      const { result } = renderHook(() => useQuery({
        queryKey: ['test'],
        queryFn,
        refetchInterval: 5000,
      }));

      await waitFor(() => result.current.isSuccess);

      expect(queryFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('useMutation', () => {
    it('should call mutationFn and return data', async () => {
      const mutationFn = jest.fn().mockResolvedValue({ success: true });

      const { result } = renderHook(() => useMutation({
        mutationFn,
      }));

      await act(async () => {
        await result.current.mutate({ test: 'data' });
      });

      expect(result.current.data).toEqual({ success: true });
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('should return loading state during mutation', async () => {
      const mutationFn = jest.fn();
      const { result } = renderHook(() => useMutation({
        mutationFn,
      }));

      expect(result.current.isLoading).toBe(true);
    });

    it('should return error state on mutation failure', async () => {
      const mutationFn = jest.fn().mockRejectedValue(new Error('Mutation failed'));

      const { result } = renderHook(() => useMutation({
        mutationFn,
      }));

      await act(async () => {
        try {
          await result.current.mutate({ test: 'data' });
        } catch {}
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.isSuccess).toBe(false);
    });

    it('should call onSuccess callback', async () => {
      const onSuccess = jest.fn();
      const mutationFn = jest.fn().mockResolvedValue({ success: true });

      const { result } = renderHook(() => useMutation({
        mutationFn,
        onSuccess,
      }));

      await act(async () => {
        await result.current.mutate({ test: 'data' });
      });

      expect(onSuccess).toHaveBeenCalledWith({ success: true });
    });

    it('should call onError callback', async () => {
      const onError = jest.fn();
      const mutationFn = jest.fn().mockRejectedValue(new Error('Mutation failed'));

      const { result } = renderHook(() => useMutation({
        mutationFn,
        onError,
      }));

      await act(async () => {
        try {
          await result.current.mutate({ test: 'data' });
        } catch {}
      });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('query invalidation', () => {
    it('should invalidate queries', async () => {
      const queryClient = createMockQueryClient();
      const queryCache = {
        find: jest.fn().mockReturnValue(undefined),
        all: jest.fn().mockReturnValue([]),
      };

      mockQueryClient.getQueryCache.mockReturnValue(queryCache);

      const { result } = renderHook(() => useQuery({
        queryKey: ['test'],
        queryClient,
      }));

      result.current.invalidateQueries();

      expect(queryCache.all).toHaveBeenCalled();
    });
  });

  describe('selectors', () => {
    it('should filter query results', async () => {
      const queryFn = jest.fn().mockResolvedValue([
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ]);

      const { result } = renderHook(() => useQuery({
        queryKey: ['test'],
        queryFn,
        select: (data: any[]) => data.filter((item: any) => item.id % 2 === 0),
      }));

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toEqual([
        { id: 1, name: 'Item 1' },
        { id: 3, name: 'Item 3' },
      ]);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      fetchMock.mockReject(new Error('Network error'));

      const queryFn = jest.fn();

      const { result } = renderHook(() => useQuery({
        queryKey: ['test'],
        queryFn,
      }));

      await waitFor(() => result.current.isError);

      expect(result.current.error).toBeDefined();
    });

    it('should retry when enabled', async () => {
      fetchMock.mockRejectOnce(new Error('Network error'))
                           .mockResolvedValueOnce({ data: 'test' });

      const queryFn = jest.fn();

      const { result } = renderHook(() => useQuery({
        queryKey: ['test'],
        queryFn,
        retry: 2,
      }));

      await waitFor(() => result.current.isSuccess);

      expect(queryFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('caching', () => {
    it('should use cached data on subsequent calls', async () => {
      const queryFn = jest.fn();

      const { result: result1 } = renderHook(() => useQuery({
        queryKey: ['test'],
        queryFn,
      }));

      await waitFor(() => result1.current.isSuccess);
      jest.clearAllMocks();

      const { result: result2 } = renderHook(() => useQuery({
        queryKey: ['test'],
        queryFn,
      }));

      expect(queryFn).toHaveBeenCalledTimes(1);
    });

    it('should cache across hook instances', () => {
      const queryFn = jest.fn().mockResolvedValue({ data: 'test' });

      const { result1 } = renderHook(() => useQuery({
        queryKey: ['test'],
        queryFn,
      }));

      const { result2 } = renderHook(() => useQuery({
        queryKey: ['test'],
        queryFn,
      }));

      await waitFor(() => result1.current.isSuccess && result2.current.isSuccess);

      expect(queryFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('type safety', () => {
    it('should infer data type from queryFn', () => {
      interface TestData {
        id: number;
        name: string;
      }

      const queryFn = jest.fn().mockResolvedValue<TestData[]>([
        { id: 1, name: 'Test 1' },
      ]);

      const { result } = renderHook(() => useQuery({
        queryKey: ['test'],
        queryFn,
      }));

      await waitFor(() => result.current.isSuccess);

      expect(typeof result.current.data).toBe('object');
      expect(Array.isArray(result.current.data)).toBe(true);
    });

    it('should infer mutation result type', () => {
      interface MutationResult {
        success: boolean;
      }

      const mutationFn = jest.fn().mockResolvedValue<MutationResult>({ success: true });

      const { result } = renderHook(() => useMutation({
        mutationFn,
      }));

      await act(async () => {
        await result.current.mutate({});
      });

      expect(result.current.data).toBeDefined();
      expect(typeof result.current.data.success).toBe('boolean');
    });
  });
});
