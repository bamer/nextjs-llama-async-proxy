import { apiService } from "@/services/api-service";
import { mockApiClient, setupMocks, createMockApiResponse } from "./test-utils";

describe("api-service-additional - Additional Methods", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  describe("clearLogs", () => {
    it("clears logs successfully", async () => {
      const mockResponse = {
        success: true,
        timestamp: new Date().toISOString(),
      };

      mockApiClient.delete.mockResolvedValue(mockResponse);

      await apiService.clearLogs();

      expect(mockApiClient.delete).toHaveBeenCalledWith("/api/logs");
      expect(mockStore.getState().clearLogs).toHaveBeenCalled();
    });

    it("throws error when clear logs fails", async () => {
      const mockResponse = {
        success: false,
        error: { code: "500", message: "Failed to clear logs" },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.delete.mockResolvedValue(mockResponse);

      await expect(apiService.clearLogs()).rejects.toThrow("Failed to clear logs");
    });

    it("uses default error message when error is undefined", async () => {
      const mockResponse = {
        success: false,
        error: { code: "500", message: "" },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.delete.mockResolvedValue(mockResponse);

      await expect(apiService.clearLogs()).rejects.toThrow("Failed to clear logs");
    });

    it("handles network errors", async () => {
      mockApiClient.delete.mockRejectedValue(new Error("Connection lost"));

      await expect(apiService.clearLogs()).rejects.toThrow("Connection lost");
    });
  });

  describe("getSystemInfo", () => {
    it("fetches system info", async () => {
      const mockResponse = createMockApiResponse({
        platform: "linux",
        nodeVersion: "18.0.0",
        uptime: 3600,
      });

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getSystemInfo();

      expect(mockApiClient.get).toHaveBeenCalledWith("/api/system/info");
      expect(result).toEqual(mockResponse);
    });

    it("handles error response", async () => {
      const mockResponse = {
        success: false,
        error: { code: "500", message: "System error" },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getSystemInfo();

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe("System error");
    });
  });

  describe("restartSystem", () => {
    it("restarts system", async () => {
      const mockResponse = createMockApiResponse({ restarting: true });

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.restartSystem();

      expect(mockApiClient.post).toHaveBeenCalledWith("/api/system/restart");
      expect(result).toEqual(mockResponse);
    });

    it("handles restart error", async () => {
      const mockResponse = {
        success: false,
        error: { code: "500", message: "Restart failed" },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.restartSystem();

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe("Restart failed");
    });
  });

  describe("shutdownSystem", () => {
    it("shuts down system", async () => {
      const mockResponse = createMockApiResponse({ shutting: true });

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.shutdownSystem();

      expect(mockApiClient.post).toHaveBeenCalledWith("/api/system/shutdown");
      expect(result).toEqual(mockResponse);
    });

    it("handles shutdown error", async () => {
      const mockResponse = {
        success: false,
        error: { code: "500", message: "Shutdown failed" },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.shutdownSystem();

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe("Shutdown failed");
    });
  });
});
