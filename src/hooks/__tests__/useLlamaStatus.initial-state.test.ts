/**
 * Initial state tests for useLlamaStatus hook
 * Testing initialization and initial status requests
 */

import { renderHook } from '@testing-library/react';
import { useLlamaStatus } from '../useLlamaStatus';
import * as websocketClientModule from '@/lib/websocket-client';

jest.mock('@/lib/websocket-client');

const mockWebsocketServer = websocketClientModule.websocketServer as jest.Mocked<typeof websocketClientModule.websocketServer>;

describe('useLlamaStatus - Initial State', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockWebsocketServer.on = jest.fn();
    mockWebsocketServer.off = jest.fn();
    mockWebsocketServer.sendMessage = jest.fn();
    mockWebsocketServer.getSocket = jest.fn(() => null);
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
