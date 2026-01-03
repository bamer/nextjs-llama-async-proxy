/**
 * Test Helpers for Logs Integration Tests
 *
 * This file contains shared helper functions used across
 * multiple logs flow integration test files.
 */

import React from 'react';
import { act, render } from '@testing-library/react';
import { WebSocketProvider } from '@/providers/websocket-provider';
import { useStore } from '@/lib/store';
import LogsPage from '@/components/pages/LogsPage';
import { websocketServer } from '@/lib/websocket-client';

/**
 * Reset store to initial state
 */
export const resetLogsStore = (): void => {
  useStore.getState().clearLogs();
};

/**
 * Render LogsPage wrapped in WebSocketProvider
 */
export const renderLogsPageWithProvider = () => {
  return render(
    React.createElement(
      WebSocketProvider,
      null,
      React.createElement(LogsPage)
    )
  );
};

/**
 * Simulate WebSocket 'connect' event
 */
export const simulateConnect = (): void => {
  const connectHandler = (websocketServer.on as jest.Mock).mock.calls.find(
    (call) => call[0] === 'connect'
  )?.[1];

  if (connectHandler) {
    act(() => {
      connectHandler();
    });
  }
};

/**
 * Emit a logs batch message from WebSocket
 */
export const emitLogsBatch = (logs: any[]): void => {
  const messageHandler = (websocketServer.on as jest.Mock).mock.calls.find(
    (call) => call[0] === 'message'
  )?.[1];

  if (messageHandler) {
    act(() => {
      messageHandler({
        type: 'logs',
        data: logs,
      });
    });
  }
};

/**
 * Emit a single log message from WebSocket
 */
export const emitSingleLog = (log: any): void => {
  const messageHandler = (websocketServer.on as jest.Mock).mock.calls.find(
    (call) => call[0] === 'message'
  )?.[1];

  if (messageHandler) {
    act(() => {
      messageHandler({
        type: 'log',
        data: log,
      });
    });
  }
};

/**
 * Wait for throttle timeout (default 1100ms for batch, 600ms for single)
 */
export const waitForThrottle = async (ms: number = 1100): Promise<void> => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

/**
 * Mock websocket server
 */
export const mockWebsocketServer = (): void => {
  // Websocket server is mocked at the top level of test files
  // This is just a placeholder helper
};
