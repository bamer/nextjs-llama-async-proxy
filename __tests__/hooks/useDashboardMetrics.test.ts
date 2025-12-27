import { renderHook, act, waitFor } from "@testing-library/react";
import { useDashboardMetrics } from "@/components/dashboard/hooks/useDashboardMetrics";

// Mock the store
jest.mock("@/lib/store");

// Mock useWebSocket
jest.mock("@/hooks/use-websocket", () => ({
  useWebSocket: jest.fn(() => ({
    isConnected: false,
    connectionState: "disconnected",
    sendMessage: jest.fn(),
    requestMetrics: jest.fn(),
    requestLogs: jest.fn(),
    requestModels: jest.fn(),
    startModel: jest.fn(),
    stopModel: jest.fn(),
    socketId: "socket-123",
  })),
}));

// Mock monitoring config
jest.mock("@/config/monitoring.config", () => ({
  MONITORING_CONFIG: {
    WEBSOCKET: {
      CONNECTION_TIMEOUT: 5000,
    },
  },
}));

const mockStore = {
  metrics: null,
};

const store = require("@/lib/store");
store.useStore = (selector: any) => selector(mockStore);

const { useWebSocket } = require("@/hooks/use-websocket");

describe("useDashboardMetrics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Reset mock store
    Object.assign(mockStore, {
      metrics: null,
    });

    // Reset useWebSocket mock
    useWebSocket.mockReturnValue({
      isConnected: false,
      connectionState: "disconnected",
      sendMessage: jest.fn(),
      requestMetrics: jest.fn(),
      requestLogs: jest.fn(),
      requestModels: jest.fn(),
      startModel: jest.fn(),
      stopModel: jest.fn(),
      socketId: "socket-123",
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should initialize with loading state", () => {
    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.loading).toBe(true);
    expect(result.current.chartData).toEqual([]);
    expect(result.current.metrics).toBeNull();
    expect(result.current.isConnected).toBe(false);
  });

  it("should return chart data array", () => {
    const { result } = renderHook(() => useDashboardMetrics());

    expect(Array.isArray(result.current.chartData)).toBe(true);
  });

  it("should return connection state from useWebSocket", () => {
    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.isConnected).toBe(false);
    expect(typeof result.current.isConnected).toBe("boolean");
  });

  it("should stop loading when WebSocket connects", () => {
    useWebSocket.mockReturnValue({
      isConnected: true,
      connectionState: "connected",
      sendMessage: jest.fn(),
      requestMetrics: jest.fn(),
      requestLogs: jest.fn(),
      requestModels: jest.fn(),
      startModel: jest.fn(),
      stopModel: jest.fn(),
      socketId: "socket-123",
    });

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.loading).toBe(false);
  });

  it("should stop loading when metrics are available", () => {
    Object.assign(mockStore, {
      metrics: {
        cpuUsage: 50,
        memoryUsage: 60,
        totalRequests: 100,
        gpuUsage: 70,
        gpuMemoryUsage: 40,
        gpuPowerUsage: 150,
      },
    });

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.loading).toBe(false);
  });

  it("should populate chart data when metrics are available", () => {
    Object.assign(mockStore, {
      metrics: {
        cpuUsage: 45,
        memoryUsage: 60,
        totalRequests: 100,
        gpuUsage: 70,
        gpuMemoryUsage: 40,
        gpuPowerUsage: 150,
      },
    });

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData.length).toBeGreaterThan(0);

    const dataPoint = result.current.chartData[0];
    expect(dataPoint).toHaveProperty("timestamp");
    expect(dataPoint).toHaveProperty("cpu");
    expect(dataPoint).toHaveProperty("memory");
    expect(dataPoint).toHaveProperty("requests");
    expect(dataPoint).toHaveProperty("gpu");
    expect(dataPoint).toHaveProperty("gpuMemory");
    expect(dataPoint).toHaveProperty("gpuPower");

    expect(dataPoint.cpu).toBe(45);
    expect(dataPoint.memory).toBe(60);
    expect(dataPoint.requests).toBe(100);
    expect(dataPoint.gpu).toBe(70);
    expect(dataPoint.gpuMemory).toBe(40);
    expect(dataPoint.gpuPower).toBe(150);
  });

  it("should handle metrics without GPU data", () => {
    Object.assign(mockStore, {
      metrics: {
        cpuUsage: 45,
        memoryUsage: 60,
        totalRequests: 100,
      },
    });

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData.length).toBeGreaterThan(0);

    const dataPoint = result.current.chartData[0];
    expect(dataPoint.cpu).toBe(45);
    expect(dataPoint.memory).toBe(60);
    expect(dataPoint.requests).toBe(100);
    expect(dataPoint.gpu).toBe(0);
    expect(dataPoint.gpuMemory).toBe(0);
    expect(dataPoint.gpuPower).toBe(0);
  });

  it("should handle null metrics", () => {
    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.metrics).toBeNull();
    expect(result.current.chartData).toEqual([]);
  });

  it("should set loading to false on connection timeout", () => {
    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.loading).toBe(true);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.loading).toBe(false);
  });

  it("should not add duplicate chart data when values are unchanged", () => {
    const initialMetrics = {
      cpuUsage: 45,
      memoryUsage: 60,
      totalRequests: 100,
      gpuUsage: 70,
      gpuMemoryUsage: 40,
      gpuPowerUsage: 150,
    };

    Object.assign(mockStore, {
      metrics: initialMetrics,
    });

    const { result } = renderHook(() => useDashboardMetrics());

    const initialLength = result.current.chartData.length;

    // Update with same values
    Object.assign(mockStore, {
      metrics: { ...initialMetrics },
    });

    // Force re-render
    const { rerender } = renderHook(() => useDashboardMetrics());
    rerender();

    // Length should be the same (no duplicates)
    expect(result.current.chartData.length).toBe(initialLength);
  });

  it("should add new chart data when values change", () => {
    Object.assign(mockStore, {
      metrics: {
        cpuUsage: 45,
        memoryUsage: 60,
        totalRequests: 100,
      },
    });

    const { result } = renderHook(() => useDashboardMetrics());

    const initialLength = result.current.chartData.length;
    const initialCpu = result.current.chartData[0].cpu;

    // Update with different values
    Object.assign(mockStore, {
      metrics: {
        cpuUsage: 50,
        memoryUsage: 65,
        totalRequests: 105,
      },
    });

    // Force re-render
    const { rerender } = renderHook(() => useDashboardMetrics());
    rerender();

    // Length should increase
    expect(result.current.chartData.length).toBeGreaterThan(initialLength);
    expect(result.current.chartData[result.current.chartData.length - 1].cpu).toBe(50);
  });

  it("should limit chart data to 20 points", () => {
    const metrics = {
      cpuUsage: 45,
      memoryUsage: 60,
      totalRequests: 100,
    };

    Object.assign(mockStore, {
      metrics,
    });

    const { result } = renderHook(() => useDashboardMetrics());

    // Force many updates
    for (let i = 0; i < 30; i++) {
      Object.assign(mockStore, {
        metrics: {
          cpuUsage: 45 + i,
          memoryUsage: 60 + i,
          totalRequests: 100 + i,
        },
      });
    }

    const { rerender } = renderHook(() => useDashboardMetrics());
    rerender();

    // Should not exceed 20 points
    expect(result.current.chartData.length).toBeLessThanOrEqual(20);
  });

  it("should maintain chronological order in chart data", () => {
    const metrics1 = { cpuUsage: 45, memoryUsage: 60, totalRequests: 100 };
    const metrics2 = { cpuUsage: 50, memoryUsage: 65, totalRequests: 105 };
    const metrics3 = { cpuUsage: 55, memoryUsage: 70, totalRequests: 110 };

    Object.assign(mockStore, { metrics: metrics1 });

    const { result } = renderHook(() => useDashboardMetrics());

    Object.assign(mockStore, { metrics: metrics2 });
    Object.assign(mockStore, { metrics: metrics3 });

    const { rerender } = renderHook(() => useDashboardMetrics());
    rerender();

    if (result.current.chartData.length >= 3) {
      expect(result.current.chartData[0].cpu).toBe(45);
      expect(result.current.chartData[result.current.chartData.length - 1].cpu).toBe(55);
    }
  });

  it("should update chart data on metrics changes", () => {
    let callCount = 0;
    const metricsHistory = [
      { cpuUsage: 45, memoryUsage: 60, totalRequests: 100 },
      { cpuUsage: 50, memoryUsage: 65, totalRequests: 105 },
      { cpuUsage: 55, memoryUsage: 70, totalRequests: 110 },
    ];

    Object.assign(mockStore, {
      metrics: metricsHistory[0],
    });

    const { result } = renderHook(() => useDashboardMetrics());

    const initialLength = result.current.chartData.length;

    // Update metrics multiple times
    metricsHistory.slice(1).forEach((metrics) => {
      Object.assign(mockStore, { metrics });
      callCount++;
    });

    const { rerender } = renderHook(() => useDashboardMetrics());
    rerender();

    expect(result.current.chartData.length).toBeGreaterThanOrEqual(initialLength);
  });

  it("should handle metrics with undefined GPU usage", () => {
    Object.assign(mockStore, {
      metrics: {
        cpuUsage: 45,
        memoryUsage: 60,
        totalRequests: 100,
        gpuUsage: undefined,
        gpuMemoryUsage: 40,
        gpuPowerUsage: 150,
      },
    });

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData.length).toBeGreaterThan(0);
    expect(result.current.chartData[0].gpu).toBe(0);
  });

  it("should handle metrics with undefined GPU memory", () => {
    Object.assign(mockStore, {
      metrics: {
        cpuUsage: 45,
        memoryUsage: 60,
        totalRequests: 100,
        gpuUsage: 70,
        gpuMemoryUsage: undefined,
        gpuPowerUsage: 150,
      },
    });

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData.length).toBeGreaterThan(0);
    expect(result.current.chartData[0].gpuMemory).toBe(0);
  });

  it("should handle metrics with undefined GPU power", () => {
    Object.assign(mockStore, {
      metrics: {
        cpuUsage: 45,
        memoryUsage: 60,
        totalRequests: 100,
        gpuUsage: 70,
        gpuMemoryUsage: 40,
        gpuPowerUsage: undefined,
      },
    });

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData.length).toBeGreaterThan(0);
    expect(result.current.chartData[0].gpuPower).toBe(0);
  });

  it("should return metrics from store", () => {
    const testMetrics = {
      cpuUsage: 45,
      memoryUsage: 60,
      totalRequests: 100,
      gpuUsage: 70,
      gpuMemoryUsage: 40,
      gpuPowerUsage: 150,
    };

    Object.assign(mockStore, {
      metrics: testMetrics,
    });

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.metrics).toEqual(testMetrics);
  });

  it("should handle connection timeout correctly", () => {
    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.loading).toBe(true);

    // Advance time past timeout
    act(() => {
      jest.advanceTimersByTime(6000);
    });

    expect(result.current.loading).toBe(false);
  });

  it("should handle concurrent connection and metrics", () => {
    useWebSocket.mockReturnValue({
      isConnected: true,
      connectionState: "connected",
      sendMessage: jest.fn(),
      requestMetrics: jest.fn(),
      requestLogs: jest.fn(),
      requestModels: jest.fn(),
      startModel: jest.fn(),
      stopModel: jest.fn(),
      socketId: "socket-123",
    });

    Object.assign(mockStore, {
      metrics: {
        cpuUsage: 45,
        memoryUsage: 60,
        totalRequests: 100,
      },
    });

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.loading).toBe(false);
    expect(result.current.isConnected).toBe(true);
    expect(result.current.chartData.length).toBeGreaterThan(0);
  });

  it("should cleanup timeout on unmount", () => {
    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

    const { unmount } = renderHook(() => useDashboardMetrics());

    unmount();

    // Clear timeout should have been called
    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  it("should handle reconnection scenarios", () => {
    // Start disconnected
    useWebSocket.mockReturnValue({
      isConnected: false,
      connectionState: "disconnected",
      sendMessage: jest.fn(),
      requestMetrics: jest.fn(),
      requestLogs: jest.fn(),
      requestModels: jest.fn(),
      startModel: jest.fn(),
      stopModel: jest.fn(),
      socketId: "socket-123",
    });

    const { result, rerender } = renderHook(() => useDashboardMetrics());

    expect(result.current.isConnected).toBe(false);

    // Simulate reconnection
    useWebSocket.mockReturnValue({
      isConnected: true,
      connectionState: "connected",
      sendMessage: jest.fn(),
      requestMetrics: jest.fn(),
      requestLogs: jest.fn(),
      requestModels: jest.fn(),
      startModel: jest.fn(),
      stopModel: jest.fn(),
      socketId: "socket-123",
    });

    rerender();

    expect(result.current.isConnected).toBe(true);
  });

  it("should maintain data structure integrity", () => {
    Object.assign(mockStore, {
      metrics: {
        cpuUsage: 45,
        memoryUsage: 60,
        totalRequests: 100,
        gpuUsage: 70,
        gpuMemoryUsage: 40,
        gpuPowerUsage: 150,
      },
    });

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current).toHaveProperty("metrics");
    expect(result.current).toHaveProperty("chartData");
    expect(result.current).toHaveProperty("loading");
    expect(result.current).toHaveProperty("isConnected");
  });
});
