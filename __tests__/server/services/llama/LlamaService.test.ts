import axios from 'axios';
import { LlamaService } from '@/server/services/llama/LlamaService';
import type { LlamaServerConfig } from '@/server/services/llama/types';

// Mock dependencies
jest.mock('axios');
jest.mock('@/server/services/llama/healthCheck');
jest.mock('@/server/services/llama/modelLoader');

describe('LlamaService (Core)', () => {
  let service: LlamaService;
  let config: LlamaServerConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    config = {
      host: 'localhost',
      port: 8080,
      basePath: '/models',
      modelPath: '/models/llama.gguf',
    };

    service = new LlamaService(config);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    // Positive test: Initialize with full config
    it('should initialize with provided config', () => {
      const testService = new LlamaService(config);

      expect(testService).toBeInstanceOf(LlamaService);
      expect(testService.getState().status).toBe('initial');
    });

    // Positive test: Initialize with minimal config
    it('should initialize with minimal config', () => {
      const minimalConfig: LlamaServerConfig = {
        host: '0.0.0.0',
        port: 3000,
      };

      const testService = new LlamaService(minimalConfig);

      expect(testService.getState().status).toBe('initial');
      expect(testService.getState().models).toEqual([]);
    });
  });

  describe('onStateChange', () => {
    // Positive test: Register callback and receive updates
    it('should register state change callback', () => {
      const callback = jest.fn();
      service.onStateChange(callback);

      // Simulate state change
      const stateManager = (service as any).stateManager;
      stateManager.updateStatus('starting');

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'starting' })
      );
    });

    // Positive test: Multiple callbacks
    it('should handle multiple state change callbacks', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      service.onStateChange(callback1);
      service.onStateChange(callback2);

      const stateManager = (service as any).stateManager;
      stateManager.updateStatus('ready');

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    // Edge case: Callback error handling
    it('should handle callback errors gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Callback error');
      });

      service.onStateChange(errorCallback);

      const stateManager = (service as any).stateManager;

      expect(() => {
        stateManager.updateStatus('starting');
      }).not.toThrow();
    });
  });

  describe('getState', () => {
    // Positive test: Return current state
    it('should return current state', () => {
      const state = service.getState();

      expect(state).toEqual(
        expect.objectContaining({
          status: 'initial',
          models: [],
          lastError: null,
          retries: 0,
          uptime: 0,
          startedAt: null,
        })
      );
    });

    // Positive test: State returns a copy
    it('should return a copy of state', () => {
      const state1 = service.getState();
      const state2 = service.getState();

      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });

    // Positive test: State reflects changes
    it('should reflect state changes', () => {
      const initialState = service.getState();
      expect(initialState.status).toBe('initial');

      const stateManager = (service as any).stateManager;
      stateManager.updateStatus('starting');

      const newState = service.getState();
      expect(newState.status).toBe('starting');
    });
  });

  describe('start', () => {
    // Positive test: Start server successfully
    it('should start server successfully', async () => {
      const healthChecker = (service as any).healthChecker;
      healthChecker.check = jest.fn().mockResolvedValue(false);
      healthChecker.waitForReady = jest.fn().mockResolvedValue(undefined);

      const modelLoader = (service as any).modelLoader;
      modelLoader.load = jest.fn().mockResolvedValue([
        { id: 'model1', name: 'Model 1', size: 1000000000, type: 'gguf' },
      ]);

      const processManager = (service as any).processManager;
      processManager.spawn = jest.fn().mockReturnValue({
        on: jest.fn(),
        kill: jest.fn(),
      });

      await service.start();

      const state = service.getState();
      expect(state.status).toBe('ready');
      expect(state.models.length).toBe(1);
    });

    // Positive test: Return early if already ready
    it('should return early if server already ready', async () => {
      const stateManager = (service as any).stateManager;
      stateManager.updateStatus('ready');

      await service.start();

      expect((service as any).healthChecker.check).not.toHaveBeenCalled();
    });

    // Positive test: Return early if already starting
    it('should return early if server is starting', async () => {
      const stateManager = (service as any).stateManager;
      stateManager.updateStatus('starting');

      await service.start();

      expect((service as any).processManager.spawn).not.toHaveBeenCalled();
    });

    // Positive test: Handle server already running
    it('should detect already running server', async () => {
      const healthChecker = (service as any).healthChecker;
      healthChecker.check = jest.fn().mockResolvedValue(true);

      const modelLoader = (service as any).modelLoader;
      modelLoader.load = jest.fn().mockResolvedValue([]);

      await service.start();

      const state = service.getState();
      expect(state.status).toBe('ready');
      expect((service as any).processManager.spawn).not.toHaveBeenCalled();
    });

    // Negative test: Handle start failure
    it('should handle start failure and update state', async () => {
      const healthChecker = (service as any).healthChecker;
      healthChecker.check = jest.fn().mockResolvedValue(false);
      healthChecker.waitForReady = jest.fn().mockRejectedValue(
        new Error('Server failed to start')
      );

      await service.start();

      const state = service.getState();
      expect(['error', 'crashed']).toContain(state.status);
      expect(state.lastError).toBeTruthy();
    });

    // Edge case: Handle model loading failure after start
    it('should continue if model loading fails', async () => {
      const healthChecker = (service as any).healthChecker;
      healthChecker.check = jest.fn().mockResolvedValue(false);
      healthChecker.waitForReady = jest.fn().mockResolvedValue(undefined);

      const modelLoader = (service as any).modelLoader;
      modelLoader.load = jest.fn().mockRejectedValue(
        new Error('Failed to load models')
      );

      const processManager = (service as any).processManager;
      processManager.spawn = jest.fn().mockReturnValue({
        on: jest.fn(),
        kill: jest.fn(),
      });

      await service.start();

      const state = service.getState();
      expect(state.models).toEqual([]);
    });
  });

  describe('stop', () => {
    // Positive test: Stop running server
    it('should stop server successfully', async () => {
      const stateManager = (service as any).stateManager;
      stateManager.updateStatus('ready');
      stateManager.startUptimeTracking();

      const processManager = (service as any).processManager;
      processManager.isRunning = jest.fn().mockReturnValue(true);
      processManager.kill = jest.fn().mockResolvedValue(undefined);

      await service.stop();

      const state = service.getState();
      expect(state.status).toBe('initial');
      expect(processManager.kill).toHaveBeenCalledWith('SIGTERM');
    });

    // Positive test: Stop when no process running
    it('should handle stop when no process running', async () => {
      const processManager = (service as any).processManager;
      processManager.isRunning = jest.fn().mockReturnValue(false);

      await service.stop();

      const state = service.getState();
      expect(state.status).toBe('initial');
      expect(processManager.kill).not.toHaveBeenCalled();
    });

    // Positive test: Stop uptime tracking
    it('should stop uptime tracking on stop', async () => {
      const stateManager = (service as any).stateManager;
      stateManager.updateStatus('ready');
      stateManager.startUptimeTracking();

      const processManager = (service as any).processManager;
      processManager.isRunning = jest.fn().mockReturnValue(false);

      await service.stop();

      expect(stateManager.getState().startedAt).toBeNull();
    });
  });

  describe('spawnServer', () => {
    // Positive test: Spawn with correct arguments
    it('should spawn server with correct arguments', async () => {
      const healthChecker = (service as any).healthChecker;
      healthChecker.waitForReady = jest.fn().mockResolvedValue(undefined);

      const modelLoader = (service as any).modelLoader;
      modelLoader.load = jest.fn().mockResolvedValue([]);

      const processManager = (service as any).processManager;
      const mockProcess = {
        on: jest.fn(),
        kill: jest.fn(),
      };
      processManager.spawn = jest.fn().mockReturnValue(mockProcess);

      await service['spawnServer']();

      expect(processManager.spawn).toHaveBeenCalledWith(
        'llama-server',
        expect.arrayContaining(['--host', 'localhost', '--port', '8080'])
      );
    });

    // Positive test: Register process event handlers
    it('should register process event handlers', async () => {
      const healthChecker = (service as any).healthChecker;
      healthChecker.waitForReady = jest.fn().mockResolvedValue(undefined);

      const modelLoader = (service as any).modelLoader;
      modelLoader.load = jest.fn().mockResolvedValue([]);

      const processManager = (service as any).processManager;
      const mockProcess = {
        on: jest.fn(),
        kill: jest.fn(),
      };
      processManager.spawn = jest.fn().mockReturnValue(mockProcess);

      await service['spawnServer']();

      expect(mockProcess.on).toHaveBeenCalledWith(
        'error',
        expect.any(Function)
      );
      expect(mockProcess.on).toHaveBeenCalledWith(
        'exit',
        expect.any(Function)
      );
    });

    // Positive test: Handle process data streams
    it('should handle stdout and stderr', async () => {
      const healthChecker = (service as any).healthChecker;
      healthChecker.waitForReady = jest.fn().mockResolvedValue(undefined);

      const modelLoader = (service as any).modelLoader;
      modelLoader.load = jest.fn().mockResolvedValue([]);

      const processManager = (service as any).processManager;
      const mockProcess = {
        on: jest.fn(),
        kill: jest.fn(),
      };
      processManager.spawn = jest.fn().mockReturnValue(mockProcess);
      processManager.onData = jest.fn();

      await service['spawnServer']();

      expect(processManager.onData).toHaveBeenCalledWith(
        expect.any(Function),
        'stdout'
      );
      expect(processManager.onData).toHaveBeenCalledWith(
        expect.any(Function),
        'stderr'
      );
    });

    // Negative test: Handle process errors
    it('should handle process errors', async () => {
      const healthChecker = (service as any).healthChecker;
      healthChecker.waitForReady = jest.fn().mockRejectedValue(
        new Error('Server failed')
      );

      const modelLoader = (service as any).modelLoader;
      modelLoader.load = jest.fn().mockResolvedValue([]);

      const processManager = (service as any).processManager;
      const mockProcess = {
        on: jest.fn().mockImplementation((event, callback) => {
          if (event === 'error') {
            callback(new Error('Process error'));
          }
        }),
        kill: jest.fn(),
      };
      processManager.spawn = jest.fn().mockReturnValue(mockProcess);

      await service['spawnServer']();

      const state = service.getState();
      expect(['error', 'crashed']).toContain(state.status);
    });

    // Edge case: Handle process exit during startup
    it('should handle process exit during startup', async () => {
      const healthChecker = (service as any).healthChecker;
      healthChecker.waitForReady = jest.fn().mockRejectedValue(
        new Error('Server failed')
      );

      const modelLoader = (service as any).modelLoader;
      modelLoader.load = jest.fn().mockResolvedValue([]);

      const processManager = (service as any).processManager;
      const mockProcess = {
        on: jest.fn().mockImplementation((event, callback) => {
          if (event === 'exit') {
            callback(1, 'SIGTERM');
          }
        }),
        kill: jest.fn(),
      };
      processManager.spawn = jest.fn().mockReturnValue(mockProcess);

      await service['spawnServer']();

      const state = service.getState();
      expect(['error', 'crashed']).toContain(state.status);
    });
  });

  describe('loadModels', () => {
    // Positive test: Load models successfully
    it('should load models successfully', async () => {
      const modelLoader = (service as any).modelLoader;
      const mockModels = [
        { id: 'model1', name: 'Model 1', size: 1000000000, type: 'gguf' },
        { id: 'model2', name: 'Model 2', size: 2000000000, type: 'gguf' },
      ];
      modelLoader.load = jest.fn().mockResolvedValue(mockModels);

      await service['loadModels']();

      const state = service.getState();
      expect(state.models).toHaveLength(2);
      expect(state.models[0].id).toBe('model1');
    });

    // Positive test: Handle empty models list
    it('should handle empty models list', async () => {
      const modelLoader = (service as any).modelLoader;
      modelLoader.load = jest.fn().mockResolvedValue([]);

      await service['loadModels']();

      const state = service.getState();
      expect(state.models).toEqual([]);
    });

    // Negative test: Handle model loading errors
    it('should handle model loading errors gracefully', async () => {
      const modelLoader = (service as any).modelLoader;
      modelLoader.load = jest.fn().mockRejectedValue(
        new Error('Failed to load models')
      );

      await service['loadModels']();

      const state = service.getState();
      expect(state.models).toEqual([]);
    });

    // Edge case: Models with missing properties
    it('should handle models with missing properties', async () => {
      const modelLoader = (service as any).modelLoader;
      const mockModels = [
        { id: 'model1', size: 1000000000, type: 'gguf' }, // Missing name
      ];
      modelLoader.load = jest.fn().mockResolvedValue(mockModels);

      await service['loadModels']();

      const state = service.getState();
      expect(state.models.length).toBe(1);
    });
  });

  describe('handleCrash', () => {
    // Positive test: Retry after crash within limits
    it('should retry after crash within limits', async () => {
      const stateManager = (service as any).stateManager;
      stateManager.updateStatus('crashed');
      stateManager.incrementRetries();

      const healthChecker = (service as any).healthChecker;
      healthChecker.waitForReady = jest.fn().mockResolvedValue(undefined);

      const modelLoader = (service as any).modelLoader;
      modelLoader.load = jest.fn().mockResolvedValue([]);

      const processManager = (service as any).processManager;
      processManager.spawn = jest.fn().mockReturnValue({
        on: jest.fn(),
        kill: jest.fn(),
      });

      const retryHandler = (service as any).retryHandler;
      retryHandler.canRetry = jest.fn().mockReturnValue(true);
      retryHandler.getBackoffMs = jest.fn().mockReturnValue(1000);
      retryHandler.waitForRetry = jest.fn().mockResolvedValue(undefined);

      const startSpy = jest.spyOn(service, 'start' as any).mockResolvedValue(
        undefined
      );

      await service['handleCrash']();

      expect(retryHandler.waitForRetry).toHaveBeenCalled();
      expect(startSpy).toHaveBeenCalled();
    });

    // Negative test: Stop retrying after max retries
    it('should stop retrying after max retries exceeded', async () => {
      const stateManager = (service as any).stateManager;
      stateManager.updateStatus('crashed');
      stateManager.incrementRetries();

      const retryHandler = (service as any).retryHandler;
      retryHandler.canRetry = jest.fn().mockReturnValue(false);

      await service['handleCrash']();

      const state = service.getState();
      expect(state.status).toBe('error');
      expect(state.lastError).toContain('Max retries exceeded');
    });

    // Negative test: Handle retry failure
    it('should handle retry failure recursively', async () => {
      const stateManager = (service as any).stateManager;
      stateManager.updateStatus('crashed');
      stateManager.incrementRetries();

      const retryHandler = (service as any).retryHandler;
      retryHandler.canRetry = jest.fn().mockReturnValue(true);
      retryHandler.getBackoffMs = jest.fn().mockReturnValue(1000);
      retryHandler.waitForRetry = jest.fn().mockResolvedValue(undefined);

      const startSpy = jest
        .spyOn(service, 'start' as any)
        .mockRejectedValue(new Error('Retry failed'));

      await service['handleCrash']();

      expect(startSpy).toHaveBeenCalled();
    });

    // Edge case: Calculate correct retry delay
    it('should calculate correct backoff delay', async () => {
      const stateManager = (service as any).stateManager;
      stateManager.updateStatus('crashed');
      stateManager.getState().retries = 2;

      const retryHandler = (service as any).retryHandler;
      retryHandler.canRetry = jest.fn().mockReturnValue(true);
      retryHandler.getBackoffMs = jest.fn().mockReturnValue(2000); // 2^1 * 1000 = 2000
      retryHandler.waitForRetry = jest.fn().mockResolvedValue(undefined);

      jest.spyOn(service, 'start' as any).mockResolvedValue(undefined);

      await service['handleCrash']();

      expect(retryHandler.getBackoffMs).toHaveBeenCalledWith(2 - 1);
    });
  });

  describe('state management integration', () => {
    // Positive test: State updates trigger callbacks
    it('should trigger callbacks on state updates', async () => {
      const callback = jest.fn();
      service.onStateChange(callback);

      const stateManager = (service as any).stateManager;
      stateManager.updateStatus('starting');

      expect(callback).toHaveBeenCalled();
    });

    // Positive test: Reset retries on successful start
    it('should reset retries on successful start', async () => {
      const stateManager = (service as any).stateManager;
      stateManager.updateStatus('crashed');
      stateManager.incrementRetries();

      expect(service.getState().retries).toBeGreaterThan(0);

      stateManager.updateStatus('ready');

      expect(service.getState().retries).toBe(0);
    });

    // Positive test: Track models in state
    it('should track models in state', async () => {
      const modelLoader = (service as any).modelLoader;
      const mockModels = [
        { id: 'model1', name: 'Model 1', size: 1000000000, type: 'gguf' },
      ];
      modelLoader.load = jest.fn().mockResolvedValue(mockModels);

      await service['loadModels']();

      expect(service.getState().models).toHaveLength(1);
    });
  });

  describe('concurrent operations', () => {
    // Positive test: Handle concurrent start requests
    it('should handle concurrent start requests gracefully', async () => {
      const healthChecker = (service as any).healthChecker;
      healthChecker.check = jest.fn().mockResolvedValue(false);
      healthChecker.waitForReady = jest.fn().mockResolvedValue(undefined);

      const modelLoader = (service as any).modelLoader;
      modelLoader.load = jest.fn().mockResolvedValue([]);

      const processManager = (service as any).processManager;
      processManager.spawn = jest.fn().mockReturnValue({
        on: jest.fn(),
        kill: jest.fn(),
      });

      const startPromise1 = service.start();
      const startPromise2 = service.start();

      await Promise.all([startPromise1, startPromise2]);

      const state = service.getState();
      expect(state.status).toBe('ready');
    });

    // Positive test: Handle stop during start
    it('should handle stop during start', async () => {
      const healthChecker = (service as any).healthChecker;
      healthChecker.waitForReady = jest.fn(
        () => new Promise(() => {}) // Never resolves
      );

      const processManager = (service as any).processManager;
      processManager.spawn = jest.fn().mockReturnValue({
        on: jest.fn(),
        kill: jest.fn(),
      });
      processManager.kill = jest.fn().mockResolvedValue(undefined);
      processManager.isRunning = jest.fn().mockReturnValue(true);

      const startPromise = service.start();
      const stopPromise = service.stop();

      await Promise.all([startPromise, stopPromise].map((p) => p.catch(() => {})));

      expect(processManager.kill).toHaveBeenCalled();
    });
  });
});
