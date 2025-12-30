import { apiService } from "@/services/api-service";
import { apiClient } from "@/utils/api-client";
import { useStore } from "@/lib/store";

jest.mock("@/utils/api-client", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
}));

jest.mock("@/lib/store", () => ({
  useStore: {
    getState: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockStore = useStore as jest.Mocked<typeof useStore>;

describe("api-service - Additional Methods", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.getState.mockReturnValue({
      setModels: jest.fn(),
      addModel: jest.fn(),
      updateModel: jest.fn(),
      removeModel: jest.fn(),
      setMetrics: jest.fn(),
      setLogs: jest.fn(),
      clearLogs: jest.fn(),
      updateSettings: jest.fn(),
    } as any);
  });

  describe("getMetricsHistory", () => {
    it("should fetch metrics history with default params", async () => {
      const mockResponse = {
        success: true,
        data: [
          { cpuUsage: 50, memoryUsage: 60 },
          { cpuUsage: 55, memoryUsage: 65 },
        ],
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getMetricsHistory({});

      expect(mockApiClient.get).toHaveBeenCalledWith("/api/metrics/history", {
        params: {},
      });
      expect(result).toEqual(mockResponse.data);
    });

    it("should fetch metrics history with limit", async () => {
      const mockResponse = {
        success: true,
        data: [{ cpuUsage: 50 }],
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getMetricsHistory({ limit: 10 });

      expect(mockApiClient.get).toHaveBeenCalledWith("/api/metrics/history", {
        params: { limit: 10 },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it("should fetch metrics history with hours", async () => {
      const mockResponse = {
        success: true,
        data: [{ cpuUsage: 50 }],
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getMetricsHistory({ hours: 24 });

      expect(mockApiClient.get).toHaveBeenCalledWith("/api/metrics/history", {
        params: { hours: 24 },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it("should fetch metrics history with both params", async () => {
      const mockResponse = {
        success: true,
        data: [{ cpuUsage: 50 }],
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getMetricsHistory({ limit: 100, hours: 48 });

      expect(mockApiClient.get).toHaveBeenCalledWith("/api/metrics/history", {
        params: { limit: 100, hours: 48 },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it("should throw error when response is unsuccessful", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "Server error",
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await expect(
        apiService.getMetricsHistory({ limit: 10 })
      ).rejects.toThrow("Server error");
    });

    it("should use default error message when error is undefined", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "",
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await expect(
        apiService.getMetricsHistory({ hours: 24 })
      ).rejects.toThrow("Failed to fetch metrics history");
    });
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

    it("should throw error when clear logs fails", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "Failed to clear logs",
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.delete.mockResolvedValue(mockResponse);

      await expect(apiService.clearLogs()).rejects.toThrow(
        "Failed to clear logs"
      );
    });

    it("should use default error message when error is undefined", async () => {
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

  describe("getSystemInfo", () => {
    it("should fetch system info", async () => {
      const mockResponse = {
        success: true,
        data: {
          platform: "linux",
          nodeVersion: "18.0.0",
          uptime: 3600,
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getSystemInfo();

      expect(mockApiClient.get).toHaveBeenCalledWith("/api/system/info");
      expect(result).toEqual(mockResponse);
    });

    it("should handle error response", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "System error",
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getSystemInfo();

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe("System error");
    });
  });

  describe("restartSystem", () => {
    it("should restart system", async () => {
      const mockResponse = {
        success: true,
        data: { restarting: true },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.restartSystem();

      expect(mockApiClient.post).toHaveBeenCalledWith("/api/system/restart");
      expect(result).toEqual(mockResponse);
    });

    it("should handle restart error", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "Restart failed",
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.restartSystem();

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe("Restart failed");
    });
  });

  describe("shutdownSystem", () => {
    it("should shutdown system", async () => {
      const mockResponse = {
        success: true,
        data: { shutting: true },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.shutdownSystem();

      expect(mockApiClient.post).toHaveBeenCalledWith("/api/system/shutdown");
      expect(result).toEqual(mockResponse);
    });

    it("should handle shutdown error", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "Shutdown failed",
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.shutdownSystem();

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe("Shutdown failed");
    });
  });

  describe("generateText", () => {
    it("should generate text with basic prompt", async () => {
      const mockResponse = {
        success: true,
        data: { text: "Generated response" },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.generateText({ prompt: "Test prompt" });

      expect(mockApiClient.post).toHaveBeenCalledWith("/api/generate", {
        prompt: "Test prompt",
      });
      expect(result).toEqual(mockResponse);
    });

    it("should generate text with model", async () => {
      const mockResponse = {
        success: true,
        data: { text: "Generated response" },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.generateText({
        prompt: "Test",
        model: "llama-2",
      });

      expect(mockApiClient.post).toHaveBeenCalledWith("/api/generate", {
        prompt: "Test",
        model: "llama-2",
      });
      expect(result).toEqual(mockResponse);
    });

    it("should generate text with max_tokens", async () => {
      const mockResponse = {
        success: true,
        data: { text: "Generated response" },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.generateText({
        prompt: "Test",
        max_tokens: 500,
      });

      expect(mockApiClient.post).toHaveBeenCalledWith("/api/generate", {
        prompt: "Test",
        max_tokens: 500,
      });
      expect(result).toEqual(mockResponse);
    });

    it("should handle generation error", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "Generation failed",
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.generateText({ prompt: "Test" });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe("Generation failed");
    });
  });

  describe("chat", () => {
    it("should send chat message", async () => {
      const mockResponse = {
        success: true,
        data: { response: "Hello!" },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.chat({
        messages: [{ role: "user", content: "Hi" }],
      });

      expect(mockApiClient.post).toHaveBeenCalledWith("/api/chat", {
        messages: [{ role: "user", content: "Hi" }],
      });
      expect(result).toEqual(mockResponse);
    });

    it("should send chat with model", async () => {
      const mockResponse = {
        success: true,
        data: { response: "Response" },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.chat({
        messages: [{ role: "user", content: "Hi" }],
        model: "llama-2",
      });

      expect(mockApiClient.post).toHaveBeenCalledWith("/api/chat", {
        messages: [{ role: "user", content: "Hi" }],
        model: "llama-2",
      });
      expect(result).toEqual(mockResponse);
    });

    it("should send chat with max_tokens", async () => {
      const mockResponse = {
        success: true,
        data: { response: "Response" },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.chat({
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 1000,
      });

      expect(mockApiClient.post).toHaveBeenCalledWith("/api/chat", {
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 1000,
      });
      expect(result).toEqual(mockResponse);
    });

    it("should handle chat error", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "Chat failed",
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.chat({
        messages: [{ role: "user", content: "Hi" }],
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe("Chat failed");
    });
  });

  describe("getConfig", () => {
    it("should fetch config", async () => {
      const mockResponse = {
        success: true,
        data: { port: 8080, host: "localhost" },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getConfig();

      expect(mockApiClient.get).toHaveBeenCalledWith("/api/config");
      expect(result).toEqual(mockResponse);
    });

    it("should handle config error", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "Config error",
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getConfig();

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe("Config error");
    });
  });

  describe("updateConfig", () => {
    it("should update config", async () => {
      const mockResponse = {
        success: true,
        data: { port: 8081 },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.put.mockResolvedValue(mockResponse);

      const result = await apiService.updateConfig({ port: 8081 });

      expect(mockApiClient.put).toHaveBeenCalledWith("/api/config", {
        port: 8081,
      });
      expect(result).toEqual(mockResponse);
    });

    it("should handle update config error", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "400",
          message: "Invalid config",
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.put.mockResolvedValue(mockResponse);

      const result = await apiService.updateConfig({ port: -1 });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe("Invalid config");
    });
  });

  describe("error handling for additional methods", () => {
    it("should handle network errors in getMetricsHistory", async () => {
      mockApiClient.get.mockRejectedValue(new Error("Network error"));

      await expect(
        apiService.getMetricsHistory({ limit: 10 })
      ).rejects.toThrow("Network error");
    });

    it("should handle network errors in clearLogs", async () => {
      mockApiClient.delete.mockRejectedValue(new Error("Connection lost"));

      await expect(apiService.clearLogs()).rejects.toThrow("Connection lost");
    });
  });

  describe("parameter validation", () => {
    it("should handle limit of 0", async () => {
      const mockResponse = {
        success: true,
        data: [],
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getMetricsHistory({ limit: 0 });

      expect(mockApiClient.get).toHaveBeenCalledWith("/api/metrics/history", {
        params: { limit: 0 },
      });
      expect(result).toEqual([]);
    });

    it("should handle large limit value", async () => {
      const mockResponse = {
        success: true,
        data: [],
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getMetricsHistory({ limit: 10000 });

      expect(mockApiClient.get).toHaveBeenCalledWith("/api/metrics/history", {
        params: { limit: 10000 },
      });
    });

    it("should handle negative hours", async () => {
      const mockResponse = {
        success: true,
        data: [],
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getMetricsHistory({ hours: -1 });

      expect(mockApiClient.get).toHaveBeenCalledWith("/api/metrics/history", {
        params: { hours: -1 },
      });
    });
  });
});
