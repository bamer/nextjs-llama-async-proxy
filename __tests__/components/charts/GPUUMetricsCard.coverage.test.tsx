import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { GPUUMetricsCard } from '@/components/charts/GPUUMetricsCard';

describe('GPUUMetricsCard - Coverage Enhancements', () => {
  // Test empty metrics with all optional fields missing
  it('renders fallback UI when all optional metrics are undefined', () => {
    render(
      <GPUUMetricsCard
        metrics={{}}
        isDark={false}
      />
    );

    expect(screen.getByText('No GPU data available')).toBeInTheDocument();
  });

  // Test metrics with only gpuUsage (missing others)
  it('renders with only gpuUsage defined', () => {
    render(
      <GPUUMetricsCard
        metrics={{ gpuUsage: 75 } as any}
        isDark={false}
      />
    );

    expect(screen.getByText('75.0%')).toBeInTheDocument();
    expect(screen.getByText('No GPU detected')).toBeInTheDocument();
  });

  // Test metrics with only gpuName (missing others)
  it('renders with only gpuName defined', () => {
    render(
      <GPUUMetricsCard
        metrics={{ gpuName: 'Test GPU' } as any}
        isDark={false}
      />
    );

    expect(screen.getByText('Test GPU')).toBeInTheDocument();
    expect(screen.queryByText('%')).not.toBeInTheDocument();
  });

  // Test metrics with only gpuTemperature
  it('renders with only gpuTemperature defined', () => {
    render(
      <GPUUMetricsCard
        metrics={{ gpuTemperature: 65 } as any}
        isDark={false}
      />
    );

    expect(screen.getByText('65°C')).toBeInTheDocument();
    expect(screen.getByText('No GPU detected')).toBeInTheDocument();
  });

  // Test metrics with only gpuMemoryUsed
  it('renders with only gpuMemoryUsed defined', () => {
    render(
      <GPUUMetricsCard
        metrics={{ gpuMemoryUsed: 8 } as any}
        isDark={false}
      />
    );

    expect(screen.getByText('No GPU data available')).toBeInTheDocument();
  });

  // Test metrics with only gpuMemoryTotal
  it('renders with only gpuMemoryTotal defined', () => {
    render(
      <GPUUMetricsCard
        metrics={{ gpuMemoryTotal: 24 } as any}
        isDark={false}
      />
    );

    expect(screen.getByText('No GPU data available')).toBeInTheDocument();
  });

  // Test dark mode styling with empty metrics
  it('renders empty state with dark mode styling', () => {
    render(
      <GPUUMetricsCard
        metrics={{}}
        isDark={true}
      />
    );

    expect(screen.getByText('No GPU data available')).toBeInTheDocument();
  });

  // Test with gpuUsage and gpuMemory but no totals
  it('renders partial memory data without total', () => {
    render(
      <GPUUMetricsCard
        metrics={{ gpuUsage: 80, gpuMemoryUsed: 8 } as any}
        isDark={false}
      />
    );

    expect(screen.getByText('80.0%')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  // Test with gpuUsage and gpuMemoryTotal but no used
  it('renders partial memory data without used value', () => {
    render(
      <GPUUMetricsCard
        metrics={{ gpuUsage: 80, gpuMemoryTotal: 24 } as any}
        isDark={false}
      />
    );

    expect(screen.getByText('80.0%')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  // Test memoization with isDark change
  it('re-renders when isDark prop changes', () => {
    const { rerender } = render(
      <GPUUMetricsCard
        metrics={{ gpuUsage: 75, gpuName: 'Test GPU' } as any}
        isDark={false}
      />
    );

    expect(screen.getByText('Test GPU')).toBeInTheDocument();

    rerender(
      <GPUUMetricsCard
        metrics={{ gpuUsage: 75, gpuName: 'Test GPU' } as any}
        isDark={true}
      />
    );

    expect(screen.getByText('Test GPU')).toBeInTheDocument();
  });

  // Test boundary case: gpuUsage = 0
  it('handles gpuUsage of exactly 0', () => {
    render(
      <GPUUMetricsCard
        metrics={{ gpuUsage: 0, gpuName: 'Test GPU' } as any}
        isDark={false}
      />
    );

    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  // Test boundary case: gpuTemperature = 0
  it('handles gpuTemperature of exactly 0', () => {
    render(
      <GPUUMetricsCard
        metrics={{ gpuUsage: 50, gpuName: 'Test GPU', gpuTemperature: 0 } as any}
        isDark={false}
      />
    );

    expect(screen.getByText('0°C')).toBeInTheDocument();
  });

  // Test boundary case: gpuMemoryUsed = 0 with total
  it('handles gpuMemoryUsed of exactly 0 with total', () => {
    render(
      <GPUUMetricsCard
        metrics={{ gpuUsage: 50, gpuName: 'Test GPU', gpuMemoryUsed: 0, gpuMemoryTotal: 24 } as any}
        isDark={false}
      />
    );

    expect(screen.getByText('0.0 / 24.0 GB')).toBeInTheDocument();
  });

  // Test all N/A state
  it('shows N/A for all metrics when none defined except name', () => {
    render(
      <GPUUMetricsCard
        metrics={{ gpuName: 'Test GPU' } as any}
        isDark={false}
      />
    );

    const naElements = screen.getAllByText('N/A');
    expect(naElements.length).toBeGreaterThanOrEqual(3); // usage, memory, temperature
  });

  // Test undefined vs null distinction
  it('handles undefined metrics the same as null metrics', () => {
    const { rerender } = render(
      <GPUUMetricsCard
        metrics={undefined as any}
        isDark={false}
      />
    );

    expect(screen.getByText('No GPU data available')).toBeInTheDocument();

    rerender(
      <GPUUMetricsCard
        metrics={null as any}
        isDark={false}
      />
    );

    expect(screen.getByText('No GPU data available')).toBeInTheDocument();
  });

  // Test extremely long GPU name with data
  it('handles very long GPU names alongside metrics', () => {
    const longName = 'NVIDIA GeForce RTX 4090 Ti with a very long description that might wrap';
    render(
      <GPUUMetricsCard
        metrics={{ gpuUsage: 75, gpuName: longName } as any}
        isDark={false}
      />
    );

    expect(screen.getByText(longName)).toBeInTheDocument();
    expect(screen.getByText('75.0%')).toBeInTheDocument();
  });

  // Test memo equality with same props
  it('does not re-render when props are identical', () => {
    const metrics = { gpuUsage: 80, gpuName: 'Test GPU' };
    const { rerender } = render(
      <GPUUMetricsCard
        metrics={metrics as any}
        isDark={false}
      />
    );

    const gpuNameElement = screen.getByText('Test GPU');

    rerender(
      <GPUUMetricsCard
        metrics={metrics as any}
        isDark={false}
      />
    );

    // Element should still exist (no unmount/remount)
    expect(screen.getByText('Test GPU')).toBe(gpuNameElement);
  });

  // Test transition from data to empty to data
  it('handles data -> empty -> data transitions', () => {
    const { rerender } = render(
      <GPUUMetricsCard
        metrics={{ gpuUsage: 80, gpuName: 'GPU1' } as any}
        isDark={false}
      />
    );

    expect(screen.getByText('GPU1')).toBeInTheDocument();

    rerender(
      <GPUUMetricsCard
        metrics={{}}
        isDark={false}
      />
    );

    expect(screen.getByText('No GPU data available')).toBeInTheDocument();

    rerender(
      <GPUUMetricsCard
        metrics={{ gpuUsage: 75, gpuName: 'GPU2' } as any}
        isDark={false}
      />
    );

    expect(screen.getByText('GPU2')).toBeInTheDocument();
    expect(screen.queryByText('No GPU data available')).not.toBeInTheDocument();
  });
});
