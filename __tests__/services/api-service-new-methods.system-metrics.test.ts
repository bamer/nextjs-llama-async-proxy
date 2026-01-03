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

describe('api-service - System Metrics', () => {
  describe('getSystemMetrics', () => {
    it('should return system metrics', async () => {
      const mockData = {
        cpuUsage: 50,
        memoryUsage: 60,
        diskUsage: 70,
        activeModels: 2,
        uptime: 3600,
      };
      const mockResponse = createMockResponse(true, mockData);

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getSystemMetrics();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/system/metrics');
      expect(result).toEqual(mockResponse);
      expect(mockStore.getState().setMetrics).toHaveBeenCalledWith(mockResponse.data);
    });

    it('should handle system metrics errors', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: '500',
          message: 'Failed to fetch metrics',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await expect(apiService.getSystemMetrics()).rejects.toThrow('Failed to fetch metrics');
    });
  });

  describe('getMonitoringHistory', () => {
    it('should return monitoring history', async () => {
      const mockData = {
        cpu: [{ time: '10:00', displayTime: '10:00 AM', value: 50 }],
        memory: [{ time: '10:00', displayTime: '10:00 AM', value: 60 }],
        requests: [{ time: '10:00', displayTime: '10:00 AM', value: 100 }],
        gpuUtil: [{ time: '10:00', displayTime: '10:00 AM', value: 30 }],
        power: [{ time: '10:00', displayTime: '10:00 AM', value: 120 }],
      };
      const mockResponse = createMockResponse(true, mockData);

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getMonitoringHistory({ minutes: 60 });

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/monitoring/history', {
        params: { minutes: 60 },
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getLatestMonitoring', () => {
    it('should return latest monitoring data', async () => {
      const mockData = {
        cpuUsage: 50,
        memoryUsage: 60,
        gpuUsage: 30,
        timestamp: Date.now(),
      };
      const mockResponse = createMockResponse(true, mockData);

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getLatestMonitoring();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/monitoring/latest');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('rescanModels', () => {
    it('should rescan models successfully', async () => {
      const mockData = {
        message: 'Rescan complete',
        config: {
          host: '127.0.0.1',
          port: 8080,
          basePath: '/models',
          serverPath: '/path',
          ctx_size: 8192,
          batch_size: 512,
          threads: -1,
          gpu_layers: -1,
        },
      };
      const mockResponse = createMockResponse(true, mockData);

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.rescanModels();

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/llama-server/rescan', {});
      expect(result).toEqual(mockResponse);
    });

    it('should rescan with custom config', async () => {
      const mockData = {
        message: 'Rescan complete',
        config: {
          host: '127.0.0.1',
          port: 8080,
          basePath: '/models',
          serverPath: '/path',
          ctx_size: 8192,
          batch_size: 512,
          threads: -1,
          gpu_layers: -1,
        },
      };
      const mockResponse = createMockResponse(true, mockData);

      mockApiClient.post.mockResolvedValue(mockResponse);

      const customConfig = { ctx_size: 16384 };

      await apiService.rescanModels(customConfig);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/llama-server/rescan', customConfig);
    });

    it('should handle rescan errors', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: '500',
          message: 'Rescan failed',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      await expect(apiService.rescanModels()).rejects.toThrow('Rescan failed');
    });
  });

  describe('Network Error Handling', () => {
    it('should handle network errors in system methods', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));
      mockApiClient.post.mockRejectedValue(new Error('Network error'));

      await expect(apiService.getSystemMetrics()).rejects.toThrow('Network error');
      await expect(apiService.getMonitoringHistory({})).rejects.toThrow('Network error');
      await expect(apiService.rescanModels()).rejects.toThrow('Network error');
    });
  });
});
