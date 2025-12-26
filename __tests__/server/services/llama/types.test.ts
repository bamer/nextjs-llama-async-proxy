import type {
  LlamaServerConfig,
  LlamaModel,
  LlamaServiceStatus,
  LlamaServiceState,
} from '@/server/services/llama/types';

describe('llama/types exports', () => {
  describe('LlamaServerConfig', () => {
    it('should have required fields', () => {
      const config: LlamaServerConfig = {
        host: 'localhost',
        port: 8134,
        basePath: '/models',
        serverPath: '/path/to/server',
        ctx_size: 8192,
        batch_size: 512,
        threads: -1,
        gpu_layers: -1,
      };

      expect(typeof config.host).toBe('string');
      expect(typeof config.port).toBe('number');
      expect(typeof config.basePath).toBe('string');
      expect(typeof config.serverPath).toBe('string');
      expect(typeof config.ctx_size).toBe('number');
      expect(typeof config.batch_size).toBe('number');
      expect(typeof config.threads).toBe('number');
      expect(typeof config.gpu_layers).toBe('number');
    });

    it('should support optional fields', () => {
      const config: Partial<LlamaServerConfig> = {
        host: 'localhost',
        port: 8134,
        temperature: 0.7,
        top_k: 40,
      };

      expect(config.temperature).toBeDefined();
      expect(config.top_k).toBeDefined();
    });
  });

  describe('LlamaModel', () => {
    it('should have required fields', () => {
      const model: LlamaModel = {
        id: 'model-1',
        name: 'Test Model',
        size: 10737418240,
        type: 'gguf',
        modified_at: 1234567890,
        status: 'loaded',
        available: true,
      };

      expect(typeof model.id).toBe('string');
      expect(typeof model.name).toBe('string');
      expect(typeof model.size).toBe('number');
      expect(typeof model.type).toBe('string');
      expect(typeof model.modified_at).toBe('number');
      expect(['loaded', 'loading', 'unloaded']).toContain(model.status);
      expect(typeof model.available).toBe('boolean');
    });
  });

  describe('LlamaServiceStatus', () => {
    it('should have all valid status values', () => {
      const validStatuses: LlamaServiceStatus[] = [
        'initial',
        'starting',
        'ready',
        'error',
        'crashed',
        'stopping',
      ];

      validStatuses.forEach((status) => {
        expect(typeof status).toBe('string');
      });
    });

    it('should only allow specific status values', () => {
      const status: LlamaServiceStatus = 'ready';

      expect(['initial', 'starting', 'ready', 'error', 'crashed', 'stopping']).toContain(status);
    });
  });

  describe('LlamaServiceState', () => {
    it('should have required fields', () => {
      const state: LlamaServiceState = {
        status: 'ready',
        models: [],
        lastError: null,
        retries: 0,
        uptime: 0,
        startedAt: new Date(),
      };

      expect(['initial', 'starting', 'ready', 'error', 'crashed', 'stopping']).toContain(state.status);
      expect(Array.isArray(state.models)).toBe(true);
      expect(state.lastError).toBeNull();
      expect(typeof state.retries).toBe('number');
      expect(typeof state.uptime).toBe('number');
      expect(state.startedAt).toBeInstanceOf(Date);
    });

    it('should support null lastError', () => {
      const state: LlamaServiceState = {
        status: 'error',
        models: [],
        lastError: null,
        retries: 1,
        uptime: 0,
        startedAt: null,
      };

      expect(state.lastError).toBeNull();
    });

    it('should support string lastError', () => {
      const state: LlamaServiceState = {
        status: 'error',
        models: [],
        lastError: 'Error message',
        retries: 1,
        uptime: 0,
        startedAt: new Date(),
      };

      expect(typeof state.lastError).toBe('string');
    });
  });

  describe('type unions', () => {
    it('should support partial config', () => {
      const partialConfig: Partial<LlamaServerConfig> = {
        host: 'localhost',
      };

      expect(typeof partialConfig.host).toBe('string');
      expect(partialConfig.port).toBeUndefined();
    });

    it('should support optional model properties', () => {
      const partialModel: Partial<LlamaModel> = {
        id: 'model-1',
      };

      expect(typeof partialModel.id).toBe('string');
      expect(partialModel.name).toBeUndefined();
    });
  });
});
