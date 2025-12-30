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
    jest.clearAllTimers();
    jest.useFakeTimers();

    // Reset mock states with minimal data
    const mockState = {
      status: 'initial',
      models: [],
      lastError: null,
      retries: 0,
      uptime: 0,
      startedAt: null,
    };
    mockStateManager.getState.mockReturnValue(mockState);

    config = {
      host: 'localhost',
      port: 8080,
      basePath: '/models',
      modelPath: '/models/llama.gguf',
    };

    service = new LlamaService(config);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllTimers();

    // Clear mock calls but keep implementations
    mockProcessManager.spawn.mockClear();
    mockProcessManager.onData.mockClear();
    mockProcessManager.onError.mockClear();
    mockProcessManager.onExit.mockClear();
    mockProcessManager.isRunning.mockClear();
    mockProcessManager.kill.mockClear();

    mockHealthChecker.check.mockClear();
    mockHealthChecker.waitForReady.mockClear();

    mockModelLoader.load.mockClear();

    mockStateManager.onStateChange.mockClear();
    mockStateManager.getState.mockClear();
    mockStateManager.updateStatus.mockClear();
    mockStateManager.setModels.mockClear();
    mockStateManager.incrementRetries.mockClear();
    mockStateManager.startUptimeTracking.mockClear();
    mockStateManager.stopUptimeTracking.mockClear();

    mockRetryHandler.canRetry.mockClear();
    mockRetryHandler.getBackoffMs.mockClear();
    mockRetryHandler.waitForRetry.mockClear();

    mockLogger.info.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.error.mockClear();
    mockLogger.debug.mockClear();

    // Explicitly dereference service to help GC
    (service as any) = null;
    (config as any) = null;
  });

  describe('loadModels', () => {
    it('should load models successfully', async () => {
      // Use minimal mock data to reduce memory
      const mockModels = [
        { id: 'm1', name: 'M1', size: 100, type: 'gguf' },
      ];
      mockModelLoader.load.mockResolvedValue(mockModels);

      await (service as any).loadModels();

      expect(mockModelLoader.load).toHaveBeenCalled();
      expect(mockStateManager.setModels).toHaveBeenCalledWith(mockModels);
      expect(mockLogger.info).toHaveBeenCalledWith('✅ Loaded 1 model(s)');
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
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('🔄 Retry 1 in 1s'));
      expect(startSpy).toHaveBeenCalled();

      startSpy.mockRestore();
    });

    it('should stop retrying after max retries exceeded', async () => {
      mockRetryHandler.canRetry.mockReturnValue(false);

      await (service as any).handleCrash();

      expect(mockStateManager.updateStatus).toHaveBeenCalledWith('error', 'Max retries exceeded');
      expect(mockLogger.error).toHaveBeenCalledWith('❌ Max retries exceeded. Giving up.');
    });
  });

  describe('spawnServer', () => {
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
        expect.stringContaining('🚀 Spawning llama-server with args:')
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

    it('should handle process errors', async () => {
      mockHealthChecker.waitForReady.mockResolvedValue(undefined);
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
        { id: 'm1', name: 'Test Model', size: 100, type: 'gguf' }
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
