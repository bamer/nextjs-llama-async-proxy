/**
 * Null/Undefined handling tests for useLlamaStatus hook
 * Testing null/undefined values and socket events
 */

import { renderHook, act } from '@testing-library/react';
import { useLlamaStatus } from '../useLlamaStatus';
import * as websocketClientModule from '@/lib/websocket-client';

jest.mock('@/lib/websocket-client');

const mockWebsocketServer = websocketClientModule.websocketServer as jest.Mocked<typeof websocketClientModule.websocketServer>;

describe('useLlamaStatus - Null/Undefined', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockWebsocketServer.on = jest.fn();
    mockWebsocketServer.off = jest.fn();
    mockWebsocketServer.sendMessage = jest.fn();
    mockWebsocketServer.getSocket = jest.fn(() => null);
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
      expect(result.current.models).toEqual([]);
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
      expect(result.current.models).toEqual([]);
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

  describe('Socket Events', () => {
    it('should handle null socket', () => {
      mockWebsocketServer.getSocket.mockReturnValueOnce(null);

      const { result } = renderHook(() => useLlamaStatus());

      expect(result.current.status).toBe('initial');
    });

    it('should handle undefined socket', () => {
      mockWebsocketServer.getSocket.mockReturnValueOnce(
        undefined as Partial<ReturnType<typeof mockWebsocketServer.getSocket>>
      );

      const { result } = renderHook(() => useLlamaStatus());

      expect(result.current.status).toBe('initial');
    });
  });
});
