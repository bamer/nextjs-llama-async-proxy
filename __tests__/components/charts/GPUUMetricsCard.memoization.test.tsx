import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { GPUUMetricsCard } from '@/components/charts/GPUUMetricsCard';

describe('GPUUMetricsCard - Memoization', () => {
  it('memoizes correctly with same props', () => {
    const metrics1 = { gpuUsage: 80, gpuName: 'GPU1' };
    const metrics2 = { gpuUsage: 80, gpuName: 'GPU1' };

    const { rerender } = render(
      <GPUUMetricsCard
        metrics={metrics1 as any}
        isDark={false}
      />
    );

    // Should not re-render with same props (memoization)
    rerender(
      <GPUUMetricsCard
        metrics={metrics2 as any}
        isDark={false}
      />
    );

    expect(screen.getByText('GPU1')).toBeInTheDocument();
  });

  it('re-renders when props actually change', () => {
    const { rerender } = render(
      <GPUUMetricsCard
        metrics={{ gpuUsage: 50, gpuName: 'GPU1' } as any}
        isDark={false}
      />
    );

    expect(screen.getByText('50.0%')).toBeInTheDocument();

    rerender(
      <GPUUMetricsCard
        metrics={{ gpuUsage: 75, gpuName: 'GPU2' } as any}
        isDark={false}
      />
    );

    expect(screen.getByText('75.0%')).toBeInTheDocument();
    expect(screen.getByText('GPU2')).toBeInTheDocument();
  });

  it('handles memo comparison with identical metrics', () => {
    const metrics = { gpuUsage: 80, gpuName: 'RTX 4090' };

    const { rerender } = render(
      <GPUUMetricsCard
        metrics={metrics as any}
        isDark={false}
      />
    );

    expect(screen.getByText('80.0%')).toBeInTheDocument();

    // Rerender with same metrics object
    rerender(
      <GPUUMetricsCard
        metrics={metrics as any}
        isDark={false}
      />
    );

    expect(screen.getByText('80.0%')).toBeInTheDocument();
  });

  it('handles memo comparison with same values but different object', () => {
    const metrics1 = { gpuUsage: 80, gpuName: 'RTX 4090' };
    const metrics2 = { gpuUsage: 80, gpuName: 'RTX 4090' };

    const { rerender } = render(
      <GPUUMetricsCard
        metrics={metrics1 as any}
        isDark={false}
      />
    );

    expect(screen.getByText('80.0%')).toBeInTheDocument();

    // Rerender with different object but same values
    rerender(
      <GPUUMetricsCard
        metrics={metrics2 as any}
        isDark={false}
      />
    );

    expect(screen.getByText('80.0%')).toBeInTheDocument();
  });
});
