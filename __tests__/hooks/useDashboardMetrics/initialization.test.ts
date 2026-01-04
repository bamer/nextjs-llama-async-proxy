import { renderHook, act } from "@testing-library/react";
import { useDashboardMetrics } from "@/components/dashboard/hooks/useDashboardMetrics";
import {
  clearMockMetrics,
  setMockMetrics,
  setMockIsConnected,
} from "./test-utils";

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

describe("useDashboardMetrics - Initialization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    clearMockMetrics();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should initialize with loading state", () => {
    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.loading).toBe(true);
    expect(result.current.chartData).toEqual([]);
    expect(result.current.isConnected).toBe(false);
  });

  it("should set loading to false when connected", () => {
    setMockIsConnected(true);

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.loading).toBe(false);
    expect(result.current.isConnected).toBe(true);
  });

  it("should return null metrics when not available", () => {
    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.metrics).toBeNull();
  });

  it("should set loading to false when metrics are available", () => {
    setMockMetrics({
      cpu: { usage: 75 },
      memory: { used: 50 },
      totalRequests: 100,
    });

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.loading).toBe(false);
    expect(result.current.metrics).toEqual({
      cpu: { usage: 75 },
      memory: { used: 50 },
      totalRequests: 100,
    });
  });

  it("should set loading to false after connection timeout", () => {
    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.loading).toBe(true);

    act(() => {
      jest.advanceTimersByTime(15000);
    });

    expect(result.current.loading).toBe(false);
  });

  it("should clear connection timeout on unmount", () => {
    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

    const { unmount } = renderHook(() => useDashboardMetrics());

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  it("should return isConnected from useWebSocket", () => {
    setMockIsConnected(true);

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.isConnected).toBe(true);
  });

  it("should return connection state from useWebSocket", () => {
    setMockIsConnected(false);

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.isConnected).toBe(false);
  });

  it("should return all required properties", () => {
    setMockMetrics({
      cpu: { usage: 75 },
      memory: { used: 50 },
      totalRequests: 100,
    });

    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current).toHaveProperty("metrics");
    expect(result.current).toHaveProperty("chartData");
    expect(result.current).toHaveProperty("loading");
    expect(result.current).toHaveProperty("isConnected");
  });
});
