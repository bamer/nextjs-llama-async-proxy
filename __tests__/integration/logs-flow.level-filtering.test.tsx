/**
 * Integration Test: Logs Flow - Level Filtering
 *
 * Tests for filtering logs by log level (error, warn, info, debug, all).
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

describe('Logs Integration: Level Filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetLogsStore();
    mockWebsocketServer();
  });

describe('Log Level Filtering', () => {
    it('should filter logs by error level', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      const logs = [
        { level: 'info', message: 'Info log', timestamp: '2024-01-01T10:00:00Z', source: 'app' },
        { level: 'error', message: 'Error log', timestamp: '2024-01-01T10:01:00Z', source: 'app' },
        { level: 'warn', message: 'Warn log', timestamp: '2024-01-01T10:02:00Z', source: 'app' },
      ];

      emitLogsBatch(logs);
      await waitForThrottle(1100);

      const levelSelect = screen.getByRole('combobox');
      fireEvent.change(levelSelect, { target: { value: 'error' } });

      expect(screen.getByText('Error log')).toBeInTheDocument();
      expect(screen.queryByText('Info log')).not.toBeInTheDocument();
      expect(screen.queryByText('Warn log')).not.toBeInTheDocument();
    });

    it('should filter logs by warn level', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      const logs = [
        { level: 'info', message: 'Info log', timestamp: '2024-01-01T10:00:00Z', source: 'app' },
        { level: 'error', message: 'Error log', timestamp: '2024-01-01T10:01:00Z', source: 'app' },
        { level: 'warn', message: 'Warn log', timestamp: '2024-01-01T10:02:00Z', source: 'app' },
      ];

      emitLogsBatch(logs);
      await waitForThrottle(1100);

      const levelSelect = screen.getByRole('combobox');
      fireEvent.change(levelSelect, { target: { value: 'warn' } });

      expect(screen.getByText('Warn log')).toBeInTheDocument();
      expect(screen.queryByText('Info log')).not.toBeInTheDocument();
      expect(screen.queryByText('Error log')).not.toBeInTheDocument();
    });

    it('should filter logs by info level', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      const logs = [
        { level: 'info', message: 'Info log', timestamp: '2024-01-01T10:00:00Z', source: 'app' },
        { level: 'error', message: 'Error log', timestamp: '2024-01-01T10:01:00Z', source: 'app' },
        { level: 'warn', message: 'Warn log', timestamp: '2024-01-01T10:02:00Z', source: 'app' },
      ];

      emitLogsBatch(logs);
      await waitForThrottle(1100);

      const levelSelect = screen.getByRole('combobox');
      fireEvent.change(levelSelect, { target: { value: 'info' } });

      expect(screen.getByText('Info log')).toBeInTheDocument();
      expect(screen.queryByText('Error log')).not.toBeInTheDocument();
      expect(screen.queryByText('Warn log')).not.toBeInTheDocument();
    });

    it('should filter logs by debug level', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      const logs = [
        { level: 'info', message: 'Info log', timestamp: '2024-01-01T10:00:00Z', source: 'app' },
        { level: 'debug', message: 'Debug log', timestamp: '2024-01-01T10:01:00Z', source: 'app' },
        { level: 'warn', message: 'Warn log', timestamp: '2024-01-01T10:02:00Z', source: 'app' },
      ];

      emitLogsBatch(logs);
      await waitForThrottle(1100);

      const levelSelect = screen.getByRole('combobox');
      fireEvent.change(levelSelect, { target: { value: 'debug' } });

      expect(screen.getByText('Debug log')).toBeInTheDocument();
      expect(screen.queryByText('Info log')).not.toBeInTheDocument();
      expect(screen.queryByText('Warn log')).not.toBeInTheDocument();
    });

    it('should display all logs when "All Levels" is selected', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      const logs = [
        { level: 'info', message: 'Info log', timestamp: '2024-01-01T10:00:00Z', source: 'app' },
        { level: 'error', message: 'Error log', timestamp: '2024-01-01T10:01:00Z', source: 'app' },
        { level: 'warn', message: 'Warn log', timestamp: '2024-01-01T10:02:00Z', source: 'app' },
        { level: 'debug', message: 'Debug log', timestamp: '2024-01-01T10:03:00Z', source: 'app' },
      ];

      emitLogsBatch(logs);
      await waitForThrottle(1100);

      expect(screen.getByText('Info log')).toBeInTheDocument();
      expect(screen.getByText('Error log')).toBeInTheDocument();
      expect(screen.getByText('Warn log')).toBeInTheDocument();
      expect(screen.getByText('Debug log')).toBeInTheDocument();
    });
  });
});
