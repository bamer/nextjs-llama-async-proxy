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

  // Edge Case Tests
  it('handles very large number of logs (1000+)', () => {
    const manyLogs = Array.from({ length: 1500 }, (_, i) => ({
      level: ['info', 'warn', 'error', 'debug'][i % 4] as 'info' | 'warn' | 'error' | 'debug',
      message: `Log message ${i}`.repeat(10),
      timestamp: '2024-01-01T10:00:00Z',
      source: `source-${i % 10}`,
    }));
    mockState.logs = manyLogs;

    render(<LogsPage />);

    // Should only display first 50 due to maxLines default
    const logEntries = screen.getAllByText(/Log message/);
    expect(logEntries.length).toBeLessThanOrEqual(50);
  });

  it('handles logs with extremely long messages', () => {
    const longMessageLogs = [
      {
        level: 'info' as const,
        message: 'A'.repeat(10000),
        timestamp: '2024-01-01T10:00:00Z',
        source: 'application',
      },
    ];
    mockState.logs = longMessageLogs;

    render(<LogsPage />);

    expect(screen.getByText('A'.repeat(10000))).toBeInTheDocument();
  });

  it('handles logs with special characters', () => {
    const specialCharLogs = [
      {
        level: 'info' as const,
        message: 'Special: @#$%^&*()_+-={}[]|\\:;"\'<>,.?/~`',
        timestamp: '2024-01-01T10:00:00Z',
        source: 'application',
      },
    ];
    mockState.logs = specialCharLogs;

    render(<LogsPage />);

    expect(screen.getByText(/Special: @/)).toBeInTheDocument();
  });

  it('handles logs with unicode characters', () => {
    const unicodeLogs = [
      {
        level: 'info' as const,
        message: 'Unicode: 你好世界 🌍 مرحبا 😊',
        timestamp: '2024-01-01T10:00:00Z',
        source: 'application',
      },
    ];
    mockState.logs = unicodeLogs;

    render(<LogsPage />);

    expect(screen.getByText(/Unicode: 你好世界/)).toBeInTheDocument();
  });

  it('handles logs with invalid timestamps', () => {
    const invalidTimestampLogs = [
      {
        level: 'info' as const,
        message: 'Invalid timestamp log',
        timestamp: 'invalid-date',
        source: 'application',
      },
    ];
    mockState.logs = invalidTimestampLogs;

    render(<LogsPage />);

    expect(screen.getByText('Invalid timestamp log')).toBeInTheDocument();
  });

  it('handles logs with missing source', () => {
    const noSourceLogs = [
      {
        level: 'info' as const,
        message: 'No source log',
        timestamp: '2024-01-01T10:00:00Z',
      },
    ];
    mockState.logs = noSourceLogs;

    render(<LogsPage />);

    expect(screen.getByText('No source log')).toBeInTheDocument();
    // Should show 'application' as default source
    expect(screen.getByText('application')).toBeInTheDocument();
  });

  it('handles rapid filter changes', () => {
    render(<LogsPage />);

    const filterInput = screen.getByPlaceholderText('Filter logs...');

    for (let i = 0; i < 20; i++) {
      fireEvent.change(filterInput, { target: { value: `search${i}` } });
    }

    expect(filterInput).toHaveValue('search19');
  });

  it('handles rapid level changes', () => {
    render(<LogsPage />);

    const levelSelect = screen.getByRole('combobox');

    fireEvent.change(levelSelect, { target: { value: 'error' } });
    fireEvent.change(levelSelect, { target: { value: 'warn' } });
    fireEvent.change(levelSelect, { target: { value: 'info' } });
    fireEvent.change(levelSelect, { target: { value: 'debug' } });
    fireEvent.change(levelSelect, { target: { value: 'all' } });

    expect(levelSelect).toHaveValue('all');
  });

  it('handles rapid max lines changes', () => {
    render(<LogsPage />);

    const button50 = screen.getByText('50');
    const button100 = screen.getByText('100');
    const button200 = screen.getByText('200');

    for (let i = 0; i < 10; i++) {
      fireEvent.click(button50);
      fireEvent.click(button100);
      fireEvent.click(button200);
    }

    expect(button200).toHaveClass('bg-primary');
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

    // Should show all logs when filtering by whitespace
    expect(screen.getByText('Application started')).toBeInTheDocument();
  });

  it('handles filter with regex-like patterns', () => {
    mockState.logs = mockLogs;
    render(<LogsPage />);

    const filterInput = screen.getByPlaceholderText('Filter logs...');
    fireEvent.change(filterInput, { target: { value: '[test]' } });

    // Should search for literal string, not as regex
    expect(screen.queryByText('Application started')).not.toBeInTheDocument();
  });

  it('handles clearing logs multiple times', () => {
    render(<LogsPage />);

    const clearButton = screen.getByText('Clear Logs');

    for (let i = 0; i < 5; i++) {
      fireEvent.click(clearButton);
    }

    expect(mockClearLogs).toHaveBeenCalledTimes(5);
  });

  it('handles logs with null values in message', () => {
    const nullMessageLogs = [
      {
        level: 'info' as const,
        message: null as any,
        timestamp: '2024-01-01T10:00:00Z',
        source: 'application',
      },
    ];
    mockState.logs = nullMessageLogs;

    render(<LogsPage />);

    // Should not crash with null message
    expect(screen.getByText('No logs match the selected filters')).toBeInTheDocument();
  });

  it('handles logs with undefined level', () => {
    const undefinedLevelLogs = [
      {
        level: undefined as any,
        message: 'Undefined level log',
        timestamp: '2024-01-01T10:00:00Z',
        source: 'application',
      },
    ];
    mockState.logs = undefinedLevelLogs;

    render(<LogsPage />);

    expect(screen.getByText('Undefined level log')).toBeInTheDocument();
  });

  it('handles all logs being filtered out', () => {
    mockState.logs = mockLogs;
    render(<LogsPage />);

    const filterInput = screen.getByPlaceholderText('Filter logs...');
    fireEvent.change(filterInput, { target: { value: 'nonexistent-log-message' } });

    expect(screen.getByText('No logs match the selected filters')).toBeInTheDocument();
  });

  it('handles very short log messages', () => {
    const shortMessageLogs = [
      {
        level: 'info' as const,
        message: 'X',
        timestamp: '2024-01-01T10:00:00Z',
        source: 'application',
      },
    ];
    mockState.logs = shortMessageLogs;

    render(<LogsPage />);

    expect(screen.getByText('X')).toBeInTheDocument();
  });

  it('handles logs with HTML in message', () => {
    const htmlLogs = [
      {
        level: 'info' as const,
        message: 'HTML: <script>alert("xss")</script>',
        timestamp: '2024-01-01T10:00:00Z',
        source: 'application',
      },
    ];
    mockState.logs = htmlLogs;

    render(<LogsPage />);

    expect(screen.getByText(/HTML: <script>/)).toBeInTheDocument();
  });

  it('handles logs with newlines in message', () => {
    const newlineLogs = [
      {
        level: 'info' as const,
        message: 'Line 1\nLine 2\nLine 3',
        timestamp: '2024-01-01T10:00:00Z',
        source: 'application',
      },
    ];
    mockState.logs = newlineLogs;

    render(<LogsPage />);

    expect(screen.getByText(/Line 1/)).toBeInTheDocument();
  });

  it('handles logs with tabs in message', () => {
    const tabLogs = [
      {
        level: 'info' as const,
        message: 'Column1\tColumn2\tColumn3',
        timestamp: '2024-01-01T10:00:00Z',
        source: 'application',
      },
    ];
    mockState.logs = tabLogs;

    render(<LogsPage />);

    expect(screen.getByText(/Column1/)).toBeInTheDocument();
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

  it('handles logs with emoji in message', () => {
    const emojiLogs = [
      {
        level: 'info' as const,
        message: 'Log with emoji 🚀✨🎉🔥💡',
        timestamp: '2024-01-01T10:00:00Z',
        source: 'application',
      },
    ];
    mockState.logs = emojiLogs;

    render(<LogsPage />);

    expect(screen.getByText(/Log with emoji/)).toBeInTheDocument();
  });

  it('handles logs with very long source names', () => {
    const longSourceLogs = [
      {
        level: 'info' as const,
        message: 'Long source log',
        timestamp: '2024-01-01T10:00:00Z',
        source: 'A'.repeat(500),
      },
    ];
    mockState.logs = longSourceLogs;

    render(<LogsPage />);

    expect(screen.getByText('Long source log')).toBeInTheDocument();
  });

  it('handles setting max lines to current number of logs', () => {
    const exactLogs = Array.from({ length: 100 }, (_, i) => ({
      level: 'info' as const,
      message: `Log ${i}`,
      timestamp: '2024-01-01T10:00:00Z',
      source: 'application',
    }));
    mockState.logs = exactLogs;

    render(<LogsPage />);

    const button100 = screen.getByText('100');
    fireEvent.click(button100);

    expect(screen.getAllByText(/Log \d+/).length).toBe(100);
  });
});
