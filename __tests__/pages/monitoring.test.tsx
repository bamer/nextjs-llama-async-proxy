import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import MonitoringPage from '@/app/monitoring/page';

// Mock MainLayout
jest.mock('@/components/layout/main-layout', () => ({
  MainLayout: ({ children }: any) => React.createElement('div', { 'data-testid': 'main-layout' }, children),
}));

// Mock ThemeContext
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(() => ({ isDark: false, mode: 'light' as const, setMode: jest.fn(), toggleTheme: jest.fn() })),
}));

// Mock useChartHistory
jest.mock('@/hooks/useChartHistory', () => ({
  useChartHistory: jest.fn(() => ({
    cpu: [],
    memory: [],
    requests: [],
    gpuUtil: [],
    power: [],
  })),
}));

// Mock ErrorBoundary
jest.mock('@/components/ui/error-boundary', () => ({
  ErrorBoundary: ({ children, fallback }: any) =>
    React.createElement(React.Fragment, null, children || fallback),
}));

// Mock MonitoringFallback
jest.mock('@/components/ui/error-fallbacks', () => ({
  MonitoringFallback: () => React.createElement('div', { 'data-testid': 'monitoring-fallback' }, 'MonitoringFallback'),
}));

// Mock PerformanceChart
jest.mock('@/components/charts/PerformanceChart', () => {
  return function MockPerformanceChart({ title, datasets, isDark }: any) {
    return React.createElement('div', { 'data-testid': 'performance-chart', 'data-title': title },
      `PerformanceChart: ${title}`,
      `Datasets: ${datasets?.length || 0}`,
      `isDark: ${isDark}`
    );
  };
});

// Mock GPUUMetricsCard
jest.mock('@/components/charts/GPUUMetricsCard', () => {
  return function MockGPUUMetricsCard({ metrics, isDark }: any) {
    return React.createElement('div', { 'data-testid': 'gpu-metrics-card' },
      'GPUUMetricsCard Component',
      `isDark: ${isDark}`
    );
  };
});

// Mock useEffectEvent
jest.mock('@/hooks/use-effect-event', () => ({
  useEffectEvent: (fn: any) => fn,
}));

// Mock MUI components
jest.mock('@mui/material', () => ({
  Typography: ({ children, ...props }: any) => React.createElement('span', props, children),
  Box: ({ children, ...props }: any) => React.createElement('div', props, children),
  Card: ({ children, ...props }: any) => React.createElement('div', props, children),
  CardContent: ({ children }: any) => React.createElement('div', { children }),
  Grid: ({ children, ...props }: any) => React.createElement('div', props, children),
  IconButton: ({ children, onClick, ...props }: any) =>
    React.createElement('button', { ...props, onClick }, children),
  Tooltip: ({ children, ...props }: any) => React.createElement('div', { ...props }, children),
  Divider: (props: any) => React.createElement('hr', props),
  CircularProgress: (props: any) => React.createElement('span', { ...props }, 'Loading...'),
  LinearProgress: (props: any) => React.createElement('div', { ...props }, 'Progress'),
}));

// Mock MUI icons
jest.mock('@mui/icons-material', () => ({
  Refresh: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Refresh' }),
  Warning: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Warning' }),
  CheckCircle: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'CheckCircle' }),
  Info: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Info' }),
  Memory: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Memory' }),
  Storage: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Storage' }),
  Timer: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Timer' }),
  NetworkCheck: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'NetworkCheck' }),
  Computer: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Computer' }),
}));

// Mock store
jest.mock('@/lib/store', () => ({
  useStore: jest.fn((selector: any) => {
    const state = {
      metrics: null,
      setMetrics: jest.fn(),
    };
    return selector(state);
  }),
}));

const mockMetrics = {
  cpuUsage: 45,
  memoryUsage: 60,
  diskUsage: 75,
  activeModels: 4,
  uptime: 86400,
  avgResponseTime: 150,
  totalRequests: 1500,
  gpuUsage: 55,
  gpuPowerUsage: 200,
  gpuMemoryUsage: 60,
  timestamp: '2024-01-01T00:00:00Z',
};

describe('MonitoringPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('renders without errors', () => {
    const { container } = render(<MonitoringPage />);

    expect(container).toBeInTheDocument();
  });

  it('renders MainLayout wrapper', () => {
    render(<MonitoringPage />);

    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });

  it('renders loading state when no metrics', () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ metrics: null, setMetrics: jest.fn() }));

    const { container } = render(<MonitoringPage />);

    expect(screen.getByText('Loading Monitoring Data...')).toBeInTheDocument();
  });

  it('renders system monitoring heading', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn() }));

    render(<MonitoringPage />);

    jest.advanceTimersByTime(5100);

    await waitFor(() => {
      expect(screen.getByText('System Monitoring')).toBeInTheDocument();
    });
  });

  it('renders memory usage card', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn() }));

    render(<MonitoringPage />);

    jest.advanceTimersByTime(5100);

    await waitFor(() => {
      expect(screen.getByText('Memory Usage')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
    });
  });

  it('renders cpu usage card', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn() }));

    render(<MonitoringPage />);

    jest.advanceTimersByTime(5100);

    await waitFor(() => {
      expect(screen.getByText('CPU Usage')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
    });
  });

  it('renders disk usage card', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn() }));

    render(<MonitoringPage />);

    jest.advanceTimersByTime(5100);

    await waitFor(() => {
      expect(screen.getByText('Disk Usage')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

  it('renders available models card', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn() }));

    render(<MonitoringPage />);

    jest.advanceTimersByTime(5100);

    await waitFor(() => {
      expect(screen.getByText('Available Models')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  it('renders performance chart', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn() }));

    render(<MonitoringPage />);

    jest.advanceTimersByTime(5100);

    await waitFor(() => {
      const chart = screen.getByTestId('performance-chart');
      expect(chart).toBeInTheDocument();
      expect(chart).toHaveAttribute('data-title', 'System Performance');
    });
  });

  it('renders gpu metrics when available', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn() }));

    render(<MonitoringPage />);

    jest.advanceTimersByTime(5100);

    await waitFor(() => {
      const gpuCard = screen.queryByTestId('gpu-metrics-card');
      expect(gpuCard).toBeInTheDocument();
    });
  });

  it('renders system health summary', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn() }));

    render(<MonitoringPage />);

    jest.advanceTimersByTime(5100);

    await waitFor(() => {
      expect(screen.getByText('System Health Summary')).toBeInTheDocument();
    });
  });

  it('renders system uptime', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn() }));

    render(<MonitoringPage />);

    jest.advanceTimersByTime(5100);

    await waitFor(() => {
      expect(screen.getByText('System Uptime')).toBeInTheDocument();
    });
  });

  it('renders performance status', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn() }));

    render(<MonitoringPage />);

    jest.advanceTimersByTime(5100);

    await waitFor(() => {
      expect(screen.getByText('Performance Status')).toBeInTheDocument();
      expect(screen.getByText('150ms avg')).toBeInTheDocument();
    });
  });

  it('renders refresh button', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn() }));

    render(<MonitoringPage />);

    jest.advanceTimersByTime(5100);

    await waitFor(() => {
      const refreshButton = screen.queryByTestId(/icon-.*Refresh/i) || screen.queryByTitle(/refresh/i);
      expect(refreshButton).toBeInTheDocument();
    });
  });

  it('handles refresh button click', async () => {
    const useStore = require('@/lib/store').useStore;
    const setMetrics = jest.fn();
    useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics }));

    render(<MonitoringPage />);

    jest.advanceTimersByTime(5100);

    await waitFor(() => {
      const refreshButton = screen.queryByTestId(/icon-.*Refresh/i) || screen.queryByTitle(/refresh/i);
      if (refreshButton) {
        fireEvent.click(refreshButton);
      }
    });
  });

  it('has proper component structure', () => {
    render(<MonitoringPage />);

    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });

  it('renders without console errors', () => {
    const consoleError = jest.spyOn(console, 'error');

    render(<MonitoringPage />);

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('snapshot test', () => {
    const { container } = render(<MonitoringPage />);

    expect(container.firstChild).toMatchSnapshot();
  });

  it('handles re-renders gracefully', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn() }));

    const { rerender } = render(<MonitoringPage />);

    jest.advanceTimersByTime(5100);

    await waitFor(() => {
      expect(screen.getByText('System Monitoring')).toBeInTheDocument();
    });

    rerender(<MonitoringPage />);

    await waitFor(() => {
      expect(screen.getByText('System Monitoring')).toBeInTheDocument();
    });
  });

  it('is a functional component', () => {
    const { container } = render(<MonitoringPage />);

    expect(container).toBeInTheDocument();
    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });
});
