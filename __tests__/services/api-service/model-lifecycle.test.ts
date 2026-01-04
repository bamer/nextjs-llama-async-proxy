import { apiService } from '@/services/api-service';
import { mockApiClient, mockStore, setupMockStore } from './test-utils';

describe('api-service - Model Lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMockStore();
  });

  describe('startModel', () => {
    it('should start model successfully', async () => {
      const mockResponse = {
        success: true,
        data: { id: 'model1', status: 'running' },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.startModel('model1');

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/models/model1/start');
      expect(result).toEqual(mockResponse.data);
      expect(mockStore.getState().updateModel).toHaveBeenCalledWith('model1', { status: 'running' });
    });

    it('should handle start errors', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: '500',
          message: 'Failed to start model',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      await expect(apiService.startModel('model1')).rejects.toThrow('Failed to start model');
    });
  });

  describe('stopModel', () => {
    it('should stop model successfully', async () => {
      const mockResponse = {
        success: true,
        data: { id: 'model1', status: 'idle' },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.stopModel('model1');

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/models/model1/stop');
      expect(result).toEqual(mockResponse.data);
      expect(mockStore.getState().updateModel).toHaveBeenCalledWith('model1', { status: 'idle' });
    });

    it('should handle stop errors', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: '500',
          message: 'Failed to stop model',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      await expect(apiService.stopModel('model1')).rejects.toThrow('Failed to stop model');
    });
  });

  describe('loadModel', () => {
    it('should load model successfully', async () => {
      const mockResponse = {
        success: true,
        data: { id: 'model1', loaded: true },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.loadModel('model1');

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/models/model1/load', { config: undefined });
      expect(result).toEqual(mockResponse);
    });

    it('should load model with config', async () => {
      const mockResponse = {
        success: true,
        data: { id: 'model1', loaded: true },
        timestamp: new Date().toISOString(),
      };
      const config = { ctx_size: 4096 };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.loadModel('model1', config);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/models/model1/load', { config });
      expect(result).toEqual(mockResponse);
    });

    it('should handle load errors gracefully', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: '404',
          message: 'Model not found',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.loadModel('nonexistent');
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Model not found');
    });
  });

  describe('unloadModel', () => {
    it('should unload model successfully', async () => {
      const mockResponse = {
        success: true,
        data: { id: 'model1', unloaded: true },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.unloadModel('model1');

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/models/model1/unload');
      expect(result).toEqual(mockResponse);
    });

    it('should handle unload errors gracefully', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: '500',
          message: 'Unload failed',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.unloadModel('model1');
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Unload failed');
    });
  });
});
