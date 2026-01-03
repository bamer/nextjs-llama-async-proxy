/**
 * Integration Test: Logs Flow - Edge Cases
 *
 * Tests for edge cases including empty logs, unicode, performance, and more.
 */

import {
  screen
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

describe('Logs Integration: Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetLogsStore();
    mockWebsocketServer();
  });

describe('Edge Cases', () => {
    it('should handle empty logs array gracefully', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      emitLogsBatch([]);
      await waitForThrottle(1100);

      expect(screen.getByText('No logs available')).toBeInTheDocument();
    });

    it('should handle logs with missing optional fields', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      const logs = [
        {
          level: 'info',
          message: 'Log without optional fields',
          timestamp: '2024-01-01T10:00:00Z',
        },
      ];

      emitLogsBatch(logs);
      await waitForThrottle(1100);

      expect(screen.getByText('Log without optional fields')).toBeInTheDocument();
    });

    it('should handle log with unicode characters', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      const logs = [
        {
          level: 'info',
          message: 'Unicode: 你好世界 🌍 مرحبا 😊',
          timestamp: '2024-01-01T10:00:00Z',
          source: 'application',
        },
      ];

      emitLogsBatch(logs);
      await waitForThrottle(1100);

      expect(screen.getByText(/Unicode: 你好世界/)).toBeInTheDocument();
    });

    it('should handle large number of logs without performance issues', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      const manyLogs = Array.from({ length: 500 }, (_, i) => ({
        level: 'info',
        message: `Performance test log ${i}`,
        timestamp: '2024-01-01T10:00:00Z',
        source: 'application',
      }));

      const startTime = performance.now();
      emitLogsBatch(manyLogs);
      await waitForThrottle(1100);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(2000);

      const storeLogs = useStore.getState().logs;
      expect(storeLogs.length).toBeLessThanOrEqual(100);
    });
  });
});
