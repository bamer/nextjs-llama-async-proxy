import { renderHook, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useDashboardMetrics } from '@/components/dashboard/hooks/useDashboardMetrics';
import type { SystemMetrics } from '@/types/monitoring';

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
    cpu: { usage: 45.5 },
    memory: { used: 62.3 },
    disk: { used: 55.0 },
    network: { rx: 100, tx: 50 },
    uptime: 3600,
    gpu: {
      usage: 80.0,
      memoryUsed: 12.5,
      memoryTotal: 16,
      powerUsage: 200.0,
      powerLimit: 300,
      temperature: 65,
      name: 'NVIDIA RTX 4090',
    },
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
      llamaServerStatus: 'running',
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
    expect(latestDataPoint.cpu).toBe(mockMetrics.cpu.usage);
    expect(latestDataPoint.memory).toBe(mockMetrics.memory.used);
    expect(latestDataPoint.gpu).toBe(mockMetrics.gpu?.usage);
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
      gpu: {
        ...mockMetrics.gpu!,
        usage: 85.0,
        memoryUsed: 15.2,
        powerUsage: 250.0,
      },
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
    expect(latestDataPoint.gpu).toBe(metricsWithGPU.gpu!.usage);
    expect(latestDataPoint.gpuMemory).toBe(metricsWithGPU.gpu!.memoryUsed);
    expect(latestDataPoint.gpuPower).toBe(metricsWithGPU.gpu!.powerUsage);
  });

  it('defaults GPU metrics to 0 when not available', async () => {
    const metricsWithoutGPU: SystemMetrics = {
      cpu: { usage: 45.5 },
      memory: { used: 62.3 },
      disk: { used: 55.0 },
      network: { rx: 0, tx: 0 },
      uptime: 3600,
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
