/**
 * AGENT 1: Core Library Enhancement Tests - WebSocketClient Connection
 * ========================================
 * Purpose: WebSocketClient connection and event handling tests
 * Target File: websocket-client.ts (94.44% → 98%)
 */

import { WebSocketClient, websocketServer } from '@/lib/websocket-client';
import {
  mockedIo,
  createMockedSocket,
  setupWindowLocation,
} from './agent1-test-helper';

describe('WebSocketClient - Enhanced Coverage', () => {
  let client: WebSocketClient;
  let mockedSocket: any;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new WebSocketClient();
    mockedSocket = createMockedSocket();
    mockedIo.mockReturnValue(mockedSocket);
    setupWindowLocation();
  });

  describe('Event handler edge cases', () => {
    it('should handle log event with missing data property', () => {
      const callback = jest.fn();
      client.on('message', callback);

      client.connect();

      const onMock = mockedSocket.on as jest.Mock;
      const logHandler = onMock.mock.calls.find((call) => call[0] === 'log')?.[1];

      if (logHandler) {
        logHandler({ data: undefined });
      }

      expect(callback).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'log' }));
    });

    it('should handle log event with data', () => {
      const callback = jest.fn();
      client.on('message', callback);

      client.connect();

      const onMock = mockedSocket.on as jest.Mock;
      const logHandler = onMock.mock.calls.find((call) => call[0] === 'log')?.[1];

      if (logHandler) {
        logHandler({ data: { id: 'log-123', message: 'test' } });
      }

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ type: 'log' }));
    });

    it('should extract data from metrics event correctly', () => {
      const callback = jest.fn();
      client.on('message', callback);

      client.connect();

      const onMock = mockedSocket.on as jest.Mock;
      const metricsHandler = onMock.mock.calls.find((call) => call[0] === 'metrics')?.[1];

      if (metricsHandler) {
        metricsHandler({ data: { cpu: 50, memory: 60 } });
      }

      expect(callback).toHaveBeenCalledWith({
        type: 'metrics',
        data: { cpu: 50, memory: 60 },
      });
    });
  });

  describe('Connection state edge cases', () => {
    it('should handle disconnect when socket is null', () => {
      expect((client as any).socket).toBeNull();

      client.disconnect();

      expect(mockedSocket.disconnect).not.toHaveBeenCalled();
    });

    it('should set socketId to null when socket is disconnected', () => {
      client.connect();

      const onMock = mockedSocket.on as jest.Mock;
      const connectHandler = onMock.mock.calls.find((call) => call[0] === 'connect')?.[1];

      mockedSocket.id = undefined;

      if (connectHandler) {
        connectHandler();
      }

      expect((client as any).socketId).toBeNull();
    });

    it('should preserve socketId across reconnections', () => {
      client.connect();

      const onMock = mockedSocket.on as jest.Mock;
      const messageHandler = onMock.mock.calls.find((call) => call[0] === 'message')?.[1];

      if (messageHandler) {
        messageHandler({ type: 'connection', clientId: 'custom-id-123' });
      }

      expect((client as any).socketId).toBe('custom-id-123');
    });
  });

  describe('SendMessage edge cases', () => {
    it('should emit with undefined data when not provided', () => {
      mockedSocket.connected = true;
      (client as any).socket = mockedSocket;

      client.sendMessage('eventName');

      expect(mockedSocket.emit).toHaveBeenCalledWith('eventName', undefined);
    });

    it('should not emit when socket is null', () => {
      (client as any).socket = null;

      client.sendMessage('eventName', { data: 'test' });

      expect(mockedSocket.emit).not.toHaveBeenCalled();
    });

    it('should warn when sending on disconnected socket', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockedSocket.connected = false;
      (client as any).socket = mockedSocket;

      client.sendMessage('eventName');

      expect(warnSpy).toHaveBeenCalledWith('Socket.IO is not connected');
      warnSpy.mockRestore();
    });
  });

  describe('Singleton behavior', () => {
    it('should export websocketServer singleton', () => {
      expect(websocketServer).toBeInstanceOf(WebSocketClient);
    });
  });
});
