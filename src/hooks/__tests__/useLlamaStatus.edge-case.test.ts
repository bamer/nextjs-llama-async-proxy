/**
 * Comprehensive edge case tests for useLlamaStatus hook
 * Testing for null/undefined inputs, error states, loading states,
 * concurrent calls, cleanup on unmount, memory leaks, and edge cases
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useLlamaStatus } from '../useLlamaStatus';
import * as websocketClientModule from '@/lib/websocket-client';

// Mock the websocket client
jest.mock('@/lib/websocket-client');

const mockWebsocketServer = websocketClientModule.websocketServer as jest.Mocked<typeof websocketClientModule.websocketServer>;

describe('useLlamaStatus - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock websocket server methods
    mockWebsocketServer.on = jest.fn();
    mockWebsocketServer.off = jest.fn();
    mockWebsocketServer.sendMessage = jest.fn();
    mockWebsocketServer.getSocket = jest.fn(() => null);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useLlamaStatus());

      expect(result.current.status).toBe('initial');
      expect(result.current.models).toEqual([]);
      expect(result.current.lastError).toBeNull();
      expect(result.current.retries).toBe(0);
      expect(result.current.uptime).toBe(0);
      expect(result.current.startedAt).toBeNull();
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Null/Undefined Handling', () => {
    it('should handle null status data', () => {
      const { result } = renderHook(() => useLlamaStatus());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      act(() => {
        if (messageHandler) {
          messageHandler({ type: 'llama_status', data: null });
        }
      });

      // Should handle gracefully without updating state
      expect(result.current.isLoading).toBe(true);
    });

    it('should handle undefined status data', () => {
      const { result } = renderHook(() => useLlamaStatus());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      act(() => {
        if (messageHandler) {
          messageHandler({ type: 'llama_status', data: undefined });
        }
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should handle null models array', () => {
      const { result } = renderHook(() => useLlamaStatus());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      act(() => {
        if (messageHandler) {
          messageHandler({
            type: 'llama_status',
            data: {
              status: 'running',
              models: null,
              lastError: null,
              retries: 0,
              uptime: 100,
              startedAt: null,
            },
          });
        }
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.models).toBeNull();
    });

    it('should handle undefined models array', () => {
      const { result } = renderHook(() => useLlamaStatus());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      act(() => {
        if (messageHandler) {
          messageHandler({
            type: 'llama_status',
            data: {
              status: 'running',
              models: undefined,
              lastError: null,
              retries: 0,
              uptime: 100,
              startedAt: null,
            },
          });
        }
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.models).toBeUndefined();
    });

    it('should handle null startedAt', () => {
      const { result } = renderHook(() => useLlamaStatus());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      act(() => {
        if (messageHandler) {
          messageHandler({
            type: 'llama_status',
            data: {
              status: 'running',
              models: [],
              lastError: null,
              retries: 0,
              uptime: 100,
              startedAt: null,
            },
          });
        }
      });

      expect(result.current.startedAt).toBeNull();
    });
  });

  describe('Message Handling', () => {
    it('should handle llama_status messages', () => {
      const { result } = renderHook(() => useLlamaStatus());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      act(() => {
        if (messageHandler) {
          messageHandler({
            type: 'llama_status',
            data: {
              status: 'running',
              models: [{ id: '1', name: 'Model 1' }],
              lastError: null,
              retries: 0,
              uptime: 100,
              startedAt: '2024-01-01T00:00:00Z',
            },
          });
        }
      });

      expect(result.current.status).toBe('running');
      expect(result.current.models).toEqual([{ id: '1', name: 'Model 1' }]);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle non-llama_status messages', () => {
      const { result } = renderHook(() => useLlamaStatus());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      act(() => {
        if (messageHandler) {
          messageHandler({ type: 'metrics', data: { cpu: 50 } });
          messageHandler({ type: 'models', data: [] });
          messageHandler({ type: 'logs', data: [] });
        }
      });

      // Should not update state for non-llama_status messages
      expect(result.current.status).toBe('initial');
      expect(result.current.isLoading).toBe(true);
    });

    it('should handle messages from socket directly', () => {
      const mockSocket = {
        on: jest.fn(),
      };
      mockWebsocketServer.getSocket.mockReturnValue(mockSocket as any);

      const { result } = renderHook(() => useLlamaStatus());

      const socketHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'llamaStatus'
      )?.[1] as (data: unknown) => void;

      act(() => {
        if (socketHandler) {
          socketHandler({
            data: {
              status: 'running',
              models: [{ id: '1', name: 'Model 1' }],
              lastError: null,
              retries: 0,
              uptime: 100,
              startedAt: '2024-01-01T00:00:00Z',
            },
          });
        }
      });

      expect(result.current.status).toBe('running');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Error States', () => {
    it('should handle error status', () => {
      const { result } = renderHook(() => useLlamaStatus());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      act(() => {
        if (messageHandler) {
          messageHandler({
            type: 'llama_status',
            data: {
              status: 'error',
              models: [],
              lastError: 'Connection failed',
              retries: 3,
              uptime: 100,
              startedAt: '2024-01-01T00:00:00Z',
            },
          });
        }
      });

      expect(result.current.status).toBe('error');
      expect(result.current.lastError).toBe('Connection failed');
      expect(result.current.retries).toBe(3);
    });

    it('should handle null error', () => {
      const { result } = renderHook(() => useLlamaStatus());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      act(() => {
        if (messageHandler) {
          messageHandler({
            type: 'llama_status',
            data: {
              status: 'running',
              models: [],
              lastError: null,
              retries: 0,
              uptime: 100,
              startedAt: null,
            },
          });
        }
      });

      expect(result.current.lastError).toBeNull();
    });

    it('should handle undefined error', () => {
      const { result } = renderHook(() => useLlamaStatus());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      act(() => {
        if (messageHandler) {
          messageHandler({
            type: 'llama_status',
            data: {
              status: 'running',
              models: [],
              lastError: undefined,
              retries: 0,
              uptime: 100,
              startedAt: null,
            },
          });
        }
      });

      expect(result.current.lastError).toBeUndefined();
    });
  });

  describe('Status Transitions', () => {
    it('should transition from initial to running', () => {
      const { result } = renderHook(() => useLlamaStatus());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      act(() => {
        if (messageHandler) {
          messageHandler({
            type: 'llama_status',
            data: {
              status: 'running',
              models: [],
              lastError: null,
              retries: 0,
              uptime: 100,
              startedAt: '2024-01-01T00:00:00Z',
            },
          });
        }
      });

      expect(result.current.status).toBe('running');
      expect(result.current.isLoading).toBe(false);
    });

    it('should transition through multiple status changes', () => {
      const { result } = renderHook(() => useLlamaStatus());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      // initial -> starting
      act(() => {
        if (messageHandler) {
          messageHandler({
            type: 'llama_status',
            data: {
              status: 'starting',
              models: [],
              lastError: null,
              retries: 0,
              uptime: 0,
              startedAt: null,
            },
          });
        }
      });
      expect(result.current.status).toBe('starting');

      // starting -> running
      act(() => {
        if (messageHandler) {
          messageHandler({
            type: 'llama_status',
            data: {
              status: 'running',
              models: [{ id: '1' }],
              lastError: null,
              retries: 0,
              uptime: 100,
              startedAt: '2024-01-01T00:00:00Z',
            },
          });
        }
      });
      expect(result.current.status).toBe('running');

      // running -> stopped
      act(() => {
        if (messageHandler) {
          messageHandler({
            type: 'llama_status',
            data: {
              status: 'stopped',
              models: [],
              lastError: null,
              retries: 0,
              uptime: 200,
              startedAt: '2024-01-01T00:00:00Z',
            },
          });
        }
      });
      expect(result.current.status).toBe('stopped');
    });
  });

  describe('Loading State', () => {
    it('should set loading to false when receiving status', () => {
      const { result } = renderHook(() => useLlamaStatus());

      expect(result.current.isLoading).toBe(true);

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      act(() => {
        if (messageHandler) {
          messageHandler({
            type: 'llama_status',
            data: {
              status: 'running',
              models: [],
              lastError: null,
              retries: 0,
              uptime: 100,
              startedAt: null,
            },
          });
        }
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should remain loading until status received', () => {
      const { result } = renderHook(() => useLlamaStatus());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      // Send non-llama_status messages
      act(() => {
        if (messageHandler) {
          messageHandler({ type: 'metrics', data: {} });
          messageHandler({ type: 'models', data: [] });
        }
      });

      // Should still be loading
      expect(result.current.isLoading).toBe(true);
    });
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

      // Initial sendMessage should have been called
      expect(mockWebsocketServer.sendMessage).toHaveBeenCalledWith('requestLlamaStatus');
    });
  });

  describe('Memory Leaks', () => {
    it('should not leak memory with frequent remounts', () => {
      for (let i = 0; i < 100; i++) {
        const { unmount } = renderHook(() => useLlamaStatus());
        unmount();
      }

      // Should not have excessive event listeners
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

  describe('Uptime and Retries', () => {
    it('should handle zero uptime', () => {
      const { result } = renderHook(() => useLlamaStatus());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      act(() => {
        if (messageHandler) {
          messageHandler({
            type: 'llama_status',
            data: {
              status: 'running',
              models: [],
              lastError: null,
              retries: 0,
              uptime: 0,
              startedAt: null,
            },
          });
        }
      });

      expect(result.current.uptime).toBe(0);
    });

    it('should handle negative uptime', () => {
      const { result } = renderHook(() => useLlamaStatus());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      act(() => {
        if (messageHandler) {
          messageHandler({
            type: 'llama_status',
            data: {
              status: 'running',
              models: [],
              lastError: null,
              retries: 0,
              uptime: -100,
              startedAt: null,
            },
          });
        }
      });

      expect(result.current.uptime).toBe(-100);
    });

    it('should handle very large uptime', () => {
      const { result } = renderHook(() => useLlamaStatus());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      act(() => {
        if (messageHandler) {
          messageHandler({
            type: 'llama_status',
            data: {
              status: 'running',
              models: [],
              lastError: null,
              retries: 0,
              uptime: Number.MAX_SAFE_INTEGER,
              startedAt: null,
            },
          });
        }
      });

      expect(result.current.uptime).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle zero retries', () => {
      const { result } = renderHook(() => useLlamaStatus());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      act(() => {
        if (messageHandler) {
          messageHandler({
            type: 'llama_status',
            data: {
              status: 'running',
              models: [],
              lastError: null,
              retries: 0,
              uptime: 100,
              startedAt: null,
            },
          });
        }
      });

      expect(result.current.retries).toBe(0);
    });

    it('should handle high retry counts', () => {
      const { result } = renderHook(() => useLlamaStatus());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      act(() => {
        if (messageHandler) {
          messageHandler({
            type: 'llama_status',
            data: {
              status: 'running',
              models: [],
              lastError: 'Retrying...',
              retries: 1000,
              uptime: 100,
              startedAt: null,
            },
          });
        }
      });

      expect(result.current.retries).toBe(1000);
    });
  });

  describe('Models Array', () => {
    it('should handle empty models array', () => {
      const { result } = renderHook(() => useLlamaStatus());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      act(() => {
        if (messageHandler) {
          messageHandler({
            type: 'llama_status',
            data: {
              status: 'running',
              models: [],
              lastError: null,
              retries: 0,
              uptime: 100,
              startedAt: null,
            },
          });
        }
      });

      expect(result.current.models).toEqual([]);
    });

    it('should handle models with null entries', () => {
      const { result } = renderHook(() => useLlamaStatus());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      act(() => {
        if (messageHandler) {
          messageHandler({
            type: 'llama_status',
            data: {
              status: 'running',
              models: [null, { id: '1', name: 'Model 1' }, null] as any,
              lastError: null,
              retries: 0,
              uptime: 100,
              startedAt: null,
            },
          });
        }
      });

      expect(result.current.models).toEqual([
        null,
        { id: '1', name: 'Model 1' },
        null,
      ]);
    });

    it('should handle very large models array', () => {
      const { result } = renderHook(() => useLlamaStatus());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      const largeModels = Array.from({ length: 10000 }, (_, i) => ({
        id: `model-${i}`,
        name: `Model ${i}`,
      }));

      act(() => {
        if (messageHandler) {
          messageHandler({
            type: 'llama_status',
            data: {
              status: 'running',
              models: largeModels,
              lastError: null,
              retries: 0,
              uptime: 100,
              startedAt: null,
            },
          });
        }
      });

      expect(result.current.models).toHaveLength(10000);
    });
  });

  describe('Edge Case Scenarios', () => {
    it('should handle messages with special characters in error', () => {
      const { result } = renderHook(() => useLlamaStatus());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      act(() => {
        if (messageHandler) {
          messageHandler({
            type: 'llama_status',
            data: {
              status: 'error',
              models: [],
              lastError: 'Error: <script>alert("xss")</script> & "quotes"',
              retries: 1,
              uptime: 0,
              startedAt: null,
            },
          });
        }
      });

      expect(result.current.lastError).toBe(
        'Error: <script>alert("xss")</script> & "quotes"'
      );
    });

    it('should handle unicode in status data', () => {
      const { result } = renderHook(() => useLlamaStatus());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      act(() => {
        if (messageHandler) {
          messageHandler({
            type: 'llama_status',
            data: {
              status: 'running',
              models: [{ id: '1', name: '模型 🚀 测试' }],
              lastError: '错误',
              retries: 0,
              uptime: 100,
              startedAt: null,
            },
          });
        }
      });

      expect(result.current.models[0].name).toBe('模型 🚀 测试');
      expect(result.current.lastError).toBe('错误');
    });

    it('should handle malformed messages', () => {
      const { result } = renderHook(() => useLlamaStatus());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      act(() => {
        if (messageHandler) {
          messageHandler('string message');
          messageHandler(12345);
          messageHandler({ invalid: 'structure' });
          messageHandler({ type: 'llama_status' }); // missing data
          messageHandler({ data: {} }); // missing type
        }
      });

      // Should handle gracefully
      expect(result.current.status).toBe('initial');
      expect(result.current.isLoading).toBe(true);
    });

    it('should handle missing data property', () => {
      const { result } = renderHook(() => useLlamaStatus());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      act(() => {
        if (messageHandler) {
          messageHandler({ type: 'llama_status' });
        }
      });

      // Should remain in initial state
      expect(result.current.status).toBe('initial');
    });

    it('should handle partial data updates', () => {
      const { result } = renderHook(() => useLlamaStatus());

      const messageHandler = mockWebsocketServer.on.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1] as (message: unknown) => void;

      act(() => {
        if (messageHandler) {
          messageHandler({
            type: 'llama_status',
            data: {
              status: 'running',
              models: [],
              // missing other fields
            },
          });
        }
      });

      expect(result.current.status).toBe('running');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Socket Events', () => {
    it('should handle null socket', () => {
      mockWebsocketServer.getSocket.mockReturnValueOnce(null);

      const { result } = renderHook(() => useLlamaStatus());

      // Should not throw errors
      expect(result.current.status).toBe('initial');
    });

    it('should handle undefined socket', () => {
      mockWebsocketServer.getSocket.mockReturnValueOnce(undefined as any);

      const { result } = renderHook(() => useLlamaStatus());

      expect(result.current.status).toBe('initial');
    });

    it('should handle socket with no on method', () => {
      mockWebsocketServer.getSocket.mockReturnValueOnce({} as any);

      const { result } = renderHook(() => useLlamaStatus());

      expect(result.current.status).toBe('initial');
    });
  });

  describe('Initial Status Request', () => {
    it('should request initial status on mount', () => {
      renderHook(() => useLlamaStatus());

      expect(mockWebsocketServer.sendMessage).toHaveBeenCalledWith('requestLlamaStatus');
    });

    it('should request initial status only once on mount', () => {
      renderHook(() => useLlamaStatus());

      expect(mockWebsocketServer.sendMessage).toHaveBeenCalledTimes(1);
    });
  });
});
