import { LlamaService } from '@/server/services/llama/LlamaService';
import { ProcessManager } from '@/server/services/llama/processManager';
import { HealthChecker } from '@/server/services/llama/healthCheck';
import { ModelLoader } from '@/server/services/llama/modelLoader';
import { ArgumentBuilder } from '@/server/services/llama/argumentBuilder';
import { StateManager } from '@/server/services/llama/stateManager';
import { Logger } from '@/server/services/llama/logger';
import { RetryHandler } from '@/server/services/llama/retryHandler';
import type { LlamaServerConfig, LlamaServiceState } from '@/server/services/llama/types';

jest.mock('@/server/services/llama/processManager');
jest.mock('@/server/services/llama/healthCheck');
jest.mock('@/server/services/llama/modelLoader');
jest.mock('@/server/services/llama/argumentBuilder');
jest.mock('@/server/services/llama/stateManager');
jest.mock('@/server/services/llama/logger');
jest.mock('@/server/services/llama/retryHandler');

const MockProcessManager = ProcessManager as jest.MockedClass<typeof ProcessManager>;
const MockHealthChecker = HealthChecker as jest.MockedClass<typeof HealthChecker>;
const MockModelLoader = ModelLoader as jest.MockedClass<typeof ModelLoader>;
const MockArgumentBuilder = ArgumentBuilder as jest.MockedClass<typeof ArgumentBuilder>;
const MockStateManager = StateManager as jest.MockedClass<typeof StateManager>;
const MockLogger = Logger as jest.MockedClass<typeof Logger>;
const MockRetryHandler = RetryHandler as jest.MockedClass<typeof RetryHandler>;

const defaultConfig: LlamaServerConfig = {
  host: 'localhost',
  port: 8134,
  basePath: '/models',
  serverPath: '/home/bamer/llama.cpp/build/bin/llama-server',
  ctx_size: 8192,
  batch_size: 512,
  threads: -1,
  gpu_layers: -1,
};

const defaultState: LlamaServiceState = {
  status: 'initial',
  models: [],
  lastError: null,
  retries: 0,
  uptime: 0,
  startedAt: null,
};

describe('LlamaService', () => {
  let llamaService: LlamaService;
  let mockProcessManager: any;
  let mockHealthChecker: any;
  let mockModelLoader: any;
  let mockStateManager: any;
  let mockLogger: any;
  let mockRetryHandler: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockProcessManager = {
      isRunning: jest.fn().mockReturnValue(false),
      spawn: jest.fn(),
      kill: jest.fn().mockResolvedValue(undefined),
      onData: jest.fn(),
      onError: jest.fn(),
      onExit: jest.fn(),
    };

    mockHealthChecker = {
      check: jest.fn().mockResolvedValue(false),
      waitForReady: jest.fn().mockResolvedValue(undefined),
    };

    mockModelLoader = {
      load: jest.fn().mockResolvedValue([]),
    };

    mockStateManager = {
      onStateChange: jest.fn(),
      getState: jest.fn().mockReturnValue(defaultState),
      updateStatus: jest.fn(),
      setModels: jest.fn(),
      incrementRetries: jest.fn(),
      startUptimeTracking: jest.fn(),
      stopUptimeTracking: jest.fn(),
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    mockRetryHandler = {
      canRetry: jest.fn().mockReturnValue(true),
      getBackoffMs: jest.fn().mockReturnValue(1000),
      waitForRetry: jest.fn().mockResolvedValue(undefined),
    };

    MockProcessManager.mockImplementation(() => mockProcessManager);
    MockHealthChecker.mockImplementation(() => mockHealthChecker);
    MockModelLoader.mockImplementation(() => mockModelLoader);
    MockStateManager.mockImplementation(() => mockStateManager);
    MockLogger.mockImplementation(() => mockLogger);
    MockRetryHandler.mockImplementation(() => mockRetryHandler);

    llamaService = new LlamaService(defaultConfig);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with config', () => {
      const service = new LlamaService(defaultConfig);

      expect(service).toBeInstanceOf(LlamaService);
    });

    it('should create all required service instances', () => {
      expect(MockProcessManager).toHaveBeenCalledWith();
      expect(MockHealthChecker).toHaveBeenCalledWith(defaultConfig.host, defaultConfig.port);
      expect(MockModelLoader).toHaveBeenCalledWith(defaultConfig.host, defaultConfig.port, defaultConfig.basePath);
      expect(MockStateManager).toHaveBeenCalledWith();
      expect(MockLogger).toHaveBeenCalledWith('LlamaService');
      expect(MockRetryHandler).toHaveBeenCalledWith();
    });

    it('should log initialization message', () => {
      expect(mockLogger.info).toHaveBeenCalledWith('🔧 LlamaService initialized');
    });
  });

  describe('onStateChange', () => {
    it('should register state change callback', () => {
      const callback = jest.fn();

      llamaService.onStateChange(callback);

      expect(mockStateManager.onStateChange).toHaveBeenCalledWith(callback);
    });
  });

  describe('getState', () => {
    it('should return current state', () => {
      const state = llamaService.getState();

      expect(state).toEqual(defaultState);
      expect(mockStateManager.getState).toHaveBeenCalled();
    });
  });

  describe('start', () => {
    it('should start server when status is initial', async () => {
      mockStateManager.getState.mockReturnValue({
        ...defaultState,
        status: 'initial',
      });

      await llamaService.start();

      expect(mockStateManager.updateStatus).toHaveBeenCalledWith('starting');
      expect(mockHealthChecker.check).toHaveBeenCalled();
      expect(mockProcessManager.spawn).toHaveBeenCalled();
    });

    it('should not start when already ready', async () => {
      mockStateManager.getState.mockReturnValue({
        ...defaultState,
        status: 'ready',
      });

      await llamaService.start();

      expect(mockHealthChecker.check).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('✅ Llama server already running');
    });

    it('should not start when already starting', async () => {
      mockStateManager.getState.mockReturnValue({
        ...defaultState,
        status: 'starting',
      });

      await llamaService.start();

      expect(mockHealthChecker.check).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith('⏳ Llama server is already starting');
    });

    it('should load models when server is already alive', async () => {
      mockHealthChecker.check.mockResolvedValue(true);
      mockStateManager.getState.mockReturnValue({
        ...defaultState,
        status: 'initial',
      });

      await llamaService.start();

      expect(mockModelLoader.load).toHaveBeenCalled();
      expect(mockStateManager.updateStatus).toHaveBeenCalledWith('ready');
    });

    it('should handle spawn errors', async () => {
      const error = new Error('Spawn failed');
      mockProcessManager.spawn.mockImplementation(() => {
        throw error;
      });

      await llamaService.start();

      expect(mockLogger.error).toHaveBeenCalledWith(
        '❌ Failed to start llama server: Spawn failed'
      );
      expect(mockStateManager.updateStatus).toHaveBeenCalledWith('error', 'Spawn failed');
    });

    it('should spawn server with correct arguments', async () => {
      const mockArgs = ['-m', 'model.gguf', '-c', '8192'];
      jest.spyOn(ArgumentBuilder, 'build').mockReturnValue(mockArgs);

      await llamaService.start();

      expect(mockProcessManager.spawn).toHaveBeenCalledWith(
        defaultConfig.serverPath || 'llama-server',
        mockArgs
      );
    });

    it('should start uptime tracking on success', async () => {
      await llamaService.start();

      expect(mockStateManager.startUptimeTracking).toHaveBeenCalled();
    });

    it('should set up data handlers', async () => {
      await llamaService.start();

      expect(mockProcessManager.onData).toHaveBeenCalledTimes(2);
    });

    it('should set up error handler', async () => {
      await llamaService.start();

      expect(mockProcessManager.onError).toHaveBeenCalled();
    });

    it('should set up exit handler', async () => {
      await llamaService.start();

      expect(mockProcessManager.onExit).toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('should stop running server', async () => {
      mockProcessManager.isRunning.mockReturnValue(true);

      await llamaService.stop();

      expect(mockLogger.info).toHaveBeenCalledWith('🛑 Stopping llama server...');
      expect(mockStateManager.updateStatus).toHaveBeenCalledWith('stopping');
      expect(mockStateManager.stopUptimeTracking).toHaveBeenCalled();
      expect(mockProcessManager.kill).toHaveBeenCalledWith('SIGTERM');
      expect(mockLogger.info).toHaveBeenCalledWith('✅ Llama server stopped');
      expect(mockStateManager.updateStatus).toHaveBeenCalledWith('initial');
    });

    it('should not kill if server not running', async () => {
      mockProcessManager.isRunning.mockReturnValue(false);

      await llamaService.stop();

      expect(mockProcessManager.kill).not.toHaveBeenCalled();
    });

    it('should update status to initial after stop', async () => {
      mockProcessManager.isRunning.mockReturnValue(false);

      await llamaService.stop();

      expect(mockStateManager.updateStatus).toHaveBeenCalledWith('initial');
    });
  });

  describe('spawnServer', () => {
    it('should build arguments with config', async () => {
      const mockArgs = ['--arg1', '--arg2'];
      jest.spyOn(ArgumentBuilder, 'build').mockReturnValue(mockArgs);

      await llamaService.start();

      expect(ArgumentBuilder.build).toHaveBeenCalledWith(defaultConfig);
    });

    it('should use default server path if not configured', async () => {
      const configWithoutPath: LlamaServerConfig = {
        ...defaultConfig,
        serverPath: undefined,
      };
      llamaService = new LlamaService(configWithoutPath);

      await llamaService.start();

      expect(mockProcessManager.spawn).toHaveBeenCalledWith(
        'llama-server',
        expect.any(Array)
      );
    });

    it('should use configured server path', async () => {
      await llamaService.start();

      expect(mockProcessManager.spawn).toHaveBeenCalledWith(
        defaultConfig.serverPath,
        expect.any(Array)
      );
    });
  });

  describe('loadModels', () => {
    it('should load models successfully', async () => {
      const mockModels = [
        { id: 'model1', name: 'Model 1', size: 10737418240 },
        { id: 'model2', name: 'Model 2', size: 53687091200 },
      ];
      mockModelLoader.load.mockResolvedValue(mockModels);

      await llamaService.start();

      expect(mockModelLoader.load).toHaveBeenCalled();
      expect(mockStateManager.setModels).toHaveBeenCalledWith(mockModels);
      expect(mockLogger.info).toHaveBeenCalledWith(`✅ Loaded 2 model(s)`);
    });

    it('should handle model loading errors', async () => {
      const error = new Error('Failed to load models');
      mockModelLoader.load.mockRejectedValue(error);

      await llamaService.start();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to load models: Failed to load models'
      );
      expect(mockStateManager.setModels).toHaveBeenCalledWith([]);
    });

    it('should log model sizes in GB', async () => {
      const mockModels = [
        { id: 'model1', name: 'Model 1', size: 10737418240 },
      ];
      mockModelLoader.load.mockResolvedValue(mockModels);

      await llamaService.start();

      expect(mockLogger.info).toHaveBeenCalledWith(
        '  - Model 1 (10.00 GB)'
      );
    });

    it('should handle zero or unknown model sizes', async () => {
      const mockModels = [
        { id: 'model1', name: 'Model 1', size: 0 },
        { id: 'model2', name: 'Model 2', size: -1 },
      ];
      mockModelLoader.load.mockResolvedValue(mockModels);

      await llamaService.start();

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('unknown')
      );
    });
  });

  describe('handleCrash', () => {
    beforeEach(() => {
      mockStateManager.getState.mockReturnValue({
        ...defaultState,
        retries: 0,
      });
    });

    it('should retry when can retry', async () => {
      mockRetryHandler.canRetry.mockReturnValue(true);

      await llamaService.start();
      expect(mockStateManager.incrementRetries).toHaveBeenCalled();
      expect(mockRetryHandler.getBackoffMs).toHaveBeenCalledWith(0);
      expect(mockStateManager.updateStatus).toHaveBeenCalledWith('crashed');
    });

    it('should stop retrying when max retries exceeded', async () => {
      mockRetryHandler.canRetry.mockReturnValue(false);

      await llamaService.start();

      expect(mockStateManager.updateStatus).toHaveBeenCalledWith(
        'error',
        'Max retries exceeded'
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        '❌ Max retries exceeded. Giving up.'
      );
      expect(mockStateManager.incrementRetries).not.toHaveBeenCalled();
    });

    it('should log retry delay', async () => {
      mockRetryHandler.getBackoffMs.mockReturnValue(2000);

      await llamaService.start();

      expect(mockLogger.info).toHaveBeenCalledWith(
        '🔄 Retry 1 in 2s'
      );
    });

    it('should retry after delay', async () => {
      await llamaService.start();

      expect(mockRetryHandler.waitForRetry).toHaveBeenCalledWith(0);
    });

    it('should handle retry failures', async () => {
      const error = new Error('Retry failed');
      mockRetryHandler.waitForRetry.mockRejectedValue(error);

      await llamaService.start();

      expect(mockLogger.error).toHaveBeenCalledWith('Retry failed: Retry failed');
    });
  });

  describe('integration scenarios', () => {
    it('should handle full lifecycle: start → stop', async () => {
      mockProcessManager.isRunning.mockReturnValue(false);

      await llamaService.start();
      expect(mockStateManager.getState().status).toBe('ready');

      mockProcessManager.isRunning.mockReturnValue(true);
      await llamaService.stop();

      expect(mockStateManager.getState().status).toBe('initial');
    });

    it('should handle crash → retry → success flow', async () => {
      mockStateManager.getState.mockReturnValue({ ...defaultState, retries: 0 });
      mockHealthChecker.check.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
      mockProcessManager.spawn.mockImplementationOnce(() => {
        throw new Error('Process error');
      }).mockImplementation(() => ({}));

      await llamaService.start();

      expect(mockStateManager.getState().retries).toBeGreaterThan(0);
      expect(mockStateManager.getState().status).toBe('ready');
    });

    it('should handle immediate success with existing server', async () => {
      mockHealthChecker.check.mockResolvedValue(true);
      mockStateManager.getState.mockReturnValue({ ...defaultState, status: 'initial' });

      await llamaService.start();

      expect(mockModelLoader.load).toHaveBeenCalled();
      expect(mockProcessManager.spawn).not.toHaveBeenCalled();
      expect(mockStateManager.getState().status).toBe('ready');
    });
  });

  describe('state change callbacks', () => {
    it('should call registered callbacks on state changes', async () => {
      const callback = jest.fn();
      llamaService.onStateChange(callback);

      await llamaService.start();

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'ready' })
      );
    });

    it('should support multiple state change callbacks', async () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      llamaService.onStateChange(callback1);
      llamaService.onStateChange(callback2);

      await llamaService.start();

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });
});
