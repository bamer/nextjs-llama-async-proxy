/**
 * API race condition test scenarios
 * Tests for concurrent calls, cleanup, memory leaks, and race conditions
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useApi } from '../../use-api';
import * as apiServiceModule from '@/services/api-service';

export function runApiRaceScenarios(
  mockedApiService: jest.Mocked<typeof apiServiceModule.apiService>,
  createWrapper: () => ({ children }: any) => React.JSX.Element,
) {
  const mockSuccessResponses = () => {
    mockedApiService.getModels.mockResolvedValue([
      {
        id: '1',
        name: 'Model 1',
        type: 'llama',
        parameters: {},
        status: 'running',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
    mockedApiService.getMetrics.mockResolvedValue({ cpu: 50 } as any);
    mockedApiService.getLogs.mockResolvedValue([]);
    mockedApiService.getConfig.mockResolvedValue({} as any);
  };

  describe('Concurrent Calls', () => {
    it('should handle multiple simultaneous component renders', async () => {
      mockSuccessResponses();

      const { result: r1 } = renderHook(() => useApi(), { wrapper: createWrapper() });
      const { result: r2 } = renderHook(() => useApi(), { wrapper: createWrapper() });
      const { result: r3 } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(r1.current.models.isSuccess).toBe(true);
        expect(r2.current.models.isSuccess).toBe(true);
        expect(r3.current.models.isSuccess).toBe(true);
      });

      expect(mockedApiService.getModels).toHaveBeenCalledTimes(1);
      expect(mockedApiService.getMetrics).toHaveBeenCalledTimes(1);
      expect(mockedApiService.getLogs).toHaveBeenCalledTimes(1);
      expect(mockedApiService.getConfig).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid refetch calls', async () => {
      mockSuccessResponses();

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.models.isSuccess).toBe(true);
      });

      const { queryClient } = result.current;
      for (let i = 0; i < 10; i++) {
        queryClient.refetchQueries({ queryKey: ['models'] });
      }

      await waitFor(() => {
        expect(mockedApiService.getModels.mock.calls.length).toBeGreaterThan(1);
      });
    });

    it('should handle partial success - some queries fail', async () => {
      mockedApiService.getModels.mockRejectedValue(new Error('Models failed'));
      mockedApiService.getMetrics.mockResolvedValue({ cpu: 50 } as any);
      mockedApiService.getLogs.mockRejectedValue(new Error('Logs failed'));
      mockedApiService.getConfig.mockResolvedValue({ theme: 'dark' } as any);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.metrics.isSuccess).toBe(true);
        expect(result.current.config.isSuccess).toBe(true);
        expect(result.current.models.isError).toBe(true);
        expect(result.current.logs.isError).toBe(true);
      });
    });
  });

  describe('Cleanup on Unmount', () => {
    it('should cleanup queries on unmount', () => {
      const pending = () => new Promise(() => {});
      mockedApiService.getModels.mockImplementation(pending as any);
      mockedApiService.getMetrics.mockImplementation(pending as any);
      mockedApiService.getLogs.mockImplementation(pending as any);
      mockedApiService.getConfig.mockImplementation(pending as any);

      const { unmount, result } = renderHook(() => useApi(), { wrapper: createWrapper() });
      unmount();
      expect(result.current.queryClient.isFetching()).toBe(0);
    });
  });

  describe('Memory & Performance', () => {
    it('should not leak memory with frequent remounts', async () => {
      mockSuccessResponses();

      const { queryClient } = renderHook(() => useApi(), {
        wrapper: createWrapper(),
      }).result.current;

      for (let i = 0; i < 100; i++) {
        const { unmount } = renderHook(() => useApi(), { wrapper: createWrapper() });
        const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });
        await waitFor(() => expect(result.current.models.isSuccess).toBe(true));
        unmount();
      }

      expect(queryClient.getQueryCache().getAll().length).toBeLessThan(10);
    });

    it('should handle extremely slow network responses', async () => {
      const model = {
        id: '1',
        name: 'Model 1',
        type: 'llama',
        parameters: {},
        status: 'running',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockedApiService.getModels.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve([model]), 5000),
          ) as any,
      );
      mockedApiService.getMetrics.mockResolvedValue({} as any);
      mockedApiService.getLogs.mockResolvedValue([]);
      mockedApiService.getConfig.mockResolvedValue({} as any);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await new Promise((resolve) => setTimeout(resolve, 1000));
      expect(result.current.models.isLoading).toBe(true);

      await waitFor(() => expect(result.current.models.isSuccess).toBe(true), {
        timeout: 10000,
      });
    });
  });
}
