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

describe('LlamaService (Constructor & State)', () => {
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

    // Explicitly dereference to help GC
    (service as any) = null;
    (config as any) = null;
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      const testService = new LlamaService(config);

      expect(testService).toBeInstanceOf(LlamaService);
      expect(mockLogger.info).toHaveBeenCalledWith('🔧 LlamaService initialized');
    });

    it('should initialize with minimal config', () => {
      const minimalConfig: LlamaServerConfig = {
        host: '0.0.0.0',
        port: 3000,
      };

      const testService = new LlamaService(minimalConfig);

      expect(mockLogger.info).toHaveBeenCalledWith('🔧 LlamaService initialized');
    });
  });

  describe('onStateChange', () => {
    it('should register state change callback', () => {
      const callback = jest.fn();
      service.onStateChange(callback);

      expect(mockStateManager.onStateChange).toHaveBeenCalledWith(callback);
    });

    it('should handle multiple state change callbacks', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      service.onStateChange(callback1);
      service.onStateChange(callback2);

      expect(mockStateManager.onStateChange).toHaveBeenCalledTimes(2);
    });
  });

  describe('getState', () => {
    it('should return current state', () => {
      const state = service.getState();

      expect(mockStateManager.getState).toHaveBeenCalled();
      expect(state).toEqual({
        status: 'initial',
        models: [],
        lastError: null,
        retries: 0,
        uptime: 0,
        startedAt: null,
      });
    });

    it('should delegate to StateManager', () => {
      service.getState();

      expect(mockStateManager.getState).toHaveBeenCalled();
    });
  });
});
