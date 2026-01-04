import { apiService } from '@/services/api-service';
import { apiClient } from '@/utils/api-client';
import { useStore } from '@/lib/store';

// Mock apiClient properly before importing
jest.mock('@/utils/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
}));

// Mock the store
jest.mock('@/lib/store', () => ({
  useStore: {
    getState: jest.fn(),
  },
}));

export const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
export const mockStore = useStore as jest.Mocked<typeof useStore>;

export const setupMockStore = () => {
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
};
