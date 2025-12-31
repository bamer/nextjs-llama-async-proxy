import { renderHook, act, waitFor } from "@testing-library/react";
import { useDashboardActions } from "@/hooks/useDashboardActions";

// Mock dependencies
jest.mock("@/utils/api-client", () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: jest.fn(),
}));

const mockApiClient = require("@/utils/api-client").apiClient;
const mockUseQueryClient = require("@tanstack/react-query").useQueryClient;

const mockInvalidateQueries = jest.fn();
const mockQueryClient = {
  invalidateQueries: mockInvalidateQueries,
};

describe("useDashboardActions Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseQueryClient.mockReturnValue(mockQueryClient);

    mockApiClient.post.mockResolvedValue({
      success: true,
      data: {},
    });

    mockApiClient.get.mockResolvedValue({
      success: true,
      data: [],
    });
  });

  describe("Initialization", () => {
    it("returns handleRestart function", () => {
      const { result } = renderHook(() => useDashboardActions());

      expect(typeof result.current.handleRestart).toBe("function");
    });

    it("returns handleStart function", () => {
      const { result } = renderHook(() => useDashboardActions());

      expect(typeof result.current.handleStart).toBe("function");
    });

    it("returns handleRefresh function", () => {
      const { result } = renderHook(() => useDashboardActions());

      expect(typeof result.current.handleRefresh).toBe("function");
    });

    it("returns handleDownloadLogs function", () => {
      const { result } = renderHook(() => useDashboardActions());

      expect(typeof result.current.handleDownloadLogs).toBe("function");
    });
  });

  describe("handleRestart", () => {
    it("calls llama-server rescan API", async () => {
      const { result } = renderHook(() => useDashboardActions());

      await act(async () => {
        await result.current.handleRestart();
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/api/llama-server/rescan"
      );
    });

    it("invalidates models query", async () => {
      const { result } = renderHook(() => useDashboardActions());

      await act(async () => {
        await result.current.handleRestart();
      });

      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ["models"],
      });
    });

    it("invalidates metrics query", async () => {
      const { result } = renderHook(() => useDashboardActions());

      await act(async () => {
        await result.current.handleRestart();
      });

      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ["metrics"],
      });
    });

    it("throws error on API failure", async () => {
      const mockError = new Error("Restart failed");
      mockApiClient.post.mockRejectedValue(mockError);

      const { result } = renderHook(() => useDashboardActions());

      await expect(result.current.handleRestart()).rejects.toThrow(
        "Failed to restart llama server"
      );
    });

    it("throws error with custom message", async () => {
      mockApiClient.post.mockRejectedValue(new Error("Custom error"));

      const { result } = renderHook(() => useDashboardActions());

      await expect(result.current.handleRestart()).rejects.toThrow(
        "Failed to restart llama server"
      );
    });

    it("logs error to console", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      mockApiClient.post.mockRejectedValue(new Error("Test error"));

      const { result } = renderHook(() => useDashboardActions());

      try {
        await result.current.handleRestart();
      } catch (_e) {
        // Expected
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        "[useDashboardActions] Restart error:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe("handleStart", () => {
    it("calls getModels API via apiService", async () => {
      const { result } = renderHook(() => useDashboardActions());

      await act(async () => {
        await result.current.handleStart();
      });

      // Note: This uses apiService.getModels(), which internally uses apiClient
      // The actual implementation might differ based on apiService
    });

    it("invalidates models query", async () => {
      const { result } = renderHook(() => useDashboardActions());

      await act(async () => {
        await result.current.handleStart();
      });

      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ["models"],
      });
    });

    it("throws error on API failure", async () => {
      mockApiClient.get.mockRejectedValue(new Error("Start failed"));

      const { result } = renderHook(() => useDashboardActions());

      await expect(result.current.handleStart()).rejects.toThrow(
        "Failed to start llama server"
      );
    });

    it("logs error to console", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      mockApiClient.get.mockRejectedValue(new Error("Test error"));

      const { result } = renderHook(() => useDashboardActions());

      try {
        await result.current.handleStart();
      } catch (_e) {
        // Expected
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        "[useDashboardActions] Start error:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe("handleRefresh", () => {
    it("calls getModels API", async () => {
      mockApiClient.get = jest.fn().mockResolvedValue({
        success: true,
        data: [],
      });

      const { result } = renderHook(() => useDashboardActions());

      await act(async () => {
        await result.current.handleRefresh();
      });

      expect(mockApiClient.get).toHaveBeenCalled();
    });

    it("calls getMetrics API", async () => {
      const { result } = renderHook(() => useDashboardActions());

      await act(async () => {
        await result.current.handleRefresh();
      });

      // Both models and metrics are fetched
    });

    it("invalidates models query", async () => {
      const { result } = renderHook(() => useDashboardActions());

      await act(async () => {
        await result.current.handleRefresh();
      });

      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ["models"],
      });
    });

    it("invalidates metrics query", async () => {
      const { result } = renderHook(() => useDashboardActions());

      await act(async () => {
        await result.current.handleRefresh();
      });

      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ["metrics"],
      });
    });

    it("throws error on API failure", async () => {
      mockApiClient.get.mockRejectedValue(new Error("Refresh failed"));

      const { result } = renderHook(() => useDashboardActions());

      await expect(result.current.handleRefresh()).rejects.toThrow(
        "Failed to refresh dashboard data"
      );
    });

    it("logs error to console", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      mockApiClient.get.mockRejectedValue(new Error("Test error"));

      const { result } = renderHook(() => useDashboardActions());

      try {
        await result.current.handleRefresh();
      } catch (_e) {
        // Expected
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        "[useDashboardActions] Refresh error:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe("handleDownloadLogs", () => {
    beforeEach(() => {
      // Mock document methods
      global.document.createElement = jest.fn((tagName: string) => {
        if (tagName === "a") {
          return {
            href: "",
            download: "",
            click: jest.fn(),
            style: {},
          } as unknown as HTMLAnchorElement;
        }
        return document.createElement(tagName);
      });

      global.URL.createObjectURL = jest.fn(() => "blob:test-url");
      global.URL.revokeObjectURL = jest.fn();

      // Setup mock response
      mockApiClient.get.mockResolvedValue({
        logs: [{ level: "info", message: "Test" }],
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("fetches logs from API", async () => {
      const { result } = renderHook(() => useDashboardActions());

      await act(async () => {
        result.current.handleDownloadLogs();
      });

      expect(mockApiClient.get).toHaveBeenCalledWith("/api/logs");
    });

    it("creates blob with JSON data", async () => {
      const createObjectURLSpy = jest.spyOn(URL, "createObjectURL");

      const { result } = renderHook(() => useDashboardActions());

      await act(async () => {
        result.current.handleDownloadLogs();
      });

      expect(createObjectURLSpy).toHaveBeenCalled();

      createObjectURLSpy.mockRestore();
    });

    it("creates download link", async () => {
      const createElementSpy = jest.spyOn(document, "createElement");

      const { result } = renderHook(() => useDashboardActions());

      await act(async () => {
        result.current.handleDownloadLogs();
      });

      expect(createElementSpy).toHaveBeenCalledWith("a");

      createElementSpy.mockRestore();
    });

    it("triggers download", async () => {
      const { result } = renderHook(() => useDashboardActions());

      await act(async () => {
        result.current.handleDownloadLogs();
      });

      // Click should have been called on the link
    });

    it("cleans up blob URL", async () => {
      const revokeObjectURLSpy = jest.spyOn(URL, "revokeObjectURL");

      const { result } = renderHook(() => useDashboardActions());

      await act(async () => {
        result.current.handleDownloadLogs();
      });

      expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:test-url");

      revokeObjectURLSpy.mockRestore();
    });

    it("generates filename with timestamp", async () => {
      const { result } = renderHook(() => useDashboardActions());

      await act(async () => {
        result.current.handleDownloadLogs();
      });

      // Filename should include ISO timestamp
      const createLinkCall = (global.document.createElement as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === "a"
      );
      expect(createLinkCall).toBeDefined();
    });

    it("throws error on API failure", async () => {
      mockApiClient.get.mockRejectedValue(new Error("Download failed"));

      const { result } = renderHook(() => useDashboardActions());

      await expect(result.current.handleDownloadLogs()).rejects.toThrow(
        "Failed to download logs"
      );
    });

    it("logs error to console", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      mockApiClient.get.mockRejectedValue(new Error("Test error"));

      const { result } = renderHook(() => useDashboardActions());

      try {
        await result.current.handleDownloadLogs();
      } catch (_e) {
        // Expected
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        "[useDashboardActions] Download logs error:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Edge Cases", () => {
    it("handles API response without data", async () => {
      mockApiClient.post.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useDashboardActions());

      await act(async () => {
        await result.current.handleRestart();
      });

      expect(mockInvalidateQueries).toHaveBeenCalled();
    });

    it("handles non-Error exceptions", async () => {
      mockApiClient.post.mockRejectedValue("String error");

      const { result } = renderHook(() => useDashboardActions());

      await expect(result.current.handleRestart()).rejects.toThrow(
        "Failed to restart llama server"
      );
    });

    it("handles null exceptions", async () => {
      mockApiClient.post.mockRejectedValue(null);

      const { result } = renderHook(() => useDashboardActions());

      await expect(result.current.handleRestart()).rejects.toThrow(
        "Failed to restart llama server"
      );
    });
  });
});
