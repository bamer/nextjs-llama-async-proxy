import { apiService } from "@/services/api-service";
import {
  setupMockStore,
  createMockModel,
  createMockApiResponse,
} from "./model-lifecycle.test-utils";

describe("Model Lifecycle - Operations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should start, monitor, and stop model successfully", async () => {
    const mockStoreState = setupMockStore();
    const initialModel = createMockModel("llama-2-7b", "llama-2-7b", "idle");
    mockStoreState.models = [initialModel];

    const startResponse = createMockApiResponse(true, {
      ...initialModel,
      status: "running" as const,
    });

    const stopResponse = createMockApiResponse(true, {
      ...initialModel,
      status: "idle" as const,
    });

    (apiClient.post as jest.Mock).mockResolvedValue(startResponse);

    const startedModel = await apiService.startModel("llama-2-7b");

    expect(startedModel.status).toBe("running");
    expect(mockStoreState.updateModel).toHaveBeenCalledWith("llama-2-7b", {
      status: "running",
    });

    jest.advanceTimersByTime(1000);

    (apiClient.post as jest.Mock).mockResolvedValue(stopResponse);
    const stoppedModel = await apiService.stopModel("llama-2-7b");

    expect(stoppedModel.status).toBe("idle");
    expect(mockStoreState.updateModel).toHaveBeenCalledWith("llama-2-7b", {
      status: "idle",
    });
  });

  it("should handle multiple concurrent model operations", async () => {
    const mockStoreState = setupMockStore();
    const models = [
      createMockModel("llama-2-7b", "llama-2-7b", "idle"),
      createMockModel("mistral-7b", "mistral-7b", "idle"),
      createMockModel("llama-2-13b", "llama-2-13b", "idle"),
    ];

    mockStoreState.models = models;

    const startPromises = models.map((model) => {
      const response = createMockApiResponse(true, {
        ...model,
        status: "running" as const,
      });
      (apiClient.post as jest.Mock).mockResolvedValueOnce(response);
      return apiService.startModel(model.id);
    });

    const startedModels = await Promise.all(startPromises);

    expect(startedModels).toHaveLength(3);
    startedModels.forEach((model) => {
      expect(model.status).toBe("running");
    });

    const stopPromises = models.map((model) => {
      const response = createMockApiResponse(true, {
        ...model,
        status: "idle" as const,
      });
      (apiClient.post as jest.Mock).mockResolvedValueOnce(response);
      return apiService.stopModel(model.id);
    });

    const stoppedModels = await Promise.all(stopPromises);

    expect(stoppedModels).toHaveLength(3);
    stoppedModels.forEach((model) => {
      expect(model.status).toBe("idle");
    });
  });

  it("should update model state across operations", async () => {
    const mockStoreState = setupMockStore();
    const initialModel = createMockModel("llama-2-7b", "llama-2-7b", "idle");
    initialModel.parameters = { temperature: 0.7 };
    mockStoreState.models = [initialModel];

    const startResponse = createMockApiResponse(true, {
      ...initialModel,
      status: "running" as const,
    });

    (apiClient.post as jest.Mock).mockResolvedValue(startResponse);
    await apiService.startModel("llama-2-7b");

    const updateResponse = createMockApiResponse(true, {
      ...initialModel,
      status: "running" as const,
      parameters: { temperature: 0.8 },
    });

    (apiClient.put as jest.Mock).mockResolvedValue(updateResponse);
    await apiService.updateModel("llama-2-7b", { parameters: { temperature: 0.8 } });

    expect(mockStoreState.updateModel).toHaveBeenCalled();
    expect(apiClient.put).toHaveBeenCalledWith("/api/models/llama-2-7b", {
      parameters: { temperature: 0.8 },
    });

    const stopResponse = createMockApiResponse(true, {
      ...initialModel,
      status: "idle" as const,
      parameters: { temperature: 0.8 },
    });

    (apiClient.post as jest.Mock).mockResolvedValue(stopResponse);
    await apiService.stopModel("llama-2-7b");

    expect(apiClient.post).toHaveBeenCalledWith("/api/models/llama-2-7b/stop");
  });

  it("should handle sequential model operations in correct order", async () => {
    const mockStoreState = setupMockStore();
    const model = createMockModel("llama-2-7b", "llama-2-7b", "idle");
    mockStoreState.models = [model];

    const responses = [
      createMockApiResponse(true, { ...model, status: "running" as const }),
      createMockApiResponse(true, { ...model, status: "idle" as const }),
    ];

    (apiClient.post as jest.Mock).mockImplementation(() =>
      Promise.resolve(responses.shift())
    );

    await apiService.startModel("llama-2-7b");
    await apiService.stopModel("llama-2-7b");

    expect(apiClient.post).toHaveBeenNthCalledWith(1, "/api/models/llama-2-7b/start");
    expect(apiClient.post).toHaveBeenNthCalledWith(2, "/api/models/llama-2-7b/stop");
    expect(apiClient.post).toHaveBeenCalledTimes(2);
  });

  it("should handle complete workflow with getModels and operations", async () => {
    const mockStoreState = setupMockStore();
    const models = [createMockModel("llama-2-7b", "llama-2-7b", "idle")];

    const getModelsResponse = createMockApiResponse(true, models);

    (apiClient.get as jest.Mock).mockResolvedValue(getModelsResponse);

    const fetchedModels = await apiService.getModels();

    expect(fetchedModels).toEqual(models);
    expect(mockStoreState.setModels).toHaveBeenCalledWith(models);

    const startResponse = createMockApiResponse(true, {
      ...models[0],
      status: "running" as const,
    });

    (apiClient.post as jest.Mock).mockResolvedValue(startResponse);
    const startedModel = await apiService.startModel("llama-2-7b");

    expect(startedModel.status).toBe("running");
  });
});
