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

describe("api-service - Branch Coverage for Error Cases", () => {
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

  describe("getModels error branch", () => {
    it("should throw when response.success is false (line 19)", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "Server error",
          details: {},
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await expect(apiService.getModels()).rejects.toThrow("Server error");
    });

    it("should use default error message when response.error?.message is undefined (line 19)", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "",
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await expect(apiService.getModels()).rejects.toThrow("Failed to fetch models");
    });
  });

  describe("getModel error branch", () => {
    it("should throw when response.success is false (line 27)", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "404",
          message: "Model not found",
          details: {},
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await expect(apiService.getModel("model1")).rejects.toThrow("Model not found");
    });

    it("should use default error message when error.message is undefined (line 27)", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "404",
          message: "",
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await expect(apiService.getModel("nonexistent")).rejects.toThrow("Failed to fetch model nonexistent");
    });
  });

  describe("createModel error branch", () => {
    it("should throw when response.success is false (line 36)", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "400",
          message: "Invalid model data",
          details: {},
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      await expect(apiService.createModel({ name: "Test" } as any)).rejects.toThrow(
        "Invalid model data"
      );
    });

    it("should use default error message when error.message is undefined (line 36)", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "",
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      await expect(apiService.createModel({ name: "Test" } as any)).rejects.toThrow(
        "Failed to create model"
      );
    });
  });

  describe("updateModel error branch", () => {
    it("should throw when response.success is false (line 45)", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "404",
          message: "Model not found",
          details: {},
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.put.mockResolvedValue(mockResponse);

      await expect(
        apiService.updateModel("model1", { name: "Updated" })
      ).rejects.toThrow("Model not found");
    });

    it("should use default error message when error.message is undefined (line 45)", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "",
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.put.mockResolvedValue(mockResponse);

      await expect(
        apiService.updateModel("model1", { name: "Updated" })
      ).rejects.toThrow("Failed to update model model1");
    });
  });

  describe("deleteModel error branch", () => {
    it("should throw when response.success is false (line 54)", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "403",
          message: "Forbidden",
          details: {},
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.delete.mockResolvedValue(mockResponse);

      await expect(apiService.deleteModel("model1")).rejects.toThrow("Forbidden");
    });

    it("should use default error message when error.message is undefined (line 54)", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "",
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.delete.mockResolvedValue(mockResponse);

      await expect(apiService.deleteModel("model1")).rejects.toThrow(
        "Failed to delete model model1"
      );
    });
  });

  describe("startModel error branch", () => {
    it("should throw when response.success is false (line 63)", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "Failed to start",
          details: {},
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      await expect(apiService.startModel("model1")).rejects.toThrow(
        "Failed to start"
      );
    });

    it("should use default error message when error.message is undefined (line 63)", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "",
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      await expect(apiService.startModel("model1")).rejects.toThrow(
        "Failed to start model model1"
      );
    });
  });

  describe("stopModel error branch", () => {
    it("should throw when response.success is false (line 72)", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "Failed to stop",
          details: {},
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      await expect(apiService.stopModel("model1")).rejects.toThrow("Failed to stop");
    });

    it("should use default error message when error.message is undefined (line 72)", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "",
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      await expect(apiService.stopModel("model1")).rejects.toThrow(
        "Failed to stop model model1"
      );
    });
  });

  describe("getMetrics error branch", () => {
    it("should throw when response.success is false (line 82)", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "Metrics error",
          details: {},
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await expect(apiService.getMetrics()).rejects.toThrow("Metrics error");
    });

    it("should use default error message when error.message is undefined (line 82)", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "",
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await expect(apiService.getMetrics()).rejects.toThrow(
        "Failed to fetch metrics"
      );
    });
  });

  describe("getLogs error branch", () => {
    it("should throw when response.success is false (line 102)", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "Logs error",
          details: {},
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await expect(apiService.getLogs({ limit: 10 })).rejects.toThrow(
        "Logs error"
      );
    });

    it("should use default error message when error.message is undefined (line 102)", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "",
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await expect(apiService.getLogs({ limit: 10 })).rejects.toThrow(
        "Failed to fetch logs"
      );
    });
  });

  describe("updateSettings error branch", () => {
    it("should throw when response.success is false (line 125)", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "Settings error",
          details: {},
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.put.mockResolvedValue(mockResponse);

      await expect(apiService.updateSettings({ theme: "dark" })).rejects.toThrow(
        "Settings error"
      );
    });

    it("should use default error message when error.message is undefined (line 125)", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "",
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.put.mockResolvedValue(mockResponse);

      await expect(apiService.updateSettings({ theme: "dark" })).rejects.toThrow(
        "Failed to update settings"
      );
    });
  });

  describe("getMetricsHistory error branch", () => {
    it("should throw when response.success is false (line 92)", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "History error",
          details: {},
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await expect(apiService.getMetricsHistory({ limit: 10 })).rejects.toThrow(
        "History error"
      );
    });

    it("should use default error message when error.message is undefined (line 92)", async () => {
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

  describe("clearLogs error branch", () => {
    it("should throw when response.success is false (line 111)", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "Clear error",
          details: {},
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.delete.mockResolvedValue(mockResponse);

      await expect(apiService.clearLogs()).rejects.toThrow("Clear error");
    });

    it("should use default error message when error.message is undefined (line 111)", async () => {
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
});
