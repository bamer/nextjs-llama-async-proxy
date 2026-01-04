import { apiService } from '@/services/api-service';
import { mockApiClient, mockStore, setupMockStore } from './test-utils';

describe('api-service - getModels', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMockStore();
  });

  describe('getModels - Success Cases', () => {
    it('should return models successfully', async () => {
      const mockResponse = {
        success: true,
        data: [
          { id: 'model1', name: 'Model 1' },
          { id: 'model2', name: 'Model 2' },
        ],
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getModels();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/models');
      expect(result).toEqual(mockResponse.data);
      expect(mockStore.getState().setModels).toHaveBeenCalledWith(mockResponse.data);
    });
  });

  describe('getModels - Error Cases', () => {
    it('should throw error on failure', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: '500',
          message: 'Server error',
          details: {},
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await expect(apiService.getModels()).rejects.toThrow('Server error');
    });

    it('should handle network errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      await expect(apiService.getModels()).rejects.toThrow('Network error');
    });

    it('should handle undefined error message', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: '500',
          message: '',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await expect(apiService.getModels()).rejects.toThrow('Failed to fetch models');
    });
  });
});
