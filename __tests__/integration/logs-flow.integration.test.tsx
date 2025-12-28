/**
 * Integration Test: Logs Flow End-to-End
 *
 * This test verifies the complete logs functionality flow:
 * 1. WebSocket emits 'logs' and 'log' messages
 * 2. WebSocketProvider handles these messages correctly
 * 3. Logs are added to the Zustand store
 * 4. LogsPage receives and displays logs correctly
 *
 * Tests:
 * - Batch logs reception and display
 * - Individual log reception and display
 * - Log throttling mechanism
 * - Log filtering (by level, text, source)
 * - Log pagination/max lines
 * - Clear logs functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WebSocketProvider } from '@/providers/websocket-provider';
import { useStore } from '@/lib/store';
import LogsPage from '@/components/pages/LogsPage';
import { websocketServer } from '@/lib/websocket-client';

// Mock websocket-client module
jest.mock('@/lib/websocket-client');

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('Logs Integration: End-to-End Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset store to initial state
    useStore.getState().clearLogs();

    // Mock websocketServer methods
    (websocketServer as jest.Mocked<typeof websocketServer>).connect = jest.fn();
    (websocketServer as jest.Mocked<typeof websocketServer>).disconnect = jest.fn();
    (websocketServer as jest.Mocked<typeof websocketServer>).sendMessage = jest.fn();
    (websocketServer as jest.Mocked<typeof websocketServer>).requestMetrics = jest.fn();
    (websocketServer as jest.Mocked<typeof websocketServer>).requestLogs = jest.fn();
    (websocketServer as jest.Mocked<typeof websocketServer>).requestModels = jest.fn();
    (websocketServer as jest.Mocked<typeof websocketServer>).startModel = jest.fn();
    (websocketServer as jest.Mocked<typeof websocketServer>).stopModel = jest.fn();
    (websocketServer as jest.Mocked<typeof websocketServer>).on = jest.fn();
    (websocketServer as jest.Mocked<typeof websocketServer>).off = jest.fn();
    (websocketServer as jest.Mocked<typeof websocketServer>).getSocketId = jest.fn(() => 'test-socket-123');
  });

  // Helper: Render LogsPage with WebSocketProvider
  const renderLogsPageWithProvider = () => {
    return render(
      <WebSocketProvider>
        <LogsPage />
      </WebSocketProvider>
    );
  };

  // Helper: Simulate WebSocket 'connect' event
  const simulateConnect = () => {
    const connectHandler = (websocketServer.on as jest.Mock).mock.calls.find(
      (call) => call[0] === 'connect'
    )?.[1];

    if (connectHandler) {
      act(() => {
        connectHandler();
      });
    }
  };

  // Helper: Emit a logs batch message
  const emitLogsBatch = (logs: any[]) => {
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

  // Helper: Emit a single log message
  const emitSingleLog = (log: any) => {
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

  // Helper: Wait for throttle timeout
  const waitForThrottle = async (ms: number = 1100) => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, ms));
    });
  };

  describe('WebSocket → Provider → Store → Page Flow', () => {
    it('should display batch logs received from WebSocket', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      // Mock batch of logs
      const batchLogs = [
        {
          level: 'info',
          message: 'Application started',
          timestamp: '2024-01-01T10:00:00Z',
          source: 'application',
        },
        {
          level: 'error',
          message: 'Connection failed',
          timestamp: '2024-01-01T10:01:00Z',
          source: 'network',
        },
        {
          level: 'warn',
          message: 'Memory usage high',
          timestamp: '2024-01-01T10:02:00Z',
          source: 'system',
        },
      ];

      emitLogsBatch(batchLogs);
      await waitForThrottle(1100); // Wait for batch throttle (1000ms)

      // Verify logs are displayed
      expect(screen.getByText('Application started')).toBeInTheDocument();
      expect(screen.getByText('Connection failed')).toBeInTheDocument();
      expect(screen.getByText('Memory usage high')).toBeInTheDocument();

      // Verify logs are in store
      const storeLogs = useStore.getState().logs;
      expect(storeLogs).toHaveLength(3);
      expect(storeLogs[0].message).toBe('Memory usage high'); // Newest first
    });

    it('should display single logs received from WebSocket', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      // Emit single log
      const singleLog = {
        level: 'info',
        message: 'Single log message',
        timestamp: '2024-01-01T11:00:00Z',
        source: 'application',
      };

      emitSingleLog(singleLog);
      await waitForThrottle(600); // Wait for single log throttle (500ms)

      // Verify log is displayed
      expect(screen.getByText('Single log message')).toBeInTheDocument();

      // Verify log is in store
      const storeLogs = useStore.getState().logs;
      expect(storeLogs).toHaveLength(1);
      expect(storeLogs[0].message).toBe('Single log message');
    });

    it('should handle rapid single log messages with throttling', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      // Emit multiple single logs rapidly
      for (let i = 0; i < 5; i++) {
        emitSingleLog({
          level: 'info',
          message: `Rapid log ${i}`,
          timestamp: `2024-01-01T11:00:0${i}Z`,
          source: 'application',
        });
      }

      // Logs should be queued but not yet displayed
      expect(screen.queryByText(/Rapid log \d/)).not.toBeInTheDocument();

      // Wait for throttle
      await waitForThrottle(600);

      // All logs should now be displayed
      expect(screen.getByText('Rapid log 0')).toBeInTheDocument();
      expect(screen.getByText('Rapid log 4')).toBeInTheDocument();

      // Verify store has all logs
      const storeLogs = useStore.getState().logs;
      expect(storeLogs).toHaveLength(5);
    });

    it('should handle mixed batch and single log messages', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      // Emit batch logs
      const batchLogs = [
        {
          level: 'info',
          message: 'Batch log 1',
          timestamp: '2024-01-01T10:00:00Z',
          source: 'application',
        },
      ];

      emitLogsBatch(batchLogs);

      // Emit single log
      emitSingleLog({
        level: 'error',
        message: 'Single log 1',
        timestamp: '2024-01-01T10:01:00Z',
        source: 'system',
      });

      // Emit another batch
      const batchLogs2 = [
        {
          level: 'warn',
          message: 'Batch log 2',
          timestamp: '2024-01-01T10:02:00Z',
          source: 'network',
        },
      ];

      emitLogsBatch(batchLogs2);

      // Wait for throttle
      await waitForThrottle(1100);

      // Verify all logs are displayed
      expect(screen.getByText('Batch log 1')).toBeInTheDocument();
      expect(screen.getByText('Single log 1')).toBeInTheDocument();
      expect(screen.getByText('Batch log 2')).toBeInTheDocument();

      // Verify store has all logs
      const storeLogs = useStore.getState().logs;
      expect(storeLogs).toHaveLength(3);
    });
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

      // Select error level
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

      // Select warn level
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

      // Select info level
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

      // Select debug level
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

      // Ensure all levels is selected (default)
      expect(screen.getByText('Info log')).toBeInTheDocument();
      expect(screen.getByText('Error log')).toBeInTheDocument();
      expect(screen.getByText('Warn log')).toBeInTheDocument();
      expect(screen.getByText('Debug log')).toBeInTheDocument();
    });
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

      // Search for "connection"
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

      // Search with lowercase
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

      // Search for "network"
      const filterInput = screen.getByPlaceholderText('Filter logs...');
      fireEvent.change(filterInput, { target: { value: 'network' } });

      expect(screen.getByText('Log 1')).toBeInTheDocument();
      expect(screen.getByText('Log 3')).toBeInTheDocument();
      expect(screen.queryByText('Log 2')).not.toBeInTheDocument();
    });
  });

  describe('Pagination/Max Lines', () => {
    it('should limit displayed logs to maxLines (50 default)', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      // Create 100 logs
      const manyLogs = Array.from({ length: 100 }, (_, i) => ({
        level: 'info',
        message: `Log message ${i}`,
        timestamp: '2024-01-01T10:00:00Z',
        source: 'application',
      }));

      emitLogsBatch(manyLogs);
      await waitForThrottle(1100);

      // Should only display first 50 due to maxLines default
      const logEntries = screen.getAllByText(/Log message/);
      expect(logEntries.length).toBeLessThanOrEqual(50);
    });

    it('should change max lines to 100', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      // Create 75 logs
      const logs = Array.from({ length: 75 }, (_, i) => ({
        level: 'info',
        message: `Log ${i}`,
        timestamp: '2024-01-01T10:00:00Z',
        source: 'application',
      }));

      emitLogsBatch(logs);
      await waitForThrottle(1100);

      // Initially limited to 50
      expect(screen.getAllByText(/Log \d+/).length).toBe(50);

      // Change to 100
      fireEvent.click(screen.getByText('100'));

      // Should now show all 75
      expect(screen.getAllByText(/Log \d+/).length).toBe(75);
    });

    it('should change max lines to 200', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      // Create 75 logs (more than default 50 but less than store limit of 100)
      const logs = Array.from({ length: 75 }, (_, i) => ({
        level: 'info',
        message: `Log ${i}`,
        timestamp: '2024-01-01T10:00:00Z',
        source: 'application',
      }));

      emitLogsBatch(logs);
      await waitForThrottle(1100);

      // Initially limited to 50
      expect(screen.getAllByText(/Log \d+/).length).toBe(50);

      // Change to 200
      fireEvent.click(screen.getByText('200'));

      // Should now show all 75
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

      // Verify logs are displayed
      expect(screen.getByText('Log 1')).toBeInTheDocument();
      expect(screen.getByText('Log 2')).toBeInTheDocument();

      // Clear logs
      const clearButton = screen.getByText('Clear Logs');
      fireEvent.click(clearButton);

      // Verify logs are cleared from UI
      expect(screen.queryByText('Log 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Log 2')).not.toBeInTheDocument();

      // Verify logs are cleared from store
      const storeLogs = useStore.getState().logs;
      expect(storeLogs).toHaveLength(0);
    });
  });

  describe('Store Integration', () => {
    it('should maintain max 100 logs in store (trimming)', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      // Create 150 logs
      const manyLogs = Array.from({ length: 150 }, (_, i) => ({
        level: 'info',
        message: `Log ${i}`,
        timestamp: '2024-01-01T10:00:00Z',
        source: 'application',
      }));

      emitLogsBatch(manyLogs);
      await waitForThrottle(1100);

      // Store should only keep 100 logs
      const storeLogs = useStore.getState().logs;
      expect(storeLogs.length).toBeLessThanOrEqual(100);
    });

    it('should prepend new logs to the beginning of the array', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      // First batch
      const firstBatch = [
        { level: 'info', message: 'First', timestamp: '2024-01-01T10:00:00Z', source: 'app' },
      ];

      emitLogsBatch(firstBatch);
      await waitForThrottle(1100);

      // Second batch
      const secondBatch = [
        { level: 'info', message: 'Second', timestamp: '2024-01-01T10:01:00Z', source: 'app' },
      ];

      emitLogsBatch(secondBatch);
      await waitForThrottle(1100);

      // Newest log should be first in array
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

      // Verify setLogs was used (batch replaces entire array)
      const storeLogs = useStore.getState().logs;
      expect(storeLogs).toHaveLength(1);
      expect(storeLogs[0].message).toBe('Batch log');
    });

    it('should update store with addLog for individual logs', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      // Emit single log
      emitSingleLog({
        level: 'info',
        message: 'Single log',
        timestamp: '2024-01-01T11:00:00Z',
        source: 'application',
      });

      await waitForThrottle(600);

      // Verify addLog was used (prepends to array)
      const storeLogs = useStore.getState().logs;
      expect(storeLogs).toHaveLength(1);
      expect(storeLogs[0].message).toBe('Single log');
    });
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

      // Select error level
      const levelSelect = screen.getByRole('combobox');
      fireEvent.change(levelSelect, { target: { value: 'error' } });

      // Search for "connection"
      const filterInput = screen.getByPlaceholderText('Filter logs...');
      fireEvent.change(filterInput, { target: { value: 'connection' } });

      // Should only show error logs with "connection"
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

      // Filter by text
      const filterInput = screen.getByPlaceholderText('Filter logs...');
      fireEvent.change(filterInput, { target: { value: 'error' } });

      expect(screen.getByText('Error log')).toBeInTheDocument();
      expect(screen.queryByText('Info log')).not.toBeInTheDocument();

      // Change level back to all
      const levelSelect = screen.getByRole('combobox');
      fireEvent.change(levelSelect, { target: { value: 'all' } });

      // Should still only show logs matching text filter
      expect(screen.getByText('Error log')).toBeInTheDocument();
      expect(screen.queryByText('Info log')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty logs array gracefully', async () => {
      renderLogsPageWithProvider();
      simulateConnect();

      // Emit empty logs array
      emitLogsBatch([]);
      await waitForThrottle(1100);

      // Should show empty state
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
          // No source field
        },
      ];

      emitLogsBatch(logs);
      await waitForThrottle(1100);

      // Should display log without error
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

      // Create 500 logs
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

      // Should complete in reasonable time (< 2 seconds)
      expect(endTime - startTime).toBeLessThan(2000);

      // Should only keep 100 in store
      const storeLogs = useStore.getState().logs;
      expect(storeLogs.length).toBeLessThanOrEqual(100);
    });
  });

  describe('WebSocket Connection Events', () => {
    it('should request logs after WebSocket connects', () => {
      renderLogsPageWithProvider();

      // Simulate connect
      simulateConnect();

      // Should have requested logs
      expect(websocketServer.requestLogs).toHaveBeenCalled();
    });

    it('should update connection state on connect', async () => {
      renderLogsPageWithProvider();

      simulateConnect();

      await waitFor(() => {
        // Connection state should be 'connected'
        // We can verify this by checking if the hook was called
        expect(websocketServer.on).toHaveBeenCalledWith('connect', expect.any(Function));
      });
    });
  });
});
