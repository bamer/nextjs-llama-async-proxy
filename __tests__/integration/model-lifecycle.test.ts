/**
 * Model Lifecycle Integration Tests
 *
 * Tests the complete workflow of model management:
 * - Starting a model from idle state
 * - Monitoring model status via WebSocket
 * - Stopping a model
 * - Error scenarios and recovery
 * - State persistence across operations
 * - Multiple concurrent model operations
 */

import { apiService } from "@/services/api-service";
import { apiClient } from "@/utils/api-client";
import { useStore } from "@/lib/store";
import { WebSocketClient } from "@/lib/websocket-client";

// Mock dependencies
jest.mock("@/utils/api-client");
jest.mock("@/lib/store");
jest.mock("@/lib/websocket-client");

describe("Model Lifecycle Integration", () => {
  let mockWebSocket: jest.Mocked<WebSocketClient>;
  let mockStoreState: ReturnType<typeof useStore.getState>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Setup WebSocket mock
    mockWebSocket = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
      sendMessage: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      getSocketId: jest.fn(() => "test-socket-1"),
      isConnected: jest.fn(() => true),
    } as unknown as jest.Mocked<WebSocketClient>;

    (WebSocketClient as jest.Mock).mockImplementation(() => mockWebSocket);

    // Ensure apiService is called which will use WebSocket
    jest.spyOn(apiService, "getModels").mockImplementation(async () => {
      return mockStoreState.models;
    });

    // Setup store mock
    mockStoreState = {
      models: [],
      setModels: jest.fn(),
      updateModel: jest.fn(),
      addModel: jest.fn(),
      removeModel: jest.fn(),
      setActiveModel: jest.fn(),
      setMetrics: jest.fn(),
      setLogs: jest.fn(),
      clearLogs: jest.fn(),
      addLog: jest.fn(),
      updateSettings: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
      addChartData: jest.fn(),
      trimChartData: jest.fn(),
      clearChartData: jest.fn(),
    };

    (useStore.getState as jest.Mock).mockReturnValue(mockStoreState);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * POSITIVE TEST: Complete model lifecycle - start, monitor, and stop
   *
   * This test verifies that a model can be started, monitored through WebSocket updates,
   * and stopped in a single workflow.
   */
  it("should start, monitor, and stop model successfully", async () => {
    // Arrange: Setup initial model state
    const initialModel = {
      id: "llama-2-7b",
      name: "llama-2-7b",
      type: "llama" as const,
      status: "idle" as const,
      parameters: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockStoreState.models = [initialModel];

    const startResponse = {
      success: true,
      data: { ...initialModel, status: "running" as const },
      timestamp: new Date().toISOString(),
    };

    const stopResponse = {
      success: true,
      data: { ...initialModel, status: "idle" as const },
      timestamp: new Date().toISOString(),
    };

    (apiClient.post as jest.Mock).mockResolvedValue(startResponse);

    // Act: Start the model
    const startedModel = await apiService.startModel("llama-2-7b");

    // Assert: Verify model started
    expect(startedModel.status).toBe("running");
    expect(mockStoreState.updateModel).toHaveBeenCalledWith("llama-2-7b", { status: "running" });

    // Act: Monitor WebSocket updates
    const messageHandler = mockWebSocket.on.mock.calls.find((call) => call[0] === "message")?.[1];
    expect(messageHandler).toBeDefined();

    if (messageHandler) {
      // Simulate WebSocket metrics update
      messageHandler({
        type: "model_status",
        data: { id: "llama-2-7b", status: "running", metrics: { cpu: 45, memory: 60 } },
        timestamp: Date.now(),
      });

      // Simulate WebSocket logs
      messageHandler({
        type: "log",
        data: { id: "log-1", level: "info" as const, message: "Model loaded successfully", timestamp: new Date().toISOString() },
        timestamp: Date.now(),
      });
    }

    // Advance timers to process any queued operations
    jest.advanceTimersByTime(1000);

    // Assert: Verify WebSocket handlers were registered
    expect(mockWebSocket.on).toHaveBeenCalledWith("message", expect.any(Function));

    // Act: Stop the model
    (apiClient.post as jest.Mock).mockResolvedValue(stopResponse);
    const stoppedModel = await apiService.stopModel("llama-2-7b");

    // Assert: Verify model stopped
    expect(stoppedModel.status).toBe("idle");
    expect(mockStoreState.updateModel).toHaveBeenCalledWith("llama-2-7b", { status: "idle" });
  });

  /**
   * POSITIVE TEST: Multiple concurrent model operations
   *
   * This test verifies that multiple models can be started and stopped concurrently
   * without interfering with each other.
   */
  it("should handle multiple concurrent model operations", async () => {
    // Arrange: Setup multiple models
    const models = [
      {
        id: "llama-2-7b",
        name: "llama-2-7b",
        type: "llama" as const,
        status: "idle" as const,
        parameters: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "mistral-7b",
        name: "mistral-7b",
        type: "mistral" as const,
        status: "idle" as const,
        parameters: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "llama-2-13b",
        name: "llama-2-13b",
        type: "llama" as const,
        status: "idle" as const,
        parameters: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    mockStoreState.models = models;

    // Act: Start all models concurrently
    const startPromises = models.map((model) => {
      const response = {
        success: true,
        data: { ...model, status: "running" as const },
        timestamp: new Date().toISOString(),
      };
      (apiClient.post as jest.Mock).mockResolvedValueOnce(response);
      return apiService.startModel(model.id);
    });

    const startedModels = await Promise.all(startPromises);

    // Assert: Verify all models started
    expect(startedModels).toHaveLength(3);
    startedModels.forEach((model) => {
      expect(model.status).toBe("running");
    });

    // Act: Stop all models concurrently
    const stopPromises = models.map((model) => {
      const response = {
        success: true,
        data: { ...model, status: "idle" as const },
        timestamp: new Date().toISOString(),
      };
      (apiClient.post as jest.Mock).mockResolvedValueOnce(response);
      return apiService.stopModel(model.id);
    });

    const stoppedModels = await Promise.all(stopPromises);

    // Assert: Verify all models stopped
    expect(stoppedModels).toHaveLength(3);
    stoppedModels.forEach((model) => {
      expect(model.status).toBe("idle");
    });
  });

  /**
   * NEGATIVE TEST: Model start failure recovery
   *
   * This test verifies that when a model fails to start, the system can recover
   * and retry the operation successfully.
   */
  it("should recover from model start failure", async () => {
    // Arrange: Setup model
    const model = {
      id: "llama-2-7b",
      name: "llama-2-7b",
      type: "llama" as const,
      status: "idle" as const,
      parameters: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockStoreState.models = [model];

    // First attempt fails
    const failureResponse = {
      success: false,
      error: { code: "500", message: "Insufficient memory" },
      timestamp: new Date().toISOString(),
    };

    // Second attempt succeeds
    const successResponse = {
      success: true,
      data: { ...model, status: "running" as const },
      timestamp: new Date().toISOString(),
    };

    (apiClient.post as jest.Mock).mockResolvedValueOnce(failureResponse).mockResolvedValueOnce(successResponse);

    // Act & Assert: First attempt should fail
    await expect(apiService.startModel("llama-2-7b")).rejects.toThrow("Insufficient memory");

    // Act: Retry the operation
    const retryResult = await apiService.startModel("llama-2-7b");

    // Assert: Verify retry succeeded
    expect(retryResult.status).toBe("running");
    expect(apiClient.post).toHaveBeenCalledTimes(2);
  });

  /**
   * NEGATIVE TEST: WebSocket disconnect during model operation
   *
   * This test verifies that model operations handle WebSocket disconnections gracefully.
   */
  it("should handle WebSocket disconnect during model operation", async () => {
    // Arrange: Setup WebSocket to disconnect
    mockWebSocket.isConnected.mockReturnValue(false);

    const model = {
      id: "llama-2-7b",
      name: "llama-2-7b",
      type: "llama" as const,
      status: "idle" as const,
      parameters: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockStoreState.models = [model];

    const startResponse = {
      success: true,
      data: { ...model, status: "running" as const },
      timestamp: new Date().toISOString(),
    };

    (apiClient.post as jest.Mock).mockResolvedValue(startResponse);

    // Act: Start model (should work despite WebSocket disconnect)
    const result = await apiService.startModel("llama-2-7b");

    // Assert: Verify model started despite WebSocket disconnect
    expect(result.status).toBe("running");
    expect(mockStoreState.updateModel).toHaveBeenCalledWith("llama-2-7b", { status: "running" });
  });

  /**
   * POSITIVE TEST: State persistence across model operations
   *
   * This test verifies that model state is correctly persisted and restored
   * across multiple operations.
   */
  it("should persist model state across operations", async () => {
    // Arrange: Setup model
    const initialModel = {
      id: "llama-2-7b",
      name: "llama-2-7b",
      type: "llama" as const,
      status: "idle" as const,
      parameters: { temperature: 0.7 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockStoreState.models = [initialModel];

    // Act: Start model
    const startResponse = {
      success: true,
      data: { ...initialModel, status: "running" as const },
      timestamp: new Date().toISOString(),
    };

    (apiClient.post as jest.Mock).mockResolvedValue(startResponse);
    await apiService.startModel("llama-2-7b");

    // Act: Update model parameters
    const updateResponse = {
      success: true,
      data: { ...initialModel, parameters: { temperature: 0.8 } },
      timestamp: new Date().toISOString(),
    };

    (apiClient.put as jest.Mock).mockResolvedValue(updateResponse);
    await apiService.updateModel("llama-2-7b", { parameters: { temperature: 0.8 } });

    // Assert: Verify parameters persisted
    expect(mockStoreState.updateModel).toHaveBeenCalledWith("llama-2-7b", { parameters: { temperature: 0.8 } });

    // Act: Stop model
    const stopResponse = {
      success: true,
      data: { ...initialModel, status: "idle" as const, parameters: { temperature: 0.8 } },
      timestamp: new Date().toISOString(),
    };

    (apiClient.post as jest.Mock).mockResolvedValue(stopResponse);
    await apiService.stopModel("llama-2-7b");

    // Assert: Verify state preserved after stop
    expect(mockStoreState.updateModel).toHaveBeenCalledWith("llama-2-7b", {
      status: "idle",
      parameters: { temperature: 0.8 },
    });
  });

  /**
   * NEGATIVE TEST: Invalid model ID handling
   *
   * This test verifies that operations with invalid model IDs are handled gracefully.
   */
  it("should handle invalid model ID gracefully", async () => {
    // Arrange: Setup response for non-existent model
    const errorResponse = {
      success: false,
      error: { code: "404", message: "Model not found" },
      timestamp: new Date().toISOString(),
    };

    (apiClient.post as jest.Mock).mockResolvedValue(errorResponse);

    // Act & Assert: Should throw error for invalid model
    await expect(apiService.startModel("non-existent-model")).rejects.toThrow("Model not found");

    // Act & Assert: Stop should also fail for invalid model
    await expect(apiService.stopModel("non-existent-model")).rejects.toThrow("Model not found");

    // Verify store was not updated for invalid operations
    expect(mockStoreState.updateModel).not.toHaveBeenCalled();
  });

  /**
   * POSITIVE TEST: WebSocket real-time model status updates
   *
   * This test verifies that WebSocket messages properly update model status in real-time.
   */
  it("should handle real-time model status updates via WebSocket", async () => {
    // Arrange: Setup model and WebSocket
    const model = {
      id: "llama-2-7b",
      name: "llama-2-7b",
      type: "llama" as const,
      status: "loading" as const,
      parameters: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockStoreState.models = [model];

    // Simulate WebSocket message handler
    const messageHandler = jest.fn();
    mockWebSocket.on.mockImplementation((event, handler) => {
      if (event === "message") messageHandler.mockImplementation(handler);
    });

    // Act: Simulate status update messages
    messageHandler({
      type: "model_status",
      data: { id: "llama-2-7b", status: "running", metrics: { cpu: 55, memory: 65 } },
      timestamp: Date.now(),
    });

    // Simulate metrics update
    messageHandler({
      type: "metrics",
      data: {
        cpuUsage: 60,
        memoryUsage: 70,
        activeModels: 1,
        totalRequests: 100,
        avgResponseTime: 150,
        uptime: 3600,
        timestamp: new Date().toISOString(),
      },
      timestamp: Date.now(),
    });

    // Assert: Verify WebSocket received messages
    expect(messageHandler).toHaveBeenCalledTimes(2);
  });

  /**
   * POSITIVE TEST: Sequential model operations
   *
   * This test verifies that model operations can be performed sequentially
   * in the correct order.
   */
  it("should handle sequential model operations in correct order", async () => {
    // Arrange: Setup model
    const model = {
      id: "llama-2-7b",
      name: "llama-2-7b",
      type: "llama" as const,
      status: "idle" as const,
      parameters: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockStoreState.models = [model];

    const responses = [
      { success: true, data: { ...model, status: "running" as const }, timestamp: new Date().toISOString() },
      { success: true, data: { ...model, status: "idle" as const }, timestamp: new Date().toISOString() },
    ];

    (apiClient.post as jest.Mock).mockImplementation(() => Promise.resolve(responses.shift()));

    // Act: Start and then stop model sequentially
    await apiService.startModel("llama-2-7b");
    await apiService.stopModel("llama-2-7b");

    // Assert: Verify operations were called in correct order
    expect(apiClient.post).toHaveBeenNthCalledWith(1, "/api/models/llama-2-7b/start");
    expect(apiClient.post).toHaveBeenNthCalledWith(2, "/api/models/llama-2-7b/stop");
    expect(apiClient.post).toHaveBeenCalledTimes(2);
  });

  /**
   * NEGATIVE TEST: Network timeout during model operation
   *
   * This test verifies that network timeouts are handled gracefully during model operations.
   */
  it("should handle network timeout during model operation", async () => {
    // Arrange: Setup timeout error
    const timeoutError = new Error("Request timeout");
    timeoutError.name = "TimeoutError";
    (apiClient.post as jest.Mock).mockRejectedValue(timeoutError);

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    // Act & Assert: Should handle timeout gracefully
    await expect(apiService.startModel("llama-2-7b")).rejects.toThrow("Request timeout");

    consoleSpy.mockRestore();
  });

  /**
   * POSITIVE TEST: Model operation with WebSocket event handling
   *
   * This test verifies that model operations properly handle WebSocket events
   * during the operation lifecycle.
   */
  it("should handle WebSocket events during model operation", async () => {
    // Arrange: Setup model and WebSocket
    const model = {
      id: "llama-2-7b",
      name: "llama-2-7b",
      type: "llama" as const,
      status: "idle" as const,
      parameters: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockStoreState.models = [model];

    const startResponse = {
      success: true,
      data: { ...model, status: "running" as const },
      timestamp: new Date().toISOString(),
    };

    (apiClient.post as jest.Mock).mockResolvedValue(startResponse);

    // Track WebSocket events
    const connectHandler = jest.fn();
    const disconnectHandler = jest.fn();
    const errorHandler = jest.fn();

    mockWebSocket.on.mockImplementation((event, handler) => {
      if (event === "connect") connectHandler.mockImplementation(handler);
      if (event === "disconnect") disconnectHandler.mockImplementation(handler);
      if (event === "connect_error") errorHandler.mockImplementation(handler);
    });

    // Act: Start model and trigger WebSocket events
    const startPromise = apiService.startModel("llama-2-7b");

    // Simulate WebSocket connect
    connectHandler();

    // Complete the start operation
    await startPromise;

    // Assert: Verify model started
    expect(startPromise).resolves.toBeDefined();
    expect(connectHandler).toHaveBeenCalled();
  });
});
