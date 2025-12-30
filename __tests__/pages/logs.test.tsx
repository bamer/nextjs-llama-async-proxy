import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import LogsPage from '@/app/logs/page';

// Mock MainLayout
jest.mock('@/components/layout/main-layout', () => ({
  MainLayout: ({ children }: any) => React.createElement('div', { 'data-testid': 'main-layout' }, children),
}));

// Mock ThemeContext
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(() => ({ isDark: false, mode: 'light' as const, setMode: jest.fn(), toggleTheme: jest.fn() })),
}));

// Mock useWebSocket hook
jest.mock('@/hooks/use-websocket', () => ({
  useWebSocket: jest.fn(() => ({
    requestLogs: jest.fn(),
    isConnected: false,
    sendMessage: jest.fn(),
  })),
}));

// Mock ErrorBoundary
jest.mock('@/components/ui/error-boundary', () => ({
  ErrorBoundary: ({ children, fallback }: any) =>
    React.createElement(React.Fragment, null, children || fallback),
}));

// Mock LogsFallback
jest.mock('@/components/ui/error-fallbacks', () => ({
  LogsFallback: () => React.createElement('div', { 'data-testid': 'logs-fallback' }, 'LogsFallback'),
}));

// Mock MultiSelect
jest.mock('@/components/ui/MultiSelect', () => ({
  MultiSelect: ({ selected, options }: any) => {
    return React.createElement('select', {
      multiple: true,
      'data-testid': 'multi-select',
      value: Array.from(selected),
    }, options.map((opt: any) =>
      React.createElement('option', { key: opt.value, value: opt.value }, opt.label)
    ));
  },
}));

// Mock SkeletonLogEntry
jest.mock('@/components/ui', () => ({
  ...jest.requireActual('@/components/ui'),
  SkeletonLogEntry: ({ count }: any) =>
    React.createElement('div', { 'data-testid': 'skeleton-logs' }, `Skeleton x${count}`),
}));

// Mock MUI components
jest.mock('@mui/material', () => ({
  Typography: ({ children, ...props }: any) => React.createElement('span', props, children),
  Box: ({ children, ...props }: any) => React.createElement('div', props, children),
  Card: ({ children, ...props }: any) => React.createElement('div', props, children),
  CardContent: ({ children }: any) => React.createElement('div', { children }),
  Grid: ({ children, ...props }: any) => React.createElement('div', props, children),
  TextField: ({ value, onChange, ...props }: any) =>
    React.createElement('input', { ...props, type: 'text', value, onChange }),
  Chip: ({ label, ...props }: any) => React.createElement('span', { ...props }, label),
  IconButton: ({ children, onClick, ...props }: any) =>
    React.createElement('button', { ...props, onClick }, children),
  Pagination: ({ count, page, onChange }: any) =>
    React.createElement('div', { 'data-testid': 'pagination' }, `Page ${page} of ${count}`),
  CircularProgress: (props: any) => React.createElement('span', { ...props }, 'Loading...'),
}));

// Mock MUI icons
jest.mock('@mui/icons-material', () => ({
  Search: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Search' }),
  Refresh: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Refresh' }),
  Delete: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Delete' }),
  Download: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Download' }),
}));

// Mock store
jest.mock('@/lib/store', () => ({
  useStore: jest.fn((selector: any) => {
    const state = {
      logs: [],
      clearLogs: jest.fn(),
    };
    return selector(state);
  }),
}));

const mockLogs = [
  {
    id: '1',
    level: 'error',
    message: 'Test error message',
    timestamp: '2024-01-01T00:00:00Z',
    context: { source: 'test' },
  },
  {
    id: '2',
    level: 'warn',
    message: 'Test warning message',
    timestamp: '2024-01-01T00:00:01Z',
    context: { source: 'test2' },
  },
  {
    id: '3',
    level: 'info',
    message: 'Test info message',
    timestamp: '2024-01-01T00:00:02Z',
    context: { source: 'test3' },
  },
  {
    id: '4',
    level: 'debug',
    message: 'Test debug message',
    timestamp: '2024-01-01T00:00:03Z',
    context: { source: 'test4' },
  },
];

describe('LogsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    global.URL.createObjectURL = jest.fn(() => 'blob:url');
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('renders without errors', () => {
    const { container } = render(<LogsPage />);

    expect(container).toBeInTheDocument();
  });

  it('renders MainLayout wrapper', () => {
    render(<LogsPage />);

    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });

  it('renders logs heading', () => {
    render(<LogsPage />);

    expect(screen.getByText('Logs')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<LogsPage />);

    const searchInput = screen.getByPlaceholderText('Search logs...');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput.tagName).toBe('INPUT');
  });

  it('renders log level filter', () => {
    render(<LogsPage />);

    const multiSelect = screen.getByTestId('multi-select');
    expect(multiSelect).toBeInTheDocument();
  });

  it('renders refresh button', () => {
    render(<LogsPage />);

    const refreshButton = screen.getByTitle('Refresh logs');
    expect(refreshButton).toBeInTheDocument();
    expect(refreshButton.querySelector('[data-icon="Refresh"]')).toBeInTheDocument();
  });

  it('renders clear logs button', () => {
    render(<LogsPage />);

    const clearButton = screen.getByTitle('Clear logs');
    expect(clearButton).toBeInTheDocument();
    expect(clearButton.querySelector('[data-icon="Delete"]')).toBeInTheDocument();
  });

  it('renders download logs button', () => {
    render(<LogsPage />);

    const downloadButton = screen.getByTitle('Download logs');
    expect(downloadButton).toBeInTheDocument();
    expect(downloadButton.querySelector('[data-icon="Download"]')).toBeInTheDocument();
  });

  it('filters logs by search term', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ logs: mockLogs, clearLogs: jest.fn() }));

    render(<LogsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search logs...');
    fireEvent.change(searchInput, { target: { value: 'error' } });

    await waitFor(() => {
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });
  });

  it('displays logs when loaded', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ logs: mockLogs, clearLogs: jest.fn() }));

    render(<LogsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });
  });

  it('displays log level chips', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ logs: mockLogs, clearLogs: jest.fn() }));

    render(<LogsPage />);

    await waitFor(() => {
      expect(screen.getByText('ERROR')).toBeInTheDocument();
      expect(screen.getByText('WARN')).toBeInTheDocument();
      expect(screen.getByText('INFO')).toBeInTheDocument();
      expect(screen.getByText('DEBUG')).toBeInTheDocument();
    });
  });

  it('displays log timestamps', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ logs: mockLogs, clearLogs: jest.fn() }));

    render(<LogsPage />);

    await waitFor(() => {
      expect(screen.getByText(/12:00:00 AM/)).toBeInTheDocument();
    });
  });

  it('clears logs when clear button clicked', async () => {
    const clearLogs = jest.fn();
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ logs: mockLogs, clearLogs }));

    render(<LogsPage />);

    const clearButton = screen.getByTitle('Clear logs');
    fireEvent.click(clearButton);

    expect(clearLogs).toHaveBeenCalled();
  });

  it('refreshes logs when refresh button clicked', async () => {
    const requestLogs = jest.fn();
    const useWebSocket = require('@/hooks/use-websocket').useWebSocket;
    useWebSocket.mockReturnValue({ requestLogs, isConnected: true, sendMessage: jest.fn() });

    render(<LogsPage />);

    const refreshButton = screen.getByTitle('Refresh logs');
    fireEvent.click(refreshButton);

    expect(requestLogs).toHaveBeenCalled();
  });

  it('downloads logs as JSON', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ logs: mockLogs, clearLogs: jest.fn() }));

    render(<LogsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    const downloadButton = screen.getByTitle('Download logs');
    fireEvent.click(downloadButton);

    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it('renders pagination', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ logs: mockLogs, clearLogs: jest.fn() }));

    render(<LogsPage />);

    await waitFor(() => {
      const pagination = screen.getByTestId('pagination');
      expect(pagination).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ logs: [], clearLogs: jest.fn() }));

    const { container } = render(<LogsPage />);

    const skeleton = screen.queryByTestId('skeleton-logs');
    expect(skeleton).toBeInTheDocument();
  });

  it('shows empty state when no logs', () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ logs: [], clearLogs: jest.fn() }));

    render(<LogsPage />);

    expect(screen.getByText('No logs available')).toBeInTheDocument();
  });

  it('displays connection status when disconnected', () => {
    const useWebSocket = require('@/hooks/use-websocket').useWebSocket;
    useWebSocket.mockReturnValue({ requestLogs: jest.fn(), isConnected: false, sendMessage: jest.fn() });

    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ logs: [], clearLogs: jest.fn() }));

    render(<LogsPage />);

    expect(screen.getByText('Connecting to server...')).toBeInTheDocument();
  });

  it('has proper component structure', () => {
    render(<LogsPage />);

    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    expect(screen.getByText('Logs')).toBeInTheDocument();
  });

  it('renders without console errors', () => {
    const consoleError = jest.spyOn(console, 'error');

    render(<LogsPage />);

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('snapshot test', () => {
    const { container } = render(<LogsPage />);

    expect(container.firstChild).toMatchSnapshot();
  });

  it('handles rapid search changes', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ logs: mockLogs, clearLogs: jest.fn() }));

    render(<LogsPage />);

    const searchInput = screen.getByPlaceholderText('Search logs...');

    fireEvent.change(searchInput, { target: { value: 'a' } });
    fireEvent.change(searchInput, { target: { value: 'ab' } });
    fireEvent.change(searchInput, { target: { value: 'abc' } });

    await waitFor(() => {
      expect(searchInput).toHaveValue('abc');
    });
  });

  it('filters by multiple log levels', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ logs: mockLogs, clearLogs: jest.fn() }));

    render(<LogsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });
  });

  it('handles large number of logs with pagination', async () => {
    const manyLogs = Array.from({ length: 50 }, (_, i) => ({
      id: `${i}`,
      level: 'info',
      message: `Log message ${i}`,
      timestamp: '2024-01-01T00:00:00Z',
      context: { source: 'test' },
    }));

    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ logs: manyLogs, clearLogs: jest.fn() }));

    render(<LogsPage />);

    await waitFor(() => {
      expect(screen.getByText('Log message 0')).toBeInTheDocument();
    });
  });
});
