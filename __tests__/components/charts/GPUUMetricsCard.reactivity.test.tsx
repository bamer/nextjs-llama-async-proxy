import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { GPUUMetricsCard } from '@/components/charts/GPUUMetricsCard';

describe('GPUUMetricsCard - Reactivity', () => {
  it('updates when metrics change', () => {
    const { rerender } = render(
      <GPUUMetricsCard
        metrics={{ gpuUsage: 50, gpuName: 'Test GPU' } as any}
        isDark={false}
      />
    );

    expect(screen.getByText('50.0%')).toBeInTheDocument();

    rerender(
      <GPUUMetricsCard
        metrics={{ gpuUsage: 75, gpuName: 'Test GPU' } as any}
        isDark={false}
      />
    );

    expect(screen.getByText('75.0%')).toBeInTheDocument();
    expect(screen.queryByText('50.0%')).not.toBeInTheDocument();
  });

  it('updates from no data to data', () => {
    const { rerender } = render(
      <GPUUMetricsCard
        metrics={undefined as any}
        isDark={false}
      />
    );

    expect(screen.getByText('No GPU data available')).toBeInTheDocument();

    rerender(
      <GPUUMetricsCard
        metrics={{ gpuUsage: 80, gpuName: 'Test GPU' } as any}
        isDark={false}
      />
    );

    expect(screen.getByText('80.0%')).toBeInTheDocument();
    expect(screen.queryByText('No GPU data available')).not.toBeInTheDocument();
  });

  it('updates from data to no data', () => {
    const { rerender } = render(
      <GPUUMetricsCard
        metrics={{ gpuUsage: 80, gpuName: 'Test GPU' } as any}
        isDark={false}
      />
    );

    expect(screen.getByText('80.0%')).toBeInTheDocument();

    rerender(
      <GPUUMetricsCard
        metrics={undefined as any}
        isDark={false}
      />
    );

    expect(screen.getByText('No GPU data available')).toBeInTheDocument();
    expect(screen.queryByText('80.0%')).not.toBeInTheDocument();
  });

  it('renders correctly on different viewport sizes', () => {
    const metrics = {
      gpuUsage: 80,
      gpuMemoryUsed: 8,
      gpuMemoryTotal: 24,
      gpuTemperature: 65,
      gpuName: 'RTX 4090',
    };

    // Test with mobile viewport
    window.innerWidth = 375;
    window.dispatchEvent(new Event('resize'));

    const { rerender } = render(
      <GPUUMetricsCard
        metrics={metrics as any}
        isDark={false}
      />
    );

    expect(screen.getByText('RTX 4090')).toBeInTheDocument();
    expect(screen.getByText('80.0%')).toBeInTheDocument();

    // Test with desktop viewport
    window.innerWidth = 1920;
    window.dispatchEvent(new Event('resize'));

    rerender(
      <GPUUMetricsCard
        metrics={metrics as any}
        isDark={false}
      />
    );

    expect(screen.getByText('RTX 4090')).toBeInTheDocument();
    expect(screen.getByText('80.0%')).toBeInTheDocument();
  });

  it('updates when isDark changes with same metrics', () => {
    const metrics = { gpuUsage: 80, gpuName: 'RTX 4090' };

    const { rerender } = render(
      <GPUUMetricsCard
        metrics={metrics as any}
        isDark={false}
      />
    );

    expect(screen.getByText('80.0%')).toBeInTheDocument();

    rerender(
      <GPUUMetricsCard
        metrics={metrics as any}
        isDark={true}
      />
    );

    expect(screen.getByText('80.0%')).toBeInTheDocument();
  });
});
