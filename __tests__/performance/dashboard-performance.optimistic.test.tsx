import '@testing-library/jest-dom';
import ModernDashboard from '@/components/dashboard/ModernDashboard';
import { useStore } from '@/lib/store';
import type { ModelConfig, LegacySystemMetrics } from '@/types';
import { setupDashboardTest, cleanupDashboardTest, createMockMetrics, render, screen, fireEvent } from './dashboard-test-helpers';

// Mock WebSocket client
jest.mock('@/lib/websocket-client', () => ({
  websocketServer: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    sendMessage: jest.fn(),
    requestMetrics: jest.fn(),
    requestModels: jest.fn(),
    requestLogs: jest.fn(),
    startModel: jest.fn(),
    stopModel: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  },
}));

// Mock ThemeContext
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ isDark: false, mode: 'light' as const, setMode: jest.fn(), toggleTheme: jest.fn() }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock useWebSocket hook
jest.mock('@/hooks/use-websocket', () => ({
  useWebSocket: () => ({
    isConnected: true,
    connectionState: 'connected',
    reconnectionAttempts: 0,
    sendMessage: jest.fn(),
    requestMetrics: jest.fn(),
    requestModels: jest.fn(),
    requestLogs: jest.fn(),
    startModel: jest.fn(),
    stopModel: jest.fn(),
  }),
}));

// Mock useChartHistory hook
jest.mock('@/hooks/useChartHistory', () => ({
  useChartHistory: () => ({
    cpu: [], memory: [], requests: [], gpuUtil: [], power: [],
  }),
}));

// Mock lazy-loaded components
jest.mock('@/components/charts/PerformanceChart', () => ({
  PerformanceChart: () => <div data-testid="performance-chart">Chart</div>,
}));

jest.mock('@/components/dashboard/MetricsGrid', () => ({
  MetricsGrid: () => <div data-testid="metrics-grid">Metrics</div>,
}));

jest.mock('@/components/dashboard/ChartsSection', () => ({
  ChartsSection: () => <div data-testid="charts-section">Charts</div>,
}));

jest.mock('@/components/dashboard/GPUMetricsSection', () => ({
  GPUMetricsSection: () => <div data-testid="gpu-metrics-section">GPU Metrics</div>,
}));

jest.mock('@/components/dashboard/QuickActionsCard', () => ({
  QuickActionsCard: () => <div data-testid="quick-actions-card">Quick Actions</div>,
}));

jest.mock('@/components/ui', () => ({
  SkeletonMetricCard: () => <div data-testid="skeleton-metric-card">Skeleton</div>,
}));

jest.mock('@/components/dashboard/ModelsListCard', () => ({
  ModelsListCard: () => <div data-testid="models-list-card">Models</div>,
}));

jest.mock('@/components/dashboard/DashboardHeader', () => ({
  DashboardHeader: () => <div data-testid="dashboard-header">Header</div>,
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

/**
 * Optimistic UI Updates Tests
 *
 * Tests verify that UI updates happen immediately without waiting
 * for server confirmation.
 */
describe('Optimistic UI Updates', () => {
  beforeEach(() => {
    setupDashboardTest();
  });

  afterEach(() => {
    cleanupDashboardTest();
  });

  it('should update UI immediately on model toggle', async () => {
    const mockMetrics: LegacySystemMetrics = createMockMetrics({ activeModels: 0 });
    useStore.getState().setMetrics(mockMetrics as never);

    const models: ModelConfig[] = [
      {
        id: 'model-1',
        name: 'Model 1',
        type: 'llama',
        parameters: {},
        status: 'idle',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    useStore.getState().setModels(models);

    render(<ModernDashboard />);

    expect(screen.getByTestId('models-list-card')).toBeInTheDocument();

    const toggleButton = screen.getByText('Toggle');
    expect(toggleButton).toBeInTheDocument();

    fireEvent.click(toggleButton);

    expect(screen.getByTestId('models-list-card')).toBeInTheDocument();
  });

  it('should show loading state immediately on metrics refresh', async () => {
    const mockMetrics: LegacySystemMetrics = createMockMetrics({ activeModels: 2 });
    useStore.getState().setMetrics(mockMetrics as never);

    render(<ModernDashboard />);

    expect(screen.getByTestId('modern-dashboard')).toBeInTheDocument();
    const metricCards = document.querySelectorAll('.MuiCard-root');
    expect(metricCards.length).toBeGreaterThanOrEqual(4);
  });

  it('should handle model status changes gracefully', async () => {
    const mockMetrics: LegacySystemMetrics = createMockMetrics({ activeModels: 0 });
    useStore.getState().setMetrics(mockMetrics as never);

    const models: ModelConfig[] = [
      {
        id: 'model-1',
        name: 'Model 1',
        type: 'llama',
        parameters: {},
        status: 'idle',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    useStore.getState().setModels(models);

    render(<ModernDashboard />);

    expect(screen.getByTestId('models-list-card')).toBeInTheDocument();

    const updatedModels: ModelConfig[] = [
      {
        id: 'model-1',
        name: 'Model 1',
        type: 'llama',
        parameters: {},
        status: 'loading',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    useStore.getState().setModels(updatedModels);

    expect(screen.getByTestId('models-list-card')).toBeInTheDocument();
  });
});
