/**
 * WebSocket connection scenarios for useWebSocket hook
 * Tests connection states, cleanup, and connection-related edge cases
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '../../use-websocket';
import { WebSocketProvider } from '@/providers/websocket-provider';
import * as websocketClientModule from '@/lib/websocket-client';
import * as storeModule from '@/lib/store';

jest.mock('@/lib/websocket-client');
jest.mock('@/lib/store');

const mockWebsocketServer = websocketClientModule.websocketServer as jest.Mocked<
  typeof websocketClientModule.websocketServer
>;
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

const setupMocks = (useFakeTimers = false) => {
  jest.clearAllMocks();
  if (useFakeTimers) jest.useFakeTimers();
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

const clearFakeTimers = () => jest.useRealTimers();

export const connectionScenarios = () => {
  const wrapper = ({ children }: any) => React.createElement(WebSocketProvider as any, null, children);
  
  describe('Connection States', () => {
    beforeEach(() => setupMocks(false));
    
    it('should initialize as disconnected', () => {
      const { result } = renderHook(() => useWebSocket());
      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionState).toBe('disconnected');
    });
  });

  describe('Cleanup on Unmount', () => {
    beforeEach(() => setupMocks(false));
    
    it('should cleanup event listeners on unmount', () => {
      const { unmount } = renderHook(() => useWebSocket(), { wrapper });
      expect(mockWebsocketServer.on).toHaveBeenCalledTimes(4);
      unmount();
      expect(mockWebsocketServer.off).toHaveBeenCalledTimes(4);
      expect(mockWebsocketServer.disconnect).toHaveBeenCalled();
    });
  });

  describe('Connection Edge Cases', () => {
    beforeEach(() => setupMocks(true));
    afterEach(clearFakeTimers);
    
    it('should handle rapid connect/disconnect cycles', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });
      const connectHandler = mockWebsocketServer.on.mock.calls.find((call) => call[0] === 'connect')?.[1] as () => void;
      const disconnectHandler = mockWebsocketServer.on.mock.calls.find((call) => call[0] === 'disconnect')?.[1] as () => void;

      for (let i = 0; i < 10; i++) {
        act(() => connectHandler && connectHandler());
        expect(result.current.isConnected).toBe(true);
        act(() => disconnectHandler && disconnectHandler());
        expect(result.current.isConnected).toBe(false);
      }
    });

    it('should handle messages during disconnection', () => {
      renderHook(() => useWebSocket(), { wrapper });
      const messageHandler = mockWebsocketServer.on.mock.calls.find((call) => call[0] === 'message')?.[1] as (message: unknown) => void;

      act(() => {
        if (messageHandler) {
          messageHandler({ type: 'metrics', data: { cpu: 50 } });
          messageHandler({ type: 'log', data: { message: 'Test' } });
        }
      });

      expect(mockStoreState.setMetrics).toHaveBeenCalled();
    });
  });
};
