/**
 * WebSocket message send scenarios
 * Tests sendMessage functionality and message dispatching
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '../../use-websocket';
import { WebSocketProvider } from '@/providers/websocket-provider';
import * as websocketClientModule from '@/lib/websocket-client';
import * as storeModule from '@/lib/store';

jest.mock('@/lib/websocket-client');
jest.mock('@/lib/store');

const mockWebsocketServer = websocketClientModule.websocketServer as jest.Mocked<typeof websocketClientModule.websocketServer>;
const mockUseStore = storeModule.useStore as jest.MockedFunction<typeof storeModule.useStore>;
const mockStoreState = { addLog: jest.fn(), setMetrics: jest.fn(), setModels: jest.fn(), setLogs: jest.fn() };

jest.mock('@/providers/websocket-provider', () => {
  const { websocketServer } = require('@/lib/websocket-client');
  return {
    WebSocketProvider: ({ children }: any) => children,
    useWebSocketContext: jest.fn(() => ({
      isConnected: false,
      connectionState: 'disconnected' as const,
      reconnectionAttempts: 0,
      sendMessage: mockWebsocketServer.sendMessage,
      requestMetrics: mockWebsocketServer.requestMetrics,
      requestLogs: mockWebsocketServer.requestLogs,
      requestModels: mockWebsocketServer.requestModels,
      startModel: mockWebsocketServer.startModel,
      stopModel: mockWebsocketServer.stopModel,
      on: mockWebsocketServer.on,
      off: mockWebsocketServer.off,
      socketId: 'socket-123',
    })),
  };
});

const setupMocks = () => {
  jest.clearAllMocks();
  mockUseStore.mockImplementation((selector) => selector(mockStoreState as any));
  mockWebsocketServer.connect.mockImplementation(jest.fn());
  mockWebsocketServer.disconnect.mockImplementation(jest.fn());
  mockWebsocketServer.getSocketId.mockImplementation(() => 'socket-123');
  mockWebsocketServer.on.mockImplementation(jest.fn());
  mockWebsocketServer.off.mockImplementation(jest.fn());
  mockWebsocketServer.sendMessage.mockImplementation(jest.fn());
  mockWebsocketServer.requestMetrics.mockImplementation(jest.fn());
  mockWebsocketServer.requestLogs.mockImplementation(jest.fn());
  mockWebsocketServer.requestModels.mockImplementation(jest.fn());
  mockWebsocketServer.startModel.mockImplementation(jest.fn());
  mockWebsocketServer.stopModel.mockImplementation(jest.fn());
  mockWebsocketServer.getSocket.mockImplementation(() => null);
};

const wrapper = ({ children }: any) => React.createElement(WebSocketProvider as any, null, children);

export const sendMessageScenarios = () => {
  describe('sendMessage Function', () => {
    beforeEach(() => setupMocks());

    it('should not send message when disconnected', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });
      act(() => result.current.sendMessage('test_event', { data: 'test' }));
      expect(mockWebsocketServer.sendMessage).not.toHaveBeenCalled();
    });

    it('should send message when connected', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });
      const connectHandler = mockWebsocketServer.on.mock.calls.find((call) => call[0] === 'connect')?.[1] as () => void;
      act(() => {
        if (connectHandler) connectHandler();
        result.current.sendMessage('test_event', { data: 'test' });
      });
      expect(mockWebsocketServer.sendMessage).toHaveBeenCalledWith('test_event', { data: 'test' });
    });

    it('should send message with null/undefined data', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });
      const connectHandler = mockWebsocketServer.on.mock.calls.find((call) => call[0] === 'connect')?.[1] as () => void;
      act(() => {
        if (connectHandler) connectHandler();
        result.current.sendMessage('test_event', null);
        result.current.sendMessage('test_event', undefined);
      });
      expect(mockWebsocketServer.sendMessage).toHaveBeenCalledWith('test_event', null);
      expect(mockWebsocketServer.sendMessage).toHaveBeenCalledWith('test_event', undefined);
    });
  });
};
