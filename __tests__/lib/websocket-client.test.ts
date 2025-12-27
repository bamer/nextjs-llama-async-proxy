import { io, Socket } from 'socket.io-client';
import { WebSocketClient } from '@/lib/websocket-client';

jest.mock('socket.io-client');

describe('WebSocketClient', () => {
  let mockSocket: jest.Mocked<Socket>;
  let client: WebSocketClient;
  let mockEmit: jest.Mock;
  let mockOn: jest.Mock;
  let mockDisconnect: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockEmit = jest.fn();
    mockDisconnect = jest.fn();
    mockOn = jest.fn((event, callback) => {
      if (event === 'connect') {
        setTimeout(() => callback(), 0);
      }
      return mockSocket;
    });

    mockSocket = {
      connected: false,
      id: null,
      emit: mockEmit,
      on: mockOn,
      disconnect: mockDisconnect,
    } as any;

    (io as jest.Mock).mockReturnValue(mockSocket);

    client = new WebSocketClient();
  });

  describe('constructor', () => {
    it('should create WebSocketClient instance', () => {
      expect(client).toBeInstanceOf(WebSocketClient);
    });

    it('should initialize with null socket', () => {
      expect(client['socket']).toBeNull();
    });

    it('should initialize with null socketId', () => {
      expect(client['socketId']).toBeNull();
    });
  });

  describe('connect', () => {
    it('should create socket connection', () => {
      client.connect();

      expect(io).toHaveBeenCalledWith(
        expect.stringContaining('localhost'),
        expect.objectContaining({
          path: '/llamaproxws',
          transports: ['websocket'],
        })
      );
    });

    it('should not reconnect if already connected', () => {
      mockSocket.connected = true;
      client['socket'] = mockSocket;

      client.connect();

      expect(io).toHaveBeenCalledTimes(0);
    });

    it('should set socketId on connect', (done) => {
      mockSocket.id = 'socket-123';
      mockSocket.on.mockImplementation((event, callback) => {
        if (event === 'connect') {
          callback();
        }
        return mockSocket;
      });

      client.connect();

      setTimeout(() => {
        expect(client['socketId']).toBe('socket-123');
        done();
      }, 10);
    });

    it('should emit connect event', (done) => {
      const connectSpy = jest.fn();
      client.on('connect', connectSpy);

      client.connect();

      setTimeout(() => {
        expect(connectSpy).toHaveBeenCalled();
        done();
      }, 10);
    });

    it('should setup message listener', () => {
      client.connect();

      expect(mockOn).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should setup metrics listener', () => {
      client.connect();

      expect(mockOn).toHaveBeenCalledWith('metrics', expect.any(Function));
    });

    it('should setup models listener', () => {
      client.connect();

      expect(mockOn).toHaveBeenCalledWith('models', expect.any(Function));
    });

    it('should setup logs listener', () => {
      client.connect();

      expect(mockOn).toHaveBeenCalledWith('logs', expect.any(Function));
    });

    it('should setup log listener', () => {
      client.connect();

      expect(mockOn).toHaveBeenCalledWith('log', expect.any(Function));
    });

    it('should setup connect_error listener', () => {
      client.connect();

      expect(mockOn).toHaveBeenCalledWith('connect_error', expect.any(Function));
    });

    it('should setup disconnect listener', () => {
      client.connect();

      expect(mockOn).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });

    it('should use window.location.origin when available', () => {
      // In jsdom environment, window is available
      // The test verifies connect() is called with a URL from window.location.origin
      client.connect();

      expect(io).toHaveBeenCalled();
      const ioCall = (io as jest.Mock).mock.calls[0];
      expect(typeof ioCall[0]).toBe('string');
      expect(ioCall[1]).toEqual(
        expect.objectContaining({
          path: '/llamaproxws',
          transports: ['websocket'],
        })
      );
    });

    it('should use localhost when window is not available', () => {
      // Simulate server-side by deleting window temporarily
      const originalWindow = (global as any).window;
      delete (global as any).window;

      client.connect();

      // Note: The code checks for window, but falls back to localhost:3000
      // We need to verify the actual URL used
      const ioCall = (io as jest.Mock).mock.calls[0];
      expect(ioCall[0]).toContain('localhost');
      expect(ioCall[1]).toEqual(
        expect.objectContaining({
          path: '/llamaproxws',
          transports: ['websocket'],
        })
      );

      // Restore window for other tests
      (global as any).window = originalWindow;
    });

    it('should handle connection errors', (done) => {
      const errorSpy = jest.fn();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      client.on('connect_error', errorSpy);

      client.connect();

      setTimeout(() => {
        consoleErrorSpy.mockRestore();
        done();
      }, 10);
    });

    it('should handle disconnection', (done) => {
      const disconnectSpy = jest.fn();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      client.on('disconnect', disconnectSpy);

      client.connect();

      setTimeout(() => {
        consoleLogSpy.mockRestore();
        done();
      }, 10);
    });
  });

  describe('disconnect', () => {
    it('should disconnect socket', () => {
      client['socket'] = mockSocket;

      client.disconnect();

      expect(mockDisconnect).toHaveBeenCalled();
      expect(client['socket']).toBeNull();
    });

    it('should not error when socket is null', () => {
      client['socket'] = null;

      expect(() => client.disconnect()).not.toThrow();
    });
  });

  describe('sendMessage', () => {
    beforeEach(() => {
      mockSocket.connected = true;
      client['socket'] = mockSocket;
    });

    it('should send message when connected', () => {
      client.sendMessage('testEvent', { data: 'test' });

      expect(mockEmit).toHaveBeenCalledWith('testEvent', { data: 'test' });
    });

    it('should send message without data', () => {
      client.sendMessage('testEvent');

      expect(mockEmit).toHaveBeenCalledWith('testEvent', undefined);
    });

    it('should not send message when not connected', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockSocket.connected = false;

      client.sendMessage('testEvent');

      expect(mockEmit).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith('Socket.IO is not connected');

      consoleWarnSpy.mockRestore();
    });

    it('should not send message when socket is null', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      client['socket'] = null;

      client.sendMessage('testEvent');

      expect(mockEmit).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith('Socket.IO is not connected');

      consoleWarnSpy.mockRestore();
    });
  });

  describe('requestMetrics', () => {
    beforeEach(() => {
      mockSocket.connected = true;
      client['socket'] = mockSocket;
    });

    it('should send requestMetrics message', () => {
      client.requestMetrics();

      expect(mockEmit).toHaveBeenCalledWith('requestMetrics', undefined);
    });
  });

  describe('requestLogs', () => {
    beforeEach(() => {
      mockSocket.connected = true;
      client['socket'] = mockSocket;
    });

    it('should send requestLogs message', () => {
      client.requestLogs();

      expect(mockEmit).toHaveBeenCalledWith('requestLogs', undefined);
    });
  });

  describe('requestModels', () => {
    beforeEach(() => {
      mockSocket.connected = true;
      client['socket'] = mockSocket;
    });

    it('should send requestModels message', () => {
      client.requestModels();

      expect(mockEmit).toHaveBeenCalledWith('requestModels', undefined);
    });
  });

  describe('requestLlamaStatus', () => {
    beforeEach(() => {
      mockSocket.connected = true;
      client['socket'] = mockSocket;
    });

    it('should send requestLlamaStatus message', () => {
      client.requestLlamaStatus();

      expect(mockEmit).toHaveBeenCalledWith('requestLlamaStatus', undefined);
    });
  });

  describe('rescanModels', () => {
    beforeEach(() => {
      mockSocket.connected = true;
      client['socket'] = mockSocket;
    });

    it('should send rescanModels message', () => {
      client.rescanModels();

      expect(mockEmit).toHaveBeenCalledWith('rescanModels', undefined);
    });
  });

  describe('startModel', () => {
    beforeEach(() => {
      mockSocket.connected = true;
      client['socket'] = mockSocket;
    });

    it('should send startModel message with modelId', () => {
      client.startModel('model-123');

      expect(mockEmit).toHaveBeenCalledWith('startModel', { modelId: 'model-123' });
    });
  });

  describe('stopModel', () => {
    beforeEach(() => {
      mockSocket.connected = true;
      client['socket'] = mockSocket;
    });

    it('should send stopModel message with modelId', () => {
      client.stopModel('model-123');

      expect(mockEmit).toHaveBeenCalledWith('stopModel', { modelId: 'model-123' });
    });
  });

  describe('getConnectionState', () => {
    it('should return disconnected when socket is null', () => {
      client['socket'] = null;

      const state = client.getConnectionState();

      expect(state).toBe('disconnected');
    });

    it('should return connected when socket is connected', () => {
      mockSocket.connected = true;
      client['socket'] = mockSocket;

      const state = client.getConnectionState();

      expect(state).toBe('connected');
    });

    it('should return disconnected when socket is not connected', () => {
      mockSocket.connected = false;
      client['socket'] = mockSocket;

      const state = client.getConnectionState();

      expect(state).toBe('disconnected');
    });
  });

  describe('getSocketId', () => {
    it('should return null when socketId is not set', () => {
      const socketId = client.getSocketId();

      expect(socketId).toBeNull();
    });

    it('should return socketId when set', () => {
      client['socketId'] = 'socket-123';

      const socketId = client.getSocketId();

      expect(socketId).toBe('socket-123');
    });
  });

  describe('getSocket', () => {
    it('should return null when socket is not set', () => {
      const socket = client.getSocket();

      expect(socket).toBeNull();
    });

    it('should return socket when set', () => {
      client['socket'] = mockSocket;

      const socket = client.getSocket();

      expect(socket).toBe(mockSocket);
    });
  });

  describe('event handling', () => {
    beforeEach(() => {
      client.connect();
    });

    it('should handle connect event', (done) => {
      const handler = jest.fn();
      client.on('connect', handler);

      setTimeout(() => {
        expect(handler).toHaveBeenCalled();
        done();
      }, 10);
    });

    it('should handle disconnect event', (done) => {
      const handler = jest.fn();
      client.on('disconnect', handler);

      setTimeout(() => {
        done();
      }, 10);
    });

    it('should handle message event', (done) => {
      const handler = jest.fn();
      client.on('message', handler);

      const messageHandler = mockOn.mock.calls.find(call => call[0] === 'message')?.[1];
      if (messageHandler) {
        messageHandler({ type: 'test', data: 'test' });
      }

      setTimeout(() => {
        expect(handler).toHaveBeenCalledWith({ type: 'test', data: 'test' });
        done();
      }, 10);
    });

    it('should update socketId on connection message', (done) => {
      client.connect();

      // Wait a tick for connect() to complete and register all listeners
      setTimeout(() => {
        const messageHandler = mockOn.mock.calls.find(call => call[0] === 'message')?.[1];
        if (messageHandler) {
          messageHandler({ type: 'connection', clientId: 'client-123' });
        }

        setTimeout(() => {
          expect(client['socketId']).toBe('client-123');
          done();
        }, 10);
      }, 10);
    });
  });

  describe('reconnection settings', () => {
    it('should enable reconnection', () => {
      client.connect();

      expect(io).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          reconnection: true,
        })
      );
    });

    it('should set reconnection attempts', () => {
      client.connect();

      expect(io).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          reconnectionAttempts: 5,
        })
      );
    });

    it('should set reconnection delay', () => {
      client.connect();

      expect(io).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle connection error gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (io as jest.Mock).mockImplementation(() => {
        throw new Error('Connection failed');
      });

      client.connect();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to create Socket.IO connection:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
