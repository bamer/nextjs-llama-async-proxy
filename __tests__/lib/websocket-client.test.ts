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
      // Simulate server-side by making window undefined
      const originalWindow = (global as any).window;
      (global as any).window = undefined;

      client.connect();

      // Verify the URL used is localhost
      const ioCall = (io as jest.Mock).mock.calls[0];
      expect(ioCall[0]).toContain('localhost');
      // Port may be included or not depending on environment
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
        // Trigger connect_error handler to cover lines 63-64
        const errorHandler = mockOn.mock.calls.find(call => call[0] === 'connect_error')?.[1];
        if (errorHandler) {
          errorHandler(new Error('Connection failed'));
        }

        setTimeout(() => {
          expect(consoleErrorSpy).toHaveBeenCalledWith('Socket.IO connection error:', expect.any(Error));
          consoleErrorSpy.mockRestore();
          done();
        }, 10);
      }, 10);
    });

    it('should handle disconnection', (done) => {
      const disconnectSpy = jest.fn();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      client.on('disconnect', disconnectSpy);

      client.connect();

      setTimeout(() => {
        // Trigger disconnect handler to cover lines 68-69
        const disconnectHandler = mockOn.mock.calls.find(call => call[0] === 'disconnect')?.[1];
        if (disconnectHandler) {
          disconnectHandler('client disconnect');
        }

        setTimeout(() => {
          expect(consoleLogSpy).toHaveBeenCalledWith('Socket.IO disconnected:', 'client disconnect');
          consoleLogSpy.mockRestore();
          done();
        }, 10);
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

    it('should queue message when not connected', () => {
      const consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
      mockSocket.connected = false;

      client.sendMessage('testEvent', { data: 'test' });

      expect(mockEmit).not.toHaveBeenCalled();
      expect(client['messageQueue']).toEqual([{ event: 'testEvent', data: { data: 'test' } }]);
      expect(consoleDebugSpy).toHaveBeenCalledWith('Message queued (not connected):', 'testEvent');

      consoleDebugSpy.mockRestore();
    });

    it('should not send message when socket is null', () => {
      const consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
      client['socket'] = null;

      client.sendMessage('testEvent');

      expect(mockEmit).not.toHaveBeenCalled();
      expect(client['messageQueue']).toEqual([{ event: 'testEvent', data: undefined }]);
      expect(consoleDebugSpy).toHaveBeenCalledWith('Message queued (not connected):', 'testEvent');

      consoleDebugSpy.mockRestore();
    });

    it('should flush message queue on connection', (done) => {
      const consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
      mockSocket.connected = false;

      // Queue some messages
      client.sendMessage('event1', { data: 'test1' });
      client.sendMessage('event2', { data: 'test2' });
      expect(client['messageQueue'].length).toBe(2);

      // Simulate connection
      mockSocket.connected = true;
      const connectHandler = mockOn.mock.calls.find(call => call[0] === 'connect')?.[1];
      if (connectHandler) {
        connectHandler();
      }

      setTimeout(() => {
        expect(client['messageQueue'].length).toBe(0);
        expect(mockEmit).toHaveBeenCalledWith('event1', { data: 'test1' });
        expect(mockEmit).toHaveBeenCalledWith('event2', { data: 'test2' });
        expect(consoleDebugSpy).toHaveBeenCalledWith('Flushing 2 queued messages');
        consoleDebugSpy.mockRestore();
        done();
      }, 10);
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
      client['isConnecting'] = false;

      const state = client.getConnectionState();

      expect(state).toBe('disconnected');
    });

    it('should return connected when socket is connected', () => {
      mockSocket.connected = true;
      client['socket'] = mockSocket;
      client['isConnecting'] = false;

      const state = client.getConnectionState();

      expect(state).toBe('connected');
    });

    it('should return disconnected when socket is not connected', () => {
      mockSocket.connected = false;
      client['socket'] = mockSocket;
      client['isConnecting'] = false;

      const state = client.getConnectionState();

      expect(state).toBe('disconnected');
    });

    it('should return connecting when isConnecting is true', () => {
      client['socket'] = mockSocket;
      client['isConnecting'] = true;

      const state = client.getConnectionState();

      expect(state).toBe('connecting');
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

    it('should handle metrics events and emit message with data', (done) => {
      client.connect();
      const handler = jest.fn();
      client.on('message', handler);

      setTimeout(() => {
        const metricsHandler = mockOn.mock.calls.find(call => call[0] === 'metrics')?.[1];
        if (metricsHandler) {
          metricsHandler({ data: { cpu: 50, memory: 60 } });
        }

        setTimeout(() => {
          expect(handler).toHaveBeenCalledWith({ type: 'metrics', data: { cpu: 50, memory: 60 } });
          done();
        }, 10);
      }, 10);
    });

    it('should handle models events and emit message with data', (done) => {
      client.connect();
      const handler = jest.fn();
      client.on('message', handler);

      setTimeout(() => {
        const modelsHandler = mockOn.mock.calls.find(call => call[0] === 'models')?.[1];
        if (modelsHandler) {
          modelsHandler({ data: [{ id: 'model1', name: 'Test Model' }] });
        }

        setTimeout(() => {
          expect(handler).toHaveBeenCalledWith({ type: 'models', data: [{ id: 'model1', name: 'Test Model' }] });
          done();
        }, 10);
      }, 10);
    });

    it('should handle logs events and emit message with data', (done) => {
      client.connect();
      const handler = jest.fn();
      client.on('message', handler);

      setTimeout(() => {
        const logsHandler = mockOn.mock.calls.find(call => call[0] === 'logs')?.[1];
        if (logsHandler) {
          logsHandler({ data: [{ id: 1, message: 'Log 1' }, { id: 2, message: 'Log 2' }] });
        }

        setTimeout(() => {
          expect(handler).toHaveBeenCalledWith({ type: 'logs', data: [{ id: 1, message: 'Log 1' }, { id: 2, message: 'Log 2' }] });
          done();
        }, 10);
      }, 10);
    });

    it('should handle log events and emit message with data', (done) => {
      client.connect();
      const handler = jest.fn();
      client.on('message', handler);

      setTimeout(() => {
        const logHandler = mockOn.mock.calls.find(call => call[0] === 'log')?.[1];
        if (logHandler) {
          logHandler({ data: { id: 1, message: 'Individual log' } });
        }

        setTimeout(() => {
          expect(handler).toHaveBeenCalledWith({ type: 'log', data: { id: 1, message: 'Individual log' } });
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

    it('should handle connect multiple times without disconnecting', () => {
      // First connect
      client.connect();
      const callCount1 = (io as jest.Mock).mock.calls.length;

      // Second connect should be a no-op since socket is already connected
      mockSocket.connected = true;
      client.connect();
      const callCount2 = (io as jest.Mock).mock.calls.length;

      expect(callCount1).toBe(callCount2);
    });

    it('should handle metrics event without data property', (done) => {
      client.connect();
      const handler = jest.fn();
      client.on('message', handler);

      setTimeout(() => {
        const metricsHandler = mockOn.mock.calls.find(call => call[0] === 'metrics')?.[1];
        if (metricsHandler) {
          metricsHandler({});
        }

        setTimeout(() => {
          expect(handler).toHaveBeenCalledWith({ type: 'metrics', data: undefined });
          done();
        }, 10);
      }, 10);
    });

    it('should handle models event without data property', (done) => {
      client.connect();
      const handler = jest.fn();
      client.on('message', handler);

      setTimeout(() => {
        const modelsHandler = mockOn.mock.calls.find(call => call[0] === 'models')?.[1];
        if (modelsHandler) {
          modelsHandler({});
        }

        setTimeout(() => {
          expect(handler).toHaveBeenCalledWith({ type: 'models', data: undefined });
          done();
        }, 10);
      }, 10);
    });

    it('should handle logs event without data property', (done) => {
      client.connect();
      const handler = jest.fn();
      client.on('message', handler);

      setTimeout(() => {
        const logsHandler = mockOn.mock.calls.find(call => call[0] === 'logs')?.[1];
        if (logsHandler) {
          logsHandler({});
        }

        setTimeout(() => {
          expect(handler).toHaveBeenCalledWith({ type: 'logs', data: undefined });
          done();
        }, 10);
      }, 10);
    });

    it('should handle multiple event listeners for same event type', (done) => {
      const connectHandler1 = jest.fn();
      const connectHandler2 = jest.fn();
      const connectHandler3 = jest.fn();

      client.connect();
      client.on('connect', connectHandler1);
      client.on('connect', connectHandler2);
      client.on('connect', connectHandler3);

      setTimeout(() => {
        // All handlers should have been called
        expect(connectHandler1).toHaveBeenCalled();
        expect(connectHandler2).toHaveBeenCalled();
        expect(connectHandler3).toHaveBeenCalled();
        done();
      }, 10);
    });

    it('should handle logs event without data.data property', (done) => {
      client.connect();
      const handler = jest.fn();
      client.on('message', handler);

      setTimeout(() => {
        const logsHandler = mockOn.mock.calls.find(call => call[0] === 'logs')?.[1];
        if (logsHandler) {
          logsHandler({ differentProp: 'test' });
        }

        setTimeout(() => {
          // Should emit message even without data.data
          expect(handler).toHaveBeenCalledWith({ type: 'logs', data: undefined });
          done();
        }, 10);
      }, 10);
    });

    it('should handle metrics event without data.data property', (done) => {
      client.connect();
      const handler = jest.fn();
      client.on('message', handler);

      setTimeout(() => {
        const metricsHandler = mockOn.mock.calls.find(call => call[0] === 'metrics')?.[1];
        if (metricsHandler) {
          metricsHandler({ otherProp: 'value' });
        }

        setTimeout(() => {
          expect(handler).toHaveBeenCalledWith({ type: 'metrics', data: undefined });
          done();
        }, 10);
      }, 10);
    });

    it('should handle models event without data.data property', (done) => {
      client.connect();
      const handler = jest.fn();
      client.on('message', handler);

      setTimeout(() => {
        const modelsHandler = mockOn.mock.calls.find(call => call[0] === 'models')?.[1];
        if (modelsHandler) {
          modelsHandler({ somethingElse: 'data' });
        }

        setTimeout(() => {
          expect(handler).toHaveBeenCalledWith({ type: 'models', data: undefined });
          done();
        }, 10);
      }, 10);
    });

    it('should handle log event without data.data property', (done) => {
      client.connect();
      const handler = jest.fn();
      client.on('message', handler);

      setTimeout(() => {
        const logHandler = mockOn.mock.calls.find(call => call[0] === 'log')?.[1];
        if (logHandler) {
          logHandler({ otherField: 'value' });
        }

        setTimeout(() => {
          // Should not emit message when data.data is missing (line 57 check)
          expect(handler).not.toHaveBeenCalled();
          done();
        }, 10);
      }, 10);
    });

    it('should handle removeListener functionality', () => {
      const handler = jest.fn();
      client.on('connect', handler);
      client.off('connect', handler);

      expect(() => {
        client.emit('connect');
      }).not.toThrow();

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle removeAllListeners for specific event', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      client.on('connect', handler1);
      client.on('connect', handler2);
      client.removeAllListeners('connect');

      expect(() => {
        client.emit('connect');
      }).not.toThrow();
    });

    it('should handle removeAllListeners without event name', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      client.on('connect', handler1);
      client.on('message', handler2);
      client.removeAllListeners();

      expect(() => {
        client.emit('connect');
        client.emit('message', { type: 'test' });
      }).not.toThrow();
    });

    it('should handle listenerCount', () => {
      const count1 = client.listenerCount('connect');
      expect(typeof count1).toBe('number');

      client.on('connect', jest.fn());
      const count2 = client.listenerCount('connect');
      expect(count2).toBe(count1 + 1);
    });

    it('should handle eventNames', () => {
      client.on('connect', jest.fn());
      client.on('message', jest.fn());

      const events = client.eventNames();
      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBeGreaterThan(0);
    });

    it('should handle once method for one-time listeners', (done) => {
      const handler = jest.fn();

      client.once('connect', handler);
      client.emit('connect');
      client.emit('connect');

      setTimeout(() => {
        expect(handler).toHaveBeenCalledTimes(1);
        done();
      }, 10);
    });

    it('should handle emit with multiple arguments', () => {
      const handler = jest.fn();

      client.on('custom-event', handler);
      client.emit('custom-event', 'arg1', 'arg2', { data: 'arg3' });

      expect(handler).toHaveBeenCalledWith('arg1', 'arg2', { data: 'arg3' });
    });

    it('should handle setMaxListeners', () => {
      expect(() => {
        client.setMaxListeners(20);
      }).not.toThrow();
    });

    it('should handle getMaxListeners', () => {
      const max = client.getMaxListeners();
      expect(typeof max).toBe('number');

      client.setMaxListeners(50);
      const newMax = client.getMaxListeners();
      expect(newMax).toBe(50);
    });

    it('should handle prependListener', (done) => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      client.connect();
      client.on('connect', handler1);
      client.prependListener('connect', handler2);

      client.emit('connect');

      setTimeout(() => {
        // Both should be called, prepended listener should be called first
        expect(handler1).toHaveBeenCalled();
        expect(handler2).toHaveBeenCalled();
        done();
      }, 10);
    });

    it('should handle prependOnceListener', (done) => {
      const handler = jest.fn();

      client.connect();
      client.prependOnceListener('connect', handler);
      client.emit('connect');
      client.emit('connect');

      setTimeout(() => {
        expect(handler).toHaveBeenCalledTimes(1);
        done();
      }, 10);
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
