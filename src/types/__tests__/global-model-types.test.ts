import type {
  ModelConfig,
  SystemMetrics,
  LogEntry,
} from '@/types/global';

describe('Global Model Types', () => {
  describe('ModelConfig', () => {
    it('creates valid model config', () => {
      const config: ModelConfig = {
        id: 'model-1',
        name: 'Test Model',
        type: 'llama',
        parameters: { temperature: 0.7 },
        status: 'idle',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      expect(config.id).toBe('model-1');
      expect(config.name).toBe('Test Model');
      expect(config.type).toBe('llama');
      expect(config.status).toBe('idle');
    });

    it('allows all valid types and statuses', () => {
      const types: Array<ModelConfig['type']> = ['llama', 'mistral', 'other'];
      const statuses: Array<ModelConfig['status']> = ['idle', 'loading', 'running', 'error'];

      types.forEach((type) => {
        statuses.forEach((status) => {
          const config: ModelConfig = {
            id: 'model-1',
            name: 'Test Model',
            type,
            parameters: {},
            status,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          expect(config.type).toBe(type);
          expect(config.status).toBe(status);
        });
      });
    });

    it('allows complex and empty parameters', () => {
      const complexConfig: ModelConfig = {
        id: 'model-1',
        name: 'Test Model',
        type: 'llama',
        parameters: {
          temperature: 0.7,
          maxTokens: 2048,
          topP: 0.9,
          frequencyPenalty: 0.5,
          presencePenalty: 0.5,
        },
        status: 'idle',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const emptyConfig: ModelConfig = {
        id: 'model-2',
        name: 'Test Model',
        type: 'llama',
        parameters: {},
        status: 'idle',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(complexConfig.parameters.temperature).toBe(0.7);
      expect(Object.keys(emptyConfig.parameters)).toHaveLength(0);
    });
  });

  describe('SystemMetrics', () => {
    it('creates valid system metrics with and without GPU', () => {
      const metricsWithoutGPU: SystemMetrics = {
        cpu: { usage: 45 },
        memory: { used: 60 },
        disk: { used: 70 },
        network: { rx: 100, tx: 50 },
        uptime: 3600,
      };

      const metricsWithGPU: SystemMetrics = {
        cpu: { usage: 50 },
        memory: { used: 60 },
        disk: { used: 30 },
        network: { rx: 0, tx: 0 },
        uptime: 300,
        gpu: {
          usage: 75.0,
          memoryUsed: 8.5,
          memoryTotal: 16.0,
          powerUsage: 250,
          powerLimit: 300,
          temperature: 65,
          name: 'NVIDIA RTX 4090',
        },
      };

      expect(metricsWithoutGPU.gpu).toBeUndefined();
      expect(metricsWithGPU.gpu?.usage).toBe(75.0);
      expect(metricsWithGPU.gpu?.name).toBe('NVIDIA RTX 4090');
    });
  });

  describe('LogEntry', () => {
    it('creates valid log entry with all levels', () => {
      const levels: Array<LogEntry['level']> = ['info', 'warn', 'error', 'debug'];

      levels.forEach((level) => {
        const entry: LogEntry = {
          id: 'log-123',
          level,
          message: 'Test message',
          timestamp: new Date().toISOString(),
        };
        expect(entry.level).toBe(level);
      });
    });

    it('supports string and object message types with optional context', () => {
      const entryWithAllOptions: LogEntry = {
        id: 'log-1',
        level: 'info',
        message: { error: 'Error details', code: 500 },
        timestamp: new Date().toISOString(),
        context: { userId: '123', requestId: 'req-456' },
      };

      const minimalEntry: LogEntry = {
        id: 'log-2',
        level: 'warn',
        message: 'Simple string message',
        timestamp: new Date().toISOString(),
      };

      expect(typeof entryWithAllOptions.message).toBe('object');
      expect(entryWithAllOptions.context).toEqual({
        userId: '123',
        requestId: 'req-456',
      });
      expect(typeof minimalEntry.message).toBe('string');
      expect(minimalEntry.context).toBeUndefined();
    });
  });
});
