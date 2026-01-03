/**
 * Integration Test: Logs Flow - Store Integration
 *
 * Tests for store integration, trimming, and log ordering.
 */

import '@testing-library/jest-dom';
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

describe('Logs Integration: Store Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetLogsStore();
    mockWebsocketServer();
  });

describe('Store Integration', () => {
    it('should maintain max 100 logs in store (trimming)', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      const manyLogs = Array.from({ length: 150 }, (_, i) => ({
        level: 'info',
        message: `Log ${i}`,
        timestamp: '2024-01-01T10:00:00Z',
        source: 'application',
      }));

      emitLogsBatch(manyLogs);
      await waitForThrottle(1100);

      const storeLogs = useStore.getState().logs;
      expect(storeLogs.length).toBeLessThanOrEqual(100);
    });

    it('should prepend new logs to the beginning of the array', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      const firstBatch = [
        { level: 'info', message: 'First', timestamp: '2024-01-01T10:00:00Z', source: 'app' },
      ];

      emitLogsBatch(firstBatch);
      await waitForThrottle(1100);

      const secondBatch = [
        { level: 'info', message: 'Second', timestamp: '2024-01-01T10:01:00Z', source: 'app' },
      ];

      emitLogsBatch(secondBatch);
      await waitForThrottle(1100);

      const storeLogs = useStore.getState().logs;
      expect(storeLogs[0].message).toBe('Second');
      expect(storeLogs[1].message).toBe('First');
    });

    it('should update store with setLogs for batch updates', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      const logs = [
        { level: 'info', message: 'Batch log', timestamp: '2024-01-01T10:00:00Z', source: 'app' },
      ];

      emitLogsBatch(logs);
      await waitForThrottle(1100);

      const storeLogs = useStore.getState().logs;
      expect(storeLogs).toHaveLength(1);
      expect(storeLogs[0].message).toBe('Batch log');
    });

    it('should update store with addLog for individual logs', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      emitSingleLog({
        level: 'info',
        message: 'Single log',
        timestamp: '2024-01-01T11:00:00Z',
        source: 'application',
      });

      await waitForThrottle(600);

      const storeLogs = useStore.getState().logs;
      expect(storeLogs).toHaveLength(1);
      expect(storeLogs[0].message).toBe('Single log');
    });
  });
});
