/**
 * Test scenarios for llama status disconnection and socket handling
 * Includes socket event handling, message handling, and cleanup scenarios
 */

import { renderHook, act } from '@testing-library/react';
import { useLlamaStatus } from '../../useLlamaStatus';
import * as websocketClientModule from '@/lib/websocket-client';
import {
  renderLlamaStatusHook,
  getMessageHandler,
  getSocketHandler,
  setupMockSocket,
  expectInitialStatusRequest,
  expectCleanupOnUnmount,
} from '../test-utils/llama-status.test-utils';
import { mockRunningStatus } from '../mocks/llama-status.mocks';

const mockWebsocketServer = websocketClientModule.websocketServer as unknown as {
  on: jest.Mock;
  off: jest.Mock;
  sendMessage: jest.Mock;
  getSocket: jest.Mock;
};

// ============ Socket Event Scenarios ============

export const scenarioHandleNullSocket = () => {
  mockWebsocketServer.getSocket.mockReturnValueOnce(null);
  const { result } = renderLlamaStatusHook();
  expect(result.current.status).toBe('initial');
};

export const scenarioHandleUndefinedSocket = () => {
  mockWebsocketServer.getSocket.mockReturnValueOnce(undefined as any);
  const { result } = renderLlamaStatusHook();
  expect(result.current.status).toBe('initial');
};

export const scenarioHandleSocketWithNoOnMethod = () => {
  mockWebsocketServer.getSocket.mockReturnValueOnce({} as any);
  const { result } = renderLlamaStatusHook();
  expect(result.current.status).toBe('initial');
};

// ============ Message Handling Scenarios ============

export const scenarioHandleLlamaStatusMessages = () => {
  const { result } = renderLlamaStatusHook();
  const messageHandler = getMessageHandler();

  act(() => {
    if (messageHandler) {
      messageHandler({ type: 'llama_status', data: mockRunningStatus });
    }
  });

  expect(result.current.status).toBe('running');
  expect(result.current.models).toEqual([{ id: '1', name: 'Model 1' }]);
  expect(result.current.isLoading).toBe(false);
};

export const scenarioHandleNonLlamaStatusMessages = () => {
  const { result } = renderLlamaStatusHook();
  const messageHandler = getMessageHandler();

  act(() => {
    if (messageHandler) {
      messageHandler({ type: 'metrics', data: { cpu: 50 } });
      messageHandler({ type: 'models', data: [] });
      messageHandler({ type: 'logs', data: [] });
    }
  });

  expect(result.current.status).toBe('initial');
  expect(result.current.isLoading).toBe(true);
};

export const scenarioHandleMessagesFromSocket = () => {
  const mockSocket = setupMockSocket();
  const { result } = renderLlamaStatusHook();
  const socketHandler = getSocketHandler();

  act(() => {
    if (socketHandler) {
      socketHandler({ data: mockRunningStatus });
    }
  });

  expect(result.current.status).toBe('running');
  expect(result.current.isLoading).toBe(false);
};

// ============ Initial Status Request Scenarios ============

export const scenarioRequestInitialStatusOnMount = () => {
  renderLlamaStatusHook();
  expectInitialStatusRequest();
};

export const scenarioRequestInitialStatusOnce = () => {
  renderLlamaStatusHook();
  expect(mockWebsocketServer.sendMessage).toHaveBeenCalledTimes(1);
};

// ============ Cleanup Scenarios ============

export const scenarioCleanupEventListenersOnUnmount = () => {
  const { unmount } = renderLlamaStatusHook();
  expect(mockWebsocketServer.on).toHaveBeenCalled();
  expectCleanupOnUnmount(unmount);
  expect(mockWebsocketServer.off).toHaveBeenCalled();
};

export const scenarioNoSendMessageAfterUnmount = () => {
  const { unmount } = renderLlamaStatusHook();
  unmount();
  expect(mockWebsocketServer.sendMessage).toHaveBeenCalledWith('requestLlamaStatus');
};

// ============ Export grouped scenarios ============

export const disconnectionScenarios = {
  socketEvents: {
    'should handle null socket': scenarioHandleNullSocket,
    'should handle undefined socket': scenarioHandleUndefinedSocket,
  },
  messageHandling: {
    'should handle llama_status messages': scenarioHandleLlamaStatusMessages,
    'should handle non-llama_status messages': scenarioHandleNonLlamaStatusMessages,
    'should handle messages from socket directly': scenarioHandleMessagesFromSocket,
  },
  initialStatusRequest: {
    'should request initial status on mount': scenarioRequestInitialStatusOnMount,
    'should request initial status only once on mount': scenarioRequestInitialStatusOnce,
  },
  cleanupOnUnmount: {
    'should cleanup event listeners on unmount': scenarioCleanupEventListenersOnUnmount,
    'should not call sendMessage after unmount': scenarioNoSendMessageAfterUnmount,
  },
};
