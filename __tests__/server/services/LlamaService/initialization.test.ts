import { LlamaService } from '@/server/services/LlamaService';
import { LlamaServerConfig } from '@/server/services/LlamaService';
import { setupMocks, mockConfig, mockedSpawn, mockedAxios } from './test-utils';

describe('LlamaService - Initialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  describe('constructor', () => {
    it('should initialize with config and create axios client', () => {
      const llamaService = new LlamaService(mockConfig);

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:8080',
        timeout: 5000,
        validateStatus: expect.any(Function),
      });
    });

    it('should initialize with minimal config', () => {
      const minimalConfig: LlamaServerConfig = {
        host: '0.0.0.0',
        port: 3000,
      };

      const llamaService = new LlamaService(minimalConfig);

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://0.0.0.0:3000',
        timeout: 5000,
        validateStatus: expect.any(Function),
      });
    });
  });

  describe('state management', () => {
    it('should register state change callback', () => {
      const llamaService = new LlamaService(mockConfig);
      const callback = jest.fn();
      llamaService.onStateChange(callback);

      llamaService.start().catch(() => {});

      expect(callback).toHaveBeenCalled();
    });

    it('should return current state', () => {
      const llamaService = new LlamaService(mockConfig);
      const state = llamaService.getState();

      expect(state).toEqual({
        status: 'initial',
        models: [],
        lastError: null,
        retries: 0,
        uptime: 0,
        startedAt: null,
      });
    });
  });
});
