import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { SystemMetrics } from '@/types/monitoring';

jest.mock('@/hooks/use-websocket', () => ({
  useWebSocket: jest.fn(() => ({
    isConnected: true,
    connectionState: 'connected',
    reconnectionAttempts: 0,
    sendMessage: jest.fn(),
    requestMetrics: jest.fn(),
    requestLogs: jest.fn(),
    requestModels: jest.fn(),
    startModel: jest.fn(),
    stopModel: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    socketId: 'test-socket-1',
    useWebSocketEvent: jest.fn(),
  })),
}));

jest.mock('@/hooks/use-api', () => ({
  useApi: jest.fn(() => ({
    models: {
      data: [],
      isLoading: false,
      error: null,
    },
    metrics: {
      data: null,
      isLoading: false,
      error: null,
    },
    logs: {
      data: [],
      isLoading: false,
      error: null,
    },
    config: {
      data: {},
      isLoading: false,
      error: null,
    },
    queryClient: {},
  })),
}));

describe('useDashboardData', () => {
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

  const wrapper = ({ children }: any) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('initial state', () => {
    it('should initialize with loading state true', () => {
      const { result } = renderHook(() => useDashboardData(), { wrapper });
      
      expect(result.current.loading).toBe(true);
    });

    it('should return models array', async () => {
      const { result } = renderHook(() => useDashboardData(), { wrapper });
      
      await waitFor(() => {
        expect(Array.isArray(result.current.models)).toBe(true);
      });
    });

    it('should return null metrics initially', () => {
      const { result } = renderHook(() => useDashboardData(), { wrapper });
      
      expect(result.current.metrics).toBeNull();
    });
  });

  describe('WebSocket connection', () => {
    it('should request metrics when WebSocket connected', async () => {
      const { result } = renderHook(() => useDashboardData(), { wrapper });
      
      await waitFor(() => {
        const { useWebSocket } = require('@/hooks/use-websocket');
        expect(useWebSocket().requestMetrics).toHaveBeenCalled();
      });
    });

    it('should register metrics event handler', async () => {
      const { result } = renderHook(() => useDashboardData(), { wrapper });
      
      await waitFor(() => {
        const { useWebSocket } = require('@/hooks/use-websocket');
        expect(useWebSocket().on).toHaveBeenCalledWith('metrics', expect.any(Function));
      });
    });
  });

  describe('metrics transformation', () => {
    it('should transform old metrics format to new format', async () => {
      const { result } = renderHook(() => useDashboardData(), { wrapper });
      
      const { useWebSocket } = require('@/hooks/use-websocket');
      const mockHandler = useWebSocket().on.mock.calls.find(
        (call: any[]) => call[0] === 'metrics'
      )?.[1];
      if (mockHandler) {
        const oldMetrics = {
          cpuUsage: 50,
          memoryUsage: 60,
          diskUsage: 40,
          activeModels: 2,
          totalRequests: 100,
          avgResponseTime: 150,
          uptime: '1h 30m',
        };
        mockHandler(oldMetrics);
      }
      
      await waitFor(() => {
        expect(result.current.metrics).toBeDefined();
        if (result.current.metrics) {
          expect(result.current.metrics.cpu).toEqual({ usage: 50 });
          expect(result.current.metrics.memory).toEqual({ used: 60 });
          expect(result.current.metrics.disk).toEqual({ used: 40 });
          expect(result.current.metrics.uptime).toBe('1h 30m');
        }
      });
    });
  });

  describe('error handling', () => {
    it('should handle metrics parsing errors', async () => {
      const { result } = renderHook(() => useDashboardData(), { wrapper });
      
      act(() => {
        const { useWebSocket } = require('@/hooks/use-websocket');
        const mockHandler = useWebSocket().on.mock.calls.find(
          (call: any[]) => call[0] === 'metrics'
        )?.[1];
        if (mockHandler) {
          mockHandler({ invalid: 'data' });
        }
      });
      
      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
        expect(result.current.error).toContain('Failed to parse');
      });
    });
  });

  describe('cleanup', () => {
    it('should unregister metrics event on unmount', () => {
      const { unmount } = renderHook(() => useDashboardData(), { wrapper });
      
      const { useWebSocket } = require('@/hooks/use-websocket');
      expect(useWebSocket().off).toHaveBeenCalledWith('metrics', expect.any(Function));
      
      unmount();
    });
  });
});
