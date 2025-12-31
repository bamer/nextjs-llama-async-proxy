import { renderHook, act, waitFor } from "@testing-library/react";
import { useLoggerConfig, type LoggerConfig } from "@/hooks/useLoggerConfig";

// Mock dependencies
jest.mock("@/hooks/use-websocket", () => ({
  useWebSocket: jest.fn(),
}));

jest.mock("@/utils/api-client", () => ({
  apiClient: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports

// eslint-disable-next-line @typescript-eslint/no-require-imports

// eslint-disable-next-line @typescript-eslint/no-require-imports - Jest dynamic import
const mockUseWebSocket = jest.mocked(require("@/hooks/use-websocket")).useWebSocket;
// eslint-disable-next-line @typescript-eslint/no-require-imports - Jest dynamic import
const mockApiClient = jest.mocked(require("@/utils/api-client")).apiClient;

const defaultConfig: LoggerConfig = {
  level: "info",
  format: "json",
  maxFiles: 14,
  maxSize: "20m",
  enableConsole: true,
  enableFile: true,
  enableRemote: false,
};

describe("useLoggerConfig Hook", () => {
  const mockSendMessage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseWebSocket.mockReturnValue({
      sendMessage: mockSendMessage,
    });

    mockApiClient.get.mockResolvedValue({
      success: true,
      data: defaultConfig,
    });

    mockApiClient.put.mockResolvedValue({
      success: true,
      data: defaultConfig,
    });
  });

  describe("Initialization", () => {
    it("initializes with loading state", () => {
      mockApiClient.get.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          success: true,
          data: defaultConfig,
        }), 100))
      );

      const { result } = renderHook(() => useLoggerConfig());

      expect(result.current.loading).toBe(true);
    });

    it("initializes with null config", () => {
      mockApiClient.get.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          success: true,
          data: defaultConfig,
        }), 100))
      );

      const { result } = renderHook(() => useLoggerConfig());

      expect(result.current.config).toBeNull();
    });

    it("initializes with null original config", () => {
      mockApiClient.get.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          success: true,
          data: defaultConfig,
        }), 100))
      );

      const { result } = renderHook(() => useLoggerConfig());

      expect(result.current.originalConfig).toBeNull();
    });

    it("initializes with false hasChanges", () => {
      mockApiClient.get.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          success: true,
          data: defaultConfig,
        }), 100))
      );

      const { result } = renderHook(() => useLoggerConfig());

      expect(result.current.hasChanges).toBe(false);
    });

    it("initializes with null error", () => {
      mockApiClient.get.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          success: true,
          data: defaultConfig,
        }), 100))
      );

      const { result } = renderHook(() => useLoggerConfig());

      expect(result.current.error).toBeNull();
    });
  });

  describe("fetchConfig", () => {
    it("fetches config on mount", async () => {
      mockApiClient.get.mockResolvedValue({
        success: true,
        data: defaultConfig,
      });

      const { result } = renderHook(() => useLoggerConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith("/api/logger/config");
    });

    it("sets config after successful fetch", async () => {
      const { result } = renderHook(() => useLoggerConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.config).toEqual(defaultConfig);
    });

    it("sets original config after successful fetch", async () => {
      const { result } = renderHook(() => useLoggerConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.originalConfig).toEqual(defaultConfig);
    });

    it("resets hasChanges after successful fetch", async () => {
      const { result } = renderHook(() => useLoggerConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasChanges).toBe(false);
    });

    it("sets error on failed fetch", async () => {
      mockApiClient.get.mockResolvedValue({
        success: false,
        error: { message: "Fetch failed" },
      });

      const { result } = renderHook(() => useLoggerConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toContain("Failed to fetch logger config");
    });

    it("sets loading false after fetch completes", async () => {
      const { result } = renderHook(() => useLoggerConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe("updateConfig", () => {
    it("updates a single config value", async () => {
      const { result } = renderHook(() => useLoggerConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateConfig({ level: "debug" });
      });

      expect(result.current.config?.level).toBe("debug");
    });

    it("updates multiple config values", async () => {
      const { result } = renderHook(() => useLoggerConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateConfig({
          level: "debug",
          maxFiles: 20,
        });
      });

      expect(result.current.config?.level).toBe("debug");
      expect(result.current.config?.maxFiles).toBe(20);
    });

    it("sets hasChanges when config differs from original", async () => {
      const { result } = renderHook(() => useLoggerConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasChanges).toBe(false);

      act(() => {
        result.current.updateConfig({ level: "debug" });
      });

      expect(result.current.hasChanges).toBe(true);
    });

    it("does not set hasChanges when config matches original", async () => {
      const { result } = renderHook(() => useLoggerConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateConfig({ level: "info" }); // Same as original
      });

      expect(result.current.hasChanges).toBe(false);
    });

    it("handles update before config is loaded", async () => {
      mockApiClient.get.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          success: true,
          data: defaultConfig,
        }), 100))
      );

      const { result } = renderHook(() => useLoggerConfig());

      act(() => {
        result.current.updateConfig({ level: "debug" });
      });

      // Should not crash
    });
  });

  describe("resetConfig", () => {
    it("resets config to original", async () => {
      const { result } = renderHook(() => useLoggerConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateConfig({ level: "debug" });
      });

      expect(result.current.config?.level).toBe("debug");

      act(() => {
        result.current.resetConfig();
      });

      expect(result.current.config).toEqual(defaultConfig);
    });

    it("resets hasChanges to false", async () => {
      const { result } = renderHook(() => useLoggerConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateConfig({ level: "debug" });
      });

      expect(result.current.hasChanges).toBe(true);

      act(() => {
        result.current.resetConfig();
      });

      expect(result.current.hasChanges).toBe(false);
    });

    it("does nothing when original config is null", async () => {
      mockApiClient.get.mockResolvedValue({
        success: false,
        error: { message: "Fetch failed" },
      });

      const { result } = renderHook(() => useLoggerConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.resetConfig();
      });

      expect(result.current.config).toBeNull();
    });
  });

  describe("saveConfig", () => {
    it("saves config to API", async () => {
      const { result } = renderHook(() => useLoggerConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateConfig({ level: "debug" });
      });

      await act(async () => {
        await result.current.saveConfig();
      });

      expect(mockApiClient.put).toHaveBeenCalledWith(
        "/api/logger/config",
        expect.objectContaining({ level: "debug" })
      );
    });

    it("does not save when hasChanges is false", async () => {
      const { result } = renderHook(() => useLoggerConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.saveConfig();
      });

      expect(mockApiClient.put).not.toHaveBeenCalled();
    });

    it("updates original config after successful save", async () => {
      const { result } = renderHook(() => useLoggerConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateConfig({ level: "debug" });
      });

      await act(async () => {
        await result.current.saveConfig();
      });

      expect(result.current.originalConfig?.level).toBe("debug");
    });

    it("resets hasChanges after successful save", async () => {
      const { result } = renderHook(() => useLoggerConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateConfig({ level: "debug" });
      });

      await act(async () => {
        await result.current.saveConfig();
      });

      expect(result.current.hasChanges).toBe(false);
    });

    it("sends WebSocket message after successful save", async () => {
      const { result } = renderHook(() => useLoggerConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateConfig({ level: "debug" });
      });

      await act(async () => {
        await result.current.saveConfig();
      });

      expect(mockSendMessage).toHaveBeenCalledWith(
        "logger_config_updated",
        expect.objectContaining({ level: "debug" })
      );
    });

    it("sets error on failed save", async () => {
      mockApiClient.put.mockResolvedValue({
        success: false,
        error: { message: "Save failed" },
      });

      const { result } = renderHook(() => useLoggerConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateConfig({ level: "debug" });
      });

      await act(async () => {
        await result.current.saveConfig();
      });

      expect(result.current.error).toContain("Failed to save logger config");
    });

    it("sets loading true during save", async () => {
      let resolveSave: (value: unknown) => void;
      mockApiClient.put.mockReturnValue(
        new Promise((resolve) => {
          resolveSave = resolve;
        })
      );

      const { result } = renderHook(() => useLoggerConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateConfig({ level: "debug" });
      });

      act(() => {
        result.current.saveConfig();
      });

      expect(result.current.loading).toBe(true);

      resolveSave!({ success: true, data: defaultConfig });
    });
  });

  describe("Error Handling", () => {
    it("handles fetch error", async () => {
      mockApiClient.get.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useLoggerConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toContain("Failed to fetch logger config");
    });

    it("handles save error", async () => {
      mockApiClient.put.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useLoggerConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateConfig({ level: "debug" });
      });

      await act(async () => {
        await result.current.saveConfig();
      });

      expect(result.current.error).toContain("Failed to save logger config");
    });
  });

  describe("Edge Cases", () => {
    it("handles null config", async () => {
      mockApiClient.get.mockResolvedValue({
        success: true,
        data: null,
      });

      const { result } = renderHook(() => useLoggerConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.config).toBeNull();
    });

    it("handles undefined config", async () => {
      mockApiClient.get.mockResolvedValue({
        success: true,
        data: undefined,
      });

      const { result } = renderHook(() => useLoggerConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.config).toBeUndefined();
    });

    it("handles partial config object", async () => {
      const partialConfig = { level: "debug" } as LoggerConfig;

      const { result } = renderHook(() => useLoggerConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateConfig(partialConfig);
      });

      expect(result.current.config?.level).toBe("debug");
    });
  });
});
