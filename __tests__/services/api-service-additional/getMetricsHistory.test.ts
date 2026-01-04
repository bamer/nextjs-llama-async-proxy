import { apiService } from "@/services/api-service";
import { mockApiClient, setupMocks, createMockApiResponse } from "./test-utils";

describe("api-service-additional - getMetricsHistory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  describe("successful requests", () => {
    it("fetches metrics history with default params", async () => {
      const mockResponse = createMockApiResponse([
        { cpuUsage: 50, memoryUsage: 60 },
        { cpuUsage: 55, memoryUsage: 65 },
      ]);

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getMetricsHistory({});

      expect(mockApiClient.get).toHaveBeenCalledWith("/api/metrics/history", {
        params: {},
      });
      expect(result).toEqual(mockResponse.data);
    });

    it("fetches metrics history with limit", async () => {
      const mockResponse = createMockApiResponse([{ cpuUsage: 50 }]);

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getMetricsHistory({ limit: 10 });

      expect(mockApiClient.get).toHaveBeenCalledWith("/api/metrics/history", {
        params: { limit: 10 },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it("fetches metrics history with hours", async () => {
      const mockResponse = createMockApiResponse([{ cpuUsage: 50 }]);

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getMetricsHistory({ hours: 24 });

      expect(mockApiClient.get).toHaveBeenCalledWith("/api/metrics/history", {
        params: { hours: 24 },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it("fetches metrics history with both params", async () => {
      const mockResponse = createMockApiResponse([{ cpuUsage: 50 }]);

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getMetricsHistory({
        limit: 100,
        hours: 48,
      });

      expect(mockApiClient.get).toHaveBeenCalledWith("/api/metrics/history", {
        params: { limit: 100, hours: 48 },
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("error handling", () => {
    it("throws error when response is unsuccessful", async () => {
      const mockResponse = {
        success: false,
        error: { code: "500", message: "Server error" },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await expect(apiService.getMetricsHistory({ limit: 10 })).rejects.toThrow(
        "Server error"
      );
    });

    it("uses default error message when error is undefined", async () => {
      const mockResponse = {
        success: false,
        error: { code: "500", message: "" },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await expect(apiService.getMetricsHistory({ hours: 24 })).rejects.toThrow(
        "Failed to fetch metrics history"
      );
    });

    it("handles network errors", async () => {
      mockApiClient.get.mockRejectedValue(new Error("Network error"));

      await expect(apiService.getMetricsHistory({ limit: 10 })).rejects.toThrow(
        "Network error"
      );
    });
  });
});
