import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { GPUUMetricsCard } from '@/components/charts/GPUUMetricsCard';

describe('GPUUMetricsCard - Basic Rendering', () => {
  const mockMetrics = {
    gpuUsage: 80,
    gpuMemoryUsed: 8,
    gpuMemoryTotal: 24,
    gpuTemperature: 65,
    gpuName: 'NVIDIA RTX 4090',
  };

  it('renders correctly with complete metrics', () => {
    render(
      <GPUUMetricsCard
        metrics={mockMetrics}
        isDark={false}
      />
    );

    expect(screen.getByText('GPU Information')).toBeInTheDocument();
    expect(screen.getByText('NVIDIA RTX 4090')).toBeInTheDocument();
    expect(screen.getByText('80.0%')).toBeInTheDocument();
    expect(screen.getByText('8.0 / 24.0 GB')).toBeInTheDocument();
    expect(screen.getByText('65°C')).toBeInTheDocument();
  });

  it('displays GPU utilization progress bar', () => {
    render(
      <GPUUMetricsCard
        metrics={mockMetrics}
        isDark={false}
      />
    );

    expect(screen.getByText('GPU Utilization')).toBeInTheDocument();
    expect(screen.getByText('80.0%')).toBeInTheDocument();
  });

  it('displays memory usage progress bar', () => {
    render(
      <GPUUMetricsCard
        metrics={mockMetrics}
        isDark={false}
      />
    );

    expect(screen.getByText('Memory Usage')).toBeInTheDocument();
    expect(screen.getByText('8.0 / 24.0 GB')).toBeInTheDocument();
  });

  it('renders CardContent with proper structure', () => {
    render(
      <GPUUMetricsCard
        metrics={mockMetrics}
        isDark={false}
      />
    );

    expect(screen.getByText('GPU Information')).toBeInTheDocument();
    expect(screen.getByText('GPU Performance')).toBeInTheDocument();
    expect(screen.getByText('GPU Name')).toBeInTheDocument();
    expect(screen.getByText('Temperature')).toBeInTheDocument();
  });

  it('renders both GPU name and performance sections', () => {
    render(
      <GPUUMetricsCard
        metrics={mockMetrics}
        isDark={false}
      />
    );

    // Check that both sections are present
    expect(screen.getByText('GPU Name')).toBeInTheDocument();
    expect(screen.getByText('GPU Utilization')).toBeInTheDocument();
    expect(screen.getByText('Memory Usage')).toBeInTheDocument();
    expect(screen.getByText('Temperature')).toBeInTheDocument();
  });
});
