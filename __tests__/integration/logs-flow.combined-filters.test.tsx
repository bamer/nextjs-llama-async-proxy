/**
 * Integration Test: Logs Flow - Combined Filters
 *
 * Tests for combining level and text filters, and filter reset behavior.
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

describe('Logs Integration: Combined Filters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetLogsStore();
    mockWebsocketServer();
  });

describe('Combined Filter Operations', () => {
    it('should filter by level and text simultaneously', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      const logs = [
        { level: 'info', message: 'Connection established', timestamp: '2024-01-01T10:00:00Z', source: 'network' },
        { level: 'error', message: 'Connection failed', timestamp: '2024-01-01T10:01:00Z', source: 'network' },
        { level: 'info', message: 'User logged in', timestamp: '2024-01-01T10:02:00Z', source: 'auth' },
        { level: 'error', message: 'Authentication failed', timestamp: '2024-01-01T10:03:00Z', source: 'auth' },
      ];

      emitLogsBatch(logs);
      await waitForThrottle(1100);

      const levelSelect = screen.getByRole('combobox');
      fireEvent.change(levelSelect, { target: { value: 'error' } });

      const filterInput = screen.getByPlaceholderText('Filter logs...');
      fireEvent.change(filterInput, { target: { value: 'connection' } });

      expect(screen.getByText('Connection failed')).toBeInTheDocument();
      expect(screen.queryByText('Connection established')).not.toBeInTheDocument();
      expect(screen.queryByText('Authentication failed')).not.toBeInTheDocument();
    });

    it('should reset filters when switching levels', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      const logs = [
        { level: 'info', message: 'Info log', timestamp: '2024-01-01T10:00:00Z', source: 'app' },
        { level: 'error', message: 'Error log', timestamp: '2024-01-01T10:01:00Z', source: 'app' },
      ];

      emitLogsBatch(logs);
      await waitForThrottle(1100);

      const filterInput = screen.getByPlaceholderText('Filter logs...');
      fireEvent.change(filterInput, { target: { value: 'error' } });

      expect(screen.getByText('Error log')).toBeInTheDocument();
      expect(screen.queryByText('Info log')).not.toBeInTheDocument();

      const levelSelect = screen.getByRole('combobox');
      fireEvent.change(levelSelect, { target: { value: 'all' } });

      expect(screen.getByText('Error log')).toBeInTheDocument();
      expect(screen.queryByText('Info log')).not.toBeInTheDocument();
    });
  });
});
