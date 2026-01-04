import { apiService } from "@/services/api-service";
import { mockApiClient, setupMocks, createMockApiResponse } from "./test-utils";

describe("api-service-additional - parameter validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  describe("getMetricsHistory parameter validation", () => {
    it("handles limit of 0", async () => {
      const mockResponse = createMockApiResponse([]);

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getMetricsHistory({ limit: 0 });

      expect(mockApiClient.get).toHaveBeenCalledWith("/api/metrics/history", {
        params: { limit: 0 },
      });
      expect(result).toEqual([]);
    });

    it("handles large limit value", async () => {
      const mockResponse = createMockApiResponse([]);

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getMetricsHistory({ limit: 10000 });

      expect(mockApiClient.get).toHaveBeenCalledWith("/api/metrics/history", {
        params: { limit: 10000 },
      });
    });

    it("handles negative hours", async () => {
      const mockResponse = createMockApiResponse([]);

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getMetricsHistory({ hours: -1 });

      expect(mockApiClient.get).toHaveBeenCalledWith("/api/metrics/history", {
        params: { hours: -1 },
      });
    });
  });
});
