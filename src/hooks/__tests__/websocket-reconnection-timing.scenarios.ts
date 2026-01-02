import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '@/hooks/use-websocket';
import { mockWebSocketServer, contextState, simulateProviderDisconnect } from './websocket-reconnection-shared';

export const timingScenarios = {
  'should use exponential backoff delays': () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    renderHook(() => useWebSocket());

    act(() => {
      simulateProviderDisconnect();
      jest.advanceTimersByTime(1000);
      simulateProviderDisconnect();
      jest.advanceTimersByTime(2000);
      simulateProviderDisconnect();
      jest.advanceTimersByTime(4000);
    });

    expect(mockWebSocketServer.connect).toHaveBeenCalled();
    consoleSpy.mockRestore();
  },

  'should cap reconnection delay at 30 seconds': () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      simulateProviderDisconnect();
      jest.advanceTimersByTime(10000);
      simulateProviderDisconnect();
      jest.advanceTimersByTime(10000);
      simulateProviderDisconnect();
      jest.advanceTimersByTime(10000);
      simulateProviderDisconnect();
      jest.advanceTimersByTime(10000);
      simulateProviderDisconnect();
      jest.advanceTimersByTime(10000);
    });

    expect(contextState.reconnectionAttempts).toBe(5);
  },

  'should stop reconnection after max attempts': () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      for (let i = 0; i < 10; i++) {
        simulateProviderDisconnect();
        jest.advanceTimersByTime(10000);
      }
    });

    expect(contextState.connectionState).toBe('reconnecting');
  },
};
