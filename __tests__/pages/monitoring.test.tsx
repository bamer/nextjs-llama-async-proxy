import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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
  return function MockGPUUMetricsCard({ metrics: _metrics, isDark }: any) {
    // metrics is available for future use
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

// Mock MUI components with proper prop filtering
jest.mock('@mui/material', () => ({
  Typography: ({ children, ...props }: any) => {
    const { gutterBottom, variant, color, fontWeight, ...filteredProps } = props;
    return React.createElement(variant === 'h3' || variant === 'h6' || variant === 'h5' || variant === 'h4' ? 'h1' : 'span', filteredProps, children);
  },
  Box: ({ children, ...props }: any) => {
    const { sx, display, alignItems, justifyContent, mb, ...filteredProps } = props;
    return React.createElement('div', filteredProps, children);
  },
  Card: ({ children, ...props }: any) => {
    const { sx, ...filteredProps } = props;
    return React.createElement('div', filteredProps, children);
  },
  CardContent: ({ children }: any) => React.createElement('div', { children }),
  Grid: ({ children, ...props }: any) => {
    const { size, spacing, ...filteredProps } = props;
    return React.createElement('div', filteredProps, children);
  },
  IconButton: ({ children, onClick, ...props }: any) => {
    const { sx, size, color, disabled, title, ...filteredProps } = props;
    return React.createElement('button', { ...filteredProps, onClick, disabled: disabled || false, title }, children);
  },
  Tooltip: ({ children, ...props }: any) => {
    const { title, ...filteredProps } = props;
    return React.createElement('div', filteredProps, children);
  },
  Divider: (props: any) => {
    const { sx, ...filteredProps } = props;
    return React.createElement('hr', filteredProps);
  },
  CircularProgress: (props: any) => {
    const { sx, size, color, ...filteredProps } = props;
    return React.createElement('span', filteredProps, 'Loading...');
  },
  LinearProgress: (props: any) => {
    const { sx, variant, value, color, ...filteredProps } = props;
    return React.createElement('div', filteredProps, 'Progress');
  },
}));

// Mock MUI icons
jest.mock('@mui/icons-material', () => ({
  Refresh: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Refresh', width: 24, height: 24 }),
  Warning: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Warning', width: 24, height: 24 }),
  CheckCircle: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'CheckCircle', width: 24, height: 24 }),
  Info: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Info', width: 24, height: 24 }),
  Memory: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Memory', width: 24, height: 24 }),
  Storage: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Storage', width: 24, height: 24 }),
  Timer: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Timer', width: 24, height: 24 }),
  NetworkCheck: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'NetworkCheck', width: 24, height: 24 }),
  Computer: (props: any) => React.createElement('svg', { ...props, 'data-icon': 'Computer', width: 24, height: 24 }),
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
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders without errors', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn() }));

    const { container } = await act(async () => {
      return render(<MonitoringPage />);
    });

    expect(container).toBeInTheDocument();
  });

  it('renders MainLayout wrapper', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn() }));

    await act(async () => {
      render(<MonitoringPage />);
    });

    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });

  it('renders loading state when no metrics', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ metrics: null, setMetrics: jest.fn() }));

    await act(async () => {
      render(<MonitoringPage />);
    });

    expect(screen.getByText('Loading Monitoring Data...')).toBeInTheDocument();
  });

  it('renders system monitoring heading', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn() }));

    await act(async () => {
      render(<MonitoringPage />);
    });

    expect(screen.getByText('System Monitoring')).toBeInTheDocument();
  });

  it('renders memory usage card', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn() }));

    await act(async () => {
      render(<MonitoringPage />);
    });

    expect(screen.getByText('Memory Usage')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('renders cpu usage card', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn() }));

    await act(async () => {
      render(<MonitoringPage />);
    });

    expect(screen.getByText('CPU Usage')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('renders disk usage card', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn() }));

    await act(async () => {
      render(<MonitoringPage />);
    });

    expect(screen.getByText('Disk Usage')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('renders available models card', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn() }));

    await act(async () => {
      render(<MonitoringPage />);
    });

    expect(screen.getByText('Available Models')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('renders performance chart', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn() }));

    await act(async () => {
      render(<MonitoringPage />);
    });

    const chart = screen.getByTestId('performance-chart');
    expect(chart).toBeInTheDocument();
    expect(chart).toHaveAttribute('data-title', 'System Performance');
  });

  it('renders gpu metrics when available', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn() }));

    await act(async () => {
      render(<MonitoringPage />);
    });

    const gpuCard = screen.queryByTestId('gpu-metrics-card');
    expect(gpuCard).toBeInTheDocument();
  });

  it('renders system health summary', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn() }));

    await act(async () => {
      render(<MonitoringPage />);
    });

    expect(screen.getByText('System Health Summary')).toBeInTheDocument();
  });

  it('renders system uptime', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn() }));

    await act(async () => {
      render(<MonitoringPage />);
    });

    expect(screen.getByText('System Uptime')).toBeInTheDocument();
  });

  it('renders performance status', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn() }));

    await act(async () => {
      render(<MonitoringPage />);
    });

    expect(screen.getByText('Performance Status')).toBeInTheDocument();
    expect(screen.getByText('150ms avg')).toBeInTheDocument();
  });

  it('renders refresh button', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn() }));

    await act(async () => {
      render(<MonitoringPage />);
    });

    const refreshButton = screen.queryByTitle(/refresh/i);
    expect(refreshButton).toBeInTheDocument();
  });

  it('has proper component structure', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn() }));

    await act(async () => {
      render(<MonitoringPage />);
    });

    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });

  it('renders without console errors', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn() }));
    const consoleError = jest.spyOn(console, 'error');

    await act(async () => {
      render(<MonitoringPage />);
    });

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('snapshot test', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn() }));

    const { container } = await act(async () => {
      return render(<MonitoringPage />);
    });

    expect(container.firstChild).toMatchSnapshot();
  });

  it('handles re-renders gracefully', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn() }));

    const { rerender } = await act(async () => {
      return render(<MonitoringPage />);
    });

    expect(screen.getByText('System Monitoring')).toBeInTheDocument();

    await act(async () => {
      rerender(<MonitoringPage />);
    });

    expect(screen.getByText('System Monitoring')).toBeInTheDocument();
  });

  it('is a functional component', async () => {
    const useStore = require('@/lib/store').useStore;
    useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn() }));

    const { container } = await act(async () => {
      return render(<MonitoringPage />);
    });

    expect(container).toBeInTheDocument();
    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });
});
