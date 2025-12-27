import { renderHook, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useDashboardMetrics } from '@/components/dashboard/hooks/useDashboardMetrics';
import type { SystemMetrics } from '@/types/global';

jest.mock('@/lib/store');
jest.mock('@/hooks/use-websocket', () => ({
  useWebSocket: jest.fn(() => ({
    isConnected: true,
    connectionState: 'connected',
    sendMessage: jest.fn(),
    requestMetrics: jest.fn(),
    requestLogs: jest.fn(),
    requestModels: jest.fn(),
    startModel: jest.fn(),
    stopModel: jest.fn(),
    socketId: 'test-socket-id',
  })),
}));

import { useStore } from '@/lib/store';
const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;

describe('useDashboardMetrics', () => {
  const mockMetrics: SystemMetrics = {
    cpuUsage: 45.5,
    memoryUsage: 62.3,
    diskUsage: 55.0,
    activeModels: 2,
    uptime: 3600,
    totalRequests: 1000,
    avgResponseTime: 150,
    timestamp: new Date().toISOString(),
    gpuUsage: 80.0,
    gpuMemoryUsage: 12.5,
    gpuPowerUsage: 200.0,
  };

  const createMockState = (metrics: SystemMetrics | null) => ({
    models: [],
    activeModelId: null,
    metrics,
    logs: [],
    settings: {
      theme: 'system',
      notifications: true,
      autoRefresh: true,
    },
    status: {
      isLoading: false,
      error: null,
    },
    chartHistory: {
      cpu: [],
      memory: [],
      requests: [],
      gpuUtil: [],
      power: [],
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStore.mockImplementation((selector) =>
      (selector as any)(createMockState(null))
    );
  });

  it('returns initial state with loading false when connected', () => {
    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current).toEqual({
      metrics: null,
      chartData: [],
      loading: false,
      isConnected: true,
    });
  });

  it('returns loading false when connected', async () => {
    mockUseStore.mockImplementation((selector) =>
      (selector as any)(createMockState(mockMetrics))
    );

    const { result } = renderHook(() => useDashboardMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('sets loading false when metrics are provided', async () => {
    mockUseStore.mockImplementation((selector) =>
      (selector as any)(createMockState(mockMetrics))
    );

    const { result } = renderHook(() => useDashboardMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics).toEqual(mockMetrics);
  });

  it('updates chart data when metrics change', async () => {
    mockUseStore.mockImplementation((selector) =>
      (selector as any)(createMockState(mockMetrics))
    );

    const { result } = renderHook(() => useDashboardMetrics());

    await waitFor(() => {
      expect(result.current.chartData.length).toBeGreaterThan(0);
    });

    const latestDataPoint =
      result.current.chartData[result.current.chartData.length - 1];
    expect(latestDataPoint.cpu).toBe(mockMetrics.cpuUsage);
    expect(latestDataPoint.memory).toBe(mockMetrics.memoryUsage);
    expect(latestDataPoint.requests).toBe(mockMetrics.totalRequests);
  });

  it('limits chart data to 20 points', async () => {
    mockUseStore.mockImplementation((selector) =>
      (selector as any)(createMockState(mockMetrics))
    );

    const { result } = renderHook(() => useDashboardMetrics());

    await waitFor(() => {
      expect(result.current.chartData.length).toBeGreaterThan(0);
    });

    expect(result.current.chartData.length).toBeLessThanOrEqual(20);
  });

  it('includes GPU metrics in chart data when available', async () => {
    const metricsWithGPU: SystemMetrics = {
      ...mockMetrics,
      gpuUsage: 85.0,
      gpuMemoryUsage: 15.2,
      gpuPowerUsage: 250.0,
    };

    mockUseStore.mockImplementation((selector) =>
      (selector as any)(createMockState(metricsWithGPU))
    );

    const { result } = renderHook(() => useDashboardMetrics());

    await waitFor(() => {
      expect(result.current.chartData.length).toBeGreaterThan(0);
    });

    const latestDataPoint =
      result.current.chartData[result.current.chartData.length - 1];
    expect(latestDataPoint.gpu).toBe(metricsWithGPU.gpuUsage);
    expect(latestDataPoint.gpuMemory).toBe(metricsWithGPU.gpuMemoryUsage);
    expect(latestDataPoint.gpuPower).toBe(metricsWithGPU.gpuPowerUsage);
  });

  it('defaults GPU metrics to 0 when not available', async () => {
    const metricsWithoutGPU: SystemMetrics = {
      cpuUsage: 45.5,
      memoryUsage: 62.3,
      diskUsage: 55.0,
      activeModels: 2,
      uptime: 3600,
      totalRequests: 1000,
      avgResponseTime: 150,
      timestamp: new Date().toISOString(),
    };

    mockUseStore.mockImplementation((selector) =>
      (selector as any)(createMockState(metricsWithoutGPU))
    );

    const { result } = renderHook(() => useDashboardMetrics());

    await waitFor(() => {
      expect(result.current.chartData.length).toBeGreaterThan(0);
    });

    const latestDataPoint =
      result.current.chartData[result.current.chartData.length - 1];
    expect(latestDataPoint.gpu).toBe(0);
    expect(latestDataPoint.gpuMemory).toBe(0);
    expect(latestDataPoint.gpuPower).toBe(0);
  });

  it('returns isConnected status from WebSocket', () => {
    mockUseStore.mockImplementation((selector) =>
      (selector as any)(createMockState(null))
    );

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.isConnected).toBe(true);
  });
});
