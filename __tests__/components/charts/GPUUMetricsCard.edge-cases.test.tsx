import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { GPUUMetricsCard } from '@/components/charts/GPUUMetricsCard';

describe('GPUUMetricsCard - Edge Cases', () => {
  it('shows "No GPU data available" when metrics is null', () => {
    render(
      <GPUUMetricsCard
        metrics={null as any}
        isDark={false}
      />
    );

    expect(screen.getByText('No GPU data available')).toBeInTheDocument();
  });

  it('shows "No GPU data available" when metrics is undefined', () => {
    render(
      <GPUUMetricsCard
        metrics={undefined as any}
        isDark={false}
      />
    );

    expect(screen.getByText('No GPU data available')).toBeInTheDocument();
  });

  it('shows "No GPU data available" when metrics is empty object', () => {
    render(
      <GPUUMetricsCard
        metrics={{}}
        isDark={false}
      />
    );

    expect(screen.getByText('No GPU data available')).toBeInTheDocument();
  });

  it('shows "No GPU detected" when gpuName is not provided', () => {
    const metricsWithoutName = {
      gpuUsage: 80,
      gpuMemoryUsed: 8,
      gpuMemoryTotal: 24,
      gpuTemperature: 65,
    };

    render(
      <GPUUMetricsCard
        metrics={metricsWithoutName as any}
        isDark={false}
      />
    );

    expect(screen.getByText('No GPU detected')).toBeInTheDocument();
  });

  it('handles special characters in GPU name', () => {
    const metricsWithSpecialName = {
      gpuUsage: 75,
      gpuName: 'NVIDIA® GeForce® RTX™ 4090',
    };

    render(
      <GPUUMetricsCard
        metrics={metricsWithSpecialName as any}
        isDark={false}
      />
    );

    expect(screen.getByText('NVIDIA® GeForce® RTX™ 4090')).toBeInTheDocument();
  });

  it('handles null metrics explicitly', () => {
    render(
      <GPUUMetricsCard
        metrics={null as any}
        isDark={false}
      />
    );

    expect(screen.getByText('No GPU data available')).toBeInTheDocument();
  });

  it('handles empty object metrics explicitly', () => {
    render(
      <GPUUMetricsCard
        metrics={{}}
        isDark={false}
      />
    );

    expect(screen.getByText('No GPU data available')).toBeInTheDocument();
  });

  it('handles very long GPU names', () => {
    const metricsWithLongName = {
      gpuUsage: 80,
      gpuName: 'This is a very long GPU name that might cause text wrapping issues in the component',
    };

    render(
      <GPUUMetricsCard
        metrics={metricsWithLongName as any}
        isDark={false}
      />
    );

    expect(screen.getByText('This is a very long GPU name that might cause text wrapping issues in the component')).toBeInTheDocument();
  });

  it('handles GPU name with numbers and special characters', () => {
    const metricsWithComplexName = {
      gpuUsage: 80,
      gpuName: 'NVIDIA GeForce RTX 4090 Ti (8GB GDDR6X)',
    };

    render(
      <GPUUMetricsCard
        metrics={metricsWithComplexName as any}
        isDark={false}
      />
    );

    expect(screen.getByText('NVIDIA GeForce RTX 4090 Ti (8GB GDDR6X)')).toBeInTheDocument();
  });
});
