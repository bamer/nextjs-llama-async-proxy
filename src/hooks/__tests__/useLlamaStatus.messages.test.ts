/**
 * Message handling tests for useLlamaStatus hook
 * Testing message processing
 */

import { renderHook, act } from '@testing-library/react';
import { useLlamaStatus } from '../useLlamaStatus';
import * as websocketClientModule from '@/lib/websocket-client';

jest.mock('@/lib/websocket-client');

const mockWebsocketServer = websocketClientModule.websocketServer as jest.Mocked<typeof websocketClientModule.websocketServer>;

describe('useLlamaStatus - Messages', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockWebsocketServer.on = jest.fn();
    mockWebsocketServer.off = jest.fn();
    mockWebsocketServer.sendMessage = jest.fn();
    mockWebsocketServer.getSocket = jest.fn(() => null);
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

      expect(result.current.status).toBe('initial');
      expect(result.current.isLoading).toBe(true);
    });

    it('should handle messages from socket directly', () => {
      const mockSocket = {
        on: jest.fn(),
      } as Partial<ReturnType<typeof mockWebsocketServer.getSocket>>;

      mockWebsocketServer.getSocket.mockReturnValue(mockSocket);

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
});
