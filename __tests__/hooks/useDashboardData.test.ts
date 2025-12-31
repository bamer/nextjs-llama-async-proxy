import { renderHook, waitFor } from "@testing-library/react";
import { useDashboardData } from "@/hooks/useDashboardData";

// Mock dependencies
jest.mock("@/hooks/use-websocket", () => ({
  useWebSocket: jest.fn(),
}));

jest.mock("@/hooks/use-api", () => ({
  useApi: jest.fn(),
}));

const mockUseWebSocket = jest.mocked(require("@/hooks/use-websocket").useWebSocket);
const mockUseApi = jest.mocked(require("@/hooks/use-api").useApi);

describe("useDashboardData Hook", () => {
  const mockModels = [
    { id: "1", name: "Model 1", status: "running" },
    { id: "2", name: "Model 2", status: "idle" },
  ];

  const mockMetrics = {
    cpuUsage: 50,
    memoryUsage: 60,
    uptime: 3600,
  };

  const mockOn = jest.fn();
  const mockOff = jest.fn();
  const mockRequestMetrics = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseWebSocket.mockReturnValue({
      isConnected: false,
      connectionState: "disconnected",
      requestMetrics: mockRequestMetrics,
      on: mockOn,
      off: mockOff,
    });

    mockUseApi.mockImplementation((endpoint: string) => {
      if (endpoint === "/api/models") {
        return {
          data: mockModels,
          isLoading: false,
          error: null,
        };
      }
      if (endpoint === "/api/metrics") {
        return {
          data: mockMetrics,
          isLoading: false,
          error: null,
        };
      }
      return {
        data: null,
        isLoading: false,
        error: null,
      };
    });
  });

  describe("Initialization", () => {
    it("initializes with loading state", () => {
      const { result } = renderHook(() => useDashboardData());

      expect(result.current.loading).toBe(true);
    });

    it("initializes with null error", () => {
      const { result } = renderHook(() => useDashboardData());

      expect(result.current.error).toBeNull();
    });

    it("initializes with null metrics", () => {
      const { result } = renderHook(() => useDashboardData());

      expect(result.current.metrics).toBeNull();
    });

    it("returns models array", () => {
      const { result } = renderHook(() => useDashboardData());

      expect(Array.isArray(result.current.models)).toBe(true);
    });

    it("returns connectionState", () => {
      const { result } = renderHook(() => useDashboardData());

      expect(result.current.connectionState).toBe("disconnected");
    });
  });

  describe("Data Fetching - API", () => {
    it("fetches models data via API", () => {
      renderHook(() => useDashboardData());

      expect(mockUseApi).toHaveBeenCalledWith("/api/models");
    });

    it("fetches metrics data via API", () => {
      renderHook(() => useDashboardData());

      expect(mockUseApi).toHaveBeenCalledWith("/api/metrics");
    });

    it("returns models from API response", () => {
      const { result } = renderHook(() => useDashboardData());

      expect(result.current.models).toEqual(mockModels);
    });

    it("uses API metrics when WebSocket disconnected", () => {
      const { result } = renderHook(() => useDashboardData());

      expect(result.current.metrics).toEqual(mockMetrics);
    });
  });

  describe("Data Fetching - WebSocket", () => {
    beforeEach(() => {
      mockUseWebSocket.mockReturnValue({
        isConnected: true,
        connectionState: "connected",
        requestMetrics: mockRequestMetrics,
        on: mockOn,
        off: mockOff,
      });
    });

    it("requests metrics via WebSocket when connected", () => {
      renderHook(() => useDashboardData());

      expect(mockRequestMetrics).toHaveBeenCalled();
    });

    it("registers metrics event handler", () => {
      renderHook(() => useDashboardData());

      expect(mockOn).toHaveBeenCalledWith(
        "metrics",
        expect.any(Function)
      );
    });

    it("unregisters metrics event handler on cleanup", () => {
      const { unmount } = renderHook(() => useDashboardData());

      unmount();

      expect(mockOff).toHaveBeenCalledWith(
        "metrics",
        expect.any(Function)
      );
    });

    it("updates metrics from WebSocket message", async () => {
      let metricsHandler: ((data: unknown) => void) | undefined;

      mockOn.mockImplementation((event: string, handler: (data: unknown) => void) => {
        if (event === "metrics") {
          metricsHandler = handler;
        }
      });

      const { result } = renderHook(() => useDashboardData());

      const newMetrics = {
        cpuUsage: 75,
        memoryUsage: 80,
        uptime: 7200,
      };

      await waitFor(() => {
        if (metricsHandler) {
          metricsHandler(newMetrics);
        }
      });

      // The handler should have been called
      expect(mockOn).toHaveBeenCalledWith("metrics", expect.any(Function));
    });

    it("handles metrics update gracefully", () => {
      renderHook(() => useDashboardData());

      expect(mockOn).toHaveBeenCalledWith("metrics", expect.any(Function));
    });

    it("handles malformed metrics data", () => {
      mockUseApi.mockImplementation((endpoint: string) => {
        if (endpoint === "/api/metrics") {
          return {
            data: { invalid: "data" },
            isLoading: false,
            error: null,
          };
        }
        return {
          data: mockModels,
          isLoading: false,
          error: null,
        };
      });

      expect(() => {
        renderHook(() => useDashboardData());
      }).not.toThrow();
    });
  });

  describe("Error Handling", () => {
    it("sets error when models API fails", () => {
      mockUseApi.mockImplementation((endpoint: string) => {
        if (endpoint === "/api/models") {
          return {
            data: null,
            isLoading: false,
            error: new Error("Failed to load models"),
          };
        }
        return {
          data: mockMetrics,
          isLoading: false,
          error: null,
        };
      });

      const { result } = renderHook(() => useDashboardData());

      expect(result.current.error).toContain("models");
    });

    it("sets error when metrics API fails", () => {
      mockUseApi.mockImplementation((endpoint: string) => {
        if (endpoint === "/api/models") {
          return {
            data: mockModels,
            isLoading: false,
            error: null,
          };
        }
        return {
          data: null,
          isLoading: false,
          error: new Error("Failed to load metrics"),
        };
      });

      const { result } = renderHook(() => useDashboardData());

      expect(result.current.error).toContain("metrics");
    });

    it("sets loading false when both queries complete", async () => {
      mockUseApi.mockImplementation((endpoint: string) => ({
        data: endpoint === "/api/models" ? mockModels : mockMetrics,
        isLoading: false,
        error: null,
      }));

      const { result } = renderHook(() => useDashboardData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it("sets loading true when any query is loading", () => {
      mockUseApi.mockImplementation((endpoint: string) => {
        if (endpoint === "/api/models") {
          return {
            data: mockModels,
            isLoading: true,
            error: null,
          };
        }
        return {
          data: mockMetrics,
          isLoading: false,
          error: null,
        };
      });

      const { result } = renderHook(() => useDashboardData());

      expect(result.current.loading).toBe(true);
    });
  });

  describe("Loading State", () => {
    it("is true when models is loading", () => {
      mockUseApi.mockImplementation((endpoint: string) => {
        if (endpoint === "/api/models") {
          return {
            data: null,
            isLoading: true,
            error: null,
          };
        }
        return {
          data: mockMetrics,
          isLoading: false,
          error: null,
        };
      });

      const { result } = renderHook(() => useDashboardData());

      expect(result.current.loading).toBe(true);
    });

    it("is true when metrics is loading", () => {
      mockUseApi.mockImplementation((endpoint: string) => {
        if (endpoint === "/api/metrics") {
          return {
            data: null,
            isLoading: true,
            error: null,
          };
        }
        return {
          data: mockModels,
          isLoading: false,
          error: null,
        };
      });

      const { result } = renderHook(() => useDashboardData());

      expect(result.current.loading).toBe(true);
    });

    it("is false when both queries complete", () => {
      mockUseApi.mockImplementation(() => ({
        data: null,
        isLoading: false,
        error: null,
      }));

      const { result } = renderHook(() => useDashboardData());

      expect(result.current.loading).toBe(false);
    });
  });

  describe("Models Data", () => {
    it("returns empty array when models is null", () => {
      mockUseApi.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useDashboardData());

      expect(result.current.models).toEqual([]);
    });

    it("returns empty array when models is undefined", () => {
      mockUseApi.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useDashboardData());

      expect(result.current.models).toEqual([]);
    });

    it("returns models array when data exists", () => {
      const { result } = renderHook(() => useDashboardData());

      expect(result.current.models).toEqual(mockModels);
    });
  });

  describe("Connection State", () => {
    it("returns connection state from useWebSocket", () => {
      mockUseWebSocket.mockReturnValue({
        isConnected: false,
        connectionState: "connecting",
        requestMetrics: mockRequestMetrics,
        on: mockOn,
        off: mockOff,
      });

      const { result } = renderHook(() => useDashboardData());

      expect(result.current.connectionState).toBe("connecting");
    });

    it("returns connected state when WebSocket is connected", () => {
      mockUseWebSocket.mockReturnValue({
        isConnected: true,
        connectionState: "connected",
        requestMetrics: mockRequestMetrics,
        on: mockOn,
        off: mockOff,
      });

      const { result } = renderHook(() => useDashboardData());

      expect(result.current.connectionState).toBe("connected");
    });
  });

  describe("Edge Cases", () => {
    it("handles malformed metrics data", () => {
      mockUseApi.mockImplementation((endpoint: string) => {
        if (endpoint === "/api/metrics") {
          return {
            data: { invalid: "data" },
            isLoading: false,
            error: null,
          };
        }
        return {
          data: mockModels,
          isLoading: false,
          error: null,
        };
      });

      expect(() => {
        renderHook(() => useDashboardData());
      }).not.toThrow();
    });

    it("handles error objects", () => {
      mockUseApi.mockImplementation((endpoint: string) => {
        if (endpoint === "/api/models") {
          return {
            data: null,
            isLoading: false,
            error: { message: "Custom error" },
          };
        }
        return {
          data: mockMetrics,
          isLoading: false,
          error: null,
        };
      });

      const { result } = renderHook(() => useDashboardData());

      expect(result.current.error).toContain("models");
    });
  });

  describe("Cleanup", () => {
    it("cleans up WebSocket listeners on unmount", () => {
      mockUseWebSocket.mockReturnValue({
        isConnected: true,
        connectionState: "connected",
        requestMetrics: mockRequestMetrics,
        on: mockOn,
        off: mockOff,
      });

      const { unmount } = renderHook(() => useDashboardData());

      expect(mockOn).toHaveBeenCalled();

      unmount();

      expect(mockOff).toHaveBeenCalled();
    });
  });
});
