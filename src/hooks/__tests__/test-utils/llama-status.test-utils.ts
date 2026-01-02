/**
 * Test utilities for useLlamaStatus hook tests
 * Provides reusable helper functions for common test scenarios
 */

import { renderHook, act } from '@testing-library/react';
import { useLlamaStatus } from '../../useLlamaStatus';
import * as websocketClientModule from '@/lib/websocket-client';

// Type for mocked websocket server methods
type MockedWebsocketServer = {
  on: jest.Mock;
  off: jest.Mock;
  sendMessage: jest.Mock;
  getSocket: jest.Mock;
};

const mockWebsocketServer = websocketClientModule.websocketServer as unknown as MockedWebsocketServer;

/**
 * Helper to get the message handler from websocket server mock
 */
export const getMessageHandler = (): ((message: unknown) => void) | undefined => {
  const onCalls = mockWebsocketServer.on.mock?.calls || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return onCalls.find((call: any[]) => call[0] === 'message')?.[1] as (
    message: unknown
  ) => void | undefined;
};

/**
 * Helper to get the socket status handler
 */
export const getSocketHandler = (): ((data: unknown) => void) | undefined => {
  const mockSocket = mockWebsocketServer.getSocket();
  if (!mockSocket || typeof mockSocket.on !== 'function') {
    return undefined;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'llamaStatus')?.[1] as (
    data: unknown
  ) => void;
};

/**
 * Standard beforeEach setup for useLlamaStatus tests
 */
export const setupLlamaStatusTests = (): void => {
  jest.clearAllMocks();
  jest.useFakeTimers();

  mockWebsocketServer.on = jest.fn();
  mockWebsocketServer.off = jest.fn();
  mockWebsocketServer.sendMessage = jest.fn();
  mockWebsocketServer.getSocket = jest.fn(() => null);
};

/**
 * Standard afterEach cleanup
 */
export const cleanupLlamaStatusTests = (): void => {
  jest.useRealTimers();
};

/**
 * Render the useLlamaStatus hook with standard setup
 */
export const renderLlamaStatusHook = () => {
  return renderHook(() => useLlamaStatus());
};

/**
 * Send a status message through the message handler
 */
export const sendStatusMessage = (
  statusData: unknown
): void => {
  const messageHandler = getMessageHandler();
  act(() => {
    if (messageHandler) {
      messageHandler({ type: 'llama_status', data: statusData });
    }
  });
};

/**
 * Send a non-status message (metrics, models, logs, etc.)
 */
export const sendNonStatusMessage = (
  type: string,
  data: unknown
): void => {
  const messageHandler = getMessageHandler();
  act(() => {
    if (messageHandler) {
      messageHandler({ type, data });
    }
  });
};

/**
 * Create a mock socket object
 */
export const createMockSocket = (overrides = {}) => {
  return {
    on: jest.fn(),
    ...overrides,
  };
};

/**
 * Setup mock socket for testing socket-level events
 */
export const setupMockSocket = () => {
  const mockSocket = createMockSocket();
  mockWebsocketServer.getSocket.mockReturnValue(mockSocket as any);
  return mockSocket;
};

/**
 * Send multiple status messages in sequence
 */
export const sendMultipleStatusMessages = (
  statusUpdates: unknown[]
): void => {
  const messageHandler = getMessageHandler();
  act(() => {
    statusUpdates.forEach((statusData) => {
      if (messageHandler) {
        messageHandler({ type: 'llama_status', data: statusData });
      }
    });
  });
};

/**
 * Verify the hook is in its initial state
 */
export const expectInitialState = (
  result: { current: ReturnType<typeof useLlamaStatus> }
): void => {
  expect(result.current.status).toBe('initial');
  expect(result.current.models).toEqual([]);
  expect(result.current.lastError).toBeNull();
  expect(result.current.retries).toBe(0);
  expect(result.current.uptime).toBe(0);
  expect(result.current.startedAt).toBeNull();
  expect(result.current.isLoading).toBe(true);
};

/**
 * Verify that initial status request was sent
 */
export const expectInitialStatusRequest = (): void => {
  expect(mockWebsocketServer.sendMessage).toHaveBeenCalledWith('requestLlamaStatus');
};

/**
 * Verify cleanup on unmount
 */
export const expectCleanupOnUnmount = (unmount: () => void): void => {
  unmount();
  expect(mockWebsocketServer.off).toHaveBeenCalled();
};
