import { apiService } from '@/services/api-service';
import { apiClient } from '@/utils/api-client';
import { useStore } from '@/lib/store';
import {
  setupApiTests,
  createMockResponse,
} from '../services/api-service-test-helper';

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

// Mock store
jest.mock('@/lib/store', () => ({
  useStore: {
    getState: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockStore = useStore as jest.Mocked<typeof useStore>;

setupApiTests(mockStore);

describe('api-service - System Info', () => {
  describe('getSystemInfo', () => {
    it('should return system info', async () => {
      const mockData = {
        platform: 'linux',
        arch: 'x64',
        version: '1.0.0',
      };
      const mockResponse = createMockResponse(true, mockData);

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getSystemInfo();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/system/info');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('restartSystem', () => {
    it('should restart system', async () => {
      const mockResponse = {
        success: true,
        data: null,
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.restartSystem();

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/system/restart');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('shutdownSystem', () => {
    it('should shutdown system', async () => {
      const mockResponse = {
        success: true,
        data: null,
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.shutdownSystem();

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/system/shutdown');
      expect(result).toEqual(mockResponse);
    });
  });
});
