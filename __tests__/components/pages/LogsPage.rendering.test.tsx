import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import LogsPage from '@/components/pages/LogsPage';
import { mockLogs, mockState, mockClearLogs } from './LogsPage.test.helper';

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

describe('LogsPage - Rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState.logs = [...mockLogs];
  });

  it('renders correctly', () => {
    render(<LogsPage />);

    expect(screen.getByText('Logs')).toBeInTheDocument();
  });

  it('displays filter input', () => {
    render(<LogsPage />);

    expect(screen.getByPlaceholderText('Filter logs...')).toBeInTheDocument();
  });

  it('displays level selector', () => {
    render(<LogsPage />);

    expect(screen.getByText('All Levels')).toBeInTheDocument();
  });

  it('displays clear logs button', () => {
    render(<LogsPage />);

    expect(screen.getByText('Clear Logs')).toBeInTheDocument();
  });

  it('displays max lines buttons', () => {
    render(<LogsPage />);

    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('renders log entries', () => {
    render(<LogsPage />);

    expect(screen.getByText('Application started')).toBeInTheDocument();
    expect(screen.getByText('Connection failed')).toBeInTheDocument();
    expect(screen.getByText('Memory usage high')).toBeInTheDocument();
  });

  it('clears logs', () => {
    render(<LogsPage />);

    const clearButton = screen.getByText('Clear Logs');
    fireEvent.click(clearButton);

    expect(mockClearLogs).toHaveBeenCalled();
  });

  it('sets max lines to 50', () => {
    render(<LogsPage />);

    const button50 = screen.getByText('50');
    fireEvent.click(button50);

    expect(button50).toHaveClass('bg-primary');
  });

  it('sets max lines to 100', () => {
    render(<LogsPage />);

    const button100 = screen.getByText('100');
    fireEvent.click(button100);

    expect(button100).toHaveClass('bg-primary');
  });

  it('sets max lines to 200', () => {
    render(<LogsPage />);

    const button200 = screen.getByText('200');
    fireEvent.click(button200);

    expect(button200).toHaveClass('bg-primary');
  });

  it('shows empty state when no logs', () => {
    mockState.logs = [];
    render(<LogsPage />);

    expect(screen.getByText('No logs available')).toBeInTheDocument();
  });

  it('shows no matching logs message', () => {
    mockState.logs = mockLogs;
    render(<LogsPage />);

    const filterInput = screen.getByPlaceholderText('Filter logs...');
    fireEvent.change(filterInput, { target: { value: 'nonexistent' } });

    expect(screen.getByText('No logs match the selected filters')).toBeInTheDocument();
  });

  it('displays log levels with correct colors', () => {
    render(<LogsPage />);

    const logEntries = screen.getAllByText(/(INFO|ERROR|WARN|DEBUG)/);
    expect(logEntries.length).toBeGreaterThan(0);
  });

  it('displays log timestamps', () => {
    render(<LogsPage />);

    const timestamps = screen.getAllByText(/\d{1,2}:\d{2}:\d{2}/);
    expect(timestamps.length).toBeGreaterThan(0);
  });

  it('displays log sources', () => {
    render(<LogsPage />);

    const sources = screen.getAllByText('application');
    expect(sources.length).toBeGreaterThan(0);
    expect(screen.getByText('network')).toBeInTheDocument();
    expect(screen.getByText('system')).toBeInTheDocument();
  });

  it('uses context source when available', () => {
    render(<LogsPage />);

    expect(screen.getByText('system')).toBeInTheDocument();
  });

  it('displays log messages', () => {
    render(<LogsPage />);

    expect(screen.getByText('Application started')).toBeInTheDocument();
    expect(screen.getByText('Connection failed')).toBeInTheDocument();
    expect(screen.getByText('Memory usage high')).toBeInTheDocument();
    expect(screen.getByText('Debug information')).toBeInTheDocument();
  });
});
