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
 * Log entry type for test data
 */
export interface TestLogEntry {
  level: string;
  message: string;
  timestamp: string;
  source?: string;
}

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
    <WebSocketProvider>
      <LogsPage />
    </WebSocketProvider>
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
export const emitLogsBatch = (logs: TestLogEntry[]): void => {
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
export const emitSingleLog = (log: TestLogEntry): void => {
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
 * Mock websocketServer methods for tests
 */
export const mockWebsocketServer = (): void => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ws = websocketServer as any;
  ws.connect = jest.fn();
  ws.disconnect = jest.fn();
  ws.sendMessage = jest.fn();
  ws.requestMetrics = jest.fn();
  ws.requestLogs = jest.fn();
  ws.requestModels = jest.fn();
  ws.startModel = jest.fn();
  ws.stopModel = jest.fn();
  ws.on = jest.fn();
  ws.off = jest.fn();
  ws.getSocketId = jest.fn(() => 'test-socket-123');
};
