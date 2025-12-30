// Mock implementations - must be defined before jest.mock calls
const mockProcessManager = {
  spawn: jest.fn(),
  onData: jest.fn(),
  onError: jest.fn(),
  onExit: jest.fn(),
  isRunning: jest.fn(),
  kill: jest.fn(),
};

const mockHealthChecker = {
  check: jest.fn(),
  waitForReady: jest.fn(),
};

const mockModelLoader = {
  load: jest.fn(),
};

const mockStateManager = {
  onStateChange: jest.fn(),
  getState: jest.fn(),
  updateStatus: jest.fn(),
  setModels: jest.fn(),
  incrementRetries: jest.fn(),
  startUptimeTracking: jest.fn(),
  stopUptimeTracking: jest.fn(),
};

const mockRetryHandler = {
  canRetry: jest.fn(),
  getBackoffMs: jest.fn(),
  waitForRetry: jest.fn(),
};

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// Apply mocks before imports
jest.mock('@/server/services/llama/processManager', () => ({
  ProcessManager: jest.fn().mockImplementation(() => mockProcessManager),
}));

jest.mock('@/server/services/llama/healthCheck', () => ({
  HealthChecker: jest.fn().mockImplementation(() => mockHealthChecker),
}));

jest.mock('@/server/services/llama/modelLoader', () => ({
  ModelLoader: jest.fn().mockImplementation(() => mockModelLoader),
}));

jest.mock('@/server/services/llama/stateManager', () => ({
  StateManager: jest.fn().mockImplementation(() => mockStateManager),
}));

jest.mock('@/server/services/llama/retryHandler', () => ({
  RetryHandler: jest.fn().mockImplementation(() => mockRetryHandler),
}));

jest.mock('@/lib/logger', () => ({
  getLogger: jest.fn().mockReturnValue(mockLogger),
}));

import { LlamaService } from '@/server/services/llama/LlamaService';
import type { LlamaServerConfig } from '@/server/services/llama/types';

describe('LlamaService (Models & Crash Handling)', () => {
  let service: LlamaService;
  let config: LlamaServerConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Reset mock states
    mockStateManager.getState.mockReturnValue({
      status: 'initial',
      models: [],
      lastError: null,
      retries: 0,
      uptime: 0,
      startedAt: null,
    });

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
    jest.clearAllMocks();
  });

  describe('loadModels', () => {
    it('should load models successfully', async () => {
      const mockModels = [
        { id: 'model1', name: 'Model 1', size: 1000000000, type: 'gguf' },
        { id: 'model2', name: 'Model 2', size: 2000000000, type: 'gguf' },
      ];
      mockModelLoader.load.mockResolvedValue(mockModels);

      await (service as any).loadModels();

      expect(mockModelLoader.load).toHaveBeenCalled();
      expect(mockStateManager.setModels).toHaveBeenCalledWith(mockModels);
      expect(mockLogger.info).toHaveBeenCalledWith('✅ Loaded 2 model(s)');
    });

    it('should handle empty models list', async () => {
      mockModelLoader.load.mockResolvedValue([]);

      await (service as any).loadModels();

      expect(mockStateManager.setModels).toHaveBeenCalledWith([]);
      expect(mockLogger.info).toHaveBeenCalledWith('✅ Loaded 0 model(s)');
    });

    it('should handle model loading errors gracefully', async () => {
      mockModelLoader.load.mockRejectedValue(new Error('Failed to load models'));

      await (service as any).loadModels();

      expect(mockStateManager.setModels).toHaveBeenCalledWith([]);
      expect(mockLogger.warn).toHaveBeenCalledWith('Failed to load models: Failed to load models');
    });
  });

  describe('handleCrash', () => {
    beforeEach(() => {
      mockStateManager.getState.mockReturnValue({
        status: 'crashed',
        models: [],
        lastError: null,
        retries: 1,
        uptime: 0,
        startedAt: null,
      });
    });

    it('should retry after crash within limits', async () => {
      mockRetryHandler.canRetry.mockReturnValue(true);
      mockRetryHandler.getBackoffMs.mockReturnValue(1000);
      mockRetryHandler.waitForRetry.mockResolvedValue(undefined);

      // Mock successful retry
      const startSpy = jest.spyOn(service, 'start' as any).mockResolvedValue(undefined);

      await (service as any).handleCrash();

      expect(mockRetryHandler.canRetry).toHaveBeenCalledWith(1);
      expect(mockStateManager.incrementRetries).toHaveBeenCalled();
      expect(mockRetryHandler.waitForRetry).toHaveBeenCalledWith(0);
      expect(mockLogger.info).toHaveBeenCalledWith('🔄 Retry 1 in 1000s');
      expect(startSpy).toHaveBeenCalled();

      startSpy.mockRestore();
    });

    it('should stop retrying after max retries exceeded', async () => {
      mockRetryHandler.canRetry.mockReturnValue(false);

      await (service as any).handleCrash();

      expect(mockStateManager.updateStatus).toHaveBeenCalledWith('error', 'Max retries exceeded');
      expect(mockLogger.error).toHaveBeenCalledWith('❌ Max retries exceeded. Giving up.');
    });

    it('should handle retry failure', async () => {
      mockRetryHandler.canRetry.mockReturnValue(true);
      mockRetryHandler.getBackoffMs.mockReturnValue(1000);
      mockRetryHandler.waitForRetry.mockResolvedValue(undefined);

      // Mock start to fail once and then succeed to avoid infinite loop
      const startSpy = jest.spyOn(service, 'start' as any)
        .mockRejectedValueOnce(new Error('Retry failed'))
        .mockResolvedValueOnce(undefined);

      await (service as any).handleCrash();

      expect(startSpy).toHaveBeenCalledTimes(2); // First call fails, second succeeds
      expect(mockLogger.error).toHaveBeenCalledWith('Retry failed: Retry failed');

      startSpy.mockRestore();
    });
  });

  describe('spawnServer', () => {
    beforeEach(() => {
      mockProcessManager.spawn.mockClear();
      mockProcessManager.onData.mockClear();
      mockProcessManager.onError.mockClear();
      mockProcessManager.onExit.mockClear();
    });

    it('should spawn server with correct arguments', async () => {
      mockHealthChecker.waitForReady.mockResolvedValue(undefined);
      mockModelLoader.load.mockResolvedValue([]);
      mockProcessManager.spawn.mockReturnValue({ on: jest.fn(), kill: jest.fn() });

      await (service as any).spawnServer();

      expect(mockProcessManager.spawn).toHaveBeenCalledWith(
        'llama-server',
        expect.arrayContaining(['--host', 'localhost', '--port', '8080'])
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        '🚀 Spawning llama-server with args: --host localhost --port 8080'
      );
    });

    it('should register process event handlers', async () => {
      mockHealthChecker.waitForReady.mockResolvedValue(undefined);
      mockModelLoader.load.mockResolvedValue([]);
      const mockProcess = { on: jest.fn(), kill: jest.fn() };
      mockProcessManager.spawn.mockReturnValue(mockProcess);

      await (service as any).spawnServer();

      expect(mockProcessManager.onData).toHaveBeenCalledWith(expect.any(Function), 'stdout');
      expect(mockProcessManager.onData).toHaveBeenCalledWith(expect.any(Function), 'stderr');
      expect(mockProcessManager.onError).toHaveBeenCalledWith(expect.any(Function));
      expect(mockProcessManager.onExit).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should handle stdout and stderr', async () => {
      mockHealthChecker.waitForReady.mockResolvedValue(undefined);
      mockModelLoader.load.mockResolvedValue([]);
      mockProcessManager.spawn.mockReturnValue({ on: jest.fn(), kill: jest.fn() });

      await (service as any).spawnServer();

      expect(mockProcessManager.onData).toHaveBeenCalledTimes(2);
    });

    it('should handle process errors', async () => {
      mockHealthChecker.waitForReady.mockRejectedValue(new Error('Server failed'));
      mockModelLoader.load.mockResolvedValue([]);
      mockProcessManager.spawn.mockReturnValue({ on: jest.fn(), kill: jest.fn() });

      // Mock the error handler to trigger crash handling
      mockProcessManager.onError.mockImplementation((callback) => {
        callback(new Error('Process error'));
      });

      await (service as any).spawnServer();

      expect(mockLogger.error).toHaveBeenCalledWith('Process error: Process error');
    });

    it('should handle process exit during startup', async () => {
      mockHealthChecker.waitForReady.mockResolvedValue(undefined);
      mockModelLoader.load.mockResolvedValue([]);
      mockProcessManager.spawn.mockReturnValue({ on: jest.fn(), kill: jest.fn() });

      // Mock onExit to call the callback immediately
      mockProcessManager.onExit.mockImplementation((callback) => {
        callback(1, 'SIGTERM');
      });

      await service['spawnServer']();

      expect(mockLogger.warn).toHaveBeenCalledWith('Process exited with code 1 signal SIGTERM');
    });
  });

  describe('integration tests', () => {
    beforeEach(() => {
      mockStateManager.getState.mockReturnValue({
        status: 'initial',
        models: [],
        lastError: null,
        retries: 0,
        uptime: 0,
        startedAt: null,
      });
    });

    it('should complete full startup sequence', async () => {
      mockHealthChecker.check.mockResolvedValue(false);
      mockHealthChecker.waitForReady.mockResolvedValue(undefined);
      mockModelLoader.load.mockResolvedValue([
        { id: 'model1', name: 'Test Model', size: 1000000000, type: 'gguf' }
      ]);
      mockProcessManager.spawn.mockReturnValue({ on: jest.fn(), kill: jest.fn() });

      await service.start();

      expect(mockStateManager.updateStatus).toHaveBeenCalledWith('starting');
      expect(mockHealthChecker.check).toHaveBeenCalled();
      expect(mockProcessManager.spawn).toHaveBeenCalled();
      expect(mockModelLoader.load).toHaveBeenCalled();
      expect(mockStateManager.updateStatus).toHaveBeenCalledWith('ready');
    });

    it('should handle stop during operation', async () => {
      mockProcessManager.isRunning.mockReturnValue(true);
      mockProcessManager.kill.mockResolvedValue(undefined);

      await service.stop();

      expect(mockStateManager.updateStatus).toHaveBeenCalledWith('stopping');
      expect(mockStateManager.stopUptimeTracking).toHaveBeenCalled();
      expect(mockProcessManager.kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('should handle multiple state change callbacks', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      service.onStateChange(callback1);
      service.onStateChange(callback2);

      expect(mockStateManager.onStateChange).toHaveBeenCalledTimes(2);
    });
  });
});
