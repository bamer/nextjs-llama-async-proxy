import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { GPUUMetricsCard } from '@/components/charts/GPUUMetricsCard';

describe('GPUUMetricsCard - Missing Values', () => {
  it('displays N/A when gpuUsage is undefined', () => {
    const metricsWithoutUsage = {
      gpuName: 'Test GPU',
      gpuMemoryUsed: 8,
      gpuMemoryTotal: 24,
      gpuTemperature: 65,
    };

    render(
      <GPUUMetricsCard
        metrics={metricsWithoutUsage as any}
        isDark={false}
      />
    );

    const naElements = screen.getAllByText('N/A');
    expect(naElements.length).toBeGreaterThan(0);
  });

  it('displays N/A when gpuMemoryUsed is undefined', () => {
    const metricsWithoutMemoryUsed = {
      gpuUsage: 80,
      gpuName: 'Test GPU',
      gpuMemoryTotal: 24,
      gpuTemperature: 65,
    };

    render(
      <GPUUMetricsCard
        metrics={metricsWithoutMemoryUsed as any}
        isDark={false}
      />
    );

    const naElements = screen.getAllByText('N/A');
    expect(naElements.length).toBeGreaterThan(0);
  });

  it('displays N/A when gpuMemoryTotal is undefined', () => {
    const metricsWithoutMemoryTotal = {
      gpuUsage: 80,
      gpuName: 'Test GPU',
      gpuMemoryUsed: 8,
      gpuTemperature: 65,
    };

    render(
      <GPUUMetricsCard
        metrics={metricsWithoutMemoryTotal as any}
        isDark={false}
      />
    );

    const naElements = screen.getAllByText('N/A');
    expect(naElements.length).toBeGreaterThan(0);
  });

  it('handles gpuMemoryTotal of zero (prevents division by zero)', () => {
    const metricsWithZeroMemory = {
      gpuUsage: 80,
      gpuName: 'Test GPU',
      gpuMemoryUsed: 8,
      gpuMemoryTotal: 0,
      gpuTemperature: 65,
    };

    render(
      <GPUUMetricsCard
        metrics={metricsWithZeroMemory as any}
        isDark={false}
      />
    );

    expect(screen.getByText('80.0%')).toBeInTheDocument();
  });

  it('displays N/A when gpuTemperature is undefined', () => {
    const metricsWithoutTemperature = {
      gpuUsage: 80,
      gpuName: 'Test GPU',
      gpuMemoryUsed: 8,
      gpuMemoryTotal: 24,
    };

    render(
      <GPUUMetricsCard
        metrics={metricsWithoutTemperature as any}
        isDark={false}
      />
    );

    const naElements = screen.getAllByText('N/A');
    expect(naElements.length).toBeGreaterThan(0);
  });

  it('renders N/A when gpuUsage is explicitly undefined', () => {
    const metricsWithUndefined = {
      gpuUsage: undefined,
      gpuName: 'Test GPU',
      gpuMemoryUsed: 8,
      gpuMemoryTotal: 24,
      gpuTemperature: 65,
    };

    render(
      <GPUUMetricsCard
        metrics={metricsWithUndefined as any}
        isDark={false}
      />
    );

    const naElements = screen.getAllByText('N/A');
    expect(naElements.length).toBeGreaterThan(0);
  });

  it('renders N/A when gpuMemoryUsed and gpuMemoryTotal are undefined', () => {
    const metricsWithUndefinedMemory = {
      gpuUsage: 80,
      gpuName: 'Test GPU',
      gpuMemoryUsed: undefined,
      gpuMemoryTotal: undefined,
    };

    render(
      <GPUUMetricsCard
        metrics={metricsWithUndefinedMemory as any}
        isDark={false}
      />
    );

    const naElements = screen.getAllByText('N/A');
    expect(naElements.length).toBeGreaterThan(0);
  });

  it('renders N/A when gpuTemperature is undefined', () => {
    const metricsWithUndefinedTemp = {
      gpuUsage: 80,
      gpuName: 'Test GPU',
      gpuMemoryUsed: 8,
      gpuMemoryTotal: 24,
      gpuTemperature: undefined,
    };

    render(
      <GPUUMetricsCard
        metrics={metricsWithUndefinedTemp as any}
        isDark={false}
      />
    );

    const naElements = screen.getAllByText('N/A');
    expect(naElements.length).toBeGreaterThan(0);
  });
});
