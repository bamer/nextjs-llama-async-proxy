import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';
import React from 'react';

jest.mock('@/services/api-service', () => ({
  apiService: {
    getModels: jest.fn(() => Promise.resolve([])),
    getMetrics: jest.fn(() => Promise.resolve({})),
    getLogs: jest.fn(() => Promise.resolve([])),
    getConfig: jest.fn(() => Promise.resolve({})),
  },
}));

describe('use-api', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
        },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: any) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  describe('useApi hook', () => {
    it('should return all query objects', async () => {
      const { result } = renderHook(() => useApi(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeDefined();
        expect(result.current.models).toBeDefined();
        expect(result.current.metrics).toBeDefined();
        expect(result.current.logs).toBeDefined();
        expect(result.current.config).toBeDefined();
        expect(result.current.queryClient).toBeDefined();
      });
    });

    it('should query models with correct key', async () => {
      const { result } = renderHook(() => useApi(), { wrapper });

      await waitFor(() => {
        const { apiService } = require('@/services/api-service');
        expect(apiService.getModels).toHaveBeenCalled();
      });
    });

    it('should query metrics with correct key', async () => {
      const { result } = renderHook(() => useApi(), { wrapper });

      await waitFor(() => {
        const { apiService } = require('@/services/api-service');
        expect(apiService.getMetrics).toHaveBeenCalled();
      });
    });

    it('should query logs with correct parameters', async () => {
      const { result } = renderHook(() => useApi(), { wrapper });

      await waitFor(() => {
        const { apiService } = require('@/services/api-service');
        expect(apiService.getLogs).toHaveBeenCalledWith({ limit: 50 });
      });
    });

    it('should query config with correct key', async () => {
      const { result } = renderHook(() => useApi(), { wrapper });

      await waitFor(() => {
        const { apiService } = require('@/services/api-service');
        expect(apiService.getConfig).toHaveBeenCalled();
      });
    });

    it('should return queryClient instance', async () => {
      const { result } = renderHook(() => useApi(), { wrapper });

      await waitFor(() => {
        expect(result.current.queryClient).toBeInstanceOf(QueryClient);
      });
    });
  });
});
