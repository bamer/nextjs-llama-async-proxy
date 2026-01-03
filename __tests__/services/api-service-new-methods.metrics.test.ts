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

describe('api-service - Metrics & Logs', () => {
  describe('getMetricsHistory', () => {
    it('should return metrics history successfully', async () => {
      const mockData = [
        { cpuUsage: 50, memoryUsage: 60, timestamp: Date.now() },
        { cpuUsage: 55, memoryUsage: 65, timestamp: Date.now() },
      ];
      const mockResponse = createMockResponse(true, mockData);

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getMetricsHistory({ limit: 10 });

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/metrics/history', {
        params: { limit: 10 },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should fetch history with hours parameter', async () => {
      const mockResponse = createMockResponse(true, []);

      mockApiClient.get.mockResolvedValue(mockResponse);

      await apiService.getMetricsHistory({ hours: 24 });

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/metrics/history', {
        params: { hours: 24 },
      });
    });

    it('should handle fetch errors', async () => {
      const mockResponse = createMockResponse(false, {
        code: '500',
        message: 'Failed to fetch history',
      });

      mockApiClient.get.mockResolvedValue(mockResponse);

      await expect(apiService.getMetricsHistory({})).rejects.toThrow(
        'Failed to fetch history'
      );
    });
  });

  describe('clearLogs', () => {
    it('should clear logs successfully', async () => {
      const mockResponse = {
        success: true,
        timestamp: new Date().toISOString(),
      };

      mockApiClient.delete.mockResolvedValue(mockResponse);

      await apiService.clearLogs();

      expect(mockApiClient.delete).toHaveBeenCalledWith('/api/logs');
      expect(mockStore.getState().clearLogs).toHaveBeenCalled();
    });

    it('should handle clear logs errors', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: '500',
          message: 'Failed to clear logs',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.delete.mockResolvedValue(mockResponse);

      await expect(apiService.clearLogs()).rejects.toThrow('Failed to clear logs');
    });
  });
});
