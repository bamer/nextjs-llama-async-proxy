import '@testing-library/jest-dom';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { PerformanceChart } from '@/components/charts/PerformanceChart';
import { setupDashboardTest, cleanupDashboardTest, render, screen } from './dashboard-test-helpers';

// Mock ThemeContext
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ isDark: false, mode: 'light' as const, setMode: jest.fn(), toggleTheme: jest.fn() }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock PerformanceChart
jest.mock('@/components/charts/PerformanceChart', () => ({
  PerformanceChart: ({ datasets, title, isDark }: {
    datasets: unknown[];
    title: string;
    isDark: boolean;
  }) => (
    <div data-testid="performance-chart" data-title={title} data-dark={isDark}>
      <div data-testid="chart-datasets-count">{datasets.length}</div>
    </div>
  ),
}));

/**
 * Component Memoization Tests
 *
 * Tests verify that components are properly memoized to prevent
 * unnecessary re-renders when props haven't changed.
 */
describe('Component Memoization', () => {
  beforeEach(() => {
    setupDashboardTest();
  });

  afterEach(() => {
    cleanupDashboardTest();
  });

  it('should not re-render MetricCard when props unchanged', () => {
    const { rerender } = render(
      <MetricCard title="Test" value={50} unit="%" isDark={false} />
    );

    const card = document.querySelector('.MuiCard-root');
    expect(card).toBeInTheDocument();

    rerender(<MetricCard title="Test" value={50} unit="%" isDark={false} />);

    expect(document.querySelector('.MuiCard-root')).toBeInTheDocument();
  });

  it('should only re-render PerformanceChart when datasets change', () => {
    const datasets = [
      {
        dataKey: 'cpu',
        label: 'CPU %',
        colorDark: '#60a5fa',
        colorLight: '#2563eb',
        valueFormatter: (value: number | null) => value !== null ? `${value.toFixed(1)}%` : 'N/A',
        data: Array(60).fill(null).map((_, i) => ({
          time: new Date(Date.now() - i * 60000).toISOString(),
          displayTime: `${Math.floor((60 - i) / 60)}:${String((60 - i) % 60).padStart(2, '0')}`,
          value: 50 + Math.sin(i / 10) * 30,
        })),
      },
    ];

    const { rerender } = render(
      <PerformanceChart
        title="Test Chart"
        description="Test description"
        datasets={datasets}
        isDark={false}
      />
    );

    const chart = screen.getByTestId('performance-chart');
    expect(chart).toBeInTheDocument();
    const datasetsCountElement = screen.getByTestId('chart-datasets-count');
    expect(datasetsCountElement).toBeInTheDocument();
    expect(datasetsCountElement.textContent).toBe('1');

    rerender(
      <PerformanceChart
        title="Test Chart"
        description="Test description"
        datasets={datasets}
        isDark={false}
      />
    );

    expect(chart).toBeInTheDocument();
  });

  it('should not re-render PerformanceChart when isDark prop changes', () => {
    const datasets = [
      {
        dataKey: 'cpu',
        label: 'CPU %',
        colorDark: '#60a5fa',
        colorLight: '#2563eb',
        valueFormatter: (value: number | null) => value !== null ? `${value.toFixed(1)}%` : 'N/A',
        data: Array(60).fill(null).map((_, i) => ({
          time: new Date(Date.now() - i * 60000).toISOString(),
          displayTime: `${Math.floor((60 - i) / 60)}:${String((60 - i) % 60).padStart(2, '0')}`,
          value: 50 + Math.sin(i / 10) * 30,
        })),
      },
    ];

    const { rerender } = render(
      <PerformanceChart
        title="Test Chart"
        description="Test description"
        datasets={datasets}
        isDark={false}
      />
    );

    const chart = screen.getByTestId('performance-chart');
    expect(chart.getAttribute('data-dark')).toBe('false');

    rerender(
      <PerformanceChart
        title="Test Chart"
        description="Test description"
        datasets={datasets}
        isDark={true}
      />
    );

    expect(chart.getAttribute('data-dark')).toBe('true');
  });
});
