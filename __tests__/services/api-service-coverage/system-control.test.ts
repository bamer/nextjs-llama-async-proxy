import { apiService } from "@/services/api-service";
import { mockApiClient, setupMockStore } from "./test-utils";

describe("api-service-coverage - System Control", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMockStore();
  });

  describe("restartSystem", () => {
    it("should restart system successfully", async () => {
      const mockResponse = {
        success: true,
        data: { message: "System restarting" },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.restartSystem();

      expect(mockApiClient.post).toHaveBeenCalledWith("/api/system/restart");
      expect(result).toEqual(mockResponse);
    });

    it("should return error response without throwing", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "Failed to restart system",
          details: {},
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.restartSystem();

      expect(result).toEqual(mockResponse);
    });
  });

  describe("shutdownSystem", () => {
    it("should shutdown system successfully", async () => {
      const mockResponse = {
        success: true,
        data: { message: "System shutting down" },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.shutdownSystem();

      expect(mockApiClient.post).toHaveBeenCalledWith("/api/system/shutdown");
      expect(result).toEqual(mockResponse);
    });

    it("should return error response without throwing", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "Failed to shutdown system",
          details: {},
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.shutdownSystem();

      expect(result).toEqual(mockResponse);
    });
  });

  describe("getConfig", () => {
    it("should return config successfully", async () => {
      const mockResponse = {
        success: true,
        data: {
          modelsPath: "/models",
          port: 8080,
          host: "localhost",
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getConfig();

      expect(mockApiClient.get).toHaveBeenCalledWith("/api/config");
      expect(result).toEqual(mockResponse);
    });

    it("should return error response without throwing", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "Failed to get config",
          details: {},
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getConfig();

      expect(result).toEqual(mockResponse);
    });
  });

  describe("updateConfig", () => {
    it("should update config successfully", async () => {
      const config = {
        modelsPath: "/new/models",
        port: 8081,
      };

      const mockResponse = {
        success: true,
        data: {
          ...config,
          message: "Config updated",
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.put.mockResolvedValue(mockResponse);

      const result = await apiService.updateConfig(config);

      expect(mockApiClient.put).toHaveBeenCalledWith("/api/config", config);
      expect(result).toEqual(mockResponse);
    });

    it("should return error response without throwing", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "Failed to update config",
          details: {},
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.put.mockResolvedValue(mockResponse);

      const result = await apiService.updateConfig({});

      expect(result).toEqual(mockResponse);
    });
  });
});
