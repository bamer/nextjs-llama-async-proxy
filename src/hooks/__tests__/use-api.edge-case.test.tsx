/**
 * Comprehensive edge case tests for useApi hook
 * Testing for null/undefined inputs, error states, loading states,
 * concurrent calls, cleanup on unmount, memory leaks, and edge cases
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useApi } from '../use-api';
import * as apiServiceModule from '@/services/api-service';

// Mock the apiService
jest.mock('@/services/api-service', () => ({
  apiService: {
    getModels: jest.fn(),
    getMetrics: jest.fn(),
    getLogs: jest.fn(),
    getConfig: jest.fn(),
  },
}));

const mockedApiService = apiServiceModule.apiService as jest.Mocked<typeof apiServiceModule.apiService>;

describe('useApi - Edge Cases', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Create a new query client for each test to avoid state leakage
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    });

    jest.clearAllMocks();
  });

  const createWrapper = () => {
    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  describe('Null/Undefined Handling', () => {
    it('should handle null response from getModels', async () => {
      mockedApiService.getModels.mockResolvedValue(null as any);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.models.data).toBeNull();
        expect(result.current.models.isSuccess).toBe(true);
      });
    });

    it('should handle undefined response from getMetrics', async () => {
      mockedApiService.getMetrics.mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.metrics.data).toBeUndefined();
        expect(result.current.metrics.isSuccess).toBe(true);
      });
    });

    it('should handle empty array response from getLogs', async () => {
      mockedApiService.getLogs.mockResolvedValue([]);
      mockedApiService.getModels.mockResolvedValue([]);
      mockedApiService.getMetrics.mockResolvedValue({} as any);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.logs.data).toEqual([]);
      });
    });

    it('should handle empty object response from getConfig', async () => {
      mockedApiService.getConfig.mockResolvedValue({} as any);
      mockedApiService.getModels.mockResolvedValue([]);
      mockedApiService.getMetrics.mockResolvedValue({} as any);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.config.data).toEqual({});
      });
    });
  });

  describe('Error States', () => {
    it('should handle network errors from getModels', async () => {
      const error = new Error('Network error');
      mockedApiService.getModels.mockRejectedValue(error);
      mockedApiService.getMetrics.mockResolvedValue({} as any);
      mockedApiService.getLogs.mockResolvedValue([]);
      mockedApiService.getConfig.mockResolvedValue({} as any);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.models.isError).toBe(true);
        expect(result.current.models.error).toEqual(error);
      });
    });

    it('should handle timeout errors from getMetrics', async () => {
      const error = new Error('Request timeout');
      mockedApiService.getMetrics.mockRejectedValue(error);
      mockedApiService.getModels.mockResolvedValue([]);
      mockedApiService.getLogs.mockResolvedValue([]);
      mockedApiService.getConfig.mockResolvedValue({} as any);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.metrics.isError).toBe(true);
        expect(result.current.metrics.error).toEqual(error);
      });
    });

    it('should handle API errors with status codes from getLogs', async () => {
      const error = { response: { status: 500, data: { message: 'Internal server error' } } };
      mockedApiService.getLogs.mockRejectedValue(error);
      mockedApiService.getModels.mockResolvedValue([]);
      mockedApiService.getMetrics.mockResolvedValue({} as any);
      mockedApiService.getConfig.mockResolvedValue({} as any);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.logs.isError).toBe(true);
      });
    });

    it('should handle malformed JSON response from getConfig', async () => {
      const error = new SyntaxError('Unexpected token < in JSON');
      mockedApiService.getConfig.mockRejectedValue(error);
      mockedApiService.getModels.mockResolvedValue([]);
      mockedApiService.getMetrics.mockResolvedValue({} as any);
      mockedApiService.getLogs.mockResolvedValue([]);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.config.isError).toBe(true);
      });
    });

    it('should handle multiple concurrent errors', async () => {
      const modelError = new Error('Models failed');
      const metricsError = new Error('Metrics failed');
      const logsError = new Error('Logs failed');
      const configError = new Error('Config failed');

      mockedApiService.getModels.mockRejectedValue(modelError);
      mockedApiService.getMetrics.mockRejectedValue(metricsError);
      mockedApiService.getLogs.mockRejectedValue(logsError);
      mockedApiService.getConfig.mockRejectedValue(configError);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.models.isError).toBe(true);
        expect(result.current.metrics.isError).toBe(true);
        expect(result.current.logs.isError).toBe(true);
        expect(result.current.config.isError).toBe(true);
      });
    });
  });

  describe('Loading States', () => {
    it('should be in loading state initially for all queries', () => {
      mockedApiService.getModels.mockImplementation(() => new Promise(() => {}));
      mockedApiService.getMetrics.mockImplementation(() => new Promise(() => {}));
      mockedApiService.getLogs.mockImplementation(() => new Promise(() => {}));
      mockedApiService.getConfig.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      expect(result.current.models.isLoading).toBe(true);
      expect(result.current.metrics.isLoading).toBe(true);
      expect(result.current.logs.isLoading).toBe(true);
      expect(result.current.config.isLoading).toBe(true);
    });

    it('should transition from loading to success', async () => {
      mockedApiService.getModels.mockResolvedValue([{ id: '1', name: 'Model 1' }]);
      mockedApiService.getMetrics.mockResolvedValue({ cpu: 50 } as any);
      mockedApiService.getLogs.mockResolvedValue([]);
      mockedApiService.getConfig.mockResolvedValue({ theme: 'dark' } as any);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.models.isLoading).toBe(false);
        expect(result.current.metrics.isLoading).toBe(false);
        expect(result.current.logs.isLoading).toBe(false);
        expect(result.current.config.isLoading).toBe(false);
      });
    });

    it('should transition from loading to error', async () => {
      mockedApiService.getModels.mockRejectedValue(new Error('Failed'));
      mockedApiService.getMetrics.mockRejectedValue(new Error('Failed'));
      mockedApiService.getLogs.mockRejectedValue(new Error('Failed'));
      mockedApiService.getConfig.mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.models.isLoading).toBe(false);
        expect(result.current.metrics.isLoading).toBe(false);
        expect(result.current.logs.isLoading).toBe(false);
        expect(result.current.config.isLoading).toBe(false);

        expect(result.current.models.isError).toBe(true);
        expect(result.current.metrics.isError).toBe(true);
        expect(result.current.logs.isError).toBe(true);
        expect(result.current.config.isError).toBe(true);
      });
    });
  });

  describe('Concurrent Calls', () => {
    it('should handle multiple simultaneous component renders', async () => {
      mockedApiService.getModels.mockResolvedValue([{ id: '1' }]);
      mockedApiService.getMetrics.mockResolvedValue({ cpu: 50 } as any);
      mockedApiService.getLogs.mockResolvedValue([]);
      mockedApiService.getConfig.mockResolvedValue({} as any);

      // Simulate multiple components using the hook
      const { result: result1 } = renderHook(() => useApi(), { wrapper: createWrapper() });
      const { result: result2 } = renderHook(() => useApi(), { wrapper: createWrapper() });
      const { result: result3 } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result1.current.models.isSuccess).toBe(true);
        expect(result2.current.models.isSuccess).toBe(true);
        expect(result3.current.models.isSuccess).toBe(true);
      });

      // Should only make one request per query due to query caching
      expect(mockedApiService.getModels).toHaveBeenCalledTimes(1);
      expect(mockedApiService.getMetrics).toHaveBeenCalledTimes(1);
      expect(mockedApiService.getLogs).toHaveBeenCalledTimes(1);
      expect(mockedApiService.getConfig).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid refetch calls', async () => {
      mockedApiService.getModels.mockResolvedValue([{ id: '1' }]);
      mockedApiService.getMetrics.mockResolvedValue({ cpu: 50 } as any);
      mockedApiService.getLogs.mockResolvedValue([]);
      mockedApiService.getConfig.mockResolvedValue({} as any);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.models.isSuccess).toBe(true);
      });

      // Rapidly trigger refetches
      for (let i = 0; i < 10; i++) {
        queryClient.refetchQueries({ queryKey: ['models'] });
      }

      await waitFor(() => {
        expect(mockedApiService.getModels.mock.calls.length).toBeGreaterThan(1);
      });
    });
  });

  describe('Cleanup on Unmount', () => {
    it('should cleanup queries on unmount', () => {
      mockedApiService.getModels.mockImplementation(() => new Promise(() => {}));
      mockedApiService.getMetrics.mockImplementation(() => new Promise(() => {}));
      mockedApiService.getLogs.mockImplementation(() => new Promise(() => {}));
      mockedApiService.getConfig.mockImplementation(() => new Promise(() => {}));

      const { unmount } = renderHook(() => useApi(), { wrapper: createWrapper() });

      unmount();

      // After unmount, queries should be cancelled
      expect(queryClient.isFetching()).toBe(0);
    });
  });

  describe('Memory Leaks', () => {
    it('should not leak memory with frequent remounts', async () => {
      mockedApiService.getModels.mockResolvedValue([{ id: '1' }]);
      mockedApiService.getMetrics.mockResolvedValue({ cpu: 50 } as any);
      mockedApiService.getLogs.mockResolvedValue([]);
      mockedApiService.getConfig.mockResolvedValue({} as any);

      // Mount and unmount multiple times
      for (let i = 0; i < 100; i++) {
        const { unmount } = renderHook(() => useApi(), { wrapper: createWrapper() });
        const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });
        await waitFor(() => {
          expect(result.current.models.isSuccess).toBe(true);
        });
        unmount();
      }

      // Should not have memory issues - query cache should be managed properly
      expect(queryClient.getQueryCache().getAll().length).toBeLessThan(10);
    });

    it('should handle large datasets without memory issues', async () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        id: `model-${i}`,
        name: `Model ${i}`,
      }));

      mockedApiService.getModels.mockResolvedValue(largeData);
      mockedApiService.getMetrics.mockResolvedValue({} as any);
      mockedApiService.getLogs.mockResolvedValue([]);
      mockedApiService.getConfig.mockResolvedValue({} as any);

      const { result, unmount } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.models.data).toHaveLength(10000);
      });

      unmount();

      // Memory should be cleaned up
      const cachedData = queryClient.getQueryData(['models']);
      expect(cachedData).toBeUndefined();
    });
  });

  describe('Refetch Intervals', () => {
    it('should refetch models every 30 seconds', async () => {
      jest.useFakeTimers();

      mockedApiService.getModels.mockResolvedValue([{ id: '1' }]);
      mockedApiService.getMetrics.mockResolvedValue({} as any);
      mockedApiService.getLogs.mockResolvedValue([]);
      mockedApiService.getConfig.mockResolvedValue({} as any);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.models.isSuccess).toBe(true);
      });

      const initialCallCount = mockedApiService.getModels.mock.calls.length;

      // Fast-forward 30 seconds
      jest.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(mockedApiService.getModels.mock.calls.length).toBe(initialCallCount + 1);
      });

      jest.useRealTimers();
    });

    it('should refetch metrics every 10 seconds', async () => {
      jest.useFakeTimers();

      mockedApiService.getModels.mockResolvedValue([]);
      mockedApiService.getMetrics.mockResolvedValue({ cpu: 50 } as any);
      mockedApiService.getLogs.mockResolvedValue([]);
      mockedApiService.getConfig.mockResolvedValue({} as any);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.metrics.isSuccess).toBe(true);
      });

      const initialCallCount = mockedApiService.getMetrics.mock.calls.length;

      // Fast-forward 10 seconds
      jest.advanceTimersByTime(10000);

      await waitFor(() => {
        expect(mockedApiService.getMetrics.mock.calls.length).toBe(initialCallCount + 1);
      });

      jest.useRealTimers();
    });

    it('should refetch logs every 15 seconds', async () => {
      jest.useFakeTimers();

      mockedApiService.getModels.mockResolvedValue([]);
      mockedApiService.getMetrics.mockResolvedValue({} as any);
      mockedApiService.getLogs.mockResolvedValue([]);
      mockedApiService.getConfig.mockResolvedValue({} as any);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.logs.isSuccess).toBe(true);
      });

      const initialCallCount = mockedApiService.getLogs.mock.calls.length;

      // Fast-forward 15 seconds
      jest.advanceTimersByTime(15000);

      await waitFor(() => {
        expect(mockedApiService.getLogs.mock.calls.length).toBe(initialCallCount + 1);
      });

      jest.useRealTimers();
    });
  });

  describe('Query Client Access', () => {
    it('should provide access to queryClient', () => {
      mockedApiService.getModels.mockResolvedValue([]);
      mockedApiService.getMetrics.mockResolvedValue({} as any);
      mockedApiService.getLogs.mockResolvedValue([]);
      mockedApiService.getConfig.mockResolvedValue({} as any);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      expect(result.current.queryClient).toBeDefined();
      expect(result.current.queryClient).toBeInstanceOf(QueryClient);
    });

    it('should allow manual invalidation through queryClient', async () => {
      mockedApiService.getModels.mockResolvedValue([{ id: '1' }]);
      mockedApiService.getMetrics.mockResolvedValue({} as any);
      mockedApiService.getLogs.mockResolvedValue([]);
      mockedApiService.getConfig.mockResolvedValue({} as any);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.models.isSuccess).toBe(true);
      });

      // Manually invalidate
      result.current.queryClient.invalidateQueries({ queryKey: ['models'] });

      await waitFor(() => {
        expect(mockedApiService.getModels.mock.calls.length).toBe(2);
      });
    });
  });

  describe('Edge Case Scenarios', () => {
    it('should handle partial success - some queries fail', async () => {
      mockedApiService.getModels.mockRejectedValue(new Error('Models failed'));
      mockedApiService.getMetrics.mockResolvedValue({ cpu: 50 } as any);
      mockedApiService.getLogs.mockRejectedValue(new Error('Logs failed'));
      mockedApiService.getConfig.mockResolvedValue({ theme: 'dark' } as any);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.models.isError).toBe(true);
        expect(result.current.metrics.isSuccess).toBe(true);
        expect(result.current.logs.isError).toBe(true);
        expect(result.current.config.isSuccess).toBe(true);
      });
    });

    it('should handle extremely slow network responses', async () => {
      mockedApiService.getModels.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([{ id: '1' }]), 5000))
      );
      mockedApiService.getMetrics.mockResolvedValue({} as any);
      mockedApiService.getLogs.mockResolvedValue([]);
      mockedApiService.getConfig.mockResolvedValue({} as any);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      // Should still be loading after 1 second
      await new Promise((resolve) => setTimeout(resolve, 1000));
      expect(result.current.models.isLoading).toBe(true);

      // Should eventually succeed
      await waitFor(
        () => {
          expect(result.current.models.isSuccess).toBe(true);
        },
        { timeout: 6000 }
      );
    });

    it('should handle responses with null fields', async () => {
      mockedApiService.getModels.mockResolvedValue([{ id: null, name: null }] as any);
      mockedApiService.getMetrics.mockResolvedValue({ cpu: null, memory: null } as any);
      mockedApiService.getLogs.mockResolvedValue([null, null] as any);
      mockedApiService.getConfig.mockResolvedValue({ theme: null } as any);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.models.isSuccess).toBe(true);
        expect(result.current.metrics.isSuccess).toBe(true);
        expect(result.current.logs.isSuccess).toBe(true);
        expect(result.current.config.isSuccess).toBe(true);
      });
    });

    it('should handle responses with circular references', async () => {
      const circularData: any = { id: '1' };
      circularData.self = circularData;

      mockedApiService.getModels.mockResolvedValue([circularData]);
      mockedApiService.getMetrics.mockResolvedValue({} as any);
      mockedApiService.getLogs.mockResolvedValue([]);
      mockedApiService.getConfig.mockResolvedValue({} as any);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.models.isSuccess).toBe(true);
      });
    });

    it('should handle responses with special characters', async () => {
      const specialData = [
        { id: '<script>alert("xss")</script>', name: 'Model with "quotes" & <tags>' },
      ];

      mockedApiService.getModels.mockResolvedValue(specialData);
      mockedApiService.getMetrics.mockResolvedValue({} as any);
      mockedApiService.getLogs.mockResolvedValue([]);
      mockedApiService.getConfig.mockResolvedValue({} as any);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.models.data).toEqual(specialData);
      });
    });

    it('should handle responses with unicode characters', async () => {
      const unicodeData = [{ id: '1', name: '模型 🚀 测试' }];

      mockedApiService.getModels.mockResolvedValue(unicodeData);
      mockedApiService.getMetrics.mockResolvedValue({} as any);
      mockedApiService.getLogs.mockResolvedValue([]);
      mockedApiService.getConfig.mockResolvedValue({} as any);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.models.data).toEqual(unicodeData);
      });
    });

    it('should handle responses with very long strings', async () => {
      const longString = 'a'.repeat(1000000);
      const longData = [{ id: '1', description: longString }];

      mockedApiService.getModels.mockResolvedValue(longData);
      mockedApiService.getMetrics.mockResolvedValue({} as any);
      mockedApiService.getLogs.mockResolvedValue([]);
      mockedApiService.getConfig.mockResolvedValue({} as any);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.models.data![0].description).toBe(longString);
      });
    });
  });
});
