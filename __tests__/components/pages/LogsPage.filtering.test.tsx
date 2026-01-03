import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import LogsPage from '@/components/pages/LogsPage';
import { mockLogs, mockState } from './LogsPage.test.helper';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/hooks/use-websocket', () => ({
  useWebSocket: () => ({
    requestLogs: jest.fn(),
    isConnected: true,
  }),
}));

jest.mock('@/lib/store');

describe('LogsPage - Filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState.logs = [...mockLogs];
  });

  it('filters logs by text', () => {
    render(<LogsPage />);

    const filterInput = screen.getByPlaceholderText('Filter logs...');
    fireEvent.change(filterInput, { target: { value: 'started' } });

    expect(screen.getByText('Application started')).toBeInTheDocument();
    expect(screen.queryByText('Connection failed')).not.toBeInTheDocument();
  });

  it('filters logs by level', () => {
    render(<LogsPage />);

    const levelSelect = screen.getByRole('combobox');
    fireEvent.change(levelSelect, { target: { value: 'error' } });

    expect(screen.getByText('Connection failed')).toBeInTheDocument();
    expect(screen.queryByText('Application started')).not.toBeInTheDocument();
  });

  it('filters logs by source', () => {
    render(<LogsPage />);

    const filterInput = screen.getByPlaceholderText('Filter logs...');
    fireEvent.change(filterInput, { target: { value: 'network' } });

    expect(screen.getByText('Connection failed')).toBeInTheDocument();
    expect(screen.queryByText('Application started')).not.toBeInTheDocument();
  });

  it('handles case-insensitive filtering', () => {
    render(<LogsPage />);

    const filterInput = screen.getByPlaceholderText('Filter logs...');
    fireEvent.change(filterInput, { target: { value: 'STARTED' } });

    expect(screen.getByText('Application started')).toBeInTheDocument();
  });

  it('filters by "error" level', () => {
    render(<LogsPage />);

    const levelSelect = screen.getByRole('combobox');
    fireEvent.change(levelSelect, { target: { value: 'error' } });

    expect(screen.getByText('Connection failed')).toBeInTheDocument();
    expect(screen.queryByText('Application started')).not.toBeInTheDocument();
  });

  it('filters by "warn" level', () => {
    render(<LogsPage />);

    const levelSelect = screen.getByRole('combobox');
    fireEvent.change(levelSelect, { target: { value: 'warn' } });

    expect(screen.getByText('Memory usage high')).toBeInTheDocument();
    expect(screen.queryByText('Application started')).not.toBeInTheDocument();
  });

  it('filters by "info" level', () => {
    render(<LogsPage />);

    const levelSelect = screen.getByRole('combobox');
    fireEvent.change(levelSelect, { target: { value: 'info' } });

    expect(screen.getByText('Application started')).toBeInTheDocument();
    expect(screen.queryByText('Connection failed')).not.toBeInTheDocument();
  });

  it('filters by "debug" level', () => {
    render(<LogsPage />);

    const levelSelect = screen.getByRole('combobox');
    fireEvent.change(levelSelect, { target: { value: 'debug' } });

    expect(screen.getByText('Debug information')).toBeInTheDocument();
    expect(screen.queryByText('Application started')).not.toBeInTheDocument();
  });

  it('limits displayed logs to max lines', () => {
    const manyLogs = Array.from({ length: 100 }, (_, i) => ({
      level: 'info',
      message: `Log message ${i}`,
      timestamp: '2024-01-01T10:00:00Z',
      source: 'application',
    }));
    mockState.logs = manyLogs;

    render(<LogsPage />);

    expect(screen.getAllByText(/Log message/).length).toBeLessThanOrEqual(50);
  });

  it('displays all level options', () => {
    render(<LogsPage />);

    const levelSelect = screen.getByRole('combobox');
    fireEvent.change(levelSelect, { target: { value: 'error' } });

    expect(screen.getByText('All Levels')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(screen.getByText('Debug')).toBeInTheDocument();
  });

  it('handles empty filter text', () => {
    mockState.logs = mockLogs;
    render(<LogsPage />);

    const filterInput = screen.getByPlaceholderText('Filter logs...');
    fireEvent.change(filterInput, { target: { value: 'started' } });
    fireEvent.change(filterInput, { target: { value: '' } });

    expect(screen.getByText('Application started')).toBeInTheDocument();
  });

  it('handles filter with only whitespace', () => {
    mockState.logs = mockLogs;
    render(<LogsPage />);

    const filterInput = screen.getByPlaceholderText('Filter logs...');
    fireEvent.change(filterInput, { target: { value: '   ' } });

    expect(screen.getByText('Application started')).toBeInTheDocument();
  });

  it('handles filter with regex-like patterns', () => {
    mockState.logs = mockLogs;
    render(<LogsPage />);

    const filterInput = screen.getByPlaceholderText('Filter logs...');
    fireEvent.change(filterInput, { target: { value: '[test]' } });

    expect(screen.queryByText('Application started')).not.toBeInTheDocument();
  });

  it('handles all logs being filtered out', () => {
    mockState.logs = mockLogs;
    render(<LogsPage />);

    const filterInput = screen.getByPlaceholderText('Filter logs...');
    fireEvent.change(filterInput, {
      target: { value: 'nonexistent-log-message' },
    });

    expect(
      screen.getByText('No logs match the selected filters'),
    ).toBeInTheDocument();
  });

  it('handles concurrent filter operations', () => {
    mockState.logs = mockLogs;
    render(<LogsPage />);

    const filterInput = screen.getByPlaceholderText('Filter logs...');
    const levelSelect = screen.getByRole('combobox');

    fireEvent.change(filterInput, { target: { value: 'started' } });
    fireEvent.change(levelSelect, { target: { value: 'info' } });
    fireEvent.change(filterInput, { target: { value: '' } });

    expect(screen.getByText('Application started')).toBeInTheDocument();
  });
});
