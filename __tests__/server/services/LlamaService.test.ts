import { spawn, ChildProcess } from 'child_process';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import {
  LlamaService,
  LlamaServerConfig,
  LlamaServiceStatus,
  LlamaServiceState,
} from '@/server/services/LlamaService';

// Mock dependencies
jest.mock('child_process');
jest.mock('axios');
jest.mock('fs');
jest.mock('path');

const mockedSpawn = spawn as jest.MockedFunction<typeof spawn>;
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedPath = path as jest.Mocked<typeof path>;

describe('LlamaService', () => {
  let llamaService: LlamaService;
  let mockConfig: LlamaServerConfig;
  let mockProcess: ChildProcess;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockConfig = {
      host: 'localhost',
      port: 8080,
      modelPath: '/path/to/model.gguf',
      basePath: '/path/to/models',
      serverPath: '/path/to/llama-server',
      ctx_size: 2048,
      batch_size: 512,
      threads: 4,
      gpu_layers: 20,
      temperature: 0.7,
      verbose: true,
    };

    mockProcess = {
      pid: 12345,
      kill: jest.fn(),
      on: jest.fn(),
      stdout: {
        on: jest.fn(),
      },
      stderr: {
        on: jest.fn(),
      },
      unref: jest.fn(),
    } as any;

    mockedSpawn.mockReturnValue(mockProcess);
    mockedAxios.create.mockReturnValue({
      get: jest.fn(),
      post: jest.fn(),
      delete: jest.fn(),
      defaults: { timeout: 5000 },
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    } as any);

    mockedPath.join.mockImplementation((...args) => args.join('/'));
    mockedPath.resolve.mockImplementation((...args) => args.join('/'));
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readdirSync.mockReturnValue(['model1.gguf', 'model2.bin']);
    mockedFs.statSync.mockReturnValue({
      size: 1000000000,
      mtimeMs: Date.now(),
    } as any);
  });

  describe('constructor', () => {
    it('should initialize with config and create axios client', () => {
      llamaService = new LlamaService(mockConfig);

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

      llamaService = new LlamaService(minimalConfig);

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://0.0.0.0:3000',
        timeout: 5000,
        validateStatus: expect.any(Function),
      });
    });
  });

  describe('state management', () => {
    beforeEach(() => {
      llamaService = new LlamaService(mockConfig);
    });

    it('should register state change callback', () => {
      const callback = jest.fn();
      llamaService.onStateChange(callback);

      // Trigger state change by starting service
      llamaService.start().catch(() => {});

      expect(callback).toHaveBeenCalled();
    });

    it('should return current state', () => {
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

  describe('start', () => {
    beforeEach(() => {
      llamaService = new LlamaService(mockConfig);
    });

    it('should return immediately if already ready', async () => {
      // Mock service as already ready
      (llamaService as any).state.status = 'ready';

      await llamaService.start();

      expect(mockedSpawn).not.toHaveBeenCalled();
    });

    it('should return immediately if already starting', async () => {
      // Mock service as already starting
      (llamaService as any).state.status = 'starting';

      await llamaService.start();

      expect(mockedSpawn).not.toHaveBeenCalled();
    });

    it('should start server when not running', async () => {
      // Mock health check to return false
      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockRejectedValue(new Error('Not ready')),
        post: jest.fn(),
        delete: jest.fn(),
        defaults: { timeout: 5000 },
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      // Mock successful health check after spawn
      const healthCheckCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      healthCheckCall
        .mockRejectedValueOnce(new Error('Not ready')) // First call fails
        .mockResolvedValueOnce({ status: 200 }); // Subsequent calls succeed

      // Mock model loading
      const modelsResponse = {
        data: {
          data: [
            {
              id: 'model1',
              name: 'Test Model 1',
              size: 1000000000,
              type: 'gguf',
            },
          ],
        },
      };
      healthCheckCall.mockResolvedValueOnce({ status: 200, data: modelsResponse.data });

      await llamaService.start();

      expect(mockedSpawn).toHaveBeenCalledWith(
        '/path/to/llama-server',
        expect.arrayContaining([
          '-m', '/path/to/model.gguf',
          '--host', 'localhost',
          '--port', '8080',
          '-c', '2048',
          '-b', '512',
          '-t', '4',
          '-ngl', '20',
          '--temp', '0.7',
          '--verbose',
        ]),
        {
          stdio: ['ignore', 'pipe', 'pipe'],
          detached: false,
        }
      );
    });

    it('should handle server already running', async () => {
      // Mock health check to return true
      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({ status: 200 }),
        post: jest.fn(),
        delete: jest.fn(),
        defaults: { timeout: 5000 },
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      // Mock model loading
      const modelsResponse = {
        data: {
          data: [
            {
              id: 'model1',
              name: 'Test Model 1',
              size: 1000000000,
              type: 'gguf',
            },
          ],
        },
      };
      (mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>)
        .mockResolvedValueOnce({ status: 200, data: modelsResponse.data });

      await llamaService.start();

      expect(mockedSpawn).not.toHaveBeenCalled();
    });

    it('should handle start errors', async () => {
      const startError = new Error('Failed to start server');
      mockedSpawn.mockImplementation(() => {
        throw startError;
      });

      await expect(llamaService.start()).rejects.toThrow('Failed to start server');

      const state = llamaService.getState();
      expect(state.status).toBe('error');
      expect(state.lastError).toBe('Failed to start server');
    });
  });

  describe('stop', () => {
    beforeEach(() => {
      llamaService = new LlamaService(mockConfig);
    });

    it('should stop running process gracefully', async () => {
      // Set up a running process
      (llamaService as any).process = mockProcess;

      // Track the exit callback
      let exitCallback: ((code: number | null, signal: string | null) => void) | null = null;
      mockProcess.on = jest.fn().mockImplementation((event: string, callback: Function) => {
        if (event === 'exit') {
          exitCallback = callback;
        }
      });

      const stopPromise = llamaService.stop();

      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');

      // Trigger the exit callback to resolve the stop promise
      if (exitCallback) {
        exitCallback(0, 'SIGTERM');
      }

      await stopPromise;

      const state = llamaService.getState();
      expect(state.status).toBe('initial');
    });

    it('should force kill if SIGTERM timeout', async () => {
      // Mock process that doesn't exit on SIGTERM
      const mockProcessThatHangs = {
        ...mockProcess,
        on: jest.fn().mockImplementation((event: string, callback: Function) => {
          if (event === 'exit') {
            // Never call exit callback to simulate hanging
          }
        }),
      } as any;
      (llamaService as any).process = mockProcessThatHangs;

      await llamaService.stop();

      expect(mockProcessThatHangs.kill).toHaveBeenCalledWith('SIGTERM');
      // Should be called again with SIGKILL after timeout
      expect(mockProcessThatHangs.kill).toHaveBeenCalledWith('SIGKILL');
    });

    it('should handle stop when no process running', async () => {
      (llamaService as any).process = null;

      await llamaService.stop();

      expect(mockProcess.kill).not.toHaveBeenCalled();
    });
  });

  describe('healthCheck', () => {
    beforeEach(() => {
      llamaService = new LlamaService(mockConfig);
    });

    it('should return true when health endpoint responds with 200', async () => {
      const healthCheckCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      healthCheckCall.mockResolvedValue({ status: 200 });

      const result = await (llamaService as any).healthCheck();

      expect(result).toBe(true);
      expect(healthCheckCall).toHaveBeenCalledWith('/health');
    });

    it('should return false when health endpoint returns error', async () => {
      const healthCheckCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      healthCheckCall.mockRejectedValue(new Error('Connection refused'));

      const result = await (llamaService as any).healthCheck();

      expect(result).toBe(false);
    });

    it('should return false when health endpoint returns non-200 status', async () => {
      const healthCheckCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      healthCheckCall.mockResolvedValue({ status: 503 });

      const result = await (llamaService as any).healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('model loading', () => {
    beforeEach(() => {
      llamaService = new LlamaService(mockConfig);
    });

    it('should load models from server API', async () => {
      const modelsResponse = {
        status: 200,
        data: {
          data: [
            {
              id: 'model1',
              name: 'Test Model 1',
              size: 1000000000,
              type: 'gguf',
              path: '/path/to/model1.gguf',
            },
            {
              id: 'model2',
              name: 'Test Model 2',
              size: 2000000000,
              type: 'bin',
              path: '/path/to/model2.bin',
            },
          ],
        },
      };

      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockResolvedValue(modelsResponse);

      await (llamaService as any).loadModels();

      const state = llamaService.getState();
      expect(state.models).toHaveLength(2);
      expect(state.models[0]).toEqual({
        id: 'model1',
        name: 'model1',
        size: 1000000000,
        type: 'gguf',
        path: '/path/to/model1.gguf',
        modified_at: expect.any(Number),
      });
      expect(state.models[1]).toEqual({
        id: 'model2',
        name: 'model2',
        size: 2000000000,
        type: 'bin',
        path: '/path/to/model2.bin',
        modified_at: expect.any(Number),
      });
    });

    it('should handle server API returning array directly', async () => {
      const modelsResponse = {
        status: 200,
        data: [
          {
            id: 'model1',
            name: 'Test Model 1',
            size: 1000000000,
            type: 'gguf',
          },
        ],
      };

      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockResolvedValue(modelsResponse);

      await (llamaService as any).loadModels();

      const state = llamaService.getState();
      expect(state.models).toHaveLength(1);
      expect(state.models[0].name).toBe('model1');
    });

    it('should fallback to filesystem when server API fails', async () => {
      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockRejectedValue(new Error('API Error'));

      await (llamaService as any).loadModels();

      const state = llamaService.getState();
      expect(state.models).toHaveLength(2); // From mocked readdirSync
    });

    it('should handle empty models list from server', async () => {
      const emptyResponse = {
        status: 200,
        data: { data: [] },
      };

      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockResolvedValue(emptyResponse);

      await (llamaService as any).loadModels();

      const state = llamaService.getState();
      expect(state.models).toHaveLength(0);
    });

    it('should handle filesystem fallback when no basePath configured', async () => {
      const configWithoutBasePath = { ...mockConfig };
      delete configWithoutBasePath.basePath;
      llamaService = new LlamaService(configWithoutBasePath);

      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockRejectedValue(new Error('API Error'));

      await (llamaService as any).loadModels();

      const state = llamaService.getState();
      expect(state.models).toHaveLength(0);
    });

    it('should handle filesystem fallback when directory not found', async () => {
      mockedFs.existsSync.mockReturnValue(false);

      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockRejectedValue(new Error('API Error'));

      await (llamaService as any).loadModels();

      const state = llamaService.getState();
      expect(state.models).toHaveLength(0);
    });
  });

  describe('argument building', () => {
    beforeEach(() => {
      llamaService = new LlamaService(mockConfig);
    });

    it('should build args with model path', () => {
      const args = (llamaService as any).buildArgs();

      expect(args).toContain('-m');
      expect(args).toContain('/path/to/model.gguf');
    });

    it('should build args with models directory when no model path', () => {
      const configWithoutModelPath = { ...mockConfig };
      delete configWithoutModelPath.modelPath;
      llamaService = new LlamaService(configWithoutModelPath);

      const args = (llamaService as any).buildArgs();

      expect(args).toContain('--models-dir');
      expect(args).toContain('/path/to/models');
    });

    it('should include all configuration options', () => {
      const args = (llamaService as any).buildArgs();

      expect(args).toContain('--host');
      expect(args).toContain('localhost');
      expect(args).toContain('--port');
      expect(args).toContain('8080');
      expect(args).toContain('-c');
      expect(args).toContain('2048');
      expect(args).toContain('-b');
      expect(args).toContain('512');
      expect(args).toContain('-t');
      expect(args).toContain('4');
      expect(args).toContain('-ngl');
      expect(args).toContain('20');
      expect(args).toContain('--temp');
      expect(args).toContain('0.7');
      expect(args).toContain('--verbose');
    });

    it('should handle undefined optional parameters', () => {
      const configWithUndefined = {
        host: 'localhost',
        port: 8080,
        modelPath: '/path/to/model.gguf',
      } as LlamaServerConfig;
      llamaService = new LlamaService(configWithUndefined);

      const args = (llamaService as any).buildArgs();

      expect(args).not.toContain('-ngl');
      expect(args).not.toContain('--temp');
    });

    it('should handle negative values correctly', () => {
      const configWithNegatives = {
        ...mockConfig,
        threads: -1,
        gpu_layers: -1,
        n_predict: -1,
        seed: -1,
      };
      llamaService = new LlamaService(configWithNegatives);

      const args = (llamaService as any).buildArgs();

      expect(args).not.toContain('-t');
      expect(args).not.toContain('-ngl');
      expect(args).not.toContain('-n');
      expect(args).not.toContain('--seed');
    });

    it('should include custom server args', () => {
      const configWithCustomArgs = {
        ...mockConfig,
        serverArgs: ['--custom-flag', 'custom-value'],
      };
      llamaService = new LlamaService(configWithCustomArgs);

      const args = (llamaService as any).buildArgs();

      expect(args).toContain('--custom-flag');
      expect(args).toContain('custom-value');
    });

    it('should handle flash attention settings', () => {
      const configOn = { ...mockConfig, flash_attn: 'on' };
      llamaService = new LlamaService(configOn);

      const argsOn = (llamaService as any).buildArgs();

      expect(argsOn).toContain('-fa');
      expect(argsOn).not.toContain('--no-flash-attn');

      const configOff = { ...mockConfig, flash_attn: 'off' };
      llamaService = new LlamaService(configOff);

      const argsOff = (llamaService as any).buildArgs();

      expect(argsOff).toContain('--no-flash-attn');
      expect(argsOff).not.toContain('-fa');

      const configAuto = { ...mockConfig, flash_attn: 'auto' };
      llamaService = new LlamaService(configAuto);

      const argsAuto = (llamaService as any).buildArgs();

      expect(argsAuto).not.toContain('-fa');
      expect(argsAuto).not.toContain('--no-flash-attn');
    });
  });
});