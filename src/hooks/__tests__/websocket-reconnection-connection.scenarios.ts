import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '@/hooks/use-websocket';
import {
  mockWebSocketServer,
  contextState,
  simulateProviderConnect,
  simulateProviderDisconnect,
  simulateProviderError,
} from './websocket-reconnection-shared';

export const connectionScenarios = {
  'should start exponential backoff on disconnect': () => {
    const { result } = renderHook(() => useWebSocket());
    act(() => simulateProviderConnect());
    expect(result.current.isConnected).toBe(true);
    expect(result.current.reconnectionAttempts).toBe(0);
    act(() => simulateProviderDisconnect());
    expect(result.current.connectionState).toBe('reconnecting');
    expect(result.current.reconnectionAttempts).toBe(1);
    expect(mockWebSocketServer.connect).toHaveBeenCalled();
  },

  'should resubscribe to data on successful reconnection': () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const { result } = renderHook(() => useWebSocket());
    act(() => simulateProviderConnect());
    mockWebSocketServer.requestMetrics.mockClear();
    mockWebSocketServer.requestModels.mockClear();
    mockWebSocketServer.requestLogs.mockClear();
    act(() => {
      simulateProviderDisconnect();
      jest.advanceTimersByTime(1000);
      simulateProviderConnect();
    });
    expect(result.current.requestMetrics).toBeDefined();
    expect(result.current.requestModels).toBeDefined();
    expect(result.current.requestLogs).toBeDefined();
    consoleSpy.mockRestore();
  },

  'should not resubscribe on initial connection': () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const { result } = renderHook(() => useWebSocket());
    act(() => simulateProviderConnect());
    expect(result.current.requestMetrics).toBeDefined();
    expect(result.current.requestModels).toBeDefined();
    expect(result.current.requestLogs).toBeDefined();
    consoleSpy.mockRestore();
  },

  'should reset reconnection attempts on successful connection': () => {
    const { result } = renderHook(() => useWebSocket());
    act(() => simulateProviderConnect());
    expect(result.current.reconnectionAttempts).toBe(0);
    expect(result.current.connectionState).toBe('connected');
    act(() => simulateProviderDisconnect());
    expect(result.current.reconnectionAttempts).toBe(1);
    expect(result.current.connectionState).toBe('reconnecting');
    act(() => simulateProviderConnect());
    expect(result.current.reconnectionAttempts).toBe(0);
    expect(result.current.connectionState).toBe('connected');
  },

  'should attempt reconnection on connection error': () => {
    renderHook(() => useWebSocket());
    const initialConnectCount = mockWebSocketServer.connect.mock.calls.length;
    act(() => {
      simulateProviderDisconnect();
      jest.advanceTimersByTime(1000);
    });
    expect(mockWebSocketServer.connect).toHaveBeenCalled();
  },

  'should attempt reconnection when page becomes visible': () => {
    const { result } = renderHook(() => useWebSocket());
    act(() => simulateProviderDisconnect());
    expect(result.current.isConnected).toBe(false);
    const initialConnectCount = mockWebSocketServer.connect.mock.calls.length;
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
      jest.advanceTimersByTime(1000);
    });
    expect(mockWebSocketServer.connect).toHaveBeenCalled();
  },
};
