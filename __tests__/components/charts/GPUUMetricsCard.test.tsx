import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { GPUUMetricsCard } from '@/components/charts/GPUUMetricsCard';

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('GPUUMetricsCard', () => {
  const mockMetrics = {
    cpuUsage: 50,
    memoryUsage: 60,
    diskUsage: 70,
    gpuUsage: 80,
    gpuMemoryUsed: 8,
    gpuMemoryTotal: 24,
    gpuTemperature: 65,
  } as any;

  it('renders correctly', () => {
    renderWithTheme(
      <GPUUMetricsCard
        metrics={mockMetrics}
        isDark={false}
      />
    );

    expect(screen.getByText('GPU Information')).toBeInTheDocument();
  });

  it('displays GPU usage when available', () => {
    renderWithTheme(
      <GPUUMetricsCard
        metrics={mockMetrics}
        isDark={false}
      />
    );

    expect(screen.getByText('80.0%')).toBeInTheDocument();
  });

  it('displays GPU memory usage', () => {
    renderWithTheme(
      <GPUUMetricsCard
        metrics={mockMetrics}
        isDark={false}
      />
    );

    expect(screen.getByText('8.0 / 24.0 GB')).toBeInTheDocument();
  });

  it('displays GPU temperature', () => {
    renderWithTheme(
      <GPUUMetricsCard
        metrics={mockMetrics}
        isDark={false}
      />
    );

    expect(screen.getByText('65°C')).toBeInTheDocument();
  });

  it('shows message when no GPU data available', () => {
    const metricsWithoutGPU = {
      cpuUsage: 50,
      memoryUsage: 60,
      diskUsage: 70,
    } as any;

    renderWithTheme(
      <GPUUMetricsCard
        metrics={metricsWithoutGPU}
        isDark={false}
      />
    );

    expect(screen.getByText('No GPU data available')).toBeInTheDocument();
  });

  it('applies dark mode styling', () => {
    const { container } = renderWithTheme(
      <GPUUMetricsCard
        metrics={mockMetrics}
        isDark={true}
      />
    );

    const card = container.querySelector('.MuiCard-root');
    expect(card).toBeInTheDocument();
  });

  it('handles partial GPU data', () => {
    const partialMetrics = {
      cpuUsage: 50,
      memoryUsage: 60,
      diskUsage: 70,
      gpuUsage: 75,
    } as any;

    renderWithTheme(
      <GPUUMetricsCard
        metrics={partialMetrics}
        isDark={false}
      />
    );

    expect(screen.getByText('75.0%')).toBeInTheDocument();
  });
});
