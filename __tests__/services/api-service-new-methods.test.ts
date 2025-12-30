import { apiService } from '@/services/api-service';
import { apiClient } from '@/utils/api-client';
import { useStore } from '@/lib/store';

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

describe('api-service - New Methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.getState.mockReturnValue({
      setModels: jest.fn(),
      addModel: jest.fn(),
      updateModel: jest.fn(),
      removeModel: jest.fn(),
      setMetrics: jest.fn(),
      setLogs: jest.fn(),
      clearLogs: jest.fn(),
      updateSettings: jest.fn(),
    } as any);
  });

  describe('getMetricsHistory', () => {
    it('should return metrics history successfully', async () => {
      const mockResponse = {
        success: true,
        data: [
          { cpuUsage: 50, memoryUsage: 60, timestamp: Date.now() },
          { cpuUsage: 55, memoryUsage: 65, timestamp: Date.now() },
        ],
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getMetricsHistory({ limit: 10 });

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/metrics/history', {
        params: { limit: 10 },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should fetch history with hours parameter', async () => {
      const mockResponse = {
        success: true,
        data: [],
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await apiService.getMetricsHistory({ hours: 24 });

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/metrics/history', {
        params: { hours: 24 },
      });
    });

    it('should handle fetch errors', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: '500',
          message: 'Failed to fetch history',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await expect(apiService.getMetricsHistory()).rejects.toThrow(
        'Failed to fetch metrics history'
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

  describe('getSystemInfo', () => {
    it('should return system info', async () => {
      const mockResponse = {
        success: true,
        data: {
          platform: 'linux',
          arch: 'x64',
          version: '1.0.0',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getSystemInfo();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/system/info');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('restartSystem', () => {
    it('should restart system', async () => {
      const mockResponse = {
        success: true,
        data: null,
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.restartSystem();

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/system/restart');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('shutdownSystem', () => {
    it('should shutdown system', async () => {
      const mockResponse = {
        success: true,
        data: null,
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.shutdownSystem();

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/system/shutdown');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('generateText', () => {
    it('should generate text successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          text: 'Generated text',
          model: 'llama-2',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.generateText({
        prompt: 'Hello',
        model: 'llama-2',
        max_tokens: 100,
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/generate', {
        prompt: 'Hello',
        model: 'llama-2',
        max_tokens: 100,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle generation errors', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: '500',
          message: 'Generation failed',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.generateText({ prompt: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Generation failed');
    });
  });

  describe('chat', () => {
    it('should handle chat request', async () => {
      const mockResponse = {
        success: true,
        data: {
          message: 'Chat response',
          model: 'llama-2',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.chat({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'llama-2',
        max_tokens: 100,
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/chat', {
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'llama-2',
        max_tokens: 100,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getConfig', () => {
    it('should return server config', async () => {
      const mockResponse = {
        success: true,
        data: {
          serverConfig: {
            host: '127.0.0.1',
            port: 8080,
          },
          appConfig: {
            theme: 'dark',
          },
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getConfig();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/config');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateConfig', () => {
    it('should update server config', async () => {
      const mockResponse = {
        success: true,
        data: {
          serverConfig: {
            host: '127.0.0.1',
            port: 8080,
          },
          appConfig: {
            theme: 'light',
          },
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const config = {
        serverConfig: { host: '127.0.0.1', port: 8080, basePath: '/models', serverPath: '/path', ctx_size: 8192, batch_size: 512, threads: -1, gpu_layers: -1 },
        appConfig: { theme: 'light' },
      };

      const result = await apiService.updateConfig(config);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/config', config);
      expect(mockStore.getState().updateSettings).toHaveBeenCalledWith(config);
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
        serverConfig: { host: '127.0.0.1', port: 8080, basePath: '/models', serverPath: '/path', ctx_size: 8192, batch_size: 512, threads: -1, gpu_layers: -1 },
        appConfig: {},
      };

      await expect(apiService.updateConfig(config)).rejects.toThrow(
        'Failed to update config'
      );
    });
  });

  describe('discoverModels', () => {
    it('should discover models successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          discovered: [
            { id: 'model1', name: 'Model 1', status: 'idle', filePath: '/path/1', createdAt: Date.now(), updatedAt: Date.now() },
            { id: 'model2', name: 'Model 2', status: 'idle', filePath: '/path/2', createdAt: Date.now(), updatedAt: Date.now() },
          ],
        },
        timestamp: new Date().toISOString(),
      };

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
        'Failed to discover models'
      );
    });
  });

  describe('analyzeFitParams', () => {
    it('should analyze fit params successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          model: { id: 'model1', name: 'Model 1', status: 'idle', filePath: '/path/1', createdAt: Date.now(), updatedAt: Date.now() },
          fitParams: {
            recommended_ctx_size: 4096,
            recommended_gpu_layers: 30,
            recommended_tensor_split: null,
            file_size_bytes: 1000000,
            quantization_type: 'q4_0',
            parameter_count: 1000000,
            architecture: 'llama',
            context_window: 4096,
            fit_params_analyzed_at: Date.now(),
            fit_params_success: 1,
            fit_params_error: null,
            fit_params_raw_output: null,
            projected_cpu_memory_mb: 500,
            projected_gpu_memory_mb: 1000,
          },
        },
        timestamp: new Date().toISOString(),
      };

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
        'Failed to analyze model fit params'
      );
    });
  });

  describe('getFitParams', () => {
    it('should get fit params successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          model: { id: 'model1', name: 'Model 1', status: 'idle', filePath: '/path/1', createdAt: Date.now(), updatedAt: Date.now() },
          fitParams: {
            recommended_ctx_size: 4096,
            recommended_gpu_layers: 30,
            recommended_tensor_split: null,
            file_size_bytes: 1000000,
            quantization_type: 'q4_0',
            parameter_count: 1000000,
            architecture: 'llama',
            context_window: 4096,
            fit_params_analyzed_at: Date.now(),
            fit_params_success: 1,
            fit_params_error: null,
            fit_params_raw_output: null,
            projected_cpu_memory_mb: 500,
            projected_gpu_memory_mb: 1000,
          },
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getFitParams('model1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/models/model1/analyze');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getModelTemplates', () => {
    it('should return model templates', async () => {
      const mockResponse = {
        success: true,
        data: {
          model_templates: {
            template1: { name: 'Template 1' },
            template2: { name: 'Template 2' },
          },
          default_model: 'template1',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getModelTemplates();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/model-templates');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('saveModelTemplates', () => {
    it('should save model templates successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          model_templates: {
            template1: { name: 'Template 1' },
          },
          default_model: 'template1',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const templates = { template1: { name: 'Template 1' } };

      const result = await apiService.saveModelTemplates(templates);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/model-templates', {
        model_templates: templates,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle save errors', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: '500',
          message: 'Save failed',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      await expect(apiService.saveModelTemplates({})).rejects.toThrow(
        'Failed to save model templates'
      );
    });
  });

  describe('rescanModels', () => {
    it('should rescan models successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
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
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.rescanModels();

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/llama-server/rescan', {});
      expect(result).toEqual(mockResponse);
    });

    it('should rescan with custom config', async () => {
      const mockResponse = {
        success: true,
        data: {
          message: 'Rescan complete',
          config: { host: '127.0.0.1', port: 8080, basePath: '/models', serverPath: '/path', ctx_size: 8192, batch_size: 512, threads: -1, gpu_layers: -1 },
        },
        timestamp: new Date().toISOString(),
      };

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

      await expect(apiService.rescanModels()).rejects.toThrow(
        'Failed to rescan models'
      );
    });
  });

  describe('getMonitoringHistory', () => {
    it('should return monitoring history', async () => {
      const mockResponse = {
        success: true,
        data: {
          cpu: [{ time: '10:00', displayTime: '10:00 AM', value: 50 }],
          memory: [{ time: '10:00', displayTime: '10:00 AM', value: 60 }],
          requests: [{ time: '10:00', displayTime: '10:00 AM', value: 100 }],
          gpuUtil: [{ time: '10:00', displayTime: '10:00 AM', value: 30 }],
          power: [{ time: '10:00', displayTime: '10:00 AM', value: 120 }],
        },
        timestamp: new Date().toISOString(),
      };

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
      const mockResponse = {
        success: true,
        data: {
          cpuUsage: 50,
          memoryUsage: 60,
          gpuUsage: 30,
          timestamp: Date.now(),
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getLatestMonitoring();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/monitoring/latest');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getSystemMetrics', () => {
    it('should return system metrics', async () => {
      const mockResponse = {
        success: true,
        data: {
          cpuUsage: 50,
          memoryUsage: 60,
          diskUsage: 70,
          activeModels: 2,
          uptime: 3600,
        },
        timestamp: new Date().toISOString(),
      };

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

      await expect(apiService.getSystemMetrics()).rejects.toThrow(
        'Failed to fetch system metrics'
      );
    });
  });

  describe('getLoggerConfig', () => {
    it('should return logger config', async () => {
      const mockResponse = {
        success: true,
        data: {
          consoleLevel: 'info',
          fileLevel: 'info',
          errorLevel: 'error',
          maxFileSize: '20m',
          maxFiles: '14',
          enableFileLogging: true,
          enableConsoleLogging: true,
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getLoggerConfig();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/logger/config');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateLoggerConfig', () => {
    it('should update logger config successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          consoleLevel: 'debug',
          fileLevel: 'debug',
          errorLevel: 'error',
          maxFileSize: '20m',
          maxFiles: '14',
          enableFileLogging: true,
          enableConsoleLogging: true,
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const config = {
        consoleLevel: 'debug',
        fileLevel: 'debug',
        errorLevel: 'error',
        maxFileSize: '20m',
        maxFiles: '14',
        enableFileLogging: true,
        enableConsoleLogging: true,
      };

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
      };

      await expect(apiService.updateLoggerConfig(config)).rejects.toThrow(
        'Failed to update logger config'
      );
    });
  });

  describe('getLlamaModels', () => {
    it('should return llama models', async () => {
      const mockResponse = {
        success: true,
        data: {
          models: [
            { id: 'model1', name: 'Model 1', status: 'idle', filePath: '/path/1', createdAt: Date.now(), updatedAt: Date.now() },
            { id: 'model2', name: 'Model 2', status: 'running', filePath: '/path/2', createdAt: Date.now(), updatedAt: Date.now() },
          ],
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getLlamaModels();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/models');
      expect(result).toEqual(mockResponse);
      expect(mockStore.getState().setModels).toHaveBeenCalledWith(mockResponse.data.models);
    });

    it('should handle get llama models errors', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: '500',
          message: 'Fetch failed',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await expect(apiService.getLlamaModels()).rejects.toThrow(
        'Failed to fetch llama models'
      );
    });
  });

  describe('Network Error Handling', () => {
    it('should handle network errors in new methods', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));
      mockApiClient.post.mockRejectedValue(new Error('Network error'));

      await expect(apiService.getLoggerConfig()).rejects.toThrow('Network error');
      await expect(apiService.getMonitoringHistory()).rejects.toThrow('Network error');
      await expect(apiService.discoverModels([])).rejects.toThrow('Network error');
    });
  });
});
