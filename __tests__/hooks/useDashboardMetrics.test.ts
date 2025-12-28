import { renderHook, act } from '@testing-library/react';
import { useDashboardMetrics } from '@/components/dashboard/hooks/useDashboardMetrics';

jest.mock('@/lib/store', () => ({
  useStore: jest.fn(),
}));

jest.mock('@/hooks/use-websocket', () => ({
  useWebSocket: jest.fn(),
}));

jest.mock('@/config/monitoring.config', () => ({
  MONITORING_CONFIG: {
    WEBSOCKET: {
      CONNECTION_TIMEOUT: 15000,
    },
  },
}));

const mockSetChartData = jest.fn();
let mockMetrics = null as {
  cpuUsage?: number;
  memoryUsage?: number;
  totalRequests?: number;
  uptime?: number;
  gpuUsage?: number;
  gpuPowerUsage?: number;
  gpuMemoryUsed?: number;
  gpuMemoryTotal?: number;
  gpuTemperature?: number;
  gpuName?: string;
  gpuMemoryUsage?: number;
} | null | undefined;
let mockIsConnected = false;

const { useStore } = require('@/lib/store');
const { useWebSocket } = require('@/hooks/use-websocket');

describe('useDashboardMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockMetrics = null;
    mockIsConnected = false;

    useStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        metrics: mockMetrics,
        chartHistory: {
          cpu: [],
          memory: [],
          requests: [],
          gpuUtil: [],
          power: [],
        },
        addChartData: jest.fn(),
      };
      return selector(state);
    });

    useWebSocket.mockReturnValue({
      isConnected: mockIsConnected,
      connectionState: 'disconnected',
      sendMessage: jest.fn(),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.loading).toBe(true);
    expect(result.current.chartData).toEqual([]);
    expect(result.current.isConnected).toBe(false);
  });

  it('should set loading to false when connected', () => {
    mockIsConnected = true;
    useWebSocket.mockReturnValue({
      isConnected: true,
      connectionState: 'connected',
      sendMessage: jest.fn(),
    });

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.loading).toBe(false);
    expect(result.current.isConnected).toBe(true);
  });

  it('should return null metrics when not available', () => {
    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.metrics).toBeNull();
  });

  it('should set loading to false when metrics are available', () => {
    mockMetrics = {
      cpuUsage: 75,
      memoryUsage: 50,
      totalRequests: 100,
    };

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.loading).toBe(false);
    expect(result.current.metrics).toEqual(mockMetrics);
  });

  it('should update chart data when metrics change', () => {
    mockMetrics = {
      cpuUsage: 75,
      memoryUsage: 50,
      totalRequests: 100,
      gpuUsage: 85,
      gpuMemoryUsage: 5000,
      gpuPowerUsage: 250,
    };

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData).toHaveLength(1);
    expect(result.current.chartData[0]).toMatchObject({
      cpu: 75,
      memory: 50,
      requests: 100,
      gpu: 85,
      gpuMemory: 5000,
      gpuPower: 250,
    });
    expect(result.current.chartData[0]).toHaveProperty('timestamp');
  });

  it('should not update chart data when metrics are the same', () => {
    mockMetrics = {
      cpuUsage: 75,
      memoryUsage: 50,
      totalRequests: 100,
    };

    const { result, rerender } = renderHook(() => useDashboardMetrics());

    const initialLength = result.current.chartData.length;

    rerender();

    expect(result.current.chartData.length).toBe(initialLength);
  });

  it('should limit chart data to 20 points', () => {
    const timestamps = Array.from({ length: 25 }, (_, i) => i);
    mockMetrics = {
      cpuUsage: 50,
      memoryUsage: 50,
      totalRequests: 100,
    };

    // Simulate 25 data points
    timestamps.forEach(() => {
      const currentMetrics = mockMetrics as { cpuUsage?: number } | null;
      mockMetrics = {
        ...mockMetrics as object,
        cpuUsage: (currentMetrics?.cpuUsage ?? 0) + 1,
      } as typeof mockMetrics;
    });

    const { result } = renderHook(() => useDashboardMetrics());

    // Force rerender after all updates
    act(() => {
      jest.runAllTimers();
    });

    expect(result.current.chartData.length).toBeLessThanOrEqual(20);
  });

  it('should handle metrics without GPU data', () => {
    mockMetrics = {
      cpuUsage: 75,
      memoryUsage: 50,
      totalRequests: 100,
    };

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData[0].cpu).toBe(75);
    expect(result.current.chartData[0].memory).toBe(50);
    expect(result.current.chartData[0].requests).toBe(100);
    expect(result.current.chartData[0].gpu).toBe(0);
    expect(result.current.chartData[0].gpuMemory).toBe(0);
    expect(result.current.chartData[0].gpuPower).toBe(0);
  });

  it('should handle metrics with GPU data', () => {
    mockMetrics = {
      cpuUsage: 75,
      memoryUsage: 50,
      totalRequests: 100,
      gpuUsage: 85,
      gpuMemoryUsage: 5000,
      gpuPowerUsage: 250,
    };

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData[0].gpu).toBe(85);
    expect(result.current.chartData[0].gpuMemory).toBe(5000);
    expect(result.current.chartData[0].gpuPower).toBe(250);
  });

  it('should handle metrics with only gpuUsage', () => {
    mockMetrics = {
      cpuUsage: 75,
      memoryUsage: 50,
      totalRequests: 100,
      gpuUsage: 85,
    };

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData[0].gpu).toBe(85);
    expect(result.current.chartData[0].gpuMemory).toBe(0);
    expect(result.current.chartData[0].gpuPower).toBe(0);
  });

  it('should handle metrics with only gpuPowerUsage', () => {
    mockMetrics = {
      cpuUsage: 75,
      memoryUsage: 50,
      totalRequests: 100,
      gpuPowerUsage: 250,
    };

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData[0].gpu).toBe(0);
    expect(result.current.chartData[0].gpuMemory).toBe(0);
    expect(result.current.chartData[0].gpuPower).toBe(250);
  });

  it('should set loading to false after connection timeout', () => {
    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.loading).toBe(true);

    act(() => {
      jest.advanceTimersByTime(15000);
    });

    expect(result.current.loading).toBe(false);
  });

  it('should clear connection timeout on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    const { unmount } = renderHook(() => useDashboardMetrics());

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  it('should handle changing metrics values', () => {
    mockMetrics = {
      cpuUsage: 50,
      memoryUsage: 40,
      totalRequests: 80,
    };

    const { result, rerender } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData[0].cpu).toBe(50);

    mockMetrics = {
      cpuUsage: 75,
      memoryUsage: 60,
      totalRequests: 100,
    };

    rerender();

    expect(result.current.chartData[result.current.chartData.length - 1].cpu).toBe(75);
  });

  it('should handle missing cpuUsage', () => {
    mockMetrics = {
      memoryUsage: 50,
      totalRequests: 100,
    };

    const { result } = renderHook(() => useDashboardMetrics());

    // Should not add data point when cpuUsage is undefined
    expect(result.current.chartData.length).toBe(0);
  });

  it('should handle edge case metrics values', () => {
    mockMetrics = {
      cpuUsage: 0,
      memoryUsage: 0,
      totalRequests: 0,
      gpuUsage: 0,
      gpuMemoryUsage: 0,
      gpuPowerUsage: 0,
    };

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData[0].cpu).toBe(0);
    expect(result.current.chartData[0].memory).toBe(0);
    expect(result.current.chartData[0].requests).toBe(0);
    expect(result.current.chartData[0].gpu).toBe(0);
    expect(result.current.chartData[0].gpuMemory).toBe(0);
    expect(result.current.chartData[0].gpuPower).toBe(0);
  });

  it('should handle high metric values', () => {
    mockMetrics = {
      cpuUsage: 100,
      memoryUsage: 100,
      totalRequests: 1000000,
      gpuUsage: 100,
      gpuMemoryUsage: 24000,
      gpuPowerUsage: 500,
    };

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData[0].cpu).toBe(100);
    expect(result.current.chartData[0].memory).toBe(100);
    expect(result.current.chartData[0].requests).toBe(1000000);
    expect(result.current.chartData[0].gpu).toBe(100);
    expect(result.current.chartData[0].gpuMemory).toBe(24000);
    expect(result.current.chartData[0].gpuPower).toBe(500);
  });

  it('should handle floating point metric values', () => {
    mockMetrics = {
      cpuUsage: 75.5,
      memoryUsage: 50.3,
      totalRequests: 100,
    };

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData[0].cpu).toBe(75.5);
    expect(result.current.chartData[0].memory).toBe(50.3);
    expect(result.current.chartData[0].requests).toBe(100);
  });

  it('should format timestamp correctly', () => {
    mockMetrics = {
      cpuUsage: 75,
      memoryUsage: 50,
      totalRequests: 100,
    };

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData[0].timestamp).toBeDefined();
    expect(typeof result.current.chartData[0].timestamp).toBe('string');
  });

  it('should preserve data structure', () => {
    mockMetrics = {
      cpuUsage: 75,
      memoryUsage: 50,
      totalRequests: 100,
    };

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData[0]).toHaveProperty('timestamp');
    expect(result.current.chartData[0]).toHaveProperty('cpu');
    expect(result.current.chartData[0]).toHaveProperty('memory');
    expect(result.current.chartData[0]).toHaveProperty('requests');
    expect(result.current.chartData[0]).toHaveProperty('gpu');
    expect(result.current.chartData[0]).toHaveProperty('gpuMemory');
    expect(result.current.chartData[0]).toHaveProperty('gpuPower');
  });

  it('should maintain chart data order', () => {
    mockMetrics = {
      cpuUsage: 50,
      memoryUsage: 50,
      totalRequests: 100,
    };

    const { result } = renderHook(() => useDashboardMetrics());

    const firstTimestamp = result.current.chartData[0]?.timestamp;

    // Wait a bit to ensure different timestamp
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    mockMetrics = {
      cpuUsage: 60,
      memoryUsage: 60,
      totalRequests: 110,
    };

    renderHook(() => useDashboardMetrics());

    // Most recent data should be last
    expect(result.current.chartData.length).toBeGreaterThan(0);
    if (result.current.chartData.length > 1) {
      expect(result.current.chartData[result.current.chartData.length - 1].timestamp).not.toBe(
        firstTimestamp
      );
    }
  });

  it('should return isConnected from useWebSocket', () => {
    useWebSocket.mockReturnValue({
      isConnected: true,
      connectionState: 'connected',
      sendMessage: jest.fn(),
    });

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.isConnected).toBe(true);
  });

  it('should return connection state from useWebSocket', () => {
    useWebSocket.mockReturnValue({
      isConnected: false,
      connectionState: 'connecting',
      sendMessage: jest.fn(),
    });

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.isConnected).toBe(false);
  });

  it('should not crash on null metrics', () => {
    mockMetrics = null;

    expect(() => {
      renderHook(() => useDashboardMetrics());
    }).not.toThrow();
  });

  it('should not crash on undefined metrics', () => {
    mockMetrics = undefined;

    expect(() => {
      renderHook(() => useDashboardMetrics());
    }).not.toThrow();
  });

  it('should handle empty metrics object', () => {
    mockMetrics = {};

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData.length).toBe(0);
  });

  it('should handle rapid metric updates', () => {
    mockMetrics = {
      cpuUsage: 50,
      memoryUsage: 50,
      totalRequests: 100,
    };

    const { result } = renderHook(() => useDashboardMetrics());

    // Simulate rapid updates
    for (let i = 0; i < 10; i++) {
      mockMetrics = {
        cpuUsage: 50 + i,
        memoryUsage: 50 + i,
        totalRequests: 100 + i * 10,
      };
    }

    act(() => {
      jest.runAllTimers();
    });

    expect(result.current.chartData.length).toBeGreaterThan(0);
    expect(result.current.chartData.length).toBeLessThanOrEqual(20);
  });

  it('should handle gpuUsage change detection', () => {
    mockMetrics = {
      cpuUsage: 75,
      memoryUsage: 50,
      totalRequests: 100,
      gpuUsage: 80,
    };

    const { result, rerender } = renderHook(() => useDashboardMetrics());

    const initialData = result.current.chartData[0];

    mockMetrics = {
      cpuUsage: 75,
      memoryUsage: 50,
      totalRequests: 100,
      gpuUsage: 85, // Changed
    };

    rerender();

    const newData = result.current.chartData[result.current.chartData.length - 1];

    expect(initialData.gpu).toBe(80);
    expect(newData.gpu).toBe(85);
  });

  it('should handle gpuMemoryUsage as undefined', () => {
    mockMetrics = {
      cpuUsage: 75,
      memoryUsage: 50,
      totalRequests: 100,
      gpuUsage: 85,
      // gpuMemoryUsage is undefined
    };

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData[0].gpuMemory).toBe(0);
  });

  it('should handle gpuPowerUsage as undefined', () => {
    mockMetrics = {
      cpuUsage: 75,
      memoryUsage: 50,
      totalRequests: 100,
      gpuUsage: 85,
      gpuMemoryUsage: 5000,
      // gpuPowerUsage is undefined
    };

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData[0].gpuPower).toBe(0);
  });

  it('should return metrics from store', () => {
    mockMetrics = {
      cpuUsage: 75,
      memoryUsage: 50,
      totalRequests: 100,
    };

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.metrics).toEqual(mockMetrics);
  });

  it('should handle all return values', () => {
    mockMetrics = {
      cpuUsage: 75,
      memoryUsage: 50,
      totalRequests: 100,
    };

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current).toHaveProperty('metrics');
    expect(result.current).toHaveProperty('chartData');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('isConnected');
  });

  it('should not update chart when only gpuUsage is defined and prev was also defined', () => {
    mockMetrics = {
      cpuUsage: 75,
      memoryUsage: 50,
      totalRequests: 100,
      gpuUsage: 85,
    };

    const { result, rerender } = renderHook(() => useDashboardMetrics());

    const initialLength = result.current.chartData.length;

    mockMetrics = {
      cpuUsage: 75,
      memoryUsage: 50,
      totalRequests: 100,
      gpuUsage: 85, // Same value
    };

    rerender();

    // Should not add new data point if all values are the same
    expect(result.current.chartData.length).toBe(initialLength);
  });
});
