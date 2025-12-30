import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { GPUUMetricsCard } from '@/components/charts/GPUUMetricsCard';

describe('GPUUMetricsCard', () => {
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

    // Should still render without crashing
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
    // Test with different screen sizes - component should be responsive
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

    expect(screen.getByText('66°C')).toBeInTheDocument(); // Should round to 66
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

  // Additional tests for missing branch coverage
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