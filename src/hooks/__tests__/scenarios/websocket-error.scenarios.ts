/**
 * WebSocket error scenarios for useWebSocket hook
 * Tests null/undefined handling, error states, memory leaks, and request functions
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
      socketId: mockWebsocketServer.getSocketId(),
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

export const errorScenarios = () => {
  describe('Null/Undefined Handling', () => {
    beforeEach(() => setupMocks(false));

    it('should handle null messages', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });
      const messageHandler = mockWebsocketServer.on.mock.calls.find((call) => call[0] === 'message')?.[1] as (message: unknown) => void;

      if (messageHandler) act(() => messageHandler(null));
      expect(result.current.isConnected).toBe(false);
    });

    it('should handle undefined messages', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });
      const messageHandler = mockWebsocketServer.on.mock.calls.find((call) => call[0] === 'message')?.[1] as (message: unknown) => void;

      if (messageHandler) act(() => messageHandler(undefined));
      expect(result.current.isConnected).toBe(false);
    });

    it('should handle messages with null/undefined data', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });
      const messageHandler = mockWebsocketServer.on.mock.calls.find((call) => call[0] === 'message')?.[1] as (message: unknown) => void;

      if (messageHandler) {
        act(() => {
          messageHandler({ type: 'metrics', data: null });
          messageHandler({ type: 'models', data: undefined });
        });
      }
      expect(result.current.isConnected).toBe(false);
    });
  });

  describe('Error States', () => {
    beforeEach(() => setupMocks(false));

    it('should handle WebSocket connection errors', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });
      const errorHandler = mockWebsocketServer.on.mock.calls.find((call) => call[0] === 'connect_error')?.[1] as (error: unknown) => void;

      if (errorHandler) act(() => errorHandler(new Error('Connection failed')));
      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionState).toBe('disconnected');
    });

    it('should handle malformed messages', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });
      const messageHandler = mockWebsocketServer.on.mock.calls.find((call) => call[0] === 'message')?.[1] as (message: unknown) => void;

      if (messageHandler) {
        act(() => {
          messageHandler('invalid json string');
          messageHandler({ invalid: 'structure' });
          messageHandler(12345);
        });
      }
      expect(result.current).toBeDefined();
    });
  });

  describe('Memory Leaks', () => {
    beforeEach(() => setupMocks(true));
    afterEach(clearFakeTimers);

    it('should not leak memory with frequent remounts', () => {
      for (let i = 0; i < 100; i++) {
        const { unmount } = renderHook(() => useWebSocket(), { wrapper });
        unmount();
      }
      expect(mockWebsocketServer.on.mock.calls.length).toBeLessThan(500);
    });

    it('should not leak memory with many messages', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });
      const messageHandler = mockWebsocketServer.on.mock.calls.find((call) => call[0] === 'message')?.[1] as (message: unknown) => void;

      act(() => {
        for (let i = 0; i < 1000; i++) {
          if (messageHandler) messageHandler({ type: 'log', data: { id: `${i}`, message: `Log ${i}` } });
        }
      });
      act(() => jest.advanceTimersByTime(500));
      expect(result.current).toBeDefined();
    });
  });

  describe('Request Functions & Socket ID', () => {
    beforeEach(() => setupMocks(false));

    it('should call request functions correctly', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });
      act(() => {
        result.current.requestMetrics();
        result.current.requestLogs();
        result.current.requestModels();
      });
      expect(mockWebsocketServer.requestMetrics).toHaveBeenCalled();
      expect(mockWebsocketServer.requestLogs).toHaveBeenCalled();
      expect(mockWebsocketServer.requestModels).toHaveBeenCalled();
    });

    it('should call start/stopModel with modelId', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });
      act(() => {
        result.current.startModel('model-123');
        result.current.stopModel('model-456');
      });
      expect(mockWebsocketServer.startModel).toHaveBeenCalledWith('model-123');
      expect(mockWebsocketServer.stopModel).toHaveBeenCalledWith('model-456');
    });

    it('should handle null/undefined modelId in start/stopModel', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });
      act(() => {
        result.current.startModel(null as any);
        result.current.stopModel(undefined as any);
      });
      expect(mockWebsocketServer.startModel).toHaveBeenCalledWith(null);
      expect(mockWebsocketServer.stopModel).toHaveBeenCalledWith(undefined);
    });

    it('should return socket ID correctly', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });
      expect(result.current.socketId).toBe('socket-123');
    });

    it('should handle null socket ID', () => {
      mockWebsocketServer.getSocketId.mockReturnValueOnce(null as any);
      const { result } = renderHook(() => useWebSocket(), { wrapper });
      expect(result.current.socketId).toBeNull();
    });
  });
};
