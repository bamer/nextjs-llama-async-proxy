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

describe('api-service - Configuration', () => {
  describe('getConfig', () => {
    it('should return server config', async () => {
      const mockData = {
        serverConfig: {
          host: '127.0.0.1',
          port: 8080,
        },
        appConfig: {
          theme: 'dark',
        },
      };
      const mockResponse = createMockResponse(true, mockData);

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getConfig();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/config');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateConfig', () => {
    it('should update server config', async () => {
      const mockData = {
        serverConfig: {
          host: '127.0.0.1',
          port: 8080,
        },
        appConfig: {
          theme: 'light',
        },
      };
      const mockResponse = createMockResponse(true, mockData);

      mockApiClient.post.mockResolvedValue(mockResponse);

      const config = {
        serverConfig: {
          host: '127.0.0.1',
          port: 8080,
          basePath: '/models',
          serverPath: '/path',
          ctx_size: 8192,
          batch_size: 512,
          threads: -1,
          gpu_layers: -1,
        },
        appConfig: { theme: 'light' },
      } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await apiService.updateConfig(config);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/config', config);
      expect(result).toEqual(mockResponse);
    });

    it('should handle config update errors', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: '500',
          message: 'Failed to update config',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const config = {
        serverConfig: {
          host: '127.0.0.1',
          port: 8080,
          basePath: '/models',
          serverPath: '/path',
          ctx_size: 8192,
          batch_size: 512,
          threads: -1,
          gpu_layers: -1,
        },
        appConfig: {},
      };

      await expect(apiService.updateConfig(config)).rejects.toThrow('Failed to update config');
    });
  });

  describe('getLoggerConfig', () => {
    it('should return logger config', async () => {
      const mockData = {
        consoleLevel: 'info',
        fileLevel: 'info',
        errorLevel: 'error',
        maxFileSize: '20m',
        maxFiles: '14',
        enableFileLogging: true,
        enableConsoleLogging: true,
      };
      const mockResponse = createMockResponse(true, mockData);

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getLoggerConfig();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/logger/config');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateLoggerConfig', () => {
    it('should update logger config successfully', async () => {
      const mockData = {
        consoleLevel: 'debug',
        fileLevel: 'debug',
        errorLevel: 'error',
        maxFileSize: '20m',
        maxFiles: '14',
        enableFileLogging: true,
        enableConsoleLogging: true,
      };
      const mockResponse = createMockResponse(true, mockData);

      mockApiClient.post.mockResolvedValue(mockResponse);

      const config = {
        consoleLevel: 'debug',
        fileLevel: 'debug',
        errorLevel: 'error',
        maxFileSize: '20m',
        maxFiles: '14',
        enableFileLogging: true,
        enableConsoleLogging: true,
      } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await apiService.updateLoggerConfig(config);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/logger/config', config);
      expect(result).toEqual(mockResponse);
    });

    it('should handle update logger config errors', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: '500',
          message: 'Update failed',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const config = {
        consoleLevel: 'info',
        fileLevel: 'info',
        errorLevel: 'error',
        maxFileSize: '20m',
        maxFiles: '14',
        enableFileLogging: true,
        enableConsoleLogging: true,
      } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      await expect(apiService.updateLoggerConfig(config)).rejects.toThrow('Update failed');
    });
  });
});
