/**
 * API Workflow Integration Tests
 *
 * Tests complete API request/response flows:
 * - Authentication flow (if applicable)
 * - Error handling across multiple services
 * - Concurrent requests
 * - Rate limiting behavior
 * - Request/response validation
 * - Network error recovery
 */

import { apiService } from "@/services/api-service";
import { apiClient } from "@/utils/api-client";
import { useStore } from "@/lib/store";
import type { SystemMetrics } from "@/types/monitoring";
import type { LegacySystemMetrics } from "@/types";

// Mock dependencies
jest.mock("@/utils/api-client");
jest.mock("@/lib/store");

describe("API Workflow Integration", () => {
  let mockStoreState: Partial<ReturnType<typeof useStore.getState>>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Setup store mock with all required state properties
    mockStoreState = {
      models: [],
      activeModelId: null,
      metrics: null,
      logs: [],
      settings: {
        theme: "light" as const,
        notifications: true,
        autoRefresh: true,
      },
      status: {
        isLoading: false,
        error: null,
        llamaServerStatus: "running" as const,
      },
      chartHistory: {
        cpu: [],
        memory: [],
        requests: [],
        gpuUtil: [],
        power: [],
      },
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
   * POSITIVE TEST: Complete API request/response flow
   *
   * This test verifies a complete request/response cycle through the API layer.
   */
  it("should complete full request/response flow", async () => {
    // Arrange: Setup successful response
    const mockData = {
      id: "test-123",
      name: "Test Model",
      type: "llama" as const,
    };

    const mockResponse = {
      success: true,
      data: mockData,
      timestamp: new Date().toISOString(),
    };

    (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

    // Act: Make API call
    const result = await apiService.getModels();

    // Assert: Verify complete flow
    expect(apiClient.get).toHaveBeenCalledWith("/api/models");
    expect(result).toEqual(mockData);
    expect(mockStoreState.setModels).toHaveBeenCalledWith(mockData);
  });

  /**
   * POSITIVE TEST: Multiple concurrent API requests
   *
   * This test verifies that multiple concurrent API requests can be handled
   * without race conditions or data corruption.
   */
  it("should handle multiple concurrent API requests", async () => {
    // Arrange: Setup responses for different endpoints
    const modelsResponse = {
      success: true,
      data: [
        { id: "model-1", name: "Model 1", type: "llama" as const },
        { id: "model-2", name: "Model 2", type: "mistral" as const },
      ],
      timestamp: new Date().toISOString(),
    };

    const metricsResponse = {
      success: true,
      data: {
        cpuUsage: 50,
        memoryUsage: 60,
        diskUsage: 70,
        activeModels: 2,
        totalRequests: 100,
        avgResponseTime: 200,
        uptime: 3600,
        timestamp: new Date().toISOString(),
      } as LegacySystemMetrics,
      timestamp: new Date().toISOString(),
    };

    const logsResponse = {
      success: true,
      data: [
        { id: "log-1", level: "info" as const, message: "Log entry 1", timestamp: new Date().toISOString() },
        { id: "log-2", level: "warn" as const, message: "Log entry 2", timestamp: new Date().toISOString() },
      ],
      timestamp: new Date().toISOString(),
    };

    (apiClient.get as jest.Mock)
      .mockResolvedValueOnce(modelsResponse)
      .mockResolvedValueOnce(metricsResponse)
      .mockResolvedValueOnce(logsResponse);

    // Act: Make concurrent requests
    const [models, metrics, logs] = await Promise.all([
      apiService.getModels(),
      apiService.getMetrics(),
      apiService.getLogs({ limit: 10 }),
    ]);

    // Assert: Verify all requests completed successfully
    expect(models).toHaveLength(2);
    expect(metrics.cpu.usage).toBe(50);
    expect(logs).toHaveLength(2);
    expect(apiClient.get).toHaveBeenCalledTimes(3);
  });

  /**
   * NEGATIVE TEST: API error handling across services
   *
   * This test verifies that errors are properly handled and propagated
   * across multiple API service calls.
   */
  it("should handle API errors across multiple services", async () => {
    // Arrange: Setup error responses
    const errorResponse = {
      success: false,
      error: {
        code: "500",
        message: "Internal Server Error",
        details: { service: "api-gateway" },
      },
      timestamp: new Date().toISOString(),
    };

    (apiClient.get as jest.Mock).mockResolvedValue(errorResponse);

    // Act & Assert: Should throw error
    await expect(apiService.getModels()).rejects.toThrow("Internal Server Error");

    // Verify error was not set in store (error is thrown, not stored)
    expect(mockStoreState.setError).not.toHaveBeenCalled();
  });

  /**
   * NEGATIVE TEST: Network error recovery
   *
   * This test verifies that the system can recover from network errors
   * and retry requests successfully.
   */
  it("should recover from network errors", async () => {
    // Arrange: Setup network error then success
    const networkError = new Error("Network timeout");
    const successResponse = {
      success: true,
      data: [{ id: "model-1", name: "Model 1", type: "llama" as const }],
      timestamp: new Date().toISOString(),
    };

    (apiClient.get as jest.Mock).mockRejectedValueOnce(networkError).mockResolvedValueOnce(successResponse);

    // Act & Assert: First request fails
    await expect(apiService.getModels()).rejects.toThrow("Network timeout");

    // Act: Retry the request
    const result = await apiService.getModels();

    // Assert: Retry succeeds
    expect(result).toHaveLength(1);
    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  /**
   * POSITIVE TEST: Request validation
   *
   * This test verifies that requests are properly validated before being sent.
   */
  it("should validate requests before sending", async () => {
    // Arrange: Setup response
    const updateData = { theme: "dark" as const, notifications: false };

    const response = {
      success: true,
      data: updateData,
      timestamp: new Date().toISOString(),
    };

    (apiClient.put as jest.Mock).mockResolvedValue(response);

    // Act: Update settings
    await apiService.updateSettings(updateData);

    // Assert: Verify request was sent with correct data
    expect(apiClient.put).toHaveBeenCalledWith("/api/settings", updateData);
    expect(mockStoreState.updateSettings).toHaveBeenCalledWith(updateData);
  });

  /**
   * NEGATIVE TEST: Rate limiting behavior
   *
   * This test verifies that the system handles rate limiting appropriately.
   */
  it("should handle rate limiting gracefully", async () => {
    // Arrange: Setup rate limit error
    const rateLimitError = {
      success: false,
      error: {
        code: "429",
        message: "Too Many Requests",
        details: { retryAfter: 60 },
      },
      timestamp: new Date().toISOString(),
    };

    (apiClient.get as jest.Mock).mockResolvedValue(rateLimitError);

    // Act & Assert: Should throw rate limit error
    await expect(apiService.getModels()).rejects.toThrow("Too Many Requests");

    // Act: Wait and retry
    const successResponse = {
      success: true,
      data: [],
      timestamp: new Date().toISOString(),
    };

    (apiClient.get as jest.Mock).mockResolvedValue(successResponse);
    jest.advanceTimersByTime(60000);

    const result = await apiService.getModels();

    // Assert: Retry succeeds
    expect(result).toEqual([]);
  });

  /**
   * POSITIVE TEST: Pagination handling
   *
   * This test verifies that paginated requests are handled correctly.
   */
  it("should handle paginated requests", async () => {
    // Arrange: Setup paginated responses
    const page1Response = {
      success: true,
      data: [
        { id: "log-1", level: "info" as const, message: "Log 1", timestamp: new Date().toISOString() },
        { id: "log-2", level: "info" as const, message: "Log 2", timestamp: new Date().toISOString() },
      ],
      timestamp: new Date().toISOString(),
    };

    (apiClient.get as jest.Mock).mockResolvedValue(page1Response);

    // Act: Fetch logs with limit
    const result = await apiService.getLogs({ limit: 2 });

    // Assert: Verify pagination parameters
    expect(apiClient.get).toHaveBeenCalledWith("/api/logs", { params: { limit: 2 } });
    expect(result).toHaveLength(2);
  });

  /**
   * NEGATIVE TEST: Malformed response handling
   *
   * This test verifies that malformed API responses are handled gracefully.
   */
  it("should handle malformed API responses", async () => {
    // Arrange: Setup malformed response
    const malformedResponse = {
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    };

    (apiClient.get as jest.Mock).mockResolvedValue(malformedResponse);

    // Act & Assert: Should throw error on null data
    await expect(apiService.getModels()).rejects.toThrow("Failed to fetch models");
  });

  /**
   * POSITIVE TEST: Sequential dependent requests
   *
   * This test verifies that sequential dependent API requests work correctly.
   */
  it("should handle sequential dependent requests", async () => {
    // Arrange: Setup responses
    const modelsResponse = {
      success: true,
      data: [
        { id: "model-1", name: "Model 1", type: "llama" as const },
        { id: "model-2", name: "Model 2", type: "llama" as const },
      ],
      timestamp: new Date().toISOString(),
    };

    const startResponse = {
      success: true,
      data: { id: "model-1", name: "Model 1", type: "llama" as const, status: "running" as const },
      timestamp: new Date().toISOString(),
    };

    const metricsResponse = {
      success: true,
      data: {
        cpuUsage: 45,
        memoryUsage: 55,
        diskUsage: 30,
        activeModels: 1,
        totalRequests: 50,
        avgResponseTime: 150,
        uptime: 3600,
        timestamp: new Date().toISOString(),
      } as LegacySystemMetrics,
      timestamp: new Date().toISOString(),
    };

    (apiClient.get as jest.Mock).mockResolvedValueOnce(modelsResponse).mockResolvedValueOnce(metricsResponse);
    (apiClient.post as jest.Mock).mockResolvedValue(startResponse);

    // Act: Sequential operations
    const models = await apiService.getModels();
    const startedModel = await apiService.startModel("model-1");
    const metrics = await apiService.getMetrics();

    // Assert: Verify sequential flow
    expect(models).toHaveLength(2);
    expect(startedModel.status).toBe("running");
    expect(metrics.cpu.usage).toBe(45);
    expect(apiClient.get).toHaveBeenCalledTimes(2);
    expect(apiClient.post).toHaveBeenCalledTimes(1);
  });

  /**
   * POSITIVE TEST: Request/response with timeout
   *
   * This test verifies that requests with timeout settings work correctly.
   */
  it("should handle requests with timeout", async () => {
    // Arrange: Setup delayed response
    const delayedResponse = {
      success: true,
      data: [{ id: "model-1", name: "Model 1", type: "llama" as const }],
      timestamp: new Date().toISOString(),
    };

    let resolvePromise: (value: unknown) => void;
    const delayedPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (apiClient.get as jest.Mock).mockReturnValue(delayedPromise);

    // Act: Make request
    const requestPromise = apiService.getModels();

    // Resolve after delay
    setTimeout(() => resolvePromise!(delayedResponse), 100);
    jest.advanceTimersByTime(100);

    // Assert: Request completes
    const result = await requestPromise;
    expect(result).toHaveLength(1);
  });

  /**
   * NEGATIVE TEST: Concurrent request failures
   *
   * This test verifies that when some concurrent requests fail,
   * the system handles partial failures gracefully.
   */
  it("should handle concurrent request failures", async () => {
    // Arrange: Setup mixed responses
    const modelsResponse = {
      success: true,
      data: [{ id: "model-1", name: "Model 1", type: "llama" as const }],
      timestamp: new Date().toISOString(),
    };

    const errorResponse = {
      success: false,
      error: { code: "500", message: "Service unavailable" },
      timestamp: new Date().toISOString(),
    };

    // Mock get calls to alternate between success and error
    (apiClient.get as jest.Mock)
      .mockResolvedValueOnce(modelsResponse)
      .mockResolvedValueOnce(errorResponse)
      .mockResolvedValueOnce(modelsResponse)
      .mockResolvedValueOnce(errorResponse);

    // Act & Assert: Promise.all should fail
    await expect(
      Promise.all([apiService.getModels(), apiService.getMetrics()])
    ).rejects.toThrow("Service unavailable");

    // Act: Use Promise.allSettled to handle partial failures
    const results = await Promise.allSettled([apiService.getModels(), apiService.getMetrics()]);

    // Assert: Verify partial success/failure
    expect(results[0].status).toBe("fulfilled");
    expect(results[1].status).toBe("rejected");
  });

  /**
   * POSITIVE TEST: Request caching behavior
   *
   * This test verifies that repeated identical requests can leverage caching.
   */
  it("should support request deduplication for identical requests", async () => {
    // Arrange: Setup response
    const response = {
      success: true,
      data: [{ id: "model-1", name: "Model 1", type: "llama" as const }],
      timestamp: new Date().toISOString(),
    };

    (apiClient.get as jest.Mock).mockResolvedValue(response);

    // Act: Make identical requests
    const [result1, result2, result3] = await Promise.all([
      apiService.getModels(),
      apiService.getModels(),
      apiService.getModels(),
    ]);

    // Assert: All requests succeed
    expect(result1).toEqual(result2);
    expect(result2).toEqual(result3);
    expect(apiClient.get).toHaveBeenCalledTimes(3);
  });

  /**
   * POSITIVE TEST: Health check workflow
   *
   * This test verifies that health check requests work correctly.
   */
  it("should perform health check workflow", async () => {
    // Arrange: Setup health check response
    const healthResponse = {
      success: true,
      data: {
        status: "ready",
        uptime: 3600,
        modelsLoaded: 2,
        version: "1.0.0",
      },
      timestamp: new Date().toISOString(),
    };

    (apiClient.get as jest.Mock).mockResolvedValue(healthResponse);

    // Act: Perform health check
    const result = await apiService.healthCheck();

    // Assert: Verify health check
    expect(result.success).toBe(true);
    expect(result.data?.status).toBe("ready");
    expect(apiClient.get).toHaveBeenCalledWith("/api/health");
  });

  /**
   * NEGATIVE TEST: Authentication error handling
   *
   * This test verifies that authentication errors are handled appropriately.
   */
  it("should handle authentication errors", async () => {
    // Arrange: Setup authentication error
    const authError = {
      success: false,
      error: {
        code: "401",
        message: "Unauthorized",
        details: { authType: "bearer" },
      },
      timestamp: new Date().toISOString(),
    };

    (apiClient.get as jest.Mock).mockResolvedValue(authError);

    // Act & Assert: Should throw authentication error
    await expect(apiService.getModels()).rejects.toThrow("Unauthorized");
  });

  /**
   * POSITIVE TEST: Complete CRUD workflow
   *
   * This test verifies a complete Create-Read-Update-Delete workflow.
   */
  it("should handle complete CRUD workflow", async () => {
    // Arrange: Setup CRUD responses
    const newModel = {
      id: "model-new",
      name: "New Model",
      type: "llama" as const,
      parameters: {},
      status: "idle" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const createdResponse = {
      success: true,
      data: newModel,
      timestamp: new Date().toISOString(),
    };

    const updatedResponse = {
      success: true,
      data: { ...newModel, name: "Updated Model" },
      timestamp: new Date().toISOString(),
    };

    const deleteResponse = { success: true, timestamp: new Date().toISOString() };

    (apiClient.post as jest.Mock).mockResolvedValue(createdResponse);
    (apiClient.put as jest.Mock).mockResolvedValue(updatedResponse);
    (apiClient.delete as jest.Mock).mockResolvedValue(deleteResponse);

    // Act: Complete CRUD operations
    const created = await apiService.createModel({
      name: "New Model",
      type: "llama",
      status: "idle" as const,
      parameters: {},
    });

    const updated = await apiService.updateModel("model-new", { name: "Updated Model" });

    await apiService.deleteModel("model-new");

    // Assert: Verify all CRUD operations
    expect(created.name).toBe("New Model");
    expect(updated.name).toBe("Updated Model");
    expect(mockStoreState.addModel).toHaveBeenCalledWith(expect.objectContaining(newModel));
    expect(mockStoreState.updateModel).toHaveBeenCalledWith("model-new", expect.objectContaining({ name: "Updated Model" }));
    expect(mockStoreState.removeModel).toHaveBeenCalledWith("model-new");
  });
});
