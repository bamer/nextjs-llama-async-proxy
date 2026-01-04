import { apiService } from "@/services/api-service";
import { mockApiClient, setupMockStore } from "./test-utils";

describe("api-service-coverage - Edge Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMockStore();
  });

  describe("edge cases", () => {
    it("should handle concurrent requests to same method", async () => {
      const mockResponse = {
        success: true,
        data: { id: "model1", name: "Model 1" },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const results = await Promise.all([
        apiService.getModel("model1"),
        apiService.getModel("model1"),
        apiService.getModel("model1"),
      ]);

      expect(results).toHaveLength(3);
      expect(mockApiClient.get).toHaveBeenCalledTimes(3);
    });

    it("should handle response without data field", async () => {
      const mockResponse = {
        success: true,
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await expect(apiService.getModel("model1")).rejects.toThrow();
    });
  });
});
