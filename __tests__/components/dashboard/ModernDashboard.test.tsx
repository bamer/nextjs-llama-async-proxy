import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ModernDashboard from '@/components/dashboard/ModernDashboard';

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

const { useStore } = require('@/lib/store');
const theme = createTheme();
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
    useStore.mockImplementation((selector) => {
      const state = {
        models: [
          { id: 'model1', name: 'Model 1', loaded: true, size: '7B' },
          { id: 'model2', name: 'Model 2', loaded: false, size: '13B' },
        ],
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
      };
      return selector(state);
    });
  });

  it('renders loading state initially', () => {
    renderWithProviders(<ModernDashboard />);
    expect(screen.getByText('Loading Dashboard...')).toBeInTheDocument();
  });

  it('renders dashboard after loading', async () => {
    renderWithProviders(<ModernDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
    });
  });

  it('displays metric cards', async () => {
    renderWithProviders(<ModernDashboard />);
    await waitFor(() => {
      expect(screen.getByText('CPU Usage')).toBeInTheDocument();
      expect(screen.getByText('Memory Usage')).toBeInTheDocument();
      expect(screen.getByText('Disk Usage')).toBeInTheDocument();
      expect(screen.getByText('Active Models')).toBeInTheDocument();
    });
  });

  it('displays correct metric values', async () => {
    renderWithProviders(<ModernDashboard />);
    await waitFor(() => {
      expect(screen.getByText('50.0%')).toBeInTheDocument();
      expect(screen.getByText('60.0%')).toBeInTheDocument();
      expect(screen.getByText('70.0%')).toBeInTheDocument();
    });
  });

  it('renders models list card', async () => {
    renderWithProviders(<ModernDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Model 1')).toBeInTheDocument();
      expect(screen.getByText('Model 2')).toBeInTheDocument();
    });
  });

  it('renders quick actions card', async () => {
    renderWithProviders(<ModernDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Restart/i)).toBeInTheDocument();
      expect(screen.getByText(/Start/i)).toBeInTheDocument();
    });
  });

  it('displays performance charts', async () => {
    renderWithProviders(<ModernDashboard />);
    await waitFor(() => {
      expect(screen.getByText('System Performance')).toBeInTheDocument();
    });
  });

  it('displays GPU chart when GPU metrics available', async () => {
    renderWithProviders(<ModernDashboard />);
    await waitFor(() => {
      expect(screen.getByText('GPU Utilization & Power')).toBeInTheDocument();
    });
  });

  it('displays uptime information', async () => {
    renderWithProviders(<ModernDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Uptime')).toBeInTheDocument();
      expect(screen.getByText('1h 0m')).toBeInTheDocument();
    });
  });

  it('displays total requests', async () => {
    renderWithProviders(<ModernDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Total Requests')).toBeInTheDocument();
      expect(screen.getByText('1000')).toBeInTheDocument();
    });
  });

  it('displays average response time', async () => {
    renderWithProviders(<ModernDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Avg Response Time')).toBeInTheDocument();
      expect(screen.getByText('150ms')).toBeInTheDocument();
    });
  });

  it('handles loading with no metrics', async () => {
    useStore.mockImplementation((selector) => {
      const state = {
        models: [],
        metrics: undefined,
      };
      return selector(state);
    });

    renderWithProviders(<ModernDashboard />);
    await waitFor(() => {
      expect(screen.queryByText('Loading Dashboard...')).not.toBeInTheDocument();
    });
  });
});
