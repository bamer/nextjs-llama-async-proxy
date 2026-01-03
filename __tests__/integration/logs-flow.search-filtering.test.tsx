/**
 * Integration Test: Logs Flow - Search Filtering
 *
 * Tests for filtering logs by text search (case-insensitive, source field).
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


// Mock websocket-client module
jest.mock('@/lib/websocket-client');

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('Logs Integration: Search Filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetLogsStore();
    mockWebsocketServer();
  });

describe('Search/Text Filtering', () => {
    it('should filter logs by text search', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      const logs = [
        { level: 'info', message: 'Application started successfully', timestamp: '2024-01-01T10:00:00Z', source: 'app' },
        { level: 'error', message: 'Database connection failed', timestamp: '2024-01-01T10:01:00Z', source: 'app' },
        { level: 'info', message: 'User logged in', timestamp: '2024-01-01T10:02:00Z', source: 'app' },
      ];

      emitLogsBatch(logs);
      await waitForThrottle(1100);

      const filterInput = screen.getByPlaceholderText('Filter logs...');
      fireEvent.change(filterInput, { target: { value: 'connection' } });

      expect(screen.getByText('Database connection failed')).toBeInTheDocument();
      expect(screen.queryByText('Application started successfully')).not.toBeInTheDocument();
      expect(screen.queryByText('User logged in')).not.toBeInTheDocument();
    });

    it('should perform case-insensitive search', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      const logs = [
        { level: 'info', message: 'Application STARTED', timestamp: '2024-01-01T10:00:00Z', source: 'app' },
      ];

      emitLogsBatch(logs);
      await waitForThrottle(1100);

      const filterInput = screen.getByPlaceholderText('Filter logs...');
      fireEvent.change(filterInput, { target: { value: 'started' } });

      expect(screen.getByText('Application STARTED')).toBeInTheDocument();
    });

    it('should filter by source field', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      const logs = [
        { level: 'info', message: 'Log 1', timestamp: '2024-01-01T10:00:00Z', source: 'network' },
        { level: 'info', message: 'Log 2', timestamp: '2024-01-01T10:01:00Z', source: 'database' },
        { level: 'info', message: 'Log 3', timestamp: '2024-01-01T10:02:00Z', source: 'network' },
      ];

      emitLogsBatch(logs);
      await waitForThrottle(1100);

      const filterInput = screen.getByPlaceholderText('Filter logs...');
      fireEvent.change(filterInput, { target: { value: 'network' } });

      expect(screen.getByText('Log 1')).toBeInTheDocument();
      expect(screen.getByText('Log 3')).toBeInTheDocument();
      expect(screen.queryByText('Log 2')).not.toBeInTheDocument();
    });
  });
});
