/**
 * Tests for Logs Page fixes:
 * 1. Unique React keys (no duplicates)
 * 2. Log level filtering works correctly
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LogsPage from '../../../app/logs/page';
import { useStore } from '@/lib/store';

// Mock the MainLayout component
jest.mock('@/components/layout/main-layout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="main-layout">{children}</div>,
}));

// Mock useWebSocket
jest.mock('@/hooks/use-websocket', () => ({
  useWebSocket: () => ({
    requestLogs: jest.fn(),
    isConnected: true,
  }),
}));

// Mock useTheme
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ isDark: false }),
}));

describe('LogsPage - Fixed Issues', () => {
  beforeEach(() => {
    // Clear logs before each test
    useStore.getState().clearLogs();
  });

  describe('Issue 1: Duplicate React Keys', () => {
    it('should render logs with unique keys even when IDs are similar', () => {
      // Add logs with similar timestamps that might cause duplicate IDs
      const logs = [
        {
          id: '1766830622044-v42cdy2as',
          level: 'info' as const,
          message: 'Test message 1',
          timestamp: '2025-12-27T10:00:00.000Z',
          context: { source: 'test' },
        },
        {
          id: '1766830622044-v42cdy2as', // Same ID (simulating duplicate)
          level: 'error' as const,
          message: 'Test message 2',
          timestamp: '2025-12-27T10:00:00.001Z',
          context: { source: 'test' },
        },
        {
          id: '1766830622044-v42cdy2as', // Same ID again
          level: 'debug' as const,
          message: 'Test message 3',
          timestamp: '2025-12-27T10:00:00.002Z',
          context: { source: 'test' },
        },
      ];

      useStore.getState().setLogs(logs);

      // This should not throw a React key error
      expect(() => {
        render(<LogsPage />);
      }).not.toThrow();

      // Verify all logs are rendered
      expect(screen.getByText('Test message 1')).toBeInTheDocument();
      expect(screen.getByText('Test message 2')).toBeInTheDocument();
      expect(screen.getByText('Test message 3')).toBeInTheDocument();
    });

    it('should generate unique keys using index fallback', () => {
      const logs = [
        {
          id: 'duplicate-id',
          level: 'info' as const,
          message: 'Log 1',
          timestamp: '2025-12-27T10:00:00.000Z',
          context: { source: 'test' },
        },
        {
          id: 'duplicate-id', // Same ID
          level: 'error' as const,
          message: 'Log 2',
          timestamp: '2025-12-27T10:00:01.000Z',
          context: { source: 'test' },
        },
      ];

      useStore.getState().setLogs(logs);

      render(<LogsPage />);

      // Both logs should be visible despite duplicate IDs
      expect(screen.getByText('Log 1')).toBeInTheDocument();
      expect(screen.getByText('Log 2')).toBeInTheDocument();
    });
  });

  describe('Issue 2: Empty Logs on Filter Selection', () => {
    it('should show all logs when "All Levels" is selected', () => {
      const logs = [
        {
          id: '1',
          level: 'info' as const,
          message: 'Info message',
          timestamp: '2025-12-27T10:00:00.000Z',
          context: { source: 'test' },
        },
        {
          id: '2',
          level: 'error' as const,
          message: 'Error message',
          timestamp: '2025-12-27T10:00:01.000Z',
          context: { source: 'test' },
        },
        {
          id: '3',
          level: 'debug' as const,
          message: 'Debug message',
          timestamp: '2025-12-27T10:00:02.000Z',
          context: { source: 'test' },
        },
        {
          id: '4',
          level: 'warn' as const,
          message: 'Warning message',
          timestamp: '2025-12-27T10:00:03.000Z',
          context: { source: 'test' },
        },
      ];

      useStore.getState().setLogs(logs);
      render(<LogsPage />);

      // All logs should be visible initially
      expect(screen.getByText('Info message')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByText('Debug message')).toBeInTheDocument();
      expect(screen.getByText('Warning message')).toBeInTheDocument();
    });

    it('should show only error logs when "Error Only" is selected', async () => {
      const logs = [
        {
          id: '1',
          level: 'info' as const,
          message: 'Info message',
          timestamp: '2025-12-27T10:00:00.000Z',
          context: { source: 'test' },
        },
        {
          id: '2',
          level: 'error' as const,
          message: 'Error message',
          timestamp: '2025-12-27T10:00:01.000Z',
          context: { source: 'test' },
        },
        {
          id: '3',
          level: 'debug' as const,
          message: 'Debug message',
          timestamp: '2025-12-27T10:00:02.000Z',
          context: { source: 'test' },
        },
      ];

      useStore.getState().setLogs(logs);
      render(<LogsPage />);

      // Select "Error Only" filter
      const filterSelect = screen.getByRole('combobox');
      fireEvent.mouseDown(filterSelect);

      await waitFor(() => {
        const errorOption = screen.getByText('Error Only');
        fireEvent.click(errorOption);
      });

      // Only error logs should be visible
      await waitFor(() => {
        expect(screen.getByText('Error message')).toBeInTheDocument();
        expect(screen.queryByText('Info message')).not.toBeInTheDocument();
        expect(screen.queryByText('Debug message')).not.toBeInTheDocument();
      });
    });

    it('should show both error and info logs when "Error & Info" is selected', async () => {
      const logs = [
        {
          id: '1',
          level: 'info' as const,
          message: 'Info message',
          timestamp: '2025-12-27T10:00:00.000Z',
          context: { source: 'test' },
        },
        {
          id: '2',
          level: 'error' as const,
          message: 'Error message',
          timestamp: '2025-12-27T10:00:01.000Z',
          context: { source: 'test' },
        },
        {
          id: '3',
          level: 'debug' as const,
          message: 'Debug message',
          timestamp: '2025-12-27T10:00:02.000Z',
          context: { source: 'test' },
        },
      ];

      useStore.getState().setLogs(logs);
      render(<LogsPage />);

      // Select "Error & Info" filter
      const filterSelect = screen.getByRole('combobox');
      fireEvent.mouseDown(filterSelect);

      await waitFor(() => {
        const errorInfoOption = screen.getByText('Error & Info');
        fireEvent.click(errorInfoOption);
      });

      // Both error and info logs should be visible, debug should not
      await waitFor(() => {
        expect(screen.getByText('Error message')).toBeInTheDocument();
        expect(screen.getByText('Info message')).toBeInTheDocument();
        expect(screen.queryByText('Debug message')).not.toBeInTheDocument();
      });
    });

    it('should show only warn logs when "Warn Only" is selected', async () => {
      const logs = [
        {
          id: '1',
          level: 'info' as const,
          message: 'Info message',
          timestamp: '2025-12-27T10:00:00.000Z',
          context: { source: 'test' },
        },
        {
          id: '2',
          level: 'error' as const,
          message: 'Error message',
          timestamp: '2025-12-27T10:00:01.000Z',
          context: { source: 'test' },
        },
        {
          id: '3',
          level: 'warn' as const,
          message: 'Warning message',
          timestamp: '2025-12-27T10:00:02.000Z',
          context: { source: 'test' },
        },
      ];

      useStore.getState().setLogs(logs);
      render(<LogsPage />);

      // Select "Warn Only" filter
      const filterSelect = screen.getByRole('combobox');
      fireEvent.mouseDown(filterSelect);

      await waitFor(() => {
        const warnOption = screen.getByText('Warn Only');
        fireEvent.click(warnOption);
      });

      // Only warn logs should be visible
      await waitFor(() => {
        expect(screen.getByText('Warning message')).toBeInTheDocument();
        expect(screen.queryByText('Info message')).not.toBeInTheDocument();
        expect(screen.queryByText('Error message')).not.toBeInTheDocument();
      });
    });

    it('should show only debug logs when "Debug Only" is selected', async () => {
      const logs = [
        {
          id: '1',
          level: 'info' as const,
          message: 'Info message',
          timestamp: '2025-12-27T10:00:00.000Z',
          context: { source: 'test' },
        },
        {
          id: '2',
          level: 'error' as const,
          message: 'Error message',
          timestamp: '2025-12-27T10:00:01.000Z',
          context: { source: 'test' },
        },
        {
          id: '3',
          level: 'debug' as const,
          message: 'Debug message',
          timestamp: '2025-12-27T10:00:02.000Z',
          context: { source: 'test' },
        },
      ];

      useStore.getState().setLogs(logs);
      render(<LogsPage />);

      // Select "Debug Only" filter
      const filterSelect = screen.getByRole('combobox');
      fireEvent.mouseDown(filterSelect);

      await waitFor(() => {
        const debugOption = screen.getByText('Debug Only');
        fireEvent.click(debugOption);
      });

      // Only debug logs should be visible
      await waitFor(() => {
        expect(screen.getByText('Debug message')).toBeInTheDocument();
        expect(screen.queryByText('Info message')).not.toBeInTheDocument();
        expect(screen.queryByText('Error message')).not.toBeInTheDocument();
      });
    });
  });
});
