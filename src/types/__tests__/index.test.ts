import { ModelConfig, SystemMetrics, LogEntry, ApiResponse, WebSocketMessage } from '@/types/index';

describe('Types Index Exports', () => {
  describe('ModelConfig export', () => {
    it('exports ModelConfig type - verifies index re-exports global types', () => {
      const config: ModelConfig = {
        id: 'model-1',
        name: 'Test Model',
        type: 'llama',
        parameters: { temperature: 0.7 },
        status: 'idle',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(config.id).toBe('model-1');
      expect(config.type).toBe('llama');
    });

    it('validates all ModelConfig types are exported correctly', () => {
      const types = ['llama', 'mistral', 'other'] as const;

      types.forEach((type) => {
        const config: ModelConfig = {
          id: 'model-test',
          name: 'Test',
          type,
          parameters: {},
          status: 'idle',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        expect(config.type).toBe(type);
      });
    });
  });

  describe('SystemMetrics export', () => {
    it('exports SystemMetrics type - verifies index re-exports global types', () => {
      const metrics: SystemMetrics = {
        cpuUsage: 45,
        memoryUsage: 60,
        diskUsage: 70,
        activeModels: 3,
        totalRequests: 1000,
        avgResponseTime: 150,
        uptime: 3600,
        timestamp: new Date().toISOString(),
      };

      expect(metrics.cpuUsage).toBe(45);
      expect(metrics.activeModels).toBe(3);
    });

    it('validates optional GPU metrics in SystemMetrics', () => {
      const metrics: SystemMetrics = {
        cpuUsage: 50,
        memoryUsage: 55,
        diskUsage: 65,
        activeModels: 2,
        totalRequests: 500,
        avgResponseTime: 120,
        uptime: 1800,
        timestamp: new Date().toISOString(),
        gpuUsage: 80,
        gpuName: 'NVIDIA RTX 4090',
      };

      expect(metrics.gpuUsage).toBe(80);
      expect(metrics.gpuName).toBe('NVIDIA RTX 4090');
    });
  });

  describe('LogEntry export', () => {
    it('exports LogEntry type - verifies index re-exports global types', () => {
      const entry: LogEntry = {
        id: 'log-123',
        level: 'info',
        message: 'Test message',
        timestamp: new Date().toISOString(),
      };

      expect(entry.level).toBe('info');
      expect(entry.message).toBe('Test message');
    });

    it('validates all LogEntry levels are exported correctly', () => {
      const levels = ['info', 'warn', 'error', 'debug'] as const;

      levels.forEach((level) => {
        const entry: LogEntry = {
          id: `log-${level}`,
          level,
          message: `${level} message`,
          timestamp: new Date().toISOString(),
        };

        expect(entry.level).toBe(level);
      });
    });
  });

  describe('ApiResponse export', () => {
    it('exports ApiResponse type - verifies index re-exports global types', () => {
      const response: ApiResponse<string> = {
        success: true,
        data: 'test',
        timestamp: new Date().toISOString(),
      };

      expect(response.success).toBe(true);
      expect(response.data).toBe('test');
    });

    it('validates ApiResponse with error - negative test for error handling', () => {
      const response: ApiResponse<string> = {
        success: false,
        error: {
          code: 'ERR_001',
          message: 'Test error',
        },
        timestamp: new Date().toISOString(),
      };

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('ERR_001');
    });
  });

  describe('WebSocketMessage export', () => {
    it('exports WebSocketMessage type - verifies index re-exports global types', () => {
      const message: WebSocketMessage<{ id: number }> = {
        type: 'test',
        data: { id: 1 },
        timestamp: Date.now(),
      };

      expect(message.type).toBe('test');
      expect(message.data.id).toBe(1);
    });

    it('validates WebSocketMessage with optional requestId', () => {
      const message: WebSocketMessage<string> = {
        type: 'test',
        data: 'test data',
        timestamp: Date.now(),
        requestId: 'req-123',
      };

      expect(message.requestId).toBe('req-123');
    });
  });



  describe('Export validation', () => {
    it('verifies all types are exported from index - positive test for module exports', () => {
      const testType = {
        modelConfig: {} as ModelConfig,
        systemMetrics: {} as SystemMetrics,
        logEntry: {} as LogEntry,
        apiResponse: {} as ApiResponse<string>,
        webSocketMessage: {} as WebSocketMessage<string>,
      };

      expect(testType.modelConfig).toBeDefined();
      expect(testType.systemMetrics).toBeDefined();
      expect(testType.logEntry).toBeDefined();
      expect(testType.apiResponse).toBeDefined();
      expect(testType.webSocketMessage).toBeDefined();
    });

    it('validates type compatibility across exports - positive test for type consistency', () => {
      const apiResponse: ApiResponse<ModelConfig> = {
        success: true,
        data: {
          id: 'model-1',
          name: 'Test',
          type: 'llama',
          parameters: {},
          status: 'idle',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      const wsMessage: WebSocketMessage<ModelConfig> = {
        type: 'model_update',
        data: apiResponse.data!,
        timestamp: Date.now(),
      };

      expect(apiResponse.data?.id).toBe(wsMessage.data.id);
    });
  });
});
