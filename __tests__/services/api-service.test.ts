import { apiService } from '@/services/api-service';
import { apiClient } from '@/utils/api-client';

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

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('api-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getModels', () => {
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
    });

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
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle load errors', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: '404',
          message: 'Model not found',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      await expect(apiService.loadModel('nonexistent')).rejects.toThrow('Model not found');
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
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle unload errors', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: '500',
          message: 'Unload failed',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      await expect(apiService.unloadModel('model1')).rejects.toThrow('Unload failed');
    });
  });

  describe('healthCheck', () => {
    it('should return server status', async () => {
      const mockResponse = {
        success: true,
        data: {
          status: 'ready',
          uptime: 3600,
          modelsLoaded: 2,
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.healthCheck();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/health');
      expect(result).toEqual(mockResponse);
    });

    it('should handle server down', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: '503',
          message: 'Server not responding',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.healthCheck();

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getMetrics', () => {
    it('should return metrics', async () => {
      const mockResponse = {
        success: true,
        data: {
          cpuUsage: 50,
          memoryUsage: 60,
          diskUsage: 70,
          activeModels: 1,
          totalRequests: 100,
          avgResponseTime: 200,
          uptime: 3600,
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getMetrics();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/metrics');
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle metrics error', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: '500',
          message: 'Failed to fetch metrics',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await expect(apiService.getMetrics()).rejects.toThrow('Failed to fetch metrics');
    });
  });

  describe('getLogs', () => {
    it('should return logs', async () => {
      const mockResponse = {
        success: true,
        data: [
          { level: 'info', message: 'Test log' },
        ],
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getLogs({ limit: 10 });

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/logs', { params: { limit: 10 } });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle logs error', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: '500',
          message: 'Failed to fetch logs',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await expect(apiService.getLogs({ limit: 10 })).rejects.toThrow('Failed to fetch logs');
    });
  });

  describe('getSettings', () => {
    it('should return settings', async () => {
      const mockResponse = {
        success: true,
        data: { theme: 'dark' },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getSettings();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/settings');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateSettings', () => {
    it('should update settings', async () => {
      const mockResponse = {
        success: true,
        data: { theme: 'light' },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.put.mockResolvedValue(mockResponse);

      const result = await apiService.updateSettings({ theme: 'light' });

      expect(mockApiClient.put).toHaveBeenCalledWith('/api/settings', { theme: 'light' });
      expect(result).toEqual(mockResponse);
    });

    it('should handle update errors', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: '500',
          message: 'Failed to update settings',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.put.mockResolvedValue(mockResponse);

      await expect(apiService.updateSettings({ theme: 'light' })).rejects.toThrow('Failed to update settings');
    });
  });

  describe('error handling', () => {
    it('should throw descriptive errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network failure'));

      await expect(apiService.getModels()).rejects.toThrow('Network failure');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'Request timeout',
      };

      mockApiClient.get.mockRejectedValue(timeoutError);

      await expect(apiService.getModels()).rejects.toThrow();
    });
  });

  describe('integration', () => {
    it('should support full model lifecycle', async () => {
      const loadResponse = {
        success: true,
        data: { loaded: true },
        timestamp: new Date().toISOString(),
      };

      const unloadResponse = {
        success: true,
        data: { unloaded: true },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValueOnce(loadResponse).mockResolvedValueOnce(unloadResponse);

      await apiService.loadModel('model1');
      await apiService.unloadModel('model1');

      expect(mockApiClient.post).toHaveBeenCalledTimes(2);
    });
  });
});
