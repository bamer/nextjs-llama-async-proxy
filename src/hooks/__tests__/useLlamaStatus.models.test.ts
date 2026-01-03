/**
 * Models array tests for useLlamaStatus hook
 * Testing models array handling
 */

import { renderHook, act } from '@testing-library/react';
import { useLlamaStatus } from '../useLlamaStatus';
import * as websocketClientModule from '@/lib/websocket-client';

jest.mock('@/lib/websocket-client');

const mockWebsocketServer = websocketClientModule.websocketServer as jest.Mocked<typeof websocketClientModule.websocketServer>;

describe('useLlamaStatus - Models', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockWebsocketServer.on = jest.fn();
    mockWebsocketServer.off = jest.fn();
    mockWebsocketServer.sendMessage = jest.fn();
    mockWebsocketServer.getSocket = jest.fn(() => null);
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
              models: [null, { id: '1', name: 'Model 1' }, null] as unknown,
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
});
