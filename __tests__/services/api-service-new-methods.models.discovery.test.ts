import { apiService } from '@/services/api-service';
import { apiClient } from '@/utils/api-client';
import { useStore } from '@/lib/store';
import {
  setupApiTests,
  createMockResponse,
  createMockModel,
  createMockFitParams,
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

describe('api-service - Models Discovery', () => {
  describe('discoverModels', () => {
    it('should discover models successfully', async () => {
      const mockData = {
        discovered: [
          createMockModel('model1', 'Model 1'),
          createMockModel('model2', 'Model 2'),
        ],
      };
      const mockResponse = createMockResponse(true, mockData);

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.discoverModels(['/path/to/models']);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/models/discover', {
        paths: ['/path/to/models'],
      });
      expect(result).toEqual(mockResponse);
      expect(mockStore.getState().addModel).toHaveBeenCalledTimes(2);
    });

    it('should handle discovery errors', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: '500',
          message: 'Discovery failed',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      await expect(apiService.discoverModels(['/path'])).rejects.toThrow(
        'Discovery failed'
      );
    });
  });

  describe('analyzeFitParams', () => {
    it('should analyze fit params successfully', async () => {
      const mockData = {
        model: createMockModel('model1', 'Model 1'),
        fitParams: createMockFitParams(),
      };
      const mockResponse = createMockResponse(true, mockData);

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.analyzeFitParams('model1');

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/models/model1/analyze');
      expect(result).toEqual(mockResponse);
    });

    it('should handle analysis errors', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: '500',
          message: 'Analysis failed',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      await expect(apiService.analyzeFitParams('model1')).rejects.toThrow(
        'Analysis failed'
      );
    });
  });

  describe('getFitParams', () => {
    it('should get fit params successfully', async () => {
      const mockData = {
        model: createMockModel('model1', 'Model 1'),
        fitParams: createMockFitParams(),
      };
      const mockResponse = createMockResponse(true, mockData);

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getFitParams('model1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/models/model1/analyze');
      expect(result).toEqual(mockResponse);
    });
  });
});
