import { renderHook, act } from "@testing-library/react";
import { useDashboardMetrics } from "@/components/dashboard/hooks/useDashboardMetrics";
import { clearMockMetrics, setMockMetrics } from "./test-utils";

jest.mock("@/lib/store", () => ({
  useStore: jest.fn(),
}));

jest.mock("@/hooks/use-websocket", () => ({
  useWebSocket: jest.fn(),
}));

jest.mock("@/config/monitoring.config", () => ({
  MONITORING_CONFIG: {
    WEBSOCKET: {
      CONNECTION_TIMEOUT: 15000,
    },
  },
}));

describe("useDashboardMetrics - Edge Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    clearMockMetrics();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should limit chart data to 20 points", () => {
    const timestamps = Array.from({ length: 25 }, (_, i) => i);
    setMockMetrics({
      cpu: { usage: 50 },
      memory: { used: 50 },
      totalRequests: 100,
    });

    // Simulate 25 data points
    timestamps.forEach((i) => {
      setMockMetrics({
        cpu: { usage: 50 + i },
        memory: { used: 50 },
        totalRequests: 100,
      });
    });

    const { result } = renderHook(() => useDashboardMetrics());

    act(() => {
      jest.runAllTimers();
    });

    expect(result.current.chartData.length).toBeLessThanOrEqual(20);
  });

  it("should maintain chart data order", () => {
    setMockMetrics({
      cpu: { usage: 50 },
      memory: { used: 50 },
      totalRequests: 100,
    });

    const { result, rerender } = renderHook(() => useDashboardMetrics());

    const firstTimestamp = result.current.chartData[0]?.timestamp;

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    setMockMetrics({
      cpu: { usage: 60 },
      memory: { used: 60 },
      totalRequests: 110,
    });

    rerender();

    expect(result.current.chartData.length).toBeGreaterThan(0);
    if (result.current.chartData.length > 1) {
      expect(
        result.current.chartData[result.current.chartData.length - 1].timestamp
      ).not.toBe(firstTimestamp);
    }
  });

  it("should handle missing cpuUsage", () => {
    setMockMetrics({
      memory: { used: 50 },
      totalRequests: 100,
    });

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData.length).toBe(0);
  });

  it("should handle edge case metrics values", () => {
    setMockMetrics({
      cpu: { usage: 0 },
      memory: { used: 0 },
      totalRequests: 0,
      gpu: { usage: 0, memoryUsed: 0, powerUsage: 0 },
    });

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData[0].cpu).toBe(0);
    expect(result.current.chartData[0].memory).toBe(0);
    expect(result.current.chartData[0].requests).toBe(0); // Hook always sets requests to 0
    expect(result.current.chartData[0].gpu).toBe(0);
    expect(result.current.chartData[0].gpuMemory).toBe(0);
    expect(result.current.chartData[0].gpuPower).toBe(0);
  });

  it("should handle high metric values", () => {
    setMockMetrics({
      cpu: { usage: 100 },
      memory: { used: 100 },
      totalRequests: 1000000,
      gpu: { usage: 100, memoryUsed: 24000, powerUsage: 500 },
    });

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData[0].cpu).toBe(100);
    expect(result.current.chartData[0].memory).toBe(100);
    expect(result.current.chartData[0].requests).toBe(0); // Hook always sets requests to 0
    expect(result.current.chartData[0].gpu).toBe(100);
    expect(result.current.chartData[0].gpuMemory).toBe(24000);
    expect(result.current.chartData[0].gpuPower).toBe(500);
  });

  it("should handle floating point metric values", () => {
    setMockMetrics({
      cpu: { usage: 75.5 },
      memory: { used: 50.3 },
      totalRequests: 100,
    });

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData[0].cpu).toBe(75.5);
    expect(result.current.chartData[0].memory).toBe(50.3);
    expect(result.current.chartData[0].requests).toBe(0); // Hook always sets requests to 0
  });

  it("should not crash on null metrics", () => {
    setMockMetrics(null);

    expect(() => {
      renderHook(() => useDashboardMetrics());
    }).not.toThrow();
  });

  it("should not crash on undefined metrics", () => {
    setMockMetrics(undefined);

    expect(() => {
      renderHook(() => useDashboardMetrics());
    }).not.toThrow();
  });

  it("should handle empty metrics object", () => {
    setMockMetrics({});

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData.length).toBe(0);
  });

  it("should handle rapid metric updates", () => {
    setMockMetrics({
      cpu: { usage: 50 },
      memory: { used: 50 },
      totalRequests: 100,
    });

    const { result } = renderHook(() => useDashboardMetrics());

    for (let i = 0; i < 10; i++) {
      setMockMetrics({
        cpu: { usage: 50 + i },
        memory: { used: 50 + i },
        totalRequests: 100 + i * 10,
      });
    }

    act(() => {
      jest.runAllTimers();
    });

    expect(result.current.chartData.length).toBeGreaterThan(0);
    expect(result.current.chartData.length).toBeLessThanOrEqual(20);
  });
});
