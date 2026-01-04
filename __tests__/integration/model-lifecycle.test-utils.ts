import { apiService } from "@/services/api-service";
import { apiClient } from "@/utils/api-client";
import { useStore } from "@/lib/store";

jest.mock("@/utils/api-client");
jest.mock("@/lib/store");

export const createMockStoreState = () => ({
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
});

export const setupMockStore = () => {
  const mockStoreState = createMockStoreState();
  (useStore.getState as jest.Mock).mockReturnValue(mockStoreState);
  return mockStoreState;
};

export const createMockModel = (id: string, name: string, status: "idle" | "running") => ({
  id,
  name,
  type: "llama" as const,
  status: status as const,
  parameters: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const createMockApiResponse = (success: boolean, data: unknown) => ({
  success,
  data,
  timestamp: new Date().toISOString(),
});

export const createMockErrorResponse = (code: string, message: string) => ({
  success: false,
  error: { code, message },
  timestamp: new Date().toISOString(),
});
