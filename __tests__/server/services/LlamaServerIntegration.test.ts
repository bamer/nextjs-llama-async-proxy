import { Server, Socket } from 'socket.io';
import { LlamaServerIntegration } from '@/server/services/LlamaServerIntegration';
import { LlamaService, LlamaServerConfig } from '@/server/services/LlamaService';
import { getWebSocketTransport } from '@/lib/logger';

jest.mock('@/server/services/LlamaService');
jest.mock('child_process');
jest.mock('@/lib/logger', () => ({
  ...jest.requireActual('@/lib/logger'),
  getWebSocketTransport: jest.fn(),
}));

const mockedLlamaService = LlamaService as jest.MockedClass<typeof LlamaService>;

type SocketEventHandler = (...args: any[]) => void;

const createMockSocket = (): Partial<Socket> => {
  const eventHandlers = new Map<string, SocketEventHandler[]>();

  const mockSocket: Partial<Socket> = {
    emit: jest.fn(),
    on: jest.fn((event: string, handler: SocketEventHandler): any => {
      if (!eventHandlers.has(event)) {
        eventHandlers.set(event, []);
      }
      eventHandlers.get(event)!.push(handler);
      return mockSocket;
    }) as any,
  };

  return mockSocket;
};

describe('LlamaServerIntegration', () => {
  let integration: LlamaServerIntegration;
  let mockIo: Partial<Server>;
  let mockLlamaServiceInstance: jest.Mocked<LlamaService>;
  let mockConfig: LlamaServerConfig;
  let mockSocket: Partial<Socket>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockConfig = {
      host: 'localhost',
      port: 8080,
      modelPath: '/path/to/model.gguf',
      basePath: '/path/to/models',
    };

    mockLlamaServiceInstance = {
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      getState: jest.fn().mockReturnValue({
        status: 'ready',
        models: [
          {
            id: 'model1',
            name: 'Model 1',
            size: 1000000000,
            type: 'gguf',
            modified_at: Date.now() / 1000,
          },
        ],
        lastError: null,
        retries: 0,
        uptime: 100,
        startedAt: new Date(),
      }),
      onStateChange: jest.fn(),
    } as any;

    mockedLlamaService.mockImplementation(() => mockLlamaServiceInstance);

    mockIo = {
      emit: jest.fn(),
    };

    mockSocket = createMockSocket();

    integration = new LlamaServerIntegration(mockIo as Server);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should initialize with socket.io instance', () => {
      expect(integration).toBeInstanceOf(LlamaServerIntegration);
    });
  });

  describe('initialize', () => {
    it('should initialize llama service and start metrics broadcast', async () => {
      await integration.initialize(mockConfig);

      expect(mockedLlamaService).toHaveBeenCalledWith(mockConfig);
      expect(mockLlamaServiceInstance.start).toHaveBeenCalled();
      expect(mockLlamaServiceInstance.onStateChange).toHaveBeenCalled();
    });

    it('should throw error if initialization fails', async () => {
      mockLlamaServiceInstance.start.mockRejectedValue(new Error('Failed to start'));

      await expect(integration.initialize(mockConfig)).rejects.toThrow('Failed to start');
    });

    it('should broadcast state changes', async () => {
      let stateChangeCallback: any;
      mockLlamaServiceInstance.onStateChange.mockImplementation((callback) => {
        stateChangeCallback = callback;
      });

      await integration.initialize(mockConfig);

      if (stateChangeCallback) {
        stateChangeCallback({
          status: 'ready',
          models: [{ id: 'model1', name: 'Model 1', size: 1000000000, type: 'gguf', modified_at: Date.now() / 1000 }],
          lastError: null,
          retries: 0,
          uptime: 100,
        });
      }

      expect(mockIo.emit).toHaveBeenCalledWith(
        'llamaStatus',
        expect.objectContaining({
          type: 'status',
        })
      );
      expect(mockIo.emit).toHaveBeenCalledWith(
        'models',
        expect.objectContaining({
          type: 'models',
        })
      );
    });
  });

  describe('stop', () => {
    beforeEach(async () => {
      await integration.initialize(mockConfig);
    });

    it('should stop llama service and clear metrics interval', async () => {
      await integration.stop();

      expect(mockLlamaServiceInstance.stop).toHaveBeenCalled();
    });
  });

  describe('getLlamaService', () => {
    it('should return the llama service instance', async () => {
      await integration.initialize(mockConfig);

      const service = integration.getLlamaService();

      expect(service).toBe(mockLlamaServiceInstance);
    });

    it('should return null if not initialized', () => {
      const service = integration.getLlamaService();

      expect(service).toBeNull();
    });
  });

  describe('setupWebSocketHandlers', () => {
    beforeEach(async () => {
      await integration.initialize(mockConfig);
    });

    it('should handle requestMetrics event', async () => {
      let requestMetricsCallback: any;
      const socketOnMock = mockSocket.on as jest.Mock;
      socketOnMock.mockImplementation((event: string, callback: any): any => {
        if (event === 'requestMetrics') {
          requestMetricsCallback = callback;
        }
        return mockSocket;
      });

      integration.setupWebSocketHandlers(mockSocket as Socket);

      if (requestMetricsCallback) {
        await requestMetricsCallback();
      }

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'metrics',
        expect.objectContaining({
          type: 'metrics',
        })
      );
    });

    it('should handle requestModels event', async () => {
      let requestModelsCallback: any;
      const socketOnMock = mockSocket.on as jest.Mock;
      socketOnMock.mockImplementation((event: string, callback: any): any => {
        if (event === 'requestModels') {
          requestModelsCallback = callback;
        }
        return mockSocket;
      });

      integration.setupWebSocketHandlers(mockSocket as Socket);

      if (requestModelsCallback) {
        await requestModelsCallback();
      }

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'models',
        expect.objectContaining({
          type: 'models',
        })
      );
    });

    it('should handle requestLlamaStatus event', async () => {
      let requestLlamaStatusCallback: any;
      const socketOnMock = mockSocket.on as jest.Mock;
      socketOnMock.mockImplementation((event: string, callback: any): any => {
        if (event === 'requestLlamaStatus') {
          requestLlamaStatusCallback = callback;
        }
        return mockSocket;
      });

      integration.setupWebSocketHandlers(mockSocket as Socket);

      if (requestLlamaStatusCallback) {
        await requestLlamaStatusCallback();
      }

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'llamaStatus',
        expect.objectContaining({
          type: 'status',
        })
      );
    });

    it('should handle rescanModels event', async () => {
      let rescanModelsCallback: any;
      const socketOnMock = mockSocket.on as jest.Mock;
      socketOnMock.mockImplementation((event: string, callback: any): any => {
        if (event === 'rescanModels') {
          rescanModelsCallback = callback;
        }
        return mockSocket;
      });

      integration.setupWebSocketHandlers(mockSocket as Socket);

      if (rescanModelsCallback) {
        await rescanModelsCallback();
      }

      expect(mockLlamaServiceInstance.stop).toHaveBeenCalled();
      expect(mockLlamaServiceInstance.start).toHaveBeenCalled();
    });

    it('should handle startModel event with successful fetch', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      }) as any;

      let startModelCallback: any;
      const socketOnMock = mockSocket.on as jest.Mock;
      socketOnMock.mockImplementation((event: string, callback: any): any => {
        if (event === 'startModel') {
          startModelCallback = callback;
        }
        return mockSocket;
      });

      integration.setupWebSocketHandlers(mockSocket as Socket);

      if (startModelCallback) {
        await startModelCallback({ modelId: 'model1' });
      }

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'modelStarted',
        expect.objectContaining({
          modelId: 'model1',
        })
      );

      (global.fetch as jest.Mock).mockRestore();
    });

    it('should handle startModel event when llama service is not available', async () => {
      jest.spyOn(integration, 'getLlamaService').mockReturnValue(null);

      let startModelCallback: any;
      const socketOnMock = mockSocket.on as jest.Mock;
      socketOnMock.mockImplementation((event: string, callback: any): any => {
        if (event === 'startModel') {
          startModelCallback = callback;
        }
        return mockSocket;
      });

      integration.setupWebSocketHandlers(mockSocket as Socket);

      if (startModelCallback) {
        await startModelCallback({ modelId: 'model1' });
      }

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({
          message: expect.stringContaining('not available'),
        })
      );
    });

    it('should handle stopModel event', async () => {
      let stopModelCallback: any;
      const socketOnMock = mockSocket.on as jest.Mock;
      socketOnMock.mockImplementation((event: string, callback: any): any => {
        if (event === 'stopModel') {
          stopModelCallback = callback;
        }
        return mockSocket;
      });

      integration.setupWebSocketHandlers(mockSocket as Socket);

      if (stopModelCallback) {
        await stopModelCallback({ modelId: 'model1' });
      }

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'modelStopped',
        expect.objectContaining({
          modelId: 'model1',
        })
      );
    });

    it('should handle requestLogs event', async () => {
      let requestLogsCallback: any;
      const socketOnMock = mockSocket.on as jest.Mock;
      socketOnMock.mockImplementation((event: string, callback: any): any => {
        if (event === 'requestLogs') {
          requestLogsCallback = callback;
        }
        return mockSocket;
      });

      integration.setupWebSocketHandlers(mockSocket as Socket);

      if (requestLogsCallback) {
        await requestLogsCallback();
      }

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'logs',
        expect.objectContaining({
          type: 'logs',
        })
      );
    });

    it('should handle restart_server event', async () => {
      let restartServerCallback: any;
      const socketOnMock = mockSocket.on as jest.Mock;
      socketOnMock.mockImplementation((event: string, callback: any): any => {
        if (event === 'restart_server') {
          restartServerCallback = callback;
        }
        return mockSocket;
      });

      integration.setupWebSocketHandlers(mockSocket as Socket);

      if (restartServerCallback) {
        await restartServerCallback();
      }

      expect(mockLlamaServiceInstance.stop).toHaveBeenCalled();
      expect(mockLlamaServiceInstance.start).toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'serverRestarted',
        expect.objectContaining({
          message: 'Server restarted successfully',
        })
      );
    });

    it('should handle download_logs event and return cached logs', async () => {
      let downloadLogsCallback: any;
      const socketOnMock = mockSocket.on as jest.Mock;
      socketOnMock.mockImplementation((event: string, callback: any): any => {
        if (event === 'download_logs') {
          downloadLogsCallback = callback;
        }
        return mockSocket;
      });

      // Mock getWebSocketTransport to return logs
      (getWebSocketTransport as jest.Mock).mockReturnValue({
        getCachedLogs: () => [{ id: '1', level: 'info', message: 'Test log', timestamp: '2024-01-01' }],
      });

      integration.setupWebSocketHandlers(mockSocket as Socket);

      if (downloadLogsCallback) {
        await downloadLogsCallback();
      }

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'logs',
        expect.objectContaining({
          type: 'logs',
        })
      );
    });

    it('should handle downloadLogs event and return cached logs', async () => {
      let downloadLogsCallback: any;
      const socketOnMock = mockSocket.on as jest.Mock;
      socketOnMock.mockImplementation((event: string, callback: any): any => {
        if (event === 'downloadLogs') {
          downloadLogsCallback = callback;
        }
        return mockSocket;
      });

      // Mock getWebSocketTransport to return logs
      (getWebSocketTransport as jest.Mock).mockReturnValue({
        getCachedLogs: () => [{ id: '1', level: 'info', message: 'Test log', timestamp: '2024-01-01' }],
      });

      integration.setupWebSocketHandlers(mockSocket as Socket);

      if (downloadLogsCallback) {
        await downloadLogsCallback();
      }

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'logs',
        expect.objectContaining({
          type: 'logs',
        })
      );
    });
  });
});
