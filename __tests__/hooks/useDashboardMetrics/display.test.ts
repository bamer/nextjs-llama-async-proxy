import { renderHook } from "@testing-library/react";
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

describe("useDashboardMetrics - Display", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    clearMockMetrics();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should update chart data when metrics change", () => {
    setMockMetrics({
      cpu: { usage: 75 },
      memory: { used: 50 },
      totalRequests: 100,
      gpu: { usage: 85, memoryUsed: 5000, powerUsage: 250 },
    });

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData).toHaveLength(1);
    expect(result.current.chartData[0]).toMatchObject({
      cpu: 75,
      memory: 50,
      requests: 0, // Hook always sets requests to 0
      gpu: 85,
      gpuMemory: 5000,
      gpuPower: 250,
    });
    expect(result.current.chartData[0]).toHaveProperty("timestamp");
  });

  it("should not update chart data when metrics are the same", () => {
    setMockMetrics({
      cpu: { usage: 75 },
      memory: { used: 50 },
      totalRequests: 100,
    });

    const { result, rerender } = renderHook(() => useDashboardMetrics());

    const initialLength = result.current.chartData.length;

    rerender();

    expect(result.current.chartData.length).toBe(initialLength);
  });

  it("should handle metrics without GPU data", () => {
    setMockMetrics({
      cpu: { usage: 75 },
      memory: { used: 50 },
      totalRequests: 100,
    });

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData[0].cpu).toBe(75);
    expect(result.current.chartData[0].memory).toBe(50);
    expect(result.current.chartData[0].requests).toBe(0); // Hook always sets requests to 0
    expect(result.current.chartData[0].gpu).toBe(0);
    expect(result.current.chartData[0].gpuMemory).toBe(0);
    expect(result.current.chartData[0].gpuPower).toBe(0);
  });

  it("should handle metrics with GPU data", () => {
    setMockMetrics({
      cpu: { usage: 75 },
      memory: { used: 50 },
      totalRequests: 100,
      gpu: { usage: 85, memoryUsed: 5000, powerUsage: 250 },
    });

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData[0].gpu).toBe(85);
    expect(result.current.chartData[0].gpuMemory).toBe(5000);
    expect(result.current.chartData[0].gpuPower).toBe(250);
  });

  it("should handle metrics with only gpuUsage", () => {
    setMockMetrics({
      cpu: { usage: 75 },
      memory: { used: 50 },
      totalRequests: 100,
      gpu: { usage: 85 },
    });

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData[0].gpu).toBe(85);
    expect(result.current.chartData[0].gpuMemory).toBe(0);
    expect(result.current.chartData[0].gpuPower).toBe(0);
  });

  it("should handle metrics with only gpuPowerUsage", () => {
    setMockMetrics({
      cpu: { usage: 75 },
      memory: { used: 50 },
      totalRequests: 100,
      gpu: { powerUsage: 250 },
    });

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData[0].gpu).toBe(0);
    expect(result.current.chartData[0].gpuMemory).toBe(0);
    expect(result.current.chartData[0].gpuPower).toBe(250);
  });

  it("should handle changing metrics values", () => {
    setMockMetrics({
      cpu: { usage: 50 },
      memory: { used: 40 },
      totalRequests: 80,
    });

    const { result, rerender } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData[0].cpu).toBe(50);

    setMockMetrics({
      cpu: { usage: 75 },
      memory: { used: 60 },
      totalRequests: 100,
    });

    rerender();

    expect(result.current.chartData[result.current.chartData.length - 1].cpu).toBe(75);
  });

  it("should format timestamp correctly", () => {
    setMockMetrics({
      cpu: { usage: 75 },
      memory: { used: 50 },
      totalRequests: 100,
    });

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData[0].timestamp).toBeDefined();
    expect(typeof result.current.chartData[0].timestamp).toBe("string");
  });

  it("should preserve data structure", () => {
    setMockMetrics({
      cpu: { usage: 75 },
      memory: { used: 50 },
      totalRequests: 100,
    });

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData[0]).toHaveProperty("timestamp");
    expect(result.current.chartData[0]).toHaveProperty("cpu");
    expect(result.current.chartData[0]).toHaveProperty("memory");
    expect(result.current.chartData[0]).toHaveProperty("requests");
    expect(result.current.chartData[0]).toHaveProperty("gpu");
    expect(result.current.chartData[0]).toHaveProperty("gpuMemory");
    expect(result.current.chartData[0]).toHaveProperty("gpuPower");
  });

  it("should handle gpuUsage change detection", () => {
    setMockMetrics({
      cpu: { usage: 75 },
      memory: { used: 50 },
      totalRequests: 100,
      gpu: { usage: 80 },
    });

    const { result, rerender } = renderHook(() => useDashboardMetrics());

    const initialData = result.current.chartData[0];

    setMockMetrics({
      cpu: { usage: 75 },
      memory: { used: 50 },
      totalRequests: 100,
      gpu: { usage: 85 }, // Changed
    });

    rerender();

    const newData = result.current.chartData[result.current.chartData.length - 1];

    expect(initialData.gpu).toBe(80);
    expect(newData.gpu).toBe(85);
  });

  it("should handle gpuMemoryUsage as undefined", () => {
    setMockMetrics({
      cpu: { usage: 75 },
      memory: { used: 50 },
      totalRequests: 100,
      gpu: { usage: 85 },
      // gpuMemoryUsage is undefined
    });

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData[0].gpuMemory).toBe(0);
  });

  it("should handle gpuPowerUsage as undefined", () => {
    setMockMetrics({
      cpu: { usage: 75 },
      memory: { used: 50 },
      totalRequests: 100,
      gpu: { usage: 85, memoryUsed: 5000 },
      // gpuPowerUsage is undefined
    });

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.chartData[0].gpuPower).toBe(0);
  });

  it("should return metrics from store", () => {
    setMockMetrics({
      cpu: { usage: 75 },
      memory: { used: 50 },
      totalRequests: 100,
    });

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.metrics).toEqual({
      cpu: { usage: 75 },
      memory: { used: 50 },
      totalRequests: 100,
    });
  });

  it("should not update chart when only gpuUsage is defined and prev was also defined", () => {
    setMockMetrics({
      cpu: { usage: 75 },
      memory: { used: 50 },
      totalRequests: 100,
      gpu: { usage: 85 },
    });

    const { result, rerender } = renderHook(() => useDashboardMetrics());

    const initialLength = result.current.chartData.length;

    setMockMetrics({
      cpu: { usage: 75 },
      memory: { used: 50 },
      totalRequests: 100,
      gpu: { usage: 85 }, // Same value
    });

    rerender();

    expect(result.current.chartData.length).toBe(initialLength);
  });
});
