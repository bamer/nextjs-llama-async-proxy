/**
 * WebSocket message receive scenarios
 * Tests message handling for different message types
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
const wrapper = ({ children }: any) => React.createElement(WebSocketProvider as any, null, children);

export const messageReceiveScenarios = () => {
  describe('Message Handling', () => {
    beforeEach(() => setupMocks(true));
    afterEach(clearFakeTimers);

    it('should handle metrics messages', () => {
      renderHook(() => useWebSocket(), { wrapper });
      const messageHandler = mockWebsocketServer.on.mock.calls.find((call) => call[0] === 'message')?.[1] as (message: unknown) => void;
      act(() => messageHandler && messageHandler({ type: 'metrics', data: { cpu: 50, memory: 60 } }));
      expect(mockStoreState.setMetrics).toHaveBeenCalledWith({ cpu: 50, memory: 60 });
    });

    it('should handle models messages', () => {
      renderHook(() => useWebSocket(), { wrapper });
      const messageHandler = mockWebsocketServer.on.mock.calls.find((call) => call[0] === 'message')?.[1] as (message: unknown) => void;
      act(() => messageHandler && messageHandler({ type: 'models', data: [{ id: '1', name: 'Model 1' }] }));
      expect(mockStoreState.setModels).toHaveBeenCalledWith([{ id: '1', name: 'Model 1' }]);
    });

    it('should handle logs messages', () => {
      renderHook(() => useWebSocket(), { wrapper });
      const messageHandler = mockWebsocketServer.on.mock.calls.find((call) => call[0] === 'message')?.[1] as (message: unknown) => void;
      act(() => messageHandler && messageHandler({ type: 'logs', data: [{ id: '1', message: 'Test log' }] }));
      expect(mockStoreState.setLogs).toHaveBeenCalledWith([{ id: '1', message: 'Test log' }]);
    });

    it('should handle individual log messages with throttling', () => {
      renderHook(() => useWebSocket(), { wrapper });
      const messageHandler = mockWebsocketServer.on.mock.calls.find((call) => call[0] === 'message')?.[1] as (message: unknown) => void;
      act(() => {
        if (messageHandler) {
          messageHandler({ type: 'log', data: { id: '1', message: 'Log 1' } });
          messageHandler({ type: 'log', data: { id: '2', message: 'Log 2' } });
          messageHandler({ type: 'log', data: { id: '3', message: 'Log 3' } });
        }
      });
      expect(mockStoreState.addLog).not.toHaveBeenCalled();
      act(() => jest.advanceTimersByTime(500));
      expect(mockStoreState.addLog).toHaveBeenCalledTimes(3);
    });

    it('should handle unknown message types', () => {
      renderHook(() => useWebSocket(), { wrapper });
      const messageHandler = mockWebsocketServer.on.mock.calls.find((call) => call[0] === 'message')?.[1] as (message: unknown) => void;
      act(() => messageHandler && messageHandler({ type: 'unknown_type', data: {} }));
      expect(mockStoreState.setMetrics).not.toHaveBeenCalled();
      expect(mockStoreState.setModels).not.toHaveBeenCalled();
      expect(mockStoreState.setLogs).not.toHaveBeenCalled();
      expect(mockStoreState.addLog).not.toHaveBeenCalled();
    });
  });
};
