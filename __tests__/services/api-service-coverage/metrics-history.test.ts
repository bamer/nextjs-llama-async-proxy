import { apiService } from "@/services/api-service";
import { mockApiClient, setupMockStore } from "./test-utils";

describe("api-service-coverage - Metrics History", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMockStore();
  });

  describe("getMetricsHistory", () => {
    it("should return metrics history successfully", async () => {
      const mockHistory = [
        { cpuUsage: 50, memoryUsage: 60, timestamp: "2024-01-01T00:00:00Z" },
        { cpuUsage: 55, memoryUsage: 65, timestamp: "2024-01-01T00:01:00Z" },
      ];

      const mockResponse = {
        success: true,
        data: mockHistory,
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getMetricsHistory({ limit: 10, hours: 24 });

      expect(mockApiClient.get).toHaveBeenCalledWith("/api/metrics/history", {
        params: { limit: 10, hours: 24 },
      });
      expect(result).toEqual(mockHistory);
    });

    it("should handle empty params for metrics history", async () => {
      const mockResponse = {
        success: true,
        data: [],
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getMetricsHistory({});

      expect(mockApiClient.get).toHaveBeenCalledWith("/api/metrics/history", {
        params: {},
      });
      expect(result).toEqual([]);
    });

    it("should throw error when fetching metrics history fails", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "Failed to fetch metrics history",
          details: {},
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await expect(apiService.getMetricsHistory({ limit: 10 })).rejects.toThrow(
        "Failed to fetch metrics history"
      );
    });

    it("should handle undefined error message for metrics history", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "",
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await expect(apiService.getMetricsHistory({ limit: 10 })).rejects.toThrow(
        "Failed to fetch metrics history"
      );
    });
  });
});
