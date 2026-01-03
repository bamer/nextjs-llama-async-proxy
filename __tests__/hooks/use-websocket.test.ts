import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { WebSocketProvider } from '@/providers/websocket-provider';
import { useWebSocket, useWebSocketEvent } from '@/hooks/use-websocket';
import React from 'react';

jest.mock('@/providers/websocket-provider', () => ({
  WebSocketProvider: ({ children }: any) => children,
  useWebSocketContext: jest.fn(() => ({
    isConnected: true,
    connectionState: 'connected' as const,
    reconnectionAttempts: 0,
    sendMessage: jest.fn(),
    requestMetrics: jest.fn(),
    requestLogs: jest.fn(),
    requestModels: jest.fn(),
    startModel: jest.fn(),
    stopModel: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    socketId: 'test-socket-1',
  })),
}));

describe('use-websocket', () => {
  const wrapper = ({ children }: any) => {
    return React.createElement(WebSocketProvider, null, children);
  };

  describe('useWebSocket hook', () => {
    it('should return WebSocket context values', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.isConnected).toBeDefined();
      expect(result.current.connectionState).toBeDefined();
      expect(result.current.reconnectionAttempts).toBeDefined();
      expect(result.current.sendMessage).toBeDefined();
      expect(result.current.requestMetrics).toBeDefined();
      expect(result.current.requestLogs).toBeDefined();
      expect(result.current.requestModels).toBeDefined();
      expect(result.current.startModel).toBeDefined();
      expect(result.current.stopModel).toBeDefined();
      expect(result.current.on).toBeDefined();
      expect(result.current.off).toBeDefined();
      expect(result.current.useWebSocketEvent).toBeDefined();
      expect(result.current.socketId).toBeDefined();
    });

    it('should expose connection state', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectionState).toBe('connected');
    });

    it('should expose reconnection attempts', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });

      expect(result.current.reconnectionAttempts).toBe(0);
    });

    it('should expose WebSocket methods', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });

      expect(typeof result.current.sendMessage).toBe('function');
      expect(typeof result.current.requestMetrics).toBe('function');
      expect(typeof result.current.requestLogs).toBe('function');
      expect(typeof result.current.requestModels).toBe('function');
      expect(typeof result.current.startModel).toBe('function');
      expect(typeof result.current.stopModel).toBe('function');
    });
  });

  describe('useWebSocketEvent hook', () => {
    it('should register event handler on mount', () => {
      const handler = jest.fn();
      const { unmount } = renderHook(
        () => useWebSocketEvent('test_event', handler),
        { wrapper }
      );

      const { useWebSocketContext } = require('@/providers/websocket-provider');
      const context = useWebSocketContext();
      expect(context.on).toHaveBeenCalledWith('test_event', expect.any(Function));

      unmount();
    });

    it('should unregister event handler on unmount', () => {
      const handler = jest.fn();
      const { unmount } = renderHook(
        () => useWebSocketEvent('test_event', handler),
        { wrapper }
      );

      const { useWebSocketContext } = require('@/providers/websocket-provider');
      const context = useWebSocketContext();

      unmount();

      expect(context.off).toHaveBeenCalledWith('test_event', expect.any(Function));
    });

    it('should memoize handler with dependencies', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const dep1 = 'dep1';
      const dep2 = 'dep2';

      const { rerender, unmount } = renderHook(
        ({ deps, handler }: any) => useWebSocketEvent('test_event', handler, deps),
        {
          wrapper,
          initialProps: { deps: [dep1], handler: handler1 },
        }
      );

      rerender({ deps: [dep2], handler: handler2 });

      unmount();
    });

    it('should register handler for custom event type', () => {
      const handler = jest.fn();
      const eventType = 'custom_event';

      const { unmount } = renderHook(
        () => useWebSocketEvent<{ data: string }>(eventType, handler),
        { wrapper }
      );

      const { useWebSocketContext } = require('@/providers/websocket-provider');
      const context = useWebSocketContext();
      expect(context.on).toHaveBeenCalledWith(eventType, expect.any(Function));

      unmount();
    });
  });
});
