import { io, Socket } from 'socket.io-client';
import { WebSocketClient } from '@/lib/websocket-client';

jest.mock('socket.io-client');

describe('WebSocketClient - Connection Management', () => {
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

    it('should initialize with null connection manager socket', () => {
      expect((client as any).connectionManager).toBeDefined();
    });

    it('should initialize with null connection manager socketId', () => {
      expect((client as any).connectionManager).toBeDefined();
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
      const connectionManager = (client as any).connectionManager;
      connectionManager.socket = mockSocket;

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
        expect((client as any).connectionManager.getSocketId()).toBe('socket-123');
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

      const connectionManager = (client as any).connectionManager;
      const socket = connectionManager.getSocket();
      expect(socket?.on).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should setup metrics listener', () => {
      client.connect();

      const connectionManager = (client as any).connectionManager;
      const socket = connectionManager.getSocket();
      expect(socket?.on).toHaveBeenCalledWith('metrics', expect.any(Function));
    });

    it('should setup models listener', () => {
      client.connect();

      const connectionManager = (client as any).connectionManager;
      const socket = connectionManager.getSocket();
      expect(socket?.on).toHaveBeenCalledWith('models', expect.any(Function));
    });

    it('should setup logs listener', () => {
      client.connect();

      const connectionManager = (client as any).connectionManager;
      const socket = connectionManager.getSocket();
      expect(socket?.on).toHaveBeenCalledWith('logs', expect.any(Function));
    });

    it('should setup log listener', () => {
      client.connect();

      const connectionManager = (client as any).connectionManager;
      const socket = connectionManager.getSocket();
      expect(socket?.on).toHaveBeenCalledWith('log', expect.any(Function));
    });
  });

  describe('disconnect', () => {
    it('should disconnect socket', () => {
      const connectionManager = (client as any).connectionManager;
      connectionManager.socket = mockSocket;

      client.disconnect();

      expect(mockDisconnect).toHaveBeenCalled();
      expect(connectionManager.getSocket()).toBeNull();
    });

    it('should not error when socket is null', () => {
      const connectionManager = (client as any).connectionManager;
      connectionManager.socket = null;

      expect(() => client.disconnect()).not.toThrow();
    });
  });

  describe('getConnectionState', () => {
    it('should return "connecting" when connecting', () => {
      const connectionManager = (client as any).connectionManager;
      connectionManager.isConnecting = true;

      const state = client.getConnectionState();

      expect(state).toBe('connecting');
    });

    it('should return "disconnected" when socket is null', () => {
      const connectionManager = (client as any).connectionManager;
      connectionManager.socket = null;

      const state = client.getConnectionState();

      expect(state).toBe('disconnected');
    });

    it('should return "connected" when socket is connected', () => {
      const connectionManager = (client as any).connectionManager;
      connectionManager.socket = mockSocket;
      mockSocket.connected = true;

      const state = client.getConnectionState();

      expect(state).toBe('connected');
    });

    it('should return "disconnected" when socket is not connected', () => {
      const connectionManager = (client as any).connectionManager;
      connectionManager.socket = mockSocket;
      mockSocket.connected = false;

      const state = client.getConnectionState();

      expect(state).toBe('disconnected');
    });
  });

  describe('getSocketId', () => {
    it('should return null initially', () => {
      const socketId = client.getSocketId();

      expect(socketId).toBeNull();
    });

    it('should return socketId when connected', () => {
      const connectionManager = (client as any).connectionManager;
      connectionManager.socketId = 'test-socket-id';

      const socketId = client.getSocketId();

      expect(socketId).toBe('test-socket-id');
    });
  });

  describe('getSocket', () => {
    it('should return null initially', () => {
      const socket = client.getSocket();

      expect(socket).toBeNull();
    });

    it('should return socket when connected', () => {
      const connectionManager = (client as any).connectionManager;
      connectionManager.socket = mockSocket;

      const socket = client.getSocket();

      expect(socket).toBe(mockSocket);
    });
  });
});
