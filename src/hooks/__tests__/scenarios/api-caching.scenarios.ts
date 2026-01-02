/**
 * API caching test scenarios
 * Tests for refetch intervals, query client access, and caching behavior
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useApi } from '../../use-api';
import * as apiServiceModule from '@/services/api-service';

export function runApiCachingScenarios(
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
    mockedApiService.getMetrics.mockResolvedValue({} as any);
    mockedApiService.getLogs.mockResolvedValue([]);
    mockedApiService.getConfig.mockResolvedValue({} as any);
  };

  describe('Refetch Intervals', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('should refetch models every 30 seconds', async () => {
      jest.useFakeTimers();
      mockSuccessResponses();

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.models.isSuccess).toBe(true));

      const initialCallCount = mockedApiService.getModels.mock.calls.length;
      jest.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(mockedApiService.getModels.mock.calls.length).toBe(initialCallCount + 1);
      });
    });

    it('should refetch metrics every 10 seconds', async () => {
      jest.useFakeTimers();
      mockSuccessResponses();

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.metrics.isSuccess).toBe(true));

      const initialCallCount = mockedApiService.getMetrics.mock.calls.length;
      jest.advanceTimersByTime(10000);

      await waitFor(() => {
        expect(mockedApiService.getMetrics.mock.calls.length).toBe(initialCallCount + 1);
      });
    });

    it('should refetch logs every 15 seconds', async () => {
      jest.useFakeTimers();
      mockSuccessResponses();

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.logs.isSuccess).toBe(true));

      const initialCallCount = mockedApiService.getLogs.mock.calls.length;
      jest.advanceTimersByTime(15000);

      await waitFor(() => {
        expect(mockedApiService.getLogs.mock.calls.length).toBe(initialCallCount + 1);
      });
    });
  });

  describe('Query Client Access', () => {
    it('should provide access to queryClient', () => {
      mockSuccessResponses();

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      expect(result.current.queryClient).toBeDefined();
    });

    it('should allow manual invalidation through queryClient', async () => {
      mockSuccessResponses();

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.models.isSuccess).toBe(true));

      result.current.queryClient.invalidateQueries({ queryKey: ['models'] });

      await waitFor(() => {
        expect(mockedApiService.getModels.mock.calls.length).toBe(2);
      });
    });
  });
}
