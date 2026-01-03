import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { GPUUMetricsCard } from '@/components/charts/GPUUMetricsCard';

describe('GPUUMetricsCard - Boundary Values', () => {
  it('handles very high GPU usage (100%+)', () => {
    const metricsWithHighUsage = {
      gpuUsage: 105,
      gpuName: 'Test GPU',
    };

    render(
      <GPUUMetricsCard
        metrics={metricsWithHighUsage as any}
        isDark={false}
      />
    );

    expect(screen.getByText('105.0%')).toBeInTheDocument();
  });

  it('handles negative GPU usage', () => {
    const metricsWithNegativeUsage = {
      gpuUsage: -5,
      gpuName: 'Test GPU',
    };

    render(
      <GPUUMetricsCard
        metrics={metricsWithNegativeUsage as any}
        isDark={false}
      />
    );

    expect(screen.getByText('-5.0%')).toBeInTheDocument();
  });

  it('handles GPU usage with many decimal places', () => {
    const metricsWithManyDecimals = {
      gpuUsage: 83.333333333,
      gpuName: 'Test GPU',
    };

    render(
      <GPUUMetricsCard
        metrics={metricsWithManyDecimals as any}
        isDark={false}
      />
    );

    expect(screen.getByText('83.3%')).toBeInTheDocument();
  });

  it('handles very high temperature', () => {
    const metricsWithHighTemp = {
      gpuUsage: 80,
      gpuName: 'Test GPU',
      gpuTemperature: 105,
    };

    render(
      <GPUUMetricsCard
        metrics={metricsWithHighTemp as any}
        isDark={false}
      />
    );

    expect(screen.getByText('105°C')).toBeInTheDocument();
  });

  it('handles negative temperature', () => {
    const metricsWithNegativeTemp = {
      gpuUsage: 80,
      gpuName: 'Test GPU',
      gpuTemperature: -10,
    };

    render(
      <GPUUMetricsCard
        metrics={metricsWithNegativeTemp as any}
        isDark={false}
      />
    );

    expect(screen.getByText('-10°C')).toBeInTheDocument();
  });

  it('handles memory values with many decimals', () => {
    const metricsWithDecimalMemory = {
      gpuUsage: 80,
      gpuName: 'Test GPU',
      gpuMemoryUsed: 8.33333333,
      gpuMemoryTotal: 24.66666666,
    };

    render(
      <GPUUMetricsCard
        metrics={metricsWithDecimalMemory as any}
        isDark={false}
      />
    );

    expect(screen.getByText('8.3 / 24.7 GB')).toBeInTheDocument();
  });

  it('handles memory usage exceeding total', () => {
    const metricsWithExceededMemory = {
      gpuUsage: 80,
      gpuName: 'Test GPU',
      gpuMemoryUsed: 30,
      gpuMemoryTotal: 24,
    };

    render(
      <GPUUMetricsCard
        metrics={metricsWithExceededMemory as any}
        isDark={false}
      />
    );

    expect(screen.getByText('30.0 / 24.0 GB')).toBeInTheDocument();
  });

  it('handles zero memory values', () => {
    const metricsWithZeroMemory = {
      gpuUsage: 0,
      gpuName: 'Test GPU',
      gpuMemoryUsed: 0,
      gpuMemoryTotal: 0,
      gpuTemperature: 0,
    };

    render(
      <GPUUMetricsCard
        metrics={metricsWithZeroMemory as any}
        isDark={false}
      />
    );

    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('handles fractional memory values', () => {
    const metricsWithFractionalMemory = {
      gpuUsage: 80,
      gpuName: 'Test GPU',
      gpuMemoryUsed: 7.5,
      gpuMemoryTotal: 16.0,
    };

    render(
      <GPUUMetricsCard
        metrics={metricsWithFractionalMemory as any}
        isDark={false}
      />
    );

    expect(screen.getByText('7.5 / 16.0 GB')).toBeInTheDocument();
  });

  it('handles temperature values with decimals', () => {
    const metricsWithDecimalTemp = {
      gpuUsage: 80,
      gpuName: 'Test GPU',
      gpuTemperature: 65.5,
    };

    render(
      <GPUUMetricsCard
        metrics={metricsWithDecimalTemp as any}
        isDark={false}
      />
    );

    expect(screen.getByText('66°C')).toBeInTheDocument();
  });
});
