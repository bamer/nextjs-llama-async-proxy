import { apiService } from "@/services/api-service";
import { apiClient } from "@/utils/api-client";
import { useStore } from "@/lib/store";

// Mock apiClient properly before importing
jest.mock("@/utils/api-client", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
}));

// Mock the store
jest.mock("@/lib/store", () => ({
  useStore: {
    getState: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockStore = useStore as jest.Mocked<typeof useStore>;

describe("api-service - Additional Coverage", () => {
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
    // Positive test: Fetch metrics history successfully
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

    // Positive test: Fetch metrics history with empty params
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

    // Negative test: Handle fetch error for metrics history
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

    // Negative test: Handle undefined error message
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

  describe("clearLogs", () => {
    // Positive test: Clear logs successfully
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

    // Negative test: Handle clear logs failure
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

    // Negative test: Handle undefined error message
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
    // Positive test: Get settings successfully
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

    // Negative test: Handle error without throwing (returns ApiResponse)
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
    // Positive test: Get system info successfully
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

    // Negative test: Handle error without throwing
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

  describe("restartSystem", () => {
    // Positive test: Restart system successfully
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

    // Negative test: Handle error without throwing
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
    // Positive test: Shutdown system successfully
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

    // Negative test: Handle error without throwing
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

  describe("generateText", () => {
    // Positive test: Generate text successfully
    it("should generate text successfully", async () => {
      const mockResponse = {
        success: true,
        data: {
          text: "Generated text response",
          model: "llama-2-7b",
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.generateText({
        prompt: "Hello, world!",
        model: "llama-2-7b",
        max_tokens: 100,
      });

      expect(mockApiClient.post).toHaveBeenCalledWith("/api/generate", {
        prompt: "Hello, world!",
        model: "llama-2-7b",
        max_tokens: 100,
      });
      expect(result).toEqual(mockResponse);
    });

    // Positive test: Generate text with minimal params
    it("should generate text with only prompt", async () => {
      const mockResponse = {
        success: true,
        data: { text: "Generated text" },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.generateText({
        prompt: "Test prompt",
      });

      expect(mockApiClient.post).toHaveBeenCalledWith("/api/generate", {
        prompt: "Test prompt",
      });
      expect(result).toEqual(mockResponse);
    });

    // Negative test: Handle error without throwing
    it("should return error response without throwing", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "Failed to generate text",
          details: {},
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.generateText({ prompt: "Test" });

      expect(result).toEqual(mockResponse);
    });
  });

  describe("chat", () => {
    // Positive test: Chat successfully
    it("should handle chat successfully", async () => {
      const mockResponse = {
        success: true,
        data: {
          message: {
            role: "assistant",
            content: "Chat response",
          },
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const messages = [
        { role: "user", content: "Hello!" },
        { role: "assistant", content: "Hi there!" },
      ];

      const result = await apiService.chat({
        messages,
        model: "llama-2-7b",
        max_tokens: 150,
      });

      expect(mockApiClient.post).toHaveBeenCalledWith("/api/chat", {
        messages,
        model: "llama-2-7b",
        max_tokens: 150,
      });
      expect(result).toEqual(mockResponse);
    });

    // Positive test: Chat with minimal params
    it("should handle chat with only messages", async () => {
      const mockResponse = {
        success: true,
        data: { message: { role: "assistant", content: "Response" } },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.chat({
        messages: [{ role: "user", content: "Test" }],
      });

      expect(mockApiClient.post).toHaveBeenCalledWith("/api/chat", {
        messages: [{ role: "user", content: "Test" }],
      });
      expect(result).toEqual(mockResponse);
    });

    // Negative test: Handle error without throwing
    it("should return error response without throwing", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "Failed to chat",
          details: {},
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.chat({ messages: [] });

      expect(result).toEqual(mockResponse);
    });
  });

  describe("getConfig", () => {
    // Positive test: Get config successfully
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

    // Negative test: Handle error without throwing
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
    // Positive test: Update config successfully
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

    // Negative test: Handle error without throwing
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
