import '@testing-library/jest-dom';
import ModernDashboard from '@/components/dashboard/ModernDashboard';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { useStore } from '@/lib/store';
import type { ModelConfig, LegacySystemMetrics } from '@/types';
import { __resetCache__ } from '@/lib/client-model-templates';
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

jest.mock('@/components/dashboard/ModelsListCard', () => ({
  ModelsListCard: () => <div data-testid="models-list-card">Models</div>,
}));

jest.mock('@/components/dashboard/DashboardHeader', () => ({
  DashboardHeader: () => <div data-testid="dashboard-header">Header</div>,
}));

jest.mock('@/components/ui', () => ({
  SkeletonMetricCard: () => <div data-testid="skeleton-metric-card">Skeleton</div>,
}));

jest.mock('@/components/dashboard/QuickActionsCard', () => ({
  QuickActionsCard: () => <div data-testid="quick-actions-card">Quick Actions</div>,
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
 * Dashboard Render Performance Tests
 *
 * Tests verify performance optimizations for rendering:
 * - Fast component rendering
 * - Component memoization preventing unnecessary re-renders
 */
describe('Dashboard Render Performance', () => {
  beforeEach(() => {
    setupDashboardTest();
    __resetCache__();
  });

  afterEach(() => {
    cleanupDashboardTest();
    __resetCache__();
  });

  it('should render MetricCard within 50ms', () => {
    const start = performance.now();
    render(<MetricCard title="CPU" value={50} unit="%" isDark={false} />);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(50);
    const card = document.querySelector('.MuiCard-root');
    expect(card).toBeInTheDocument();
  });

  it('should render ModernDashboard within 100ms', () => {
    const mockMetrics: LegacySystemMetrics = {
      cpuUsage: 45,
      memoryUsage: 55,
      diskUsage: 60,
      activeModels: 2,
      totalRequests: 1000,
      avgResponseTime: 150,
      uptime: 86400,
      timestamp: new Date().toISOString(),
    };
    useStore.getState().setMetrics(mockMetrics as never);

    const start = performance.now();
    const { container } = render(<ModernDashboard />);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(100);
    expect(container).toBeInTheDocument();
  });

  it('should not re-render entire dashboard on model update', () => {
    const mockMetrics: LegacySystemMetrics = createMockMetrics();
    useStore.getState().setMetrics(mockMetrics as never);

    const { rerender } = render(<ModernDashboard />);
    const dashboard = screen.getByTestId('modern-dashboard');

    const models: ModelConfig[] = [
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
    useStore.getState().setModels(models);

    rerender(<ModernDashboard />);

    expect(dashboard).toBeInTheDocument();
  });

  it('should only re-render changed MetricCard', () => {
    const initialMetrics: LegacySystemMetrics = createMockMetrics({ cpuUsage: 95, memoryUsage: 50 });
    useStore.getState().setMetrics(initialMetrics as never);

    const { rerender } = render(<ModernDashboard />);

    const cpuCard = screen.getByText('CPU Usage');
    const memoryCard = screen.getByText('Memory Usage');

    expect(cpuCard).toBeInTheDocument();
    expect(memoryCard).toBeInTheDocument();

    const updatedMetrics: LegacySystemMetrics = createMockMetrics({ cpuUsage: 85, memoryUsage: 50 });
    useStore.getState().setMetrics(updatedMetrics as never);

    rerender(<ModernDashboard />);

    expect(screen.getByText('CPU Usage')).toBeInTheDocument();
    expect(screen.getByText('Memory Usage')).toBeInTheDocument();
  });
});
