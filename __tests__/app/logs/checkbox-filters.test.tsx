/**
 * Updated tests for Logs Page with checkbox filters
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('LogsPage - Checkbox Filters', () => {
  beforeEach(() => {
    useStore.getState().clearLogs();
  });

  describe('UI Visibility', () => {
    it('should show search bar and filters even when no logs match', () => {
      const logs = [
        {
          id: '1',
          level: 'info' as const,
          message: 'Info message',
          timestamp: '2025-12-27T10:00:00.000Z',
          context: { source: 'test' },
        },
      ];

      useStore.getState().setLogs(logs);
      render(<LogsPage />);

      // Clear all levels to show no logs
      const errorCheckbox = screen.getByLabelText('Error');
      const warnCheckbox = screen.getByLabelText('Warning');
      const infoCheckbox = screen.getByLabelText('Info');
      const debugCheckbox = screen.getByLabelText('Debug');

      fireEvent.click(infoCheckbox);

      // UI should still be visible
      expect(screen.getByPlaceholderText('Search logs...')).toBeInTheDocument();
      expect(errorCheckbox).toBeInTheDocument();
      expect(warnCheckbox).toBeInTheDocument();
      expect(infoCheckbox).toBeInTheDocument();
      expect(debugCheckbox).toBeInTheDocument();
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('None')).toBeInTheDocument();
    });

    it('should show "No log levels selected" when no levels selected', () => {
      const logs = [
        {
          id: '1',
          level: 'error' as const,
          message: 'Error message',
          timestamp: '2025-12-27T10:00:00.000Z',
          context: { source: 'test' },
        },
      ];

      useStore.getState().setLogs(logs);
      render(<LogsPage />);

      // Uncheck all levels
      const errorCheckbox = screen.getByLabelText('Error');
      fireEvent.click(errorCheckbox);

      expect(screen.getByText('No log levels selected')).toBeInTheDocument();
    });

    it('should show "No logs available" when logs exist but none match search', () => {
      const logs = [
        {
          id: '1',
          level: 'error' as const,
          message: 'Error message',
          timestamp: '2025-12-27T10:00:00.000Z',
          context: { source: 'test' },
        },
      ];

      useStore.getState().setLogs(logs);
      render(<LogsPage />);

      // Search for non-existent text
      const searchInput = screen.getByPlaceholderText('Search logs...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText('No logs available')).toBeInTheDocument();
    });
  });

  describe('Checkbox Filtering', () => {
    it('should show all levels selected by default', () => {
      const logs = [
        {
          id: '1',
          level: 'error' as const,
          message: 'Error message',
          timestamp: '2025-12-27T10:00:00.000Z',
          context: { source: 'test' },
        },
      ];

      useStore.getState().setLogs(logs);
      render(<LogsPage />);

      const errorCheckbox = screen.getByLabelText('Error') as HTMLInputElement;
      const warnCheckbox = screen.getByLabelText('Warning') as HTMLInputElement;
      const infoCheckbox = screen.getByLabelText('Info') as HTMLInputElement;
      const debugCheckbox = screen.getByLabelText('Debug') as HTMLInputElement;

      expect(errorCheckbox.checked).toBe(true);
      expect(warnCheckbox.checked).toBe(true);
      expect(infoCheckbox.checked).toBe(true);
      expect(debugCheckbox.checked).toBe(true);
    });

    it('should toggle individual checkboxes', () => {
      const logs = [
        {
          id: '1',
          level: 'error' as const,
          message: 'Error message',
          timestamp: '2025-12-27T10:00:00.000Z',
          context: { source: 'test' },
        },
      ];

      useStore.getState().setLogs(logs);
      render(<LogsPage />);

      const errorCheckbox = screen.getByLabelText('Error');
      fireEvent.click(errorCheckbox);

      // Error checkbox should be unchecked
      const errorCheckboxAfter = screen.getByLabelText('Error') as HTMLInputElement;
      expect(errorCheckboxAfter.checked).toBe(false);

      // Error log should not be visible
      expect(screen.queryByText('Error message')).not.toBeInTheDocument();
    });

    it('should show only error logs when only Error checkbox is selected', () => {
      const logs = [
        {
          id: '1',
          level: 'error' as const,
          message: 'Error message',
          timestamp: '2025-12-27T10:00:00.000Z',
          context: { source: 'test' },
        },
        {
          id: '2',
          level: 'info' as const,
          message: 'Info message',
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

      // Uncheck all except Error
      fireEvent.click(screen.getByLabelText('Warning'));
      fireEvent.click(screen.getByLabelText('Info'));
      fireEvent.click(screen.getByLabelText('Debug'));

      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Info message')).not.toBeInTheDocument();
      expect(screen.queryByText('Warning message')).not.toBeInTheDocument();
    });

    it('should show error and debug logs when only those checkboxes are selected', () => {
      const logs = [
        {
          id: '1',
          level: 'error' as const,
          message: 'Error message',
          timestamp: '2025-12-27T10:00:00.000Z',
          context: { source: 'test' },
        },
        {
          id: '2',
          level: 'info' as const,
          message: 'Info message',
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

      // Uncheck all except Error and Debug
      fireEvent.click(screen.getByLabelText('Warning'));
      fireEvent.click(screen.getByLabelText('Info'));

      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByText('Debug message')).toBeInTheDocument();
      expect(screen.queryByText('Info message')).not.toBeInTheDocument();
      expect(screen.queryByText('Warning message')).not.toBeInTheDocument();
    });

    it('should select all levels when clicking "All" button', () => {
      const logs = [
        {
          id: '1',
          level: 'error' as const,
          message: 'Error message',
          timestamp: '2025-12-27T10:00:00.000Z',
          context: { source: 'test' },
        },
      ];

      useStore.getState().setLogs(logs);
      render(<LogsPage />);

      // Uncheck all
      fireEvent.click(screen.getByLabelText('Error'));

      // Click "All" button
      fireEvent.click(screen.getByText('All'));

      const errorCheckbox = screen.getByLabelText('Error') as HTMLInputElement;
      const warnCheckbox = screen.getByLabelText('Warning') as HTMLInputElement;
      const infoCheckbox = screen.getByLabelText('Info') as HTMLInputElement;
      const debugCheckbox = screen.getByLabelText('Debug') as HTMLInputElement;

      expect(errorCheckbox.checked).toBe(true);
      expect(warnCheckbox.checked).toBe(true);
      expect(infoCheckbox.checked).toBe(true);
      expect(debugCheckbox.checked).toBe(true);
    });

    it('should clear all levels when clicking "None" button', () => {
      const logs = [
        {
          id: '1',
          level: 'error' as const,
          message: 'Error message',
          timestamp: '2025-12-27T10:00:00.000Z',
          context: { source: 'test' },
        },
      ];

      useStore.getState().setLogs(logs);
      render(<LogsPage />);

      // Click "None" button
      fireEvent.click(screen.getByText('None'));

      const errorCheckbox = screen.getByLabelText('Error') as HTMLInputElement;
      const warnCheckbox = screen.getByLabelText('Warning') as HTMLInputElement;
      const infoCheckbox = screen.getByLabelText('Info') as HTMLInputElement;
      const debugCheckbox = screen.getByLabelText('Debug') as HTMLInputElement;

      expect(errorCheckbox.checked).toBe(false);
      expect(warnCheckbox.checked).toBe(false);
      expect(infoCheckbox.checked).toBe(false);
      expect(debugCheckbox.checked).toBe(false);

      expect(screen.getByText('No log levels selected')).toBeInTheDocument();
    });

    it('should show warning logs when Warning checkbox is selected', () => {
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
          level: 'warn' as const,
          message: 'Warning message',
          timestamp: '2025-12-27T10:00:01.000Z',
          context: { source: 'test' },
        },
      ];

      useStore.getState().setLogs(logs);
      render(<LogsPage />);

      // Uncheck all except Warning
      fireEvent.click(screen.getByLabelText('Error'));
      fireEvent.click(screen.getByLabelText('Info'));
      fireEvent.click(screen.getByLabelText('Debug'));

      expect(screen.getByText('Warning message')).toBeInTheDocument();
      expect(screen.queryByText('Info message')).not.toBeInTheDocument();
    });
  });

  describe('Visual Feedback', () => {
    it('should show all checkboxes by default', () => {
      const logs = [
        {
          id: '1',
          level: 'error' as const,
          message: 'Error message',
          timestamp: '2025-12-27T10:00:00.000Z',
          context: { source: 'test' },
        },
      ];

      useStore.getState().setLogs(logs);
      render(<LogsPage />);

      expect(screen.getByLabelText('Error')).toBeInTheDocument();
      expect(screen.getByLabelText('Warning')).toBeInTheDocument();
      expect(screen.getByLabelText('Info')).toBeInTheDocument();
      expect(screen.getByLabelText('Debug')).toBeInTheDocument();
    });

    it('should maintain search and filter visibility across state changes', () => {
      const logs = [
        {
          id: '1',
          level: 'error' as const,
          message: 'Error message',
          timestamp: '2025-12-27T10:00:00.000Z',
          context: { source: 'test' },
        },
      ];

      useStore.getState().setLogs(logs);
      render(<LogsPage />);

      const searchInput = screen.getByPlaceholderText('Search logs...');

      // Search
      fireEvent.change(searchInput, { target: { value: 'Error' } });
      expect(searchInput).toBeInTheDocument();

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });
      expect(searchInput).toBeInTheDocument();

      // Toggle filter
      fireEvent.click(screen.getByLabelText('Error'));
      expect(searchInput).toBeInTheDocument();
    });
  });
});
