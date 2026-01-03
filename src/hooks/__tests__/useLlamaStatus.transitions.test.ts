/**
 * Status transitions tests for useLlamaStatus hook
 * Testing status changes and loading state
 */

import { renderHook, act } from '@testing-library/react';
import { useLlamaStatus } from '../useLlamaStatus';
import * as websocketClientModule from '@/lib/websocket-client';

jest.mock('@/lib/websocket-client');

const mockWebsocketServer = websocketClientModule.websocketServer as jest.Mocked<typeof websocketClientModule.websocketServer>;

describe('useLlamaStatus - Transitions', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockWebsocketServer.on = jest.fn();
    mockWebsocketServer.off = jest.fn();
    mockWebsocketServer.sendMessage = jest.fn();
    mockWebsocketServer.getSocket = jest.fn(() => null);
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

      act(() => {
        if (messageHandler) {
          messageHandler({ type: 'metrics', data: {} });
          messageHandler({ type: 'models', data: [] });
        }
      });

      expect(result.current.isLoading).toBe(true);
    });
  });
});
