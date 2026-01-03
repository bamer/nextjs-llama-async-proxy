/**
 * Integration Test: Logs Flow - Pagination
 *
 * Tests for pagination, max lines limits, and clear logs functionality.
 */

import {
  screen, fireEvent
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
import { useStore } from '@/lib/store';


// Mock websocket-client module
jest.mock('@/lib/websocket-client');

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('Logs Integration: Pagination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetLogsStore();
    mockWebsocketServer();
  });

describe('Pagination/Max Lines', () => {
    it('should limit displayed logs to maxLines (50 default)', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      const manyLogs = Array.from({ length: 100 }, (_, i) => ({
        level: 'info',
        message: `Log message ${i}`,
        timestamp: '2024-01-01T10:00:00Z',
        source: 'application',
      }));

      emitLogsBatch(manyLogs);
      await waitForThrottle(1100);

      const logEntries = screen.getAllByText(/Log message/);
      expect(logEntries.length).toBeLessThanOrEqual(50);
    });

    it('should change max lines to 100', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      const logs = Array.from({ length: 75 }, (_, i) => ({
        level: 'info',
        message: `Log ${i}`,
        timestamp: '2024-01-01T10:00:00Z',
        source: 'application',
      }));

      emitLogsBatch(logs);
      await waitForThrottle(1100);

      expect(screen.getAllByText(/Log \d+/).length).toBe(50);

      fireEvent.click(screen.getByText('100'));

      expect(screen.getAllByText(/Log \d+/).length).toBe(75);
    });

    it('should change max lines to 200', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      const logs = Array.from({ length: 75 }, (_, i) => ({
        level: 'info',
        message: `Log ${i}`,
        timestamp: '2024-01-01T10:00:00Z',
        source: 'application',
      }));

      emitLogsBatch(logs);
      await waitForThrottle(1100);

      expect(screen.getAllByText(/Log \d+/).length).toBe(50);

      fireEvent.click(screen.getByText('200'));

      expect(screen.getAllByText(/Log \d+/).length).toBe(75);
    });
  });

  describe('Clear Logs', () => {
    it('should clear all logs from store and UI', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      const logs = [
        { level: 'info', message: 'Log 1', timestamp: '2024-01-01T10:00:00Z', source: 'app' },
        { level: 'error', message: 'Log 2', timestamp: '2024-01-01T10:01:00Z', source: 'app' },
      ];

      emitLogsBatch(logs);
      await waitForThrottle(1100);

      expect(screen.getByText('Log 1')).toBeInTheDocument();
      expect(screen.getByText('Log 2')).toBeInTheDocument();

      const clearButton = screen.getByText('Clear Logs');
      fireEvent.click(clearButton);

      expect(screen.queryByText('Log 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Log 2')).not.toBeInTheDocument();

      const storeLogs = useStore.getState().logs;
      expect(storeLogs).toHaveLength(0);
    });
  });
});
