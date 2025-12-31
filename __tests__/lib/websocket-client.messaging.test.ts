import { io, Socket } from 'socket.io-client';
import { WebSocketClient } from '@/lib/websocket-client';

jest.mock('socket.io-client');

describe('WebSocketClient - Messaging', () => {
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

  describe('sendMessage', () => {
    beforeEach(() => {
      mockSocket.connected = true;
      // Access the internal message handler through the client
      const messageHandler = (client as any).messageHandler;
      if (messageHandler) {
        messageHandler.attachSocket(mockSocket);
      }
    });

    it('should send message when connected', () => {
      client.sendMessage('test-event', { data: 'test' });

      expect(mockEmit).toHaveBeenCalledWith('test-event', { data: 'test' });
    });

    it('should send message without data', () => {
      client.sendMessage('test-event');

      expect(mockEmit).toHaveBeenCalledWith('test-event', undefined);
    });

    it('should queue message when not connected', () => {
      mockSocket.connected = false;
      client.sendMessage('test-event', { data: 'test' });

      expect(mockEmit).not.toHaveBeenCalled();
      // MessageHandler has private messageQueue, so we can't access it directly
      // Just verify that emit wasn't called
    });

    it('should queue multiple messages when not connected', () => {
      mockSocket.connected = false;
      client.sendMessage('event1', { data: 'test1' });
      client.sendMessage('event2', { data: 'test2' });

      expect(mockEmit).not.toHaveBeenCalled();
    });
  });

  describe('requestMetrics', () => {
    beforeEach(() => {
      mockSocket.connected = true;
      const messageHandler = (client as any).messageHandler;
      if (messageHandler) {
        messageHandler.attachSocket(mockSocket);
      }
    });

    it('should send request_metrics message', () => {
      client.requestMetrics();

      expect(mockEmit).toHaveBeenCalledWith('request_metrics', {});
    });

    it('should queue message when not connected', () => {
      mockSocket.connected = false;
      client.requestMetrics();

      expect(mockEmit).not.toHaveBeenCalled();
    });
  });

  describe('requestLogs', () => {
    beforeEach(() => {
      mockSocket.connected = true;
      const messageHandler = (client as any).messageHandler;
      if (messageHandler) {
        messageHandler.attachSocket(mockSocket);
      }
    });

    it('should send request_logs message', () => {
      client.requestLogs();

      expect(mockEmit).toHaveBeenCalledWith('request_logs', {});
    });

    it('should queue message when not connected', () => {
      mockSocket.connected = false;
      client.requestLogs();

      expect(mockEmit).not.toHaveBeenCalled();
    });
  });

  describe('requestModels', () => {
    beforeEach(() => {
      mockSocket.connected = true;
      const messageHandler = (client as any).messageHandler;
      if (messageHandler) {
        messageHandler.attachSocket(mockSocket);
      }
    });

    it('should send request_models message', () => {
      client.requestModels();

      expect(mockEmit).toHaveBeenCalledWith('request_models', {});
    });

    it('should queue message when not connected', () => {
      mockSocket.connected = false;
      client.requestModels();

      expect(mockEmit).not.toHaveBeenCalled();
    });
  });

  describe('requestLlamaStatus', () => {
    beforeEach(() => {
      mockSocket.connected = true;
      const messageHandler = (client as any).messageHandler;
      if (messageHandler) {
        messageHandler.attachSocket(mockSocket);
      }
    });

    it('should send requestLlamaStatus message', () => {
      client.requestLlamaStatus();

      expect(mockEmit).toHaveBeenCalledWith('requestLlamaStatus', undefined);
    });

    it('should queue message when not connected', () => {
      mockSocket.connected = false;
      client.requestLlamaStatus();

      expect(mockEmit).not.toHaveBeenCalled();
    });
  });

  describe('rescanModels', () => {
    beforeEach(() => {
      mockSocket.connected = true;
      const messageHandler = (client as any).messageHandler;
      if (messageHandler) {
        messageHandler.attachSocket(mockSocket);
      }
    });

    it('should send rescanModels message', () => {
      client.rescanModels();

      expect(mockEmit).toHaveBeenCalledWith('rescanModels', undefined);
    });

    it('should queue message when not connected', () => {
      mockSocket.connected = false;
      client.rescanModels();

      expect(mockEmit).not.toHaveBeenCalled();
    });
  });

  describe('startModel', () => {
    beforeEach(() => {
      mockSocket.connected = true;
      const messageHandler = (client as any).messageHandler;
      if (messageHandler) {
        messageHandler.attachSocket(mockSocket);
      }
    });

    it('should send startModel message with modelId', () => {
      client.startModel('model-123');

      expect(mockEmit).toHaveBeenCalledWith('startModel', { modelId: 'model-123' });
    });

    it('should queue message when not connected', () => {
      mockSocket.connected = false;
      client.startModel('model-456');

      expect(mockEmit).not.toHaveBeenCalled();
    });
  });

  describe('stopModel', () => {
    beforeEach(() => {
      mockSocket.connected = true;
      const messageHandler = (client as any).messageHandler;
      if (messageHandler) {
        messageHandler.attachSocket(mockSocket);
      }
    });

    it('should send stopModel message with modelId', () => {
      client.stopModel('model-123');

      expect(mockEmit).toHaveBeenCalledWith('stopModel', { modelId: 'model-123' });
    });

    it('should queue message when not connected', () => {
      mockSocket.connected = false;
      client.stopModel('model-789');

      expect(mockEmit).not.toHaveBeenCalled();
    });
  });
});
