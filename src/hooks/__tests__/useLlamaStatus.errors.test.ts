/**
 * Error handling tests for useLlamaStatus hook
 * Testing error states
 */

import { renderHook, act } from '@testing-library/react';
import { useLlamaStatus } from '../useLlamaStatus';
import * as websocketClientModule from '@/lib/websocket-client';

jest.mock('@/lib/websocket-client');

const mockWebsocketServer = websocketClientModule.websocketServer as jest.Mocked<typeof websocketClientModule.websocketServer>;

describe('useLlamaStatus - Errors', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockWebsocketServer.on = jest.fn();
    mockWebsocketServer.off = jest.fn();
    mockWebsocketServer.sendMessage = jest.fn();
    mockWebsocketServer.getSocket = jest.fn(() => null);
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
});
