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

    it('should handle connect errors without error message', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      client.on('connect_error', jest.fn());
      (io as jest.Mock).mockImplementation(() => {
        throw new Error();
      });

      client.connect();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle io returning null socket', () => {
      (io as jest.Mock).mockReturnValue(null as any);

      expect(() => client.connect()).not.toThrow();
    });

    it('should handle socket without connected property', () => {
      const socketWithoutConnected = {
        id: 'test-id',
        emit: mockEmit,
        on: mockOn,
        disconnect: mockDisconnect,
      } as any;
      (io as jest.Mock).mockReturnValue(socketWithoutConnected);

      expect(() => client.connect()).not.toThrow();
    });

    it('should handle rapid connect/disconnect cycles', () => {
      mockSocket.connected = false;

      for (let i = 0; i < 100; i++) {
        client.connect();
        client.disconnect();
      }

      expect(mockDisconnect).toHaveBeenCalledTimes(100);
    });

    it('should handle sendMessage with null data', () => {
      mockSocket.connected = true;
      client['socket'] = mockSocket;

      client.sendMessage('test', null);

      expect(mockEmit).toHaveBeenCalledWith('test', null);
    });

    it('should handle sendMessage with undefined data', () => {
      mockSocket.connected = true;
      client['socket'] = mockSocket;

      client.sendMessage('test', undefined);

      expect(mockEmit).toHaveBeenCalledWith('test', undefined);
    });

    it('should handle sendMessage with empty string event', () => {
      mockSocket.connected = true;
      client['socket'] = mockSocket;

      client.sendMessage('', { data: 'test' });

      expect(mockEmit).toHaveBeenCalledWith('', { data: 'test' });
    });

    it('should handle sendMessage with special characters in event name', () => {
      mockSocket.connected = true;
      client['socket'] = mockSocket;

      client.sendMessage('event/with/slashes', { data: 'test' });

      expect(mockEmit).toHaveBeenCalledWith('event/with/slashes', { data: 'test' });
    });

    it('should handle startModel with empty modelId', () => {
      mockSocket.connected = true;
      client['socket'] = mockSocket;

      client.startModel('');

      expect(mockEmit).toHaveBeenCalledWith('startModel', { modelId: '' });
    });

    it('should handle startModel with null modelId', () => {
      mockSocket.connected = true;
      client['socket'] = mockSocket;

      client.startModel(null as any);

      expect(mockEmit).toHaveBeenCalledWith('startModel', { modelId: null });
    });

    it('should handle stopModel with empty modelId', () => {
      mockSocket.connected = true;
      client['socket'] = mockSocket;

      client.stopModel('');

      expect(mockEmit).toHaveBeenCalledWith('stopModel', { modelId: '' });
    });

    it('should handle message events with null data', (done) => {
      client.connect();
      const handler = jest.fn();
      client.on('message', handler);

      setTimeout(() => {
        const messageHandler = mockOn.mock.calls.find(call => call[0] === 'message')?.[1];
        if (messageHandler) {
          messageHandler({ type: 'test', data: null });
        }

        setTimeout(() => {
          expect(handler).toHaveBeenCalledWith({ type: 'test', data: null });
          done();
        }, 10);
      }, 10);
    });

    it('should handle message events with undefined data', (done) => {
      client.connect();
      const handler = jest.fn();
      client.on('message', handler);

      setTimeout(() => {
        const messageHandler = mockOn.mock.calls.find(call => call[0] === 'message')?.[1];
        if (messageHandler) {
          messageHandler({ type: 'test', data: undefined });
        }

        setTimeout(() => {
          expect(handler).toHaveBeenCalledWith({ type: 'test', data: undefined });
          done();
        }, 10);
      }, 10);
    });

    it('should handle multiple listeners for same event', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const handler3 = jest.fn();

      client.on('connect', handler1);
      client.on('connect', handler2);
      client.on('connect', handler3);

      // All handlers should be registered
      expect(() => {
        client.emit('connect');
      }).not.toThrow();
    });

    it('should handle removing listeners', () => {
      const handler = jest.fn();
      client.on('connect', handler);

      client.removeListener('connect', handler);

      // Should not throw when removing
      expect(() => {
        client.emit('connect');
      }).not.toThrow();
    });

    it('should handle disconnect when already disconnected', () => {
      client['socket'] = null;

      expect(() => client.disconnect()).not.toThrow();
    });

    it('should handle disconnect multiple times', () => {
      client['socket'] = mockSocket;

      for (let i = 0; i < 10; i++) {
        client.disconnect();
      }

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('should handle socket id updates to empty string', (done) => {
      client.connect();
      mockSocket.id = '';

      setTimeout(() => {
        const messageHandler = mockOn.mock.calls.find(call => call[0] === 'message')?.[1];
        if (messageHandler) {
          messageHandler({ type: 'connection', clientId: '' });
        }

        setTimeout(() => {
          expect(client['socketId']).toBe('');
          done();
        }, 10);
      }, 10);
    });

    it('should handle metrics event with null data', (done) => {
      client.connect();
      const handler = jest.fn();
      client.on('message', handler);

      setTimeout(() => {
        const metricsHandler = mockOn.mock.calls.find(call => call[0] === 'metrics')?.[1];
        if (metricsHandler) {
          metricsHandler({ data: null });
        }

        setTimeout(() => {
          expect(handler).toHaveBeenCalledWith({ type: 'metrics', data: null });
          done();
        }, 10);
      }, 10);
    });

    it('should handle log event without data property', (done) => {
      client.connect();
      const handler = jest.fn();
      client.on('message', handler);

      setTimeout(() => {
        const logHandler = mockOn.mock.calls.find(call => call[0] === 'log')?.[1];
        if (logHandler) {
          logHandler({});
        }

        setTimeout(() => {
          // Should not emit message if data is missing
          expect(handler).not.toHaveBeenCalled();
          done();
        }, 10);
      }, 10);
    });
  });
});
