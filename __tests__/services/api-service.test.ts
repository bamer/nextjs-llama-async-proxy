import { apiService } from '@/services/api-service';
import { apiClient } from '@/utils/api-client';

jest.mock('@/utils/api-client');
jest.mock('axios');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('api-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

    it('should handle API errors', async () => {
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

      const result = await apiService.getModels();

      expect(result).toEqual(mockResponse.data);
      expect(mockResponse.data).toBeUndefined();
    });

    it('should handle network errors', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error',
          details: 'Connection failed',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getModels();

      expect(result).toEqual(mockResponse.data);
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

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/models', { modelId: 'model1' });
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

      const result = await apiService.loadModel('nonexistent');

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('unloadModel', () => {
    it('should unload model successfully', async () => {
      const mockResponse = {
        success: true,
        data: { id: 'model1', unloaded: true },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.delete.mockResolvedValue(mockResponse);

      const result = await apiService.unloadModel('model1');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/api/models/model1');
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

      mockApiClient.delete.mockResolvedValue(mockResponse);

      const result = await apiService.unloadModel('model1');

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getServerStatus', () => {
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

      const result = await apiService.getServerStatus();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/llama-server/status');
      expect(result).toEqual(mockResponse.data);
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

      const result = await apiService.getServerStatus();

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('startServer', () => {
    it('should start llama server successfully', async () => {
      const mockResponse = {
        success: true,
        data: { message: 'Server started' },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.startServer();

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/llama-server/start');
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle start errors', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: '500',
          message: 'Failed to start server',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.startServer();

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('stopServer', () => {
    it('should stop llama server successfully', async () => {
      const mockResponse = {
        success: true,
        data: { message: 'Server stopped' },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.stopServer();

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/llama-server/stop');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('restartServer', () => {
    it('should restart llama server successfully', async () => {
      const mockResponse = {
        success: true,
        data: { message: 'Server restarted' },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.restartServer();

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/llama-server/restart');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('error handling', () => {
    it('should throw descriptive errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network failure'));

      await expect(apiService.getModels()).rejects.toThrow();
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
