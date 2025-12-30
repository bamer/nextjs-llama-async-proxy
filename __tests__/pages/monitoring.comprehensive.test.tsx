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

// Mock MUI components with proper prop filtering - define AFTER loading/skeleton mocks
jest.mock('@mui/material', () => ({
  Typography: ({ children, ...props }: any) => {
    const { gutterBottom, variant, color, fontWeight, ...filteredProps } = props;
    return React.createElement(variant === 'h3' || variant === 'h6' || variant === 'h5' || variant === 'h4' || variant === 'subtitle1' ? 'h1' : 'span', filteredProps, children);
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
  Chip: ({ children, ...props }: any) => {
    const { label, color, size, ...filteredProps } = props;
    return React.createElement('span', filteredProps, children);
  },
  Skeleton: ({ children, ...props }: any) => {
    return React.createElement('div', { ...props, 'data-skeleton': 'true' }, children);
  },
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
    return React.createElement(variant === 'h3' || variant === 'h6' || variant === 'h5' || variant === 'h4' || variant === 'subtitle1' ? 'h1' : 'span', filteredProps, children);
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
  Chip: ({ children, ...props }: any) => {
    const { label, color, size, ...filteredProps } = props;
    return React.createElement('span', filteredProps, children);
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
      chartHistory: {
        cpu: [],
        memory: [],
        requests: [],
        gpuUtil: [],
        power: [],
      },
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

const mockMetricsHighUsage = {
  cpuUsage: 95,
  memoryUsage: 90,
  diskUsage: 98,
  activeModels: 8,
  uptime: 172800,
  avgResponseTime: 200,
  totalRequests: 5000,
  gpuUsage: 95,
  gpuPowerUsage: 350,
  gpuMemoryUsage: 95,
  timestamp: '2024-01-01T00:00:00Z',
};

const mockMetricsMediumUsage = {
  cpuUsage: 65,
  memoryUsage: 75,
  diskUsage: 85,
  activeModels: 5,
  uptime: 43200,
  avgResponseTime: 120,
  totalRequests: 2500,
  timestamp: '2024-01-01T00:00:00Z',
};

const mockMetricsNoGPU = {
  cpuUsage: 45,
  memoryUsage: 60,
  diskUsage: 75,
  activeModels: 4,
  uptime: 86400,
  avgResponseTime: 150,
  totalRequests: 1500,
  timestamp: '2024-01-01T00:00:00Z',
};

describe('MonitoringPage - Comprehensive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Page Rendering', () => {
    it('renders without errors', async () => {
      const useStore = require('@/lib/store').useStore;
      useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      expect(screen.getByText('System Monitoring')).toBeInTheDocument();
    });

    it('renders MainLayout wrapper', async () => {
      const useStore = require('@/lib/store').useStore;
      useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    });

    it('renders loading state when no metrics', async () => {
      const useStore = require('@/lib/store').useStore;
      useStore.mockImplementation((selector: any) => selector({ metrics: null, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      expect(screen.getByText('Loading Monitoring Data...')).toBeInTheDocument();
    });

    it('renders subtitle description', async () => {
      const useStore = require('@/lib/store').useStore;
      useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      expect(screen.getByText('Real-time performance and health monitoring')).toBeInTheDocument();
    });
  });

  describe('Metric Cards', () => {
    it('renders memory usage card with correct values', async () => {
      const useStore = require('@/lib/store').useStore;
      useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      expect(screen.getByText('Memory Usage')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
    });

    it('renders CPU usage card with correct values', async () => {
      const useStore = require('@/lib/store').useStore;
      useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      expect(screen.getByText('CPU Usage')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    it('renders disk usage card with correct values', async () => {
      const useStore = require('@/lib/store').useStore;
      useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      expect(screen.getByText('Disk Usage')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('renders available models card with correct values', async () => {
      const useStore = require('@/lib/store').useStore;
      useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      expect(screen.getByText('Available Models')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('4/10 models active')).toBeInTheDocument();
    });
  });

  describe('Threshold-based Status Chips', () => {
    it('shows Normal memory status when below 70%', async () => {
      const useStore = require('@/lib/store').useStore;
      const lowMemoryMetrics = { ...mockMetrics, memoryUsage: 50 };
      useStore.mockImplementation((selector: any) => selector({ metrics: lowMemoryMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      expect(screen.getByText('Normal')).toBeInTheDocument();
    });

    it('shows Medium memory status when between 70% and 85%', async () => {
      const useStore = require('@/lib/store').useStore;
      const mediumMemoryMetrics = { ...mockMetrics, memoryUsage: 78 };
      useStore.mockImplementation((selector: any) => selector({ metrics: mediumMemoryMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('shows High memory status when above 85%', async () => {
      const useStore = require('@/lib/store').useStore;
      const highMemoryMetrics = { ...mockMetrics, memoryUsage: 90 };
      useStore.mockImplementation((selector: any) => selector({ metrics: highMemoryMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('shows Normal CPU status when below 60%', async () => {
      const useStore = require('@/lib/store').useStore;
      const lowCPUMetrics = { ...mockMetrics, cpuUsage: 45 };
      useStore.mockImplementation((selector: any) => selector({ metrics: lowCPUMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      expect(screen.getByText('Normal')).toBeInTheDocument();
    });

    it('shows Medium CPU status when between 60% and 90%', async () => {
      const useStore = require('@/lib/store').useStore;
      const mediumCPUMetrics = { ...mockMetrics, cpuUsage: 75 };
      useStore.mockImplementation((selector: any) => selector({ metrics: mediumCPUMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('shows High CPU status when above 90%', async () => {
      const useStore = require('@/lib/store').useStore;
      const highCPUMetrics = { ...mockMetrics, cpuUsage: 95 };
      useStore.mockImplementation((selector: any) => selector({ metrics: highCPUMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('shows Normal disk status when below 80%', async () => {
      const useStore = require('@/lib/store').useStore;
      const lowDiskMetrics = { ...mockMetrics, diskUsage: 60 };
      useStore.mockImplementation((selector: any) => selector({ metrics: lowDiskMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      expect(screen.getByText('Normal')).toBeInTheDocument();
    });

    it('shows High disk status when between 80% and 95%', async () => {
      const useStore = require('@/lib/store').useStore;
      const highDiskMetrics = { ...mockMetrics, diskUsage: 88 };
      useStore.mockImplementation((selector: any) => selector({ metrics: highDiskMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('shows Critical disk status when above 95%', async () => {
      const useStore = require('@/lib/store').useStore;
      const criticalDiskMetrics = { ...mockMetrics, diskUsage: 97 };
      useStore.mockImplementation((selector: any) => selector({ metrics: criticalDiskMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      expect(screen.getByText('Critical')).toBeInTheDocument();
    });
  });

  describe('Performance Charts', () => {
    it('renders system performance chart', async () => {
      const useStore = require('@/lib/store').useStore;
      useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      const chart = screen.getByTestId('performance-chart');
      expect(chart).toBeInTheDocument();
      expect(chart).toHaveAttribute('data-title', 'System Performance');
    });

    it('renders GPU metrics card when GPU data is available', async () => {
      const useStore = require('@/lib/store').useStore;
      useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      const gpuCard = screen.queryByTestId('gpu-metrics-card');
      expect(gpuCard).toBeInTheDocument();
    });

    it('does not render GPU metrics when GPU data is undefined', async () => {
      const useStore = require('@/lib/store').useStore;
      useStore.mockImplementation((selector: any) => selector({ metrics: mockMetricsNoGPU, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      const gpuCard = screen.queryByTestId('gpu-metrics-card');
      expect(gpuCard).not.toBeInTheDocument();
    });

    it('renders GPU performance chart when GPU data is available', async () => {
      const useStore = require('@/lib/store').useStore;
      useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      const charts = screen.getAllByTestId('performance-chart');
      const gpuChart = charts.find((chart: any) => chart.getAttribute('data-title') === 'GPU Power & Utilization');
      expect(gpuChart).toBeInTheDocument();
    });
  });

  describe('System Health Summary', () => {
    it('renders system health summary section', async () => {
      const useStore = require('@/lib/store').useStore;
      useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      expect(screen.getByText('System Health Summary')).toBeInTheDocument();
    });

    it('renders system uptime', async () => {
      const useStore = require('@/lib/store').useStore;
      useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      expect(screen.getByText('System Uptime')).toBeInTheDocument();
      expect(screen.getByText('1d 0h 0m')).toBeInTheDocument();
    });

    it('renders performance status', async () => {
      const useStore = require('@/lib/store').useStore;
      useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      expect(screen.getByText('Performance Status')).toBeInTheDocument();
      expect(screen.getByText('150ms avg')).toBeInTheDocument();
      expect(screen.getByText('1500 requests processed')).toBeInTheDocument();
    });

    it('renders health indicators section', async () => {
      const useStore = require('@/lib/store').useStore;
      useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      expect(screen.getByText('Health Indicators')).toBeInTheDocument();
      expect(screen.getByText('Memory: 60%')).toBeInTheDocument();
      expect(screen.getByText('CPU: 45%')).toBeInTheDocument();
      expect(screen.getByText('Disk: 75%')).toBeInTheDocument();
      expect(screen.getByText('Models: 4 active')).toBeInTheDocument();
    });
  });

  describe('Refresh Functionality', () => {
    it('renders refresh button', async () => {
      const useStore = require('@/lib/store').useStore;
      useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      const refreshButton = screen.queryByTitle(/refresh metrics/i);
      expect(refreshButton).toBeInTheDocument();
    });

    it('handles refresh button click', async () => {
      const useStore = require('@/lib/store').useStore;
      const setMetricsMock = jest.fn();
      useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: setMetricsMock, chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      const refreshButton = screen.getByTitle(/refresh metrics/i);
      await act(async () => {
        fireEvent.click(refreshButton);
      });

      // Advance timers to allow setTimeout to complete
      jest.advanceTimersByTime(1000);

      expect(setMetricsMock).toHaveBeenCalled();
    });

    it('shows loading spinner while refreshing', async () => {
      const useStore = require('@/lib/store').useStore;
      useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      const refreshButton = screen.getByTitle(/refresh metrics/i);
      await act(async () => {
        fireEvent.click(refreshButton);
      });

      // Check for Loading... text in the button
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Theme Integration', () => {
    it('uses theme context for styling', async () => {
      const useStore = require('@/lib/store').useStore;
      useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      const { useTheme } = require('@/contexts/ThemeContext');
      useTheme.mockReturnValue({ isDark: true, mode: 'dark' as const, setMode: jest.fn(), toggleTheme: jest.fn() });

      await act(async () => {
        render(<MonitoringPage />);
      });

      expect(useTheme).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero values for metrics', async () => {
      const useStore = require('@/lib/store').useStore;
      const zeroMetrics = {
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
        activeModels: 0,
        uptime: 0,
        avgResponseTime: 0,
        totalRequests: 0,
        timestamp: '2024-01-01T00:00:00Z',
      };
      useStore.mockImplementation((selector: any) => selector({ metrics: zeroMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('0d 0h 0m')).toBeInTheDocument();
      expect(screen.getByText('0ms avg')).toBeInTheDocument();
    });

    it('handles partial GPU metrics (only gpuUsage)', async () => {
      const useStore = require('@/lib/store').useStore;
      const partialGPUMetrics = {
        ...mockMetricsNoGPU,
        gpuUsage: 70,
      };
      useStore.mockImplementation((selector: any) => selector({ metrics: partialGPUMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      const gpuCard = screen.queryByTestId('gpu-metrics-card');
      expect(gpuCard).toBeInTheDocument();
    });

    it('handles partial GPU metrics (only gpuPowerUsage)', async () => {
      const useStore = require('@/lib/store').useStore;
      const partialGPUMetrics = {
        ...mockMetricsNoGPU,
        gpuPowerUsage: 200,
      };
      useStore.mockImplementation((selector: any) => selector({ metrics: partialGPUMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      // GPU charts should still render if any GPU data is available
      const charts = screen.getAllByTestId('performance-chart');
      const gpuChart = charts.find((chart: any) => chart.getAttribute('data-title') === 'GPU Power & Utilization');
      expect(gpuChart).toBeInTheDocument();
    });

    it('handles large uptime values', async () => {
      const useStore = require('@/lib/store').useStore;
      const largeUptimeMetrics = {
        ...mockMetrics,
        uptime: 9000000, // 104 days
      };
      useStore.mockImplementation((selector: any) => selector({ metrics: largeUptimeMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      expect(screen.getByText('104d 4h 0m')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('renders without console errors', async () => {
      const useStore = require('@/lib/store').useStore;
      useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));
      const consoleError = jest.spyOn(console, 'error');

      await act(async () => {
        render(<MonitoringPage />);
      });

      expect(consoleError).not.toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe('Component Structure', () => {
    it('has proper component structure', async () => {
      const useStore = require('@/lib/store').useStore;
      useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      expect(screen.getByTestId('main-layout')).toBeInTheDocument();
      expect(screen.getByText('System Monitoring')).toBeInTheDocument();
      expect(screen.getByText('System Health Summary')).toBeInTheDocument();
    });

    it('handles re-renders gracefully', async () => {
      const useStore = require('@/lib/store').useStore;
      useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

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
      useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      const { container } = await act(async () => {
        return render(<MonitoringPage />);
      });

      expect(container).toBeInTheDocument();
      expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    });
  });

  describe('Data Fetching States', () => {
    it('transitions from loading to data state', async () => {
      const useStore = require('@/lib/store').useStore;

      // Start with null metrics
      useStore.mockImplementation((selector: any) => selector({ metrics: null, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      const { rerender } = await act(async () => {
        return render(<MonitoringPage />);
      });

      expect(screen.getByText('Loading Monitoring Data...')).toBeInTheDocument();

      // Update to have metrics
      useStore.mockImplementation((selector: any) => selector({ metrics: mockMetrics, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        rerender(<MonitoringPage />);
      });

      expect(screen.getByText('System Monitoring')).toBeInTheDocument();
    });

    it('handles timeout when metrics not available', async () => {
      const useStore = require('@/lib/store').useStore;
      useStore.mockImplementation((selector: any) => selector({ metrics: null, setMetrics: jest.fn(), chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] } }));

      await act(async () => {
        render(<MonitoringPage />);
      });

      // Fast-forward 5 seconds to trigger timeout
      jest.advanceTimersByTime(5000);

      expect(screen.getByText('Loading Monitoring Data...')).toBeInTheDocument();
    });
  });
});
