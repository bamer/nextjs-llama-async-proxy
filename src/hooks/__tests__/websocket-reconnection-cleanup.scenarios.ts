import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '@/hooks/use-websocket';
import { contextState, simulateProviderConnect, simulateProviderDisconnect } from './websocket-reconnection-shared';

export const cleanupScenarios = {
  'should track reconnection attempts correctly': () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      simulateProviderDisconnect();
    });

    expect(contextState.reconnectionAttempts).toBe(1);

    act(() => {
      simulateProviderDisconnect();
    });

    expect(contextState.reconnectionAttempts).toBe(2);
  },

  'should clear reconnection timer on successful connection': () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    renderHook(() => useWebSocket());

    act(() => {
      simulateProviderDisconnect();
      simulateProviderConnect();
    });

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  },

  'should expose reconnection attempts to consuming components': () => {
    const { result } = renderHook(() => useWebSocket());

    expect(contextState.reconnectionAttempts).toBe(0);

    act(() => {
      simulateProviderDisconnect();
    });

    expect(contextState.reconnectionAttempts).toBe(1);
  },
};
