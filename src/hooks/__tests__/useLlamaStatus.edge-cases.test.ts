/**
 * Edge case scenarios for useLlamaStatus hook
 * Testing special characters, unicode, malformed messages
 */

import { renderHook, act } from '@testing-library/react';
import { useLlamaStatus } from '../useLlamaStatus';
import * as websocketClientModule from '@/lib/websocket-client';

jest.mock('@/lib/websocket-client');

const mockWebsocketServer = websocketClientModule.websocketServer as jest.Mocked<typeof websocketClientModule.websocketServer>;

describe('useLlamaStatus - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockWebsocketServer.on = jest.fn();
    mockWebsocketServer.off = jest.fn();
    mockWebsocketServer.sendMessage = jest.fn();
    mockWebsocketServer.getSocket = jest.fn(() => null);
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
          messageHandler({ type: 'llama_status' });
          messageHandler({ data: {} });
        }
      });

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
            },
          });
        }
      });

      expect(result.current.status).toBe('running');
      expect(result.current.isLoading).toBe(false);
    });
  });
});
