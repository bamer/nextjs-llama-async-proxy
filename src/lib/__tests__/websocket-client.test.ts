import { WebSocketClient, websocketServer } from '@/lib/websocket-client';
import { io, Socket } from 'socket.io-client';

jest.mock('socket.io-client');

const mockedIo = io as jest.MockedFunction<typeof io>;
const mockedSocket = {
  connected: false,
  id: 'test-socket-id',
  on: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
} as unknown as jest.Mocked<Socket>;

describe('websocket-client', () => {
  let client: WebSocketClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new WebSocketClient();
    mockedSocket.connected = false;
    mockedSocket.id = 'test-socket-id';
    mockedIo.mockReturnValue(mockedSocket);

    // Mock window object
    (global as any).window = {
      location: {
        origin: 'http://localhost:3000',
      },
    };
  });

  describe('constructor', () => {
    it('should create a new WebSocketClient instance', () => {
      expect(client).toBeInstanceOf(WebSocketClient);
    });

    it('should initialize with null socket', () => {
      expect((client as any).socket).toBeNull();
      expect((client as any).socketId).toBeNull();
    });
  });

  describe('connect', () => {
    it('should connect to Socket.IO server', () => {
      client.connect();

      expect(mockedIo).toHaveBeenCalledWith('http://localhost:3000', {
        path: '/llamaproxws',
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });
    });

    it('should not connect if already connected', () => {
      mockedSocket.connected = true;
      (client as any).socket = mockedSocket;

      client.connect();

      expect(mockedIo).not.toHaveBeenCalled();
    });

    it('should handle connect event', () => {
      const connectCallback = jest.fn();
      client.on('connect', connectCallback);

      client.connect();

      // Simulate connect event
      const onMock = mockedSocket.on as jest.Mock;
      const connectHandler = onMock.mock.calls.find(
        (call) => call[0] === 'connect'
      )?.[1];

      if (connectHandler) {
        connectHandler();
      }

      expect(connectCallback).toHaveBeenCalled();
      expect((client as any).socketId).toBe('test-socket-id');
    });

    it('should handle message events', () => {
      const messageCallback = jest.fn();
      client.on('message', messageCallback);

      client.connect();

      // Simulate message event
      const onMock = mockedSocket.on as jest.Mock;
      const messageHandler = onMock.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      if (messageHandler) {
        messageHandler({ type: 'test', data: 'test-data' });
      }

      expect(messageCallback).toHaveBeenCalledWith({
        type: 'test',
        data: 'test-data',
      });
    });

    it('should handle connection message and set socketId', () => {
      client.connect();

      const onMock = mockedSocket.on as jest.Mock;
      const messageHandler = onMock.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      if (messageHandler) {
        messageHandler({
          type: 'connection',
          clientId: 'custom-client-id',
        });
      }

      expect((client as any).socketId).toBe('custom-client-id');
    });

    it('should handle metrics events', () => {
      const messageCallback = jest.fn();
      client.on('message', messageCallback);

      client.connect();

      const onMock = mockedSocket.on as jest.Mock;
      const metricsHandler = onMock.mock.calls.find(
        (call) => call[0] === 'metrics'
      )?.[1];

      if (metricsHandler) {
        metricsHandler({ data: { cpu: 50, memory: 60 } });
      }

      expect(messageCallback).toHaveBeenCalledWith({
        type: 'metrics',
        data: { cpu: 50, memory: 60 },
      });
    });

    it('should handle models events', () => {
      const messageCallback = jest.fn();
      client.on('message', messageCallback);

      client.connect();

      const onMock = mockedSocket.on as jest.Mock;
      const modelsHandler = onMock.mock.calls.find(
        (call) => call[0] === 'models'
      )?.[1];

      if (modelsHandler) {
        modelsHandler({ data: [{ id: '1', name: 'model-1' }] });
      }

      expect(messageCallback).toHaveBeenCalledWith({
        type: 'models',
        data: [{ id: '1', name: 'model-1' }],
      });
    });

    it('should handle logs events', () => {
      const messageCallback = jest.fn();
      client.on('message', messageCallback);

      client.connect();

      const onMock = mockedSocket.on as jest.Mock;
      const logsHandler = onMock.mock.calls.find(
        (call) => call[0] === 'logs'
      )?.[1];

      if (logsHandler) {
        logsHandler({ data: [{ id: '1', message: 'log-entry' }] });
      }

      expect(messageCallback).toHaveBeenCalledWith({
        type: 'logs',
        data: [{ id: '1', message: 'log-entry' }],
      });
    });

    it('should handle log events', () => {
      const messageCallback = jest.fn();
      client.on('message', messageCallback);

      client.connect();

      const onMock = mockedSocket.on as jest.Mock;
      const logHandler = onMock.mock.calls.find(
        (call) => call[0] === 'log'
      )?.[1];

      if (logHandler) {
        logHandler({ data: { id: '1', message: 'single-log' } });
      }

      expect(messageCallback).toHaveBeenCalledWith({
        type: 'log',
        data: { id: '1', message: 'single-log' },
      });
    });

    it('should handle connect_error events', () => {
      const errorCallback = jest.fn();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      client.on('connect_error', errorCallback);

      client.connect();

      const onMock = mockedSocket.on as jest.Mock;
      const errorHandler = onMock.mock.calls.find(
        (call) => call[0] === 'connect_error'
      )?.[1];

      if (errorHandler) {
        errorHandler(new Error('Connection failed'));
      }

      expect(errorCallback).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Socket.IO connection error:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle disconnect events', () => {
      const disconnectCallback = jest.fn();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      client.on('disconnect', disconnectCallback);

      client.connect();

      const onMock = mockedSocket.on as jest.Mock;
      const disconnectHandler = onMock.mock.calls.find(
        (call) => call[0] === 'disconnect'
      )?.[1];

      if (disconnectHandler) {
        disconnectHandler('io server disconnect');
      }

      expect(disconnectCallback).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Socket.IO disconnected:',
        'io server disconnect'
      );

      consoleLogSpy.mockRestore();
    });

    it('should handle connection errors during socket creation', () => {
      mockedIo.mockImplementation(() => {
        throw new Error('Socket creation failed');
      });

      const errorCallback = jest.fn();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      client.on('connect_error', errorCallback);

      client.connect();

      expect(errorCallback).toHaveBeenCalledWith(expect.any(Error));
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to create Socket.IO connection:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should use window.location.origin when available', () => {
      (global as any).window = {
        location: {
          origin: 'https://example.com',
        },
      };

      client.connect();

      expect(mockedIo).toHaveBeenCalledWith('https://example.com', expect.any(Object));
    });

    it('should use default URL when window is not available', () => {
      (global as any).window = undefined;

      client.connect();

      expect(mockedIo).toHaveBeenCalledWith('http://localhost:3000', expect.any(Object));
    });
  });

  describe('disconnect', () => {
    it('should disconnect the socket', () => {
      (client as any).socket = mockedSocket;

      client.disconnect();

      expect(mockedSocket.disconnect).toHaveBeenCalled();
      expect((client as any).socket).toBeNull();
    });

    it('should do nothing if socket is null', () => {
      client.disconnect();

      expect(mockedSocket.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    it('should send message when connected', () => {
      mockedSocket.connected = true;
      (client as any).socket = mockedSocket;

      client.sendMessage('testEvent', { data: 'test' });

      expect(mockedSocket.emit).toHaveBeenCalledWith('testEvent', { data: 'test' });
    });

    it('should not send message when not connected', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockedSocket.connected = false;
      (client as any).socket = mockedSocket;

      client.sendMessage('testEvent', { data: 'test' });

      expect(mockedSocket.emit).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith('Socket.IO is not connected');

      consoleWarnSpy.mockRestore();
    });

    it('should send message without data', () => {
      mockedSocket.connected = true;
      (client as any).socket = mockedSocket;

      client.sendMessage('testEvent');

      expect(mockedSocket.emit).toHaveBeenCalledWith('testEvent', undefined);
    });
  });

  describe('request methods', () => {
    beforeEach(() => {
      mockedSocket.connected = true;
      (client as any).socket = mockedSocket;
    });

    it('should request metrics', () => {
      client.requestMetrics();

      expect(mockedSocket.emit).toHaveBeenCalledWith('requestMetrics');
    });

    it('should request logs', () => {
      client.requestLogs();

      expect(mockedSocket.emit).toHaveBeenCalledWith('requestLogs');
    });

    it('should request models', () => {
      client.requestModels();

      expect(mockedSocket.emit).toHaveBeenCalledWith('requestModels');
    });

    it('should request llama status', () => {
      client.requestLlamaStatus();

      expect(mockedSocket.emit).toHaveBeenCalledWith('requestLlamaStatus');
    });

    it('should rescan models', () => {
      client.rescanModels();

      expect(mockedSocket.emit).toHaveBeenCalledWith('rescanModels');
    });

    it('should start model', () => {
      client.startModel('model-123');

      expect(mockedSocket.emit).toHaveBeenCalledWith('startModel', {
        modelId: 'model-123',
      });
    });

    it('should stop model', () => {
      client.stopModel('model-123');

      expect(mockedSocket.emit).toHaveBeenCalledWith('stopModel', {
        modelId: 'model-123',
      });
    });
  });

  describe('getConnectionState', () => {
    it('should return connected when socket is connected', () => {
      mockedSocket.connected = true;
      (client as any).socket = mockedSocket;

      const state = client.getConnectionState();

      expect(state).toBe('connected');
    });

    it('should return disconnected when socket is not connected', () => {
      mockedSocket.connected = false;
      (client as any).socket = mockedSocket;

      const state = client.getConnectionState();

      expect(state).toBe('disconnected');
    });

    it('should return disconnected when socket is null', () => {
      const state = client.getConnectionState();

      expect(state).toBe('disconnected');
    });
  });

  describe('getSocketId', () => {
    it('should return socketId when set', () => {
      (client as any).socketId = 'test-id-123';

      const socketId = client.getSocketId();

      expect(socketId).toBe('test-id-123');
    });

    it('should return null when socketId is not set', () => {
      const socketId = client.getSocketId();

      expect(socketId).toBeNull();
    });
  });

  describe('getSocket', () => {
    it('should return socket instance', () => {
      (client as any).socket = mockedSocket;

      const socket = client.getSocket();

      expect(socket).toBe(mockedSocket);
    });

    it('should return null when socket is not set', () => {
      const socket = client.getSocket();

      expect(socket).toBeNull();
    });
  });

  describe('websocketServer singleton', () => {
    it('should export a singleton WebSocketClient instance', () => {
      expect(websocketServer).toBeInstanceOf(WebSocketClient);
    });

    it('should be the same instance across multiple imports', () => {
      const websocketServer2 = require('@/lib/websocket-client').websocketServer;

      expect(websocketServer).toBe(websocketServer2);
    });
  });
});
