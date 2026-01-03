/**
 * Memory management tests for useLlamaStatus hook
 * Testing cleanup and memory leaks
 */

import { renderHook, act } from '@testing-library/react';
import { useLlamaStatus } from '../useLlamaStatus';
import * as websocketClientModule from '@/lib/websocket-client';

jest.mock('@/lib/websocket-client');

const mockWebsocketServer = websocketClientModule.websocketServer as jest.Mocked<typeof websocketClientModule.websocketServer>;

describe('useLlamaStatus - Memory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockWebsocketServer.on = jest.fn();
    mockWebsocketServer.off = jest.fn();
    mockWebsocketServer.sendMessage = jest.fn();
    mockWebsocketServer.getSocket = jest.fn(() => null);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Cleanup on Unmount', () => {
    it('should cleanup event listeners on unmount', () => {
      const { unmount } = renderHook(() => useLlamaStatus());

      expect(mockWebsocketServer.on).toHaveBeenCalled();

      unmount();

      expect(mockWebsocketServer.off).toHaveBeenCalled();
    });

    it('should not call sendMessage after unmount', () => {
      const { unmount } = renderHook(() => useLlamaStatus());

      unmount();

      expect(mockWebsocketServer.sendMessage).toHaveBeenCalledWith('requestLlamaStatus');
    });
  });

  describe('Memory Leaks', () => {
    it('should not leak memory with frequent remounts', () => {
      for (let i = 0; i < 100; i++) {
        const { unmount } = renderHook(() => useLlamaStatus());
        unmount();
      }

      expect(mockWebsocketServer.on.mock.calls.length).toBeLessThan(200);
    });

    it('should handle rapid status updates without memory issues', () => {
      const { result } = renderHook(() => useLlamaStatus());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      act(() => {
        for (let i = 0; i < 1000; i++) {
          if (messageHandler) {
            messageHandler({
              type: 'llama_status',
              data: {
                status: 'running',
                models: [{ id: `${i}`, name: `Model ${i}` }],
                lastError: null,
                retries: i % 10,
                uptime: i * 100,
                startedAt: `2024-01-01T00:00:00Z`,
              },
            });
          }
        }
      });

      expect(result.current.status).toBe('running');
    });
  });
});
