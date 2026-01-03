/**
 * AGENT 1: Core Library Enhancement Tests - WebSocketClient Requests
 * ========================================
 * Purpose: WebSocketClient request methods tests
 * Target File: websocket-client.ts (94.44% → 98%)
 */

import { WebSocketClient } from '@/lib/websocket-client';
import { createMockedSocket } from './agent1-test-helper';

describe('WebSocketClient - Request Methods', () => {
  let client: WebSocketClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new WebSocketClient();
    const mockedSocket = createMockedSocket();
    mockedSocket.connected = true;
    (client as any).messageHandler.attachSocket(mockedSocket);
  });

  describe('Request methods comprehensive', () => {
    it('should call sendMessage for requestMetrics', () => {
      const socket = (client as any).messageHandler.socket;
      const emitSpy = jest.spyOn(socket, 'emit');

      client.requestMetrics();

      expect(emitSpy).toHaveBeenCalledWith('request_metrics', {});
      emitSpy.mockRestore();
    });

    it('should call sendMessage for requestLogs', () => {
      const socket = (client as any).messageHandler.socket;
      const emitSpy = jest.spyOn(socket, 'emit');

      client.requestLogs();

      expect(emitSpy).toHaveBeenCalledWith('request_logs', {});
      emitSpy.mockRestore();
    });

    it('should call sendMessage for requestModels', () => {
      const socket = (client as any).messageHandler.socket;
      const emitSpy = jest.spyOn(socket, 'emit');

      client.requestModels();

      expect(emitSpy).toHaveBeenCalledWith('request_models', {});
      emitSpy.mockRestore();
    });

    it('should call sendMessage for requestLlamaStatus', () => {
      const socket = (client as any).messageHandler.socket;
      const emitSpy = jest.spyOn(socket, 'emit');

      client.requestLlamaStatus();

      expect(emitSpy).toHaveBeenCalledWith('requestLlamaStatus');
      emitSpy.mockRestore();
    });

    it('should call sendMessage for rescanModels', () => {
      const socket = (client as any).messageHandler.socket;
      const emitSpy = jest.spyOn(socket, 'emit');

      client.rescanModels();

      expect(emitSpy).toHaveBeenCalledWith('rescanModels');
      emitSpy.mockRestore();
    });

    it('should call sendMessage with modelId for startModel', () => {
      const socket = (client as any).messageHandler.socket;
      const emitSpy = jest.spyOn(socket, 'emit');

      client.startModel('model-456');

      expect(emitSpy).toHaveBeenCalledWith('startModel', { modelId: 'model-456' });
      emitSpy.mockRestore();
    });

    it('should call sendMessage with modelId for stopModel', () => {
      const socket = (client as any).messageHandler.socket;
      const emitSpy = jest.spyOn(socket, 'emit');

      client.stopModel('model-789');

      expect(emitSpy).toHaveBeenCalledWith('stopModel', { modelId: 'model-789' });
      emitSpy.mockRestore();
    });
  });
});
