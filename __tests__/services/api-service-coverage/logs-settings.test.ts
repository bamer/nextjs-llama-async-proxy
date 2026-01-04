import { apiService } from "@/services/api-service";
import { mockApiClient, mockStore, setupMockStore } from "./test-utils";

describe("api-service-coverage - Logs & Settings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMockStore();
  });

  describe("clearLogs", () => {
    it("should clear logs successfully", async () => {
      const mockResponse = {
        success: true,
        timestamp: new Date().toISOString(),
      };

      mockApiClient.delete.mockResolvedValue(mockResponse);

      await apiService.clearLogs();

      expect(mockApiClient.delete).toHaveBeenCalledWith("/api/logs");
      expect(mockStore.getState().clearLogs).toHaveBeenCalled();
    });

    it("should throw error when clearing logs fails", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "Failed to clear logs",
          details: {},
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.delete.mockResolvedValue(mockResponse);

      await expect(apiService.clearLogs()).rejects.toThrow("Failed to clear logs");
    });

    it("should handle undefined error message for clear logs", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "",
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.delete.mockResolvedValue(mockResponse);

      await expect(apiService.clearLogs()).rejects.toThrow("Failed to clear logs");
    });
  });

  describe("getSettings", () => {
    it("should return settings successfully", async () => {
      const mockResponse = {
        success: true,
        data: { theme: "dark", language: "en" },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getSettings();

      expect(mockApiClient.get).toHaveBeenCalledWith("/api/settings");
      expect(result).toEqual(mockResponse);
    });

    it("should return error response without throwing", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "Failed to fetch settings",
          details: {},
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getSettings();

      expect(result).toEqual(mockResponse);
    });
  });

  describe("getSystemInfo", () => {
    it("should return system info successfully", async () => {
      const mockResponse = {
        success: true,
        data: {
          os: "linux",
          arch: "x64",
          version: "1.0.0",
          uptime: 3600,
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getSystemInfo();

      expect(mockApiClient.get).toHaveBeenCalledWith("/api/system/info");
      expect(result).toEqual(mockResponse);
    });

    it("should return error response without throwing", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "Failed to fetch system info",
          details: {},
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getSystemInfo();

      expect(result).toEqual(mockResponse);
    });
  });
});
