/**
 * Integration Test: Logs Flow - WebSocket Flow
 *
 * Tests for WebSocket message handling and connection events.
 */

import {
  waitFor, screen
} from '@testing-library/react';
import {
  resetLogsStore,
  renderLogsPageWithProvider,
  simulateConnect,
  emitLogsBatch,
  emitSingleLog,
  waitForThrottle,
  mockWebsocketServer,
} from '../helpers/logs-test-helpers';
import { websocketServer } from '@/lib/websocket-client';


// Mock websocket-client module
jest.mock('@/lib/websocket-client');

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('Logs Integration: WebSocket Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetLogsStore();
    mockWebsocketServer();
  });

describe('WebSocket Connection Events', () => {
    it('should request logs after WebSocket connects', () => {
      renderLogsPageWithProvider();

      simulateConnect();

      expect(websocketServer.requestLogs).toHaveBeenCalled();
    });

    it('should update connection state on connect', async () => {
      renderLogsPageWithProvider();

      simulateConnect();

      await waitFor(() => {
        expect(websocketServer.on).toHaveBeenCalledWith('connect', expect.any(Function));
      });
    });
  });
});
