import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { GPUUMetricsCard } from '@/components/charts/GPUUMetricsCard';

describe('GPUUMetricsCard - Partial Data', () => {
  it('handles partial GPU data with only gpuUsage', () => {
    const partialMetrics = {
      gpuUsage: 75,
    };

    render(
      <GPUUMetricsCard
        metrics={partialMetrics as any}
        isDark={false}
      />
    );

    expect(screen.getByText('75.0%')).toBeInTheDocument();
    expect(screen.getByText('No GPU detected')).toBeInTheDocument();
  });

  it('renders data when gpuUsage is defined but gpuName is undefined', () => {
    const metrics = {
      gpuUsage: 75,
      gpuName: undefined,
    };

    render(
      <GPUUMetricsCard
        metrics={metrics as any}
        isDark={false}
      />
    );

    expect(screen.getByText('75.0%')).toBeInTheDocument();
    expect(screen.getByText('No GPU detected')).toBeInTheDocument();
  });

  it('renders data when gpuName is defined but gpuUsage is undefined', () => {
    const metrics = {
      gpuName: 'NVIDIA RTX 4090',
      gpuUsage: undefined,
    };

    render(
      <GPUUMetricsCard
        metrics={metrics as any}
        isDark={false}
      />
    );

    expect(screen.getByText('NVIDIA RTX 4090')).toBeInTheDocument();
    const naElements = screen.getAllByText('N/A');
    expect(naElements.length).toBeGreaterThan(0);
  });

  it('renders fallback UI when both gpuUsage and gpuName are undefined', () => {
    const metrics = {
      gpuUsage: undefined,
      gpuName: undefined,
    };

    render(
      <GPUUMetricsCard
        metrics={metrics as any}
        isDark={false}
      />
    );

    expect(screen.getByText('No GPU data available')).toBeInTheDocument();
  });

  it('renders with only gpuName defined', () => {
    const metrics = {
      gpuName: 'Test GPU',
    };

    render(
      <GPUUMetricsCard
        metrics={metrics as any}
        isDark={false}
      />
    );

    expect(screen.getByText('Test GPU')).toBeInTheDocument();
  });

  it('renders with both gpuUsage and gpuName defined', () => {
    const metrics = {
      gpuUsage: 80,
      gpuName: 'Test GPU',
    };

    render(
      <GPUUMetricsCard
        metrics={metrics as any}
        isDark={false}
      />
    );

    expect(screen.getByText('Test GPU')).toBeInTheDocument();
    expect(screen.getByText('80.0%')).toBeInTheDocument();
  });

  it('renders with only gpuUsage defined and other properties', () => {
    const metrics = {
      gpuUsage: 65,
      gpuMemoryUsed: 8,
      gpuMemoryTotal: 24,
      gpuTemperature: 70,
    };

    render(
      <GPUUMetricsCard
        metrics={metrics as any}
        isDark={false}
      />
    );

    expect(screen.getByText('65.0%')).toBeInTheDocument();
    expect(screen.getByText('No GPU detected')).toBeInTheDocument();
  });
});
