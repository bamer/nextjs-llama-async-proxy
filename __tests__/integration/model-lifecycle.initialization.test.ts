import { apiService } from "@/services/api-service";
import { setupMockStore, createMockModel, createMockApiResponse } from "./model-lifecycle.test-utils";

describe("Model Lifecycle - Initialization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("initializes with empty model list", () => {
    setupMockStore();
    expect(useStore.getState).toHaveBeenCalled();
  });

  it("initializes with default store state", () => {
    const mockStoreState = setupMockStore();
    expect(mockStoreState.models).toEqual([]);
    expect(mockStoreState.activeModelId).toBeNull();
    expect(mockStoreState.metrics).toBeNull();
  });

  it("initializes with default settings", () => {
    const mockStoreState = setupMockStore();
    expect(mockStoreState.settings.theme).toBe("light");
    expect(mockStoreState.settings.notifications).toBe(true);
    expect(mockStoreState.settings.autoRefresh).toBe(true);
  });

  it("initializes with empty chart history", () => {
    const mockStoreState = setupMockStore();
    expect(mockStoreState.chartHistory.cpu).toEqual([]);
    expect(mockStoreState.chartHistory.memory).toEqual([]);
    expect(mockStoreState.chartHistory.requests).toEqual([]);
    expect(mockStoreState.chartHistory.gpuUtil).toEqual([]);
    expect(mockStoreState.chartHistory.power).toEqual([]);
  });

  it("initializes with idle status", () => {
    const mockStoreState = setupMockStore();
    expect(mockStoreState.status.isLoading).toBe(false);
    expect(mockStoreState.status.error).toBeNull();
  });
});
