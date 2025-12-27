import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ModernDashboard from '@/components/dashboard/ModernDashboard';
import { useStore } from '@/lib/store';

jest.mock('@/contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTheme: () => ({ isDark: false, mode: 'light' as const, setMode: jest.fn(), toggleTheme: jest.fn(), currentTheme: null }),
}));

jest.mock('@/hooks/use-websocket', () => ({
  useWebSocket: () => ({
    isConnected: true,
    sendMessage: jest.fn(),
  }),
}));

jest.mock('@/hooks/useChartHistory', () => ({
  useChartHistory: () => ({
    cpu: [{ value: 50, timestamp: Date.now() }],
    memory: [{ value: 60, timestamp: Date.now() }],
    requests: [{ value: 100, timestamp: Date.now() }],
    gpuUtil: [{ value: 80, timestamp: Date.now() }],
    power: [{ value: 200, timestamp: Date.now() }],
  }),
}));

jest.mock('@/lib/store', () => ({
  useStore: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const { useStore: mockedUseStore } = require('@/lib/store') as { useStore: jest.Mock };
const theme = createTheme();

const mockState = {
  models: [
    { id: 'model1', name: 'Model 1', loaded: true, size: '7B' },
    { id: 'model2', name: 'Model 2', loaded: false, size: '13B' },
  ],
  activeModelId: null,
  metrics: {
    cpuUsage: 50,
    memoryUsage: 60,
    diskUsage: 70,
    activeModels: 1,
    uptime: 3600,
    totalRequests: 1000,
    avgResponseTime: 150,
    gpuUsage: {
      utilization: 80,
      power: 200,
    },
  },
  logs: [],
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
  clearLogs: jest.fn(),
  updateSettings: jest.fn(),
  setLoading: jest.fn(),
  setError: jest.fn(),
  clearError: jest.fn(),
  addChartData: jest.fn(),
  trimChartData: jest.fn(),
  clearChartData: jest.fn(),
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

function renderWithProviders(component: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MuiThemeProvider theme={theme}>{component}</MuiThemeProvider>
    </QueryClientProvider>
  );
}

describe('ModernDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockedUseStore.mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector(mockState);
      }
      return mockState;
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    renderWithProviders(<ModernDashboard />);
    expect(screen.getByText('Loading Dashboard...')).toBeInTheDocument();
  });

  it('renders dashboard after loading', async () => {
    renderWithProviders(<ModernDashboard />);
    jest.advanceTimersByTime(1500);
    await waitFor(() => {
      expect(screen.queryByText('Loading Dashboard...')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
  });

  it('displays metric cards', async () => {
    renderWithProviders(<ModernDashboard />);
    jest.advanceTimersByTime(1500);
    await waitFor(() => {
      expect(screen.queryByText('Loading Dashboard...')).not.toBeInTheDocument();
    });
    expect(screen.getByText('CPU Usage')).toBeInTheDocument();
    expect(screen.getByText('Memory Usage')).toBeInTheDocument();
    expect(screen.getByText('Disk Usage')).toBeInTheDocument();
    expect(screen.getByText('Active Models')).toBeInTheDocument();
  });

  it('displays correct metric values', async () => {
    renderWithProviders(<ModernDashboard />);
    jest.advanceTimersByTime(1500);
    await waitFor(() => {
      expect(screen.queryByText('Loading Dashboard...')).not.toBeInTheDocument();
    });
    expect(screen.getByText('50.0%')).toBeInTheDocument();
    expect(screen.getByText('60.0%')).toBeInTheDocument();
    expect(screen.getByText('70.0%')).toBeInTheDocument();
  });

  it('renders models list card', async () => {
    renderWithProviders(<ModernDashboard />);
    jest.advanceTimersByTime(1500);
    await waitFor(() => {
      expect(screen.queryByText('Loading Dashboard...')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Model 1')).toBeInTheDocument();
    expect(screen.getByText('Model 2')).toBeInTheDocument();
  });

  it('renders quick actions card', async () => {
    renderWithProviders(<ModernDashboard />);
    jest.advanceTimersByTime(1500);
    await waitFor(() => {
      expect(screen.queryByText('Loading Dashboard...')).not.toBeInTheDocument();
    });
    expect(screen.getByText(/Restart/i)).toBeInTheDocument();
    expect(screen.getByText(/Start/i)).toBeInTheDocument();
  });

  it('displays performance charts', async () => {
    renderWithProviders(<ModernDashboard />);
    jest.advanceTimersByTime(1500);
    await waitFor(() => {
      expect(screen.queryByText('Loading Dashboard...')).not.toBeInTheDocument();
    });
    expect(screen.getByText('System Performance')).toBeInTheDocument();
  });

  it('displays GPU chart when GPU metrics available', async () => {
    renderWithProviders(<ModernDashboard />);
    jest.advanceTimersByTime(1500);
    await waitFor(() => {
      expect(screen.queryByText('Loading Dashboard...')).not.toBeInTheDocument();
    });
    expect(screen.getByText('GPU Utilization & Power')).toBeInTheDocument();
  });

  it('displays uptime information', async () => {
    renderWithProviders(<ModernDashboard />);
    jest.advanceTimersByTime(1500);
    await waitFor(() => {
      expect(screen.queryByText('Loading Dashboard...')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Uptime')).toBeInTheDocument();
    expect(screen.getByText('1h 0m')).toBeInTheDocument();
  });

  it('displays total requests', async () => {
    renderWithProviders(<ModernDashboard />);
    jest.advanceTimersByTime(1500);
    await waitFor(() => {
      expect(screen.queryByText('Loading Dashboard...')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Total Requests')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
  });

  it('displays average response time', async () => {
    renderWithProviders(<ModernDashboard />);
    jest.advanceTimersByTime(1500);
    await waitFor(() => {
      expect(screen.queryByText('Loading Dashboard...')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Avg Response Time')).toBeInTheDocument();
    expect(screen.getByText('150ms')).toBeInTheDocument();
  });

  it('handles loading with no metrics', async () => {
    mockedUseStore.mockImplementation((selector) => {
      const emptyState = {
        ...mockState,
        models: [],
        metrics: undefined,
      };
      if (typeof selector === 'function') {
        return selector(emptyState);
      }
      return emptyState;
    });

    renderWithProviders(<ModernDashboard />);
    jest.advanceTimersByTime(1500);
    await waitFor(() => {
      expect(screen.queryByText('Loading Dashboard...')).not.toBeInTheDocument();
    });
  });

  // Edge Case Tests
  it('handles empty models array', async () => {
    mockedUseStore.mockImplementation((selector) => {
      const emptyModelsState = {
        ...mockState,
        models: [],
      };
      if (typeof selector === 'function') {
        return selector(emptyModelsState);
      }
      return emptyModelsState;
    });

    renderWithProviders(<ModernDashboard />);
    jest.advanceTimersByTime(1500);
    await waitFor(() => {
      expect(screen.queryByText('Loading Dashboard...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('0 models')).toBeInTheDocument();
  });

  it('handles null metrics gracefully', async () => {
    mockedUseStore.mockImplementation((selector) => {
      const nullMetricsState = {
        ...mockState,
        metrics: null,
      };
      if (typeof selector === 'function') {
        return selector(nullMetricsState);
      }
      return nullMetricsState;
    });

    renderWithProviders(<ModernDashboard />);
    jest.advanceTimersByTime(1500);
    await waitFor(() => {
      expect(screen.queryByText('Loading Dashboard...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('handles very large uptime values', async () => {
    mockedUseStore.mockImplementation((selector) => {
      const largeUptimeState = {
        ...mockState,
        metrics: {
          ...mockState.metrics,
          uptime: 864000, // 10 days
        },
      };
      if (typeof selector === 'function') {
        return selector(largeUptimeState);
      }
      return largeUptimeState;
    });

    renderWithProviders(<ModernDashboard />);
    jest.advanceTimersByTime(1500);
    await waitFor(() => {
      expect(screen.queryByText('Loading Dashboard...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('10d 0h 0m')).toBeInTheDocument();
  });

  it('handles zero uptime', async () => {
    mockedUseStore.mockImplementation((selector) => {
      const zeroUptimeState = {
        ...mockState,
        metrics: {
          ...mockState.metrics,
          uptime: 0,
        },
      };
      if (typeof selector === 'function') {
        return selector(zeroUptimeState);
      }
      return zeroUptimeState;
    });

    renderWithProviders(<ModernDashboard />);
    jest.advanceTimersByTime(1500);
    await waitFor(() => {
      expect(screen.queryByText('Loading Dashboard...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('handles very large request count', async () => {
    mockedUseStore.mockImplementation((selector) => {
      const largeRequestsState = {
        ...mockState,
        metrics: {
          ...mockState.metrics,
          totalRequests: 999999999,
        },
      };
      if (typeof selector === 'function') {
        return selector(largeRequestsState);
      }
      return largeRequestsState;
    });

    renderWithProviders(<ModernDashboard />);
    jest.advanceTimersByTime(1500);
    await waitFor(() => {
      expect(screen.queryByText('Loading Dashboard...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('999999999')).toBeInTheDocument();
  });

  it('handles extreme metric values', async () => {
    mockedUseStore.mockImplementation((selector) => {
      const extremeValuesState = {
        ...mockState,
        metrics: {
          ...mockState.metrics,
          cpuUsage: 100,
          memoryUsage: 100,
          diskUsage: 100,
        },
      };
      if (typeof selector === 'function') {
        return selector(extremeValuesState);
      }
      return extremeValuesState;
    });

    renderWithProviders(<ModernDashboard />);
    jest.advanceTimersByTime(1500);
    await waitFor(() => {
      expect(screen.queryByText('Loading Dashboard...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('100.0%')).toBeInTheDocument();
  });

  it('handles very low metric values', async () => {
    mockedUseStore.mockImplementation((selector) => {
      const lowValuesState = {
        ...mockState,
        metrics: {
          ...mockState.metrics,
          cpuUsage: 0,
          memoryUsage: 0,
          diskUsage: 0,
          activeModels: 0,
        },
      };
      if (typeof selector === 'function') {
        return selector(lowValuesState);
      }
      return lowValuesState;
    });

    renderWithProviders(<ModernDashboard />);
    jest.advanceTimersByTime(1500);
    await waitFor(() => {
      expect(screen.queryByText('Loading Dashboard...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('handles models with special characters in names', async () => {
    mockedUseStore.mockImplementation((selector) => {
      const specialCharsState = {
        ...mockState,
        models: [
          { id: 'model1', name: 'Model-α_β 🚀', loaded: true, size: '7B' },
          { id: 'model2', name: 'Model with spaces & symbols!', loaded: false, size: '13B' },
        ],
      };
      if (typeof selector === 'function') {
        return selector(specialCharsState);
      }
      return specialCharsState;
    });

    renderWithProviders(<ModernDashboard />);
    jest.advanceTimersByTime(1500);
    await waitFor(() => {
      expect(screen.queryByText('Loading Dashboard...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Model-α_β 🚀')).toBeInTheDocument();
    expect(screen.getByText('Model with spaces & symbols!')).toBeInTheDocument();
  });

  it('handles no GPU metrics', async () => {
    mockedUseStore.mockImplementation((selector) => {
      const noGpuState = {
        ...mockState,
        metrics: {
          ...mockState.metrics,
          gpuUsage: undefined,
        },
      };
      if (typeof selector === 'function') {
        return selector(noGpuState);
      }
      return noGpuState;
    });

    renderWithProviders(<ModernDashboard />);
    jest.advanceTimersByTime(1500);
    await waitFor(() => {
      expect(screen.queryByText('Loading Dashboard...')).not.toBeInTheDocument();
    });

    // Should show GPU metrics card without chart instead of GPU chart
    expect(screen.queryByText('GPU Utilization & Power')).not.toBeInTheDocument();
  });

  it('handles theme change', async () => {
    const { rerender } = renderWithProviders(<ModernDashboard />);
    jest.advanceTimersByTime(1500);
    await waitFor(() => {
      expect(screen.queryByText('Loading Dashboard...')).not.toBeInTheDocument();
    });

    // Theme should be handled by ThemeContext mock
    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
  });

  it('handles WebSocket disconnected state', async () => {
    const { useWebSocket } = require('@/hooks/use-websocket');
    useWebSocket.mockReturnValue({
      isConnected: false,
      sendMessage: jest.fn(),
    });

    renderWithProviders(<ModernDashboard />);
    jest.advanceTimersByTime(1500);
    await waitFor(() => {
      expect(screen.queryByText('Loading Dashboard...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('DISCONNECTED')).toBeInTheDocument();
  });

  it('handles very large number of models', async () => {
    const manyModels = Array.from({ length: 50 }, (_, i) => ({
      id: `model${i}`,
      name: `Model ${i}`,
      loaded: i % 2 === 0,
      size: `${i + 1}B`,
    }));

    mockedUseStore.mockImplementation((selector) => {
      const manyModelsState = {
        ...mockState,
        models: manyModels,
      };
      if (typeof selector === 'function') {
        return selector(manyModelsState);
      }
      return manyModelsState;
    });

    renderWithProviders(<ModernDashboard />);
    jest.advanceTimersByTime(1500);
    await waitFor(() => {
      expect(screen.queryByText('Loading Dashboard...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('50 models')).toBeInTheDocument();
  });

  it('handles negative response time gracefully', async () => {
    mockedUseStore.mockImplementation((selector) => {
      const negativeResponseState = {
        ...mockState,
        metrics: {
          ...mockState.metrics,
          avgResponseTime: -1,
        },
      };
      if (typeof selector === 'function') {
        return selector(negativeResponseState);
      }
      return negativeResponseState;
    });

    renderWithProviders(<ModernDashboard />);
    jest.advanceTimersByTime(1500);
    await waitFor(() => {
      expect(screen.queryByText('Loading Dashboard...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('-1ms')).toBeInTheDocument();
  });

  it('handles very high response time', async () => {
    mockedUseStore.mockImplementation((selector) => {
      const highResponseState = {
        ...mockState,
        metrics: {
          ...mockState.metrics,
          avgResponseTime: 99999,
        },
      };
      if (typeof selector === 'function') {
        return selector(highResponseState);
      }
      return highResponseState;
    });

    renderWithProviders(<ModernDashboard />);
    jest.advanceTimersByTime(1500);
    await waitFor(() => {
      expect(screen.queryByText('Loading Dashboard...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('99999ms')).toBeInTheDocument();
  });

  it('handles undefined avg response time', async () => {
    mockedUseStore.mockImplementation((selector) => {
      const undefinedResponseState = {
        ...mockState,
        metrics: {
          ...mockState.metrics,
          avgResponseTime: undefined,
        },
      };
      if (typeof selector === 'function') {
        return selector(undefinedResponseState);
      }
      return undefinedResponseState;
    });

    renderWithProviders(<ModernDashboard />);
    jest.advanceTimersByTime(1500);
    await waitFor(() => {
      expect(screen.queryByText('Loading Dashboard...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('0ms')).toBeInTheDocument();
  });

  it('handles concurrent state changes', async () => {
    renderWithProviders(<ModernDashboard />);
    jest.advanceTimersByTime(1500);
    await waitFor(() => {
      expect(screen.queryByText('Loading Dashboard...')).not.toBeInTheDocument();
    });

    // Change to empty state
    mockedUseStore.mockImplementation((selector) => {
      const changedState = {
        ...mockState,
        models: [],
        metrics: undefined,
      };
      if (typeof selector === 'function') {
        return selector(changedState);
      }
      return changedState;
    });

    // Dashboard should still render
    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
  });
});
