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
import { runApiCachingScenarios } from './scenarios/api-caching.scenarios';
import { runApiErrorScenarios } from './scenarios/api-error.scenarios';
import { runApiRaceScenarios } from './scenarios/api-race.scenarios';

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

  describe('Loading States', () => {
    it('should be in loading state initially for all queries', () => {
      const pending = () => new Promise(() => {});
      mockedApiService.getModels.mockImplementation(pending as any);
      mockedApiService.getMetrics.mockImplementation(pending as any);
      mockedApiService.getLogs.mockImplementation(pending as any);
      mockedApiService.getConfig.mockImplementation(pending as any);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });
      expect(result.current.models.isLoading).toBe(true);
      expect(result.current.metrics.isLoading).toBe(true);
      expect(result.current.logs.isLoading).toBe(true);
      expect(result.current.config.isLoading).toBe(true);
    });

    it('should transition from loading to success', async () => {
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
      const error = new Error('Failed');
      mockedApiService.getModels.mockRejectedValue(error);
      mockedApiService.getMetrics.mockRejectedValue(error);
      mockedApiService.getLogs.mockRejectedValue(error);
      mockedApiService.getConfig.mockRejectedValue(error);

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

  describe('Edge Case Scenarios', () => {
    const mockStd = () => {
      mockedApiService.getMetrics.mockResolvedValue({} as any);
      mockedApiService.getLogs.mockResolvedValue([]);
      mockedApiService.getConfig.mockResolvedValue({} as any);
    };

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
      const circularData: any = {
        id: '1',
        name: 'Model 1',
        type: 'llama',
        parameters: {},
        status: 'running',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      circularData.self = circularData;
      mockedApiService.getModels.mockResolvedValue([circularData]);
      mockStd();

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.models.isSuccess).toBe(true));
    });

    it('should handle responses with special characters', async () => {
      const specialData = [
        {
          id: '<script>alert("xss")</script>',
          name: 'Model with "quotes" & <tags>',
          type: 'llama' as const,
          parameters: {},
          status: 'running' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      mockedApiService.getModels.mockResolvedValue(specialData);
      mockStd();

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.models.data).toEqual(specialData));
    });

    it('should handle responses with unicode characters', async () => {
      const unicodeData = [
        {
          id: '1',
          name: '模型 🚀 测试',
          type: 'llama' as const,
          parameters: {},
          status: 'running' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      mockedApiService.getModels.mockResolvedValue(unicodeData);
      mockStd();

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.models.data).toEqual(unicodeData));
    });
  });

  runApiErrorScenarios(mockedApiService, createWrapper);
  runApiRaceScenarios(mockedApiService, createWrapper);
  runApiCachingScenarios(mockedApiService, createWrapper);
});
