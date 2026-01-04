import { apiService } from '@/services/api-service';
import { mockApiClient, mockStore, setupMockStore } from './test-utils';

describe('api-service - System Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMockStore();
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
      expect(mockStore.getState().setMetrics).toHaveBeenCalledWith(mockResponse.data);
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
});
