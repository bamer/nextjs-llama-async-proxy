import '@testing-library/jest-dom';
import ModernDashboard from '@/components/dashboard/ModernDashboard';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { useStore } from '@/lib/store';
import type { ModelConfig, LegacySystemMetrics } from '@/types';
import { setupDashboardTest, cleanupDashboardTest, createMockMetrics, render, screen } from './dashboard-test-helpers';

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
    cpu: [],
    memory: [],
    requests: [],
    gpuUtil: [],
    power: [],
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

/**
 * Performance Benchmarking Tests
 *
 * Tests verify that performance benchmarks are met for various scenarios.
 */
describe('Performance Benchmarking', () => {
  beforeEach(() => {
    setupDashboardTest();
  });

  afterEach(() => {
    cleanupDashboardTest();
  });

  it('should render dashboard with 10 models within 150ms', () => {
    const models: ModelConfig[] = Array(10).fill(null).map((_, i) => ({
      id: `model-${i}`,
      name: `Model ${i}`,
      type: 'llama',
      parameters: {},
      status: i % 2 === 0 ? ('running' as const) : ('idle' as const),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    useStore.getState().setModels(models);

    const start = performance.now();
    render(<ModernDashboard />);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(150);
    expect(screen.getByTestId('models-list-card')).toBeInTheDocument();
  });

  it('should handle chart data updates without blocking', () => {
    const mockMetrics: LegacySystemMetrics = createMockMetrics();
    useStore.getState().setMetrics(mockMetrics as never);

    render(<ModernDashboard />);

    const startTime = performance.now();

    for (let i = 0; i < 50; i++) {
      useStore.getState().addChartData('cpu', 50 + Math.random() * 50);
      useStore.getState().addChartData('memory', 60 + Math.random() * 40);
      useStore.getState().addChartData('requests', 100 + Math.random() * 100);
    }

    const duration = performance.now() - startTime;

    expect(duration).toBeLessThan(100);
  });

  it('should maintain performance with multiple metric cards', () => {
    const start = performance.now();

    render(
      <div>
        <MetricCard title="CPU" value={50} unit="%" isDark={false} />
        <MetricCard title="Memory" value={60} unit="%" isDark={false} />
        <MetricCard title="Disk" value={70} unit="%" isDark={false} />
        <MetricCard title="Network" value={30} unit="Mbps" isDark={false} />
      </div>
    );

    const duration = performance.now() - start;

    expect(duration).toBeLessThan(100);
    const cards = document.querySelectorAll('.MuiCard-root');
    expect(cards.length).toBeGreaterThanOrEqual(4);
  });
});
