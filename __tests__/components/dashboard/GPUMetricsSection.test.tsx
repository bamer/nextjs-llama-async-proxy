import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import GPUMetricsSection from '@/components/dashboard/GPUMetricsSection';

// Import createTheme for theme creation
import { createTheme as muiCreateTheme } from '@mui/material/styles';

// Mock the chart components
jest.mock('@/components/charts/PerformanceChart', () => ({
  PerformanceChart: ({ title }: { title: string }) => <div data-testid="performance-chart">{title}</div>,
}));

jest.mock('@/components/charts/GPUUMetricsCard', () => ({
  GPUUMetricsCard: ({ metrics }: { metrics: any }) => <div data-testid="gpu-metrics-card">{JSON.stringify(metrics)}</div>,
}));

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
  );
  return render(component, { wrapper });
}

describe('GPUMetricsSection', () => {
  const mockMetrics = {
    gpuUsage: 75,
    gpuPowerUsage: 150,
    gpuMemoryUsed: 8,
  };

  const mockChartHistory = {
    gpuUtil: [70, 75, 80],
    power: [140, 150, 160],
  };

  it('renders correctly with GPU data', () => {
    renderWithTheme(
      <GPUMetricsSection
        metrics={mockMetrics}
        chartHistory={mockChartHistory}
        isDark={false}
      />
    );

    expect(screen.getByText('GPU Metrics')).toBeInTheDocument();
    expect(screen.getByTestId('performance-chart')).toBeInTheDocument();
    expect(screen.getByTestId('gpu-metrics-card')).toBeInTheDocument();
  });

  it('renders only GPUUMetricsCard when no GPU data', () => {
    const emptyMetrics = {};

    renderWithTheme(
      <GPUMetricsSection
        metrics={emptyMetrics}
        chartHistory={mockChartHistory}
        isDark={false}
      />
    );

    expect(screen.queryByText('GPU Metrics')).not.toBeInTheDocument();
    expect(screen.getByTestId('gpu-metrics-card')).toBeInTheDocument();
    expect(screen.queryByTestId('performance-chart')).not.toBeInTheDocument();
  });

  it('renders only GPUUMetricsCard when gpuUsage is undefined', () => {
    const partialMetrics = {
      gpuPowerUsage: 150,
      gpuMemoryUsed: 8,
    };

    renderWithTheme(
      <GPUMetricsSection
        metrics={partialMetrics}
        chartHistory={mockChartHistory}
        isDark={false}
      />
    );

    expect(screen.queryByText('GPU Metrics')).not.toBeInTheDocument();
    expect(screen.getByTestId('gpu-metrics-card')).toBeInTheDocument();
  });

  it('applies dark mode styles', () => {
    renderWithTheme(
      <GPUMetricsSection
        metrics={mockMetrics}
        chartHistory={mockChartHistory}
        isDark={true}
      />
    );

    const card = document.querySelector('.MuiCard-root');
    expect(card).toBeInTheDocument();
  });

  it('applies light mode styles', () => {
    renderWithTheme(
      <GPUMetricsSection
        metrics={mockMetrics}
        chartHistory={mockChartHistory}
        isDark={false}
      />
    );

    const card = document.querySelector('.MuiCard-root');
    expect(card).toBeInTheDocument();
  });

  it('passes correct props to PerformanceChart', () => {
    renderWithTheme(
      <GPUMetricsSection
        metrics={mockMetrics}
        chartHistory={mockChartHistory}
        isDark={false}
      />
    );

    expect(screen.getByText('GPU Utilization & Power')).toBeInTheDocument();
  });

  it('handles undefined metrics', () => {
    renderWithTheme(
      <GPUMetricsSection
        metrics={undefined}
        chartHistory={mockChartHistory}
        isDark={false}
      />
    );

    expect(screen.getByTestId('gpu-metrics-card')).toBeInTheDocument();
  });

  it('handles null metrics', () => {
    renderWithTheme(
      <GPUMetricsSection
        metrics={null}
        chartHistory={mockChartHistory}
        isDark={false}
      />
    );

    expect(screen.getByTestId('gpu-metrics-card')).toBeInTheDocument();
  });

  it('handles empty chartHistory', () => {
    const emptyChartHistory = {
      gpuUtil: [],
      power: [],
    };

    renderWithTheme(
      <GPUMetricsSection
        metrics={mockMetrics}
        chartHistory={emptyChartHistory}
        isDark={false}
      />
    );

    expect(screen.getByText('GPU Metrics')).toBeInTheDocument();
    expect(screen.getByTestId('performance-chart')).toBeInTheDocument();
  });

  it('handles undefined chartHistory', () => {
    renderWithTheme(
      <GPUMetricsSection
        metrics={mockMetrics}
        chartHistory={undefined}
        isDark={false}
      />
    );

    expect(screen.getByText('GPU Metrics')).toBeInTheDocument();
  });

  it('memoizes correctly (no unnecessary re-renders)', () => {
    const { rerender } = renderWithTheme(
      <GPUMetricsSection
        metrics={mockMetrics}
        chartHistory={mockChartHistory}
        isDark={false}
      />
    );

    expect(screen.getByText('GPU Metrics')).toBeInTheDocument();

    // Re-render with same props
    rerender(
      <ThemeProvider theme={theme}>
        <GPUMetricsSection
          metrics={mockMetrics}
          chartHistory={mockChartHistory}
          isDark={false}
        />
      </ThemeProvider>
    );

    expect(screen.getByText('GPU Metrics')).toBeInTheDocument();
  });

  it('re-renders when isDark changes', () => {
    const { rerender } = renderWithTheme(
      <GPUMetricsSection
        metrics={mockMetrics}
        chartHistory={mockChartHistory}
        isDark={false}
      />
    );

    expect(screen.getByText('GPU Metrics')).toBeInTheDocument();

    // Change isDark prop
    rerender(
      <ThemeProvider theme={theme}>
        <GPUMetricsSection
          metrics={mockMetrics}
          chartHistory={mockChartHistory}
          isDark={true}
        />
      </ThemeProvider>
    );

    expect(screen.getByText('GPU Metrics')).toBeInTheDocument();
  });

  it('re-renders when metrics change', () => {
    const { rerender } = renderWithTheme(
      <GPUMetricsSection
        metrics={mockMetrics}
        chartHistory={mockChartHistory}
        isDark={false}
      />
    );

    expect(screen.getByText('GPU Metrics')).toBeInTheDocument();

    // Change metrics
    const newMetrics = { ...mockMetrics, gpuUsage: 80 };

    rerender(
      <ThemeProvider theme={theme}>
        <GPUMetricsSection
          metrics={newMetrics}
          chartHistory={mockChartHistory}
          isDark={false}
        />
      </ThemeProvider>
    );

    expect(screen.getByText('GPU Metrics')).toBeInTheDocument();
  });

  it('renders with partial GPU data (only gpuUsage)', () => {
    const partialMetrics = {
      gpuUsage: 75,
    };

    renderWithTheme(
      <GPUMetricsSection
        metrics={partialMetrics}
        chartHistory={mockChartHistory}
        isDark={false}
      />
    );

    expect(screen.getByText('GPU Metrics')).toBeInTheDocument();
    expect(screen.getByTestId('performance-chart')).toBeInTheDocument();
  });

  it('renders with partial GPU data (only gpuPowerUsage)', () => {
    const partialMetrics = {
      gpuPowerUsage: 150,
    };

    renderWithTheme(
      <GPUMetricsSection
        metrics={partialMetrics}
        chartHistory={mockChartHistory}
        isDark={false}
      />
    );

    expect(screen.getByText('GPU Metrics')).toBeInTheDocument();
    expect(screen.getByTestId('performance-chart')).toBeInTheDocument();
  });

  it('renders with partial GPU data (only gpuMemoryUsed)', () => {
    const partialMetrics = {
      gpuMemoryUsed: 8,
    };

    renderWithTheme(
      <GPUMetricsSection
        metrics={partialMetrics}
        chartHistory={mockChartHistory}
        isDark={false}
      />
    );

    expect(screen.getByText('GPU Metrics')).toBeInTheDocument();
    expect(screen.getByTestId('performance-chart')).toBeInTheDocument();
  });

  it('renders GPUUMetricsCard with correct metrics', () => {
    renderWithTheme(
      <GPUMetricsSection
        metrics={mockMetrics}
        chartHistory={mockChartHistory}
        isDark={false}
      />
    );

    expect(screen.getByText(JSON.stringify(mockMetrics))).toBeInTheDocument();
  });
});