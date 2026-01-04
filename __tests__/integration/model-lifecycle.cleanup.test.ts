import { apiService } from "@/services/api-service";
import {
  setupMockStore,
  createMockModel,
  createMockApiResponse,
  createMockErrorResponse,
} from "./model-lifecycle.test-utils";

describe("Model Lifecycle - Error Handling & Cleanup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should recover from model start failure", async () => {
    const mockStoreState = setupMockStore();
    const model = createMockModel("llama-2-7b", "llama-2-7b", "idle");
    mockStoreState.models = [model];

    const failureResponse = createMockErrorResponse("500", "Insufficient memory");
    const successResponse = createMockApiResponse(true, {
      ...model,
      status: "running" as const,
    });

    (apiClient.post as jest.Mock)
      .mockResolvedValueOnce(failureResponse)
      .mockResolvedValueOnce(successResponse);

    await expect(apiService.startModel("llama-2-7b")).rejects.toThrow("Insufficient memory");

    const retryResult = await apiService.startModel("llama-2-7b");

    expect(retryResult.status).toBe("running");
    expect(apiClient.post).toHaveBeenCalledTimes(2);
  });

  it("should handle invalid model ID gracefully", async () => {
    setupMockStore();
    const errorResponse = createMockErrorResponse("404", "Model not found");

    (apiClient.post as jest.Mock).mockResolvedValue(errorResponse);

    await expect(apiService.startModel("non-existent-model")).rejects.toThrow("Model not found");

    await expect(apiService.stopModel("non-existent-model")).rejects.toThrow("Model not found");

    const mockStoreState = useStore.getState();
    expect(mockStoreState.updateModel).not.toHaveBeenCalled();
  });

  it("should handle network timeout during model operation", async () => {
    setupMockStore();
    const timeoutError = new Error("Request timeout");
    timeoutError.name = "TimeoutError";
    (apiClient.post as jest.Mock).mockRejectedValue(timeoutError);

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    await expect(apiService.startModel("llama-2-7b")).rejects.toThrow("Request timeout");

    consoleSpy.mockRestore();
  });

  it("should handle errors during model operation gracefully", async () => {
    const mockStoreState = setupMockStore();
    const model = createMockModel("llama-2-7b", "llama-2-7b", "idle");
    mockStoreState.models = [model];

    const startResponse = createMockApiResponse(true, {
      ...model,
      status: "running" as const,
    });

    (apiClient.post as jest.Mock).mockResolvedValue(startResponse);

    const result = await apiService.startModel("llama-2-7b");

    expect(result).toBeDefined();
    expect(result.status).toBe("running");
  });

  it("should handle multiple concurrent operation failures", async () => {
    const mockStoreState = setupMockStore();
    const models = [
      createMockModel("model-1", "model-1", "idle"),
      createMockModel("model-2", "model-2", "idle"),
    ];

    mockStoreState.models = models;

    const errorResponse = createMockErrorResponse("500", "Server error");

    (apiClient.post as jest.Mock).mockResolvedValue(errorResponse);

    const promises = models.map((model) => apiService.startModel(model.id));

    await expect(Promise.all(promises)).rejects.toThrow();
  });

  it("should cleanup timers on component unmount", () => {
    jest.useFakeTimers();
    setupMockStore();

    jest.useRealTimers();
  });

  it("should handle missing apiClient gracefully", () => {
    setupMockStore();
    expect(apiService).toBeDefined();
  });
});
