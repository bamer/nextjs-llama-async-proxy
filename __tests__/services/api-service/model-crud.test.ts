import { apiService } from '@/services/api-service';
import { mockApiClient, mockStore, setupMockStore } from './test-utils';

describe('api-service - Model CRUD Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMockStore();
  });

  describe('getModel', () => {
    it('should get single model', async () => {
      const mockResponse = {
        success: true,
        data: { id: 'model1', name: 'Model 1' },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getModel('model1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/models/model1');
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle model not found', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: '404',
          message: 'Model not found',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await expect(apiService.getModel('nonexistent')).rejects.toThrow('Model not found');
    });

    it('should handle network errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Connection refused'));

      await expect(apiService.getModel('model1')).rejects.toThrow('Connection refused');
    });
  });

  describe('createModel', () => {
    it('should create model successfully', async () => {
      const mockResponse = {
        success: true,
        data: { id: 'model1', name: 'Model 1' },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.createModel({ name: 'Model 1' } as unknown);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/models', { name: 'Model 1' });
      expect(result).toEqual(mockResponse.data);
      expect(mockStore.getState().addModel).toHaveBeenCalledWith(mockResponse.data);
    });

    it('should handle creation errors', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: '400',
          message: 'Invalid model data',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      await expect(apiService.createModel({ name: 'Model 1' } as unknown)).rejects.toThrow('Invalid model data');
    });
  });

  describe('updateModel', () => {
    it('should update model successfully', async () => {
      const mockResponse = {
        success: true,
        data: { id: 'model1', name: 'Updated Model 1' },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.put.mockResolvedValue(mockResponse);

      const result = await apiService.updateModel('model1', { name: 'Updated Model 1' });

      expect(mockApiClient.put).toHaveBeenCalledWith('/api/models/model1', { name: 'Updated Model 1' });
      expect(result).toEqual(mockResponse.data);
      expect(mockStore.getState().updateModel).toHaveBeenCalledWith('model1', mockResponse.data);
    });

    it('should handle update errors', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: '404',
          message: 'Model not found',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.put.mockResolvedValue(mockResponse);

      await expect(apiService.updateModel('nonexistent', { name: 'Test' })).rejects.toThrow('Model not found');
    });
  });

  describe('deleteModel', () => {
    it('should delete model successfully', async () => {
      const mockResponse = {
        success: true,
        timestamp: new Date().toISOString(),
      };

      mockApiClient.delete.mockResolvedValue(mockResponse);

      await apiService.deleteModel('model1');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/api/models/model1');
      expect(mockStore.getState().removeModel).toHaveBeenCalledWith('model1');
    });

    it('should handle delete errors', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: '404',
          message: 'Model not found',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.delete.mockResolvedValue(mockResponse);

      await expect(apiService.deleteModel('nonexistent')).rejects.toThrow('Model not found');
    });
  });
});
