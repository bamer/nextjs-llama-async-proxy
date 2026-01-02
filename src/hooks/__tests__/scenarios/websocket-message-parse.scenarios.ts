/**
 * WebSocket message parse scenarios
 * Tests message edge cases, special characters, and concurrent streams
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

export const messageParseScenarios = () => {
  describe('Message Edge Cases', () => {
    beforeEach(() => setupMocks(true));
    afterEach(clearFakeTimers);

    it('should handle messages with special characters', () => {
      renderHook(() => useWebSocket(), { wrapper });
      const messageHandler = mockWebsocketServer.on.mock.calls.find((call) => call[0] === 'message')?.[1] as (message: unknown) => void;
      act(() => messageHandler && messageHandler({ type: 'metrics', data: { cpu: 50, name: '<script>alert("xss")</script>' } }));
      expect(mockStoreState.setMetrics).toHaveBeenCalledWith({ cpu: 50, name: '<script>alert("xss")</script>' });
    });

    it('should handle messages with unicode characters', () => {
      renderHook(() => useWebSocket(), { wrapper });
      const messageHandler = mockWebsocketServer.on.mock.calls.find((call) => call[0] === 'message')?.[1] as (message: unknown) => void;
      act(() => messageHandler && messageHandler({ type: 'models', data: [{ id: '1', name: '模型 🚀 测试' }] }));
      expect(mockStoreState.setModels).toHaveBeenCalledWith([{ id: '1', name: '模型 🚀 测试' }]);
    });

    it('should handle concurrent message streams', () => {
      renderHook(() => useWebSocket(), { wrapper });
      const messageHandler = mockWebsocketServer.on.mock.calls.find((call) => call[0] === 'message')?.[1] as (message: unknown) => void;
      act(() => {
        if (messageHandler) {
          for (let i = 0; i < 50; i++) {
            messageHandler({ type: 'metrics', data: { cpu: i } });
            messageHandler({ type: 'log', data: { message: `Log ${i}` } });
            messageHandler({ type: 'models', data: [{ id: `${i}` }] });
          }
        }
      });
      act(() => jest.advanceTimersByTime(500));
      expect(mockStoreState.setMetrics).toHaveBeenCalledTimes(50);
      expect(mockStoreState.setModels).toHaveBeenCalledTimes(50);
      expect(mockStoreState.addLog).toHaveBeenCalledTimes(50);
    });

    it('should handle multiple throttle intervals', () => {
      renderHook(() => useWebSocket(), { wrapper });
      const messageHandler = mockWebsocketServer.on.mock.calls.find((call) => call[0] === 'message')?.[1] as (message: unknown) => void;
      act(() => {
        if (messageHandler) {
          messageHandler({ type: 'log', data: { message: 'Log 1' } });
          messageHandler({ type: 'log', data: { message: 'Log 2' } });
          jest.advanceTimersByTime(500);
          messageHandler({ type: 'log', data: { message: 'Log 3' } });
          messageHandler({ type: 'log', data: { message: 'Log 4' } });
          jest.advanceTimersByTime(500);
        }
      });
      expect(mockStoreState.addLog).toHaveBeenCalledTimes(4);
    });

    it('should handle throttle timeout during rapid messages', () => {
      renderHook(() => useWebSocket(), { wrapper });
      const messageHandler = mockWebsocketServer.on.mock.calls.find((call) => call[0] === 'message')?.[1] as (message: unknown) => void;
      act(() => {
        if (messageHandler) {
          for (let i = 0; i < 100; i++) {
            messageHandler({ type: 'log', data: { message: `Log ${i}` } });
          }
          jest.advanceTimersByTime(250);
          for (let i = 0; i < 100; i++) {
            messageHandler({ type: 'log', data: { message: `Log ${i + 100}` } });
          }
          jest.advanceTimersByTime(250);
        }
      });
      expect(mockStoreState.addLog).toHaveBeenCalled();
    });
  });
};
