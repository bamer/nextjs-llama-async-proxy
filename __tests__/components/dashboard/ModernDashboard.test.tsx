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
});
