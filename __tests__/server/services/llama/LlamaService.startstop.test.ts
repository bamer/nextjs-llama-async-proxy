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

describe('LlamaService (Start/Stop)', () => {
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

  describe('start', () => {
    beforeEach(() => {
      // Reset state for each test
      mockStateManager.getState.mockReturnValue({
        status: 'initial',
        models: [],
        lastError: null,
        retries: 0,
        uptime: 0,
        startedAt: null,
      });
      mockStateManager.updateStatus.mockClear();
    });

    it('should start server successfully', async () => {
      mockStateManager.getState.mockReturnValue({
        status: 'initial',
        models: [],
        lastError: null,
        retries: 0,
        uptime: 0,
        startedAt: null,
      });
      mockHealthChecker.check.mockResolvedValue(false);
      mockHealthChecker.waitForReady.mockResolvedValue(undefined);
      mockModelLoader.load.mockResolvedValue([
        { id: 'model1', name: 'Model 1', size: 1000000000, type: 'gguf' },
      ]);
      mockProcessManager.spawn.mockReturnValue({ on: jest.fn(), kill: jest.fn() });

      await service.start();

      expect(mockHealthChecker.check).toHaveBeenCalled();
      expect(mockProcessManager.spawn).toHaveBeenCalled();
      expect(mockStateManager.updateStatus).toHaveBeenCalledWith('ready');
      expect(mockLogger.info).toHaveBeenCalledWith('✅ Llama server is ready and models loaded');
    });

    it('should return early if already ready', async () => {
      mockStateManager.getState.mockReturnValue({
        status: 'ready',
        models: [],
        lastError: null,
        retries: 0,
        uptime: 0,
        startedAt: null,
      });

      await service.start();

      expect(mockLogger.info).toHaveBeenCalledWith('✅ Llama server already running');
      expect(mockHealthChecker.check).not.toHaveBeenCalled();
    });

    it('should return early if server is starting', async () => {
      mockStateManager.getState.mockReturnValue({
        status: 'starting',
        models: [],
        lastError: null,
        retries: 0,
        uptime: 0,
        startedAt: null,
      });

      await service.start();

      expect(mockLogger.warn).toHaveBeenCalledWith('⏳ Llama server is already starting');
    });

    it('should detect already running server', async () => {
      mockStateManager.getState.mockReturnValue({
        status: 'initial',
        models: [],
        lastError: null,
        retries: 0,
        uptime: 0,
        startedAt: null,
      });
      mockHealthChecker.check.mockResolvedValue(true);
      mockModelLoader.load.mockResolvedValue([]);

      await service.start();

      expect(mockStateManager.updateStatus).toHaveBeenCalledWith('ready');
      expect(mockProcessManager.spawn).not.toHaveBeenCalled();
    });

    it('should handle start failure and update state', async () => {
      mockStateManager.getState.mockReturnValue({
        status: 'initial',
        models: [],
        lastError: null,
        retries: 0,
        uptime: 0,
        startedAt: null,
      });
      mockHealthChecker.check.mockResolvedValue(false);
      mockHealthChecker.waitForReady.mockRejectedValue(new Error('Server failed to start'));

      await service.start();

      expect(mockStateManager.updateStatus).toHaveBeenCalledWith('error', 'Server failed to start');
      expect(mockLogger.error).toHaveBeenCalledWith('❌ Failed to start llama server: Server failed to start');
    });

    it('should continue if model loading fails', async () => {
      mockStateManager.getState.mockReturnValue({
        status: 'initial',
        models: [],
        lastError: null,
        retries: 0,
        uptime: 0,
        startedAt: null,
      });
      mockHealthChecker.check.mockResolvedValue(false);
      mockHealthChecker.waitForReady.mockResolvedValue(undefined);
      mockModelLoader.load.mockRejectedValue(new Error('Failed to load models'));
      mockProcessManager.spawn.mockReturnValue({ on: jest.fn(), kill: jest.fn() });

      await service.start();

      expect(mockStateManager.setModels).toHaveBeenCalledWith([]);
      expect(mockStateManager.updateStatus).toHaveBeenCalledWith('ready');
    });
  });

  describe('stop', () => {
    it('should stop server successfully', async () => {
      mockProcessManager.isRunning.mockReturnValue(true);
      mockProcessManager.kill.mockResolvedValue(undefined);

      await service.stop();

      expect(mockStateManager.updateStatus).toHaveBeenCalledWith('stopping');
      expect(mockStateManager.stopUptimeTracking).toHaveBeenCalled();
      expect(mockProcessManager.kill).toHaveBeenCalledWith('SIGTERM');
      expect(mockStateManager.updateStatus).toHaveBeenCalledWith('initial');
      expect(mockLogger.info).toHaveBeenCalledWith('✅ Llama server stopped');
    });

    it('should handle stop when no process running', async () => {
      mockProcessManager.isRunning.mockReturnValue(false);

      await service.stop();

      expect(mockStateManager.updateStatus).toHaveBeenCalledWith('stopping');
      expect(mockStateManager.stopUptimeTracking).toHaveBeenCalled();
      expect(mockProcessManager.kill).not.toHaveBeenCalled();
      expect(mockStateManager.updateStatus).toHaveBeenCalledWith('initial');
    });
  });
});
