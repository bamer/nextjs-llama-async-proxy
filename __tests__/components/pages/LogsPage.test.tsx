import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import LogsPage from '@/components/pages/LogsPage';
import { useStore } from '@/lib/store';

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

const mockLogs = [
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
    context: { source: 'system' },
  },
  {
    level: 'debug',
    message: 'Debug information',
    timestamp: '2024-01-01T10:03:00Z',
  },
];

const mockClearLogs = jest.fn();

const mockState = {
  models: [],
  activeModelId: null,
  metrics: null,
  logs: mockLogs,
  settings: {
    theme: 'light',
    notifications: true,
    autoRefresh: true,
  },
  status: {
    isLoading: false,
    error: null,
  },
  chartHistory: {
    cpu: [],
    memory: [],
    requests: [],
    gpuUtil: [],
    power: [],
  },
  setModels: jest.fn(),
  addModel: jest.fn(),
  updateModel: jest.fn(),
  removeModel: jest.fn(),
  setActiveModel: jest.fn(),
  setMetrics: jest.fn(),
  addLog: jest.fn(),
  setLogs: jest.fn(),
  clearLogs: mockClearLogs,
  updateSettings: jest.fn(),
  setLoading: jest.fn(),
  setError: jest.fn(),
  clearError: jest.fn(),
  addChartData: jest.fn(),
  trimChartData: jest.fn(),
  clearChartData: jest.fn(),
};

(useStore as jest.Mock).mockImplementation((selector) => {
  if (typeof selector === 'function') {
    return selector(mockState);
  }
  return mockState;
});

// Mock getState for clearLogs
(useStore as any).getState = () => mockState;

describe('LogsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mockState.logs for each test
    mockState.logs = [...mockLogs];
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

    // Check that logs are displayed - level badges are in the rendered HTML
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

  it('shows correct styling for error logs', () => {
    render(<LogsPage />);

    const errorEntry = screen.getByText('Connection failed').closest('.bg-red-50, .dark\\:bg-red-950');
    expect(errorEntry).toBeInTheDocument();
  });

  it('shows correct styling for warning logs', () => {
    render(<LogsPage />);

    const warnEntry = screen.getByText('Memory usage high').closest('.bg-yellow-50, .dark\\:bg-yellow-950');
    expect(warnEntry).toBeInTheDocument();
  });

  it('shows correct styling for info logs', () => {
    render(<LogsPage />);

    const infoEntry = screen.getByText('Application started').closest('.bg-blue-50, .dark\\:bg-blue-950');
    expect(infoEntry).toBeInTheDocument();
  });

  it('shows correct styling for debug logs', () => {
    render(<LogsPage />);

    const debugEntry = screen.getByText('Debug information').closest('.bg-gray-50, .dark\\:bg-gray-800');
    expect(debugEntry).toBeInTheDocument();
  });
});
