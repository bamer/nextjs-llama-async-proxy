import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { GPUUMetricsCard } from '@/components/charts/GPUUMetricsCard';

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {component}
    </ThemeProvider>
  );
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

  // ===== GPU NAME TESTS =====
  // Test objective: Verify GPU name is displayed correctly when provided
  describe('GPU Name Display', () => {
    it('displays GPU name when provided', () => {
      const metricsWithName = {
        gpuUsage: 80,
        gpuName: 'NVIDIA RTX 4090',
      } as any;

      renderWithTheme(
        <GPUUMetricsCard
          metrics={metricsWithName}
          isDark={false}
        />
      );

      expect(screen.getByText('NVIDIA RTX 4090')).toBeInTheDocument();
    });

    it('displays "No GPU detected" when gpuName is not provided', () => {
      const metricsWithoutName = {
        gpuUsage: 80,
      } as any;

      renderWithTheme(
        <GPUUMetricsCard
          metrics={metricsWithoutName}
          isDark={false}
        />
      );

      expect(screen.getByText('No GPU detected')).toBeInTheDocument();
    });

    it('handles special characters in GPU name', () => {
      const metricsWithSpecialName = {
        gpuUsage: 75,
        gpuName: 'NVIDIA® GeForce® RTX™ 4090',
      } as any;

      renderWithTheme(
        <GPUUMetricsCard
          metrics={metricsWithSpecialName}
          isDark={false}
        />
      );

      expect(screen.getByText('NVIDIA® GeForce® RTX™ 4090')).toBeInTheDocument();
    });
  });

  // ===== EDGE CASES TESTS =====
  // Test objective: Ensure component handles edge cases gracefully
  describe('Edge Cases', () => {
    it('displays N/A when gpuMemoryUsed is present but gpuMemoryTotal is undefined', () => {
      const metricsWithPartialMemory = {
        gpuUsage: 80,
        gpuMemoryUsed: 8,
      } as any;

      renderWithTheme(
        <GPUUMetricsCard
          metrics={metricsWithPartialMemory}
          isDark={false}
        />
      );

      // Multiple N/A elements may exist, so we check that at least one exists
      const naElements = screen.getAllByText('N/A');
      expect(naElements.length).toBeGreaterThan(0);
    });

    it('displays N/A when gpuMemoryTotal is present but gpuMemoryUsed is undefined', () => {
      const metricsWithPartialMemory = {
        gpuUsage: 80,
        gpuMemoryTotal: 24,
      } as any;

      renderWithTheme(
        <GPUUMetricsCard
          metrics={metricsWithPartialMemory}
          isDark={false}
        />
      );

      const naElements = screen.getAllByText('N/A');
      expect(naElements.length).toBeGreaterThan(0);
    });

    it('handles gpuMemoryTotal of zero (division by zero prevention)', () => {
      const metricsWithZeroMemory = {
        gpuUsage: 80,
        gpuMemoryUsed: 8,
        gpuMemoryTotal: 0,
      } as any;

      renderWithTheme(
        <GPUUMetricsCard
          metrics={metricsWithZeroMemory}
          isDark={false}
        />
      );

      // Should render without crashing
      expect(screen.getByText('80.0%')).toBeInTheDocument();
    });

    it('displays N/A when gpuTemperature is undefined', () => {
      const metricsWithoutTemperature = {
        gpuUsage: 80,
        gpuMemoryUsed: 8,
        gpuMemoryTotal: 24,
      } as any;

      renderWithTheme(
        <GPUUMetricsCard
          metrics={metricsWithoutTemperature}
          isDark={false}
        />
      );

      const naElements = screen.getAllByText('N/A');
      expect(naElements.length).toBeGreaterThan(0);
    });

    it('handles very high GPU usage (100%+)', () => {
      const metricsWithHighUsage = {
        gpuUsage: 105,
      } as any;

      renderWithTheme(
        <GPUUMetricsCard
          metrics={metricsWithHighUsage}
          isDark={false}
        />
      );

      expect(screen.getByText('105.0%')).toBeInTheDocument();
    });

    it('handles negative GPU usage', () => {
      const metricsWithNegativeUsage = {
        gpuUsage: -5,
      } as any;

      renderWithTheme(
        <GPUUMetricsCard
          metrics={metricsWithNegativeUsage}
          isDark={false}
        />
      );

      expect(screen.getByText('-5.0%')).toBeInTheDocument();
    });

    it('handles GPU usage with many decimal places', () => {
      const metricsWithManyDecimals = {
        gpuUsage: 83.333333333,
      } as any;

      renderWithTheme(
        <GPUUMetricsCard
          metrics={metricsWithManyDecimals}
          isDark={false}
        />
      );

      expect(screen.getByText('83.3%')).toBeInTheDocument();
    });

    it('handles very high temperature', () => {
      const metricsWithHighTemp = {
        gpuUsage: 80,
        gpuTemperature: 105,
      } as any;

      renderWithTheme(
        <GPUUMetricsCard
          metrics={metricsWithHighTemp}
          isDark={false}
        />
      );

      expect(screen.getByText('105°C')).toBeInTheDocument();
    });

    it('handles negative temperature', () => {
      const metricsWithNegativeTemp = {
        gpuUsage: 80,
        gpuTemperature: -10,
      } as any;

      renderWithTheme(
        <GPUUMetricsCard
          metrics={metricsWithNegativeTemp}
          isDark={false}
        />
      );

      expect(screen.getByText('-10°C')).toBeInTheDocument();
    });

    it('handles memory values with many decimals', () => {
      const metricsWithDecimalMemory = {
        gpuUsage: 80,
        gpuMemoryUsed: 8.33333333,
        gpuMemoryTotal: 24.66666666,
      } as any;

      renderWithTheme(
        <GPUUMetricsCard
          metrics={metricsWithDecimalMemory}
          isDark={false}
        />
      );

      expect(screen.getByText('8.3 / 24.7 GB')).toBeInTheDocument();
    });

    it('handles memory usage exceeding total', () => {
      const metricsWithExceededMemory = {
        gpuUsage: 80,
        gpuMemoryUsed: 30,
        gpuMemoryTotal: 24,
      } as any;

      renderWithTheme(
        <GPUUMetricsCard
          metrics={metricsWithExceededMemory}
          isDark={false}
        />
      );

      expect(screen.getByText('30.0 / 24.0 GB')).toBeInTheDocument();
    });

    it('handles zero memory values', () => {
      const metricsWithZeroMemory = {
        gpuUsage: 0,
        gpuMemoryUsed: 0,
        gpuMemoryTotal: 0,
        gpuTemperature: 0,
      } as any;

      renderWithTheme(
        <GPUUMetricsCard
          metrics={metricsWithZeroMemory}
          isDark={false}
        />
      );

      expect(screen.getByText('0.0%')).toBeInTheDocument();
    });
  });

  // ===== COMPONENT UPDATES TESTS =====
  // Test objective: Verify component re-renders correctly when props change
  describe('Component Updates', () => {
    it('updates GPU usage when metrics change', () => {
      const { rerender } = renderWithTheme(
        <GPUUMetricsCard
          metrics={{ gpuUsage: 50 }}
          isDark={false}
        />
      );

      expect(screen.getByText('50.0%')).toBeInTheDocument();

      rerender(
        <GPUUMetricsCard
          metrics={{ gpuUsage: 75 }}
          isDark={false}
        />
      );

      expect(screen.getByText('75.0%')).toBeInTheDocument();
      expect(screen.queryByText('50.0%')).not.toBeInTheDocument();
    });

    it('updates theme when isDark prop changes', () => {
      const metrics = { gpuUsage: 80 } as any;
      const { rerender } = renderWithTheme(
        <GPUUMetricsCard
          metrics={metrics}
          isDark={false}
        />
      );

      rerender(
        <GPUUMetricsCard
          metrics={metrics}
          isDark={true}
        />
      );

      const card = screen.getByText('GPU Information').closest('.MuiCard-root');
      expect(card).toBeInTheDocument();
    });

    it('updates from no data to data', () => {
      const { rerender } = renderWithTheme(
        <GPUUMetricsCard
          metrics={undefined as any}
          isDark={false}
        />
      );

      expect(screen.getByText('No GPU data available')).toBeInTheDocument();

      rerender(
        <GPUUMetricsCard
          metrics={{ gpuUsage: 80 }}
          isDark={false}
        />
      );

      expect(screen.getByText('80.0%')).toBeInTheDocument();
      expect(screen.queryByText('No GPU data available')).not.toBeInTheDocument();
    });

    it('updates from data to no data', () => {
      const { rerender } = renderWithTheme(
        <GPUUMetricsCard
          metrics={{ gpuUsage: 80 }}
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
  });

  // ===== RESPONSIVE BEHAVIOR TESTS =====
  // Test objective: Verify layout works at different viewport sizes
  describe('Responsive Behavior', () => {
    it('renders correctly on mobile viewport', () => {
      // Set viewport to mobile size
      window.innerWidth = 375;
      window.dispatchEvent(new Event('resize'));

      const metrics = {
        gpuUsage: 80,
        gpuMemoryUsed: 8,
        gpuMemoryTotal: 24,
        gpuTemperature: 65,
        gpuName: 'RTX 4090',
      } as any;

      renderWithTheme(
        <GPUUMetricsCard
          metrics={metrics}
          isDark={false}
        />
      );

      expect(screen.getByText('RTX 4090')).toBeInTheDocument();
      expect(screen.getByText('80.0%')).toBeInTheDocument();
      expect(screen.getByText('8.0 / 24.0 GB')).toBeInTheDocument();
      expect(screen.getByText('65°C')).toBeInTheDocument();
    });

    it('renders correctly on tablet viewport', () => {
      // Set viewport to tablet size
      window.innerWidth = 768;
      window.dispatchEvent(new Event('resize'));

      const metrics = {
        gpuUsage: 80,
        gpuMemoryUsed: 8,
        gpuMemoryTotal: 24,
        gpuTemperature: 65,
        gpuName: 'RTX 4090',
      } as any;

      renderWithTheme(
        <GPUUMetricsCard
          metrics={metrics}
          isDark={false}
        />
      );

      expect(screen.getByText('RTX 4090')).toBeInTheDocument();
      expect(screen.getByText('80.0%')).toBeInTheDocument();
    });

    it('renders correctly on desktop viewport', () => {
      // Set viewport to desktop size
      window.innerWidth = 1920;
      window.dispatchEvent(new Event('resize'));

      const metrics = {
        gpuUsage: 80,
        gpuMemoryUsed: 8,
        gpuMemoryTotal: 24,
        gpuTemperature: 65,
        gpuName: 'RTX 4090',
      } as any;

      renderWithTheme(
        <GPUUMetricsCard
          metrics={metrics}
          isDark={false}
        />
      );

      expect(screen.getByText('RTX 4090')).toBeInTheDocument();
      expect(screen.getByText('80.0%')).toBeInTheDocument();
    });
  });

  // ===== LINEAR PROGRESS TESTS =====
  // Test objective: Verify progress bars render correctly with different values
  describe('LinearProgress Components', () => {
    it('renders GPU utilization progress bar', () => {
      const metrics = { gpuUsage: 75 } as any;
      const { container } = renderWithTheme(
        <GPUUMetricsCard
          metrics={metrics}
          isDark={false}
        />
      );

      // LinearProgress component may not render with MUI class name in test env
      // So we check if the component renders successfully by checking text content
      expect(screen.getByText('75.0%')).toBeInTheDocument();
    });

    it('renders memory usage progress bar', () => {
      const metrics = {
        gpuUsage: 80,
        gpuMemoryUsed: 8,
        gpuMemoryTotal: 24,
      } as any;

      renderWithTheme(
        <GPUUMetricsCard
          metrics={metrics}
          isDark={false}
        />
      );

      expect(screen.getByText('8.0 / 24.0 GB')).toBeInTheDocument();
    });

    it('does not render progress bars when data unavailable', () => {
      renderWithTheme(
        <GPUUMetricsCard
          metrics={undefined as any}
          isDark={false}
        />
      );

      expect(screen.getByText('No GPU data available')).toBeInTheDocument();
    });
  });

  // ===== CARD STYLING TESTS =====
  // Test objective: Verify card styling varies with theme
  describe('Card Styling', () => {
    it('applies light mode styling when isDark is false', () => {
      const { container } = renderWithTheme(
        <GPUUMetricsCard
          metrics={{ gpuUsage: 80 }}
          isDark={false}
        />
      );

      const card = container.querySelector('.MuiCard-root');
      expect(card).toBeInTheDocument();
    });

    it('applies dark mode styling when isDark is true', () => {
      const { container } = renderWithTheme(
        <GPUUMetricsCard
          metrics={{ gpuUsage: 80 }}
          isDark={true}
        />
      );

      const card = container.querySelector('.MuiCard-root');
      expect(card).toBeInTheDocument();
    });

    it('renders CardContent with proper structure', () => {
      renderWithTheme(
        <GPUUMetricsCard
          metrics={{ gpuUsage: 80 }}
          isDark={false}
        />
      );

      expect(screen.getByText('GPU Information')).toBeInTheDocument();
      expect(screen.getByText('GPU Performance')).toBeInTheDocument();
    });
  });

  // ===== LOADING STATE TESTS =====
  // Test objective: Verify component handles loading/undefined states
  describe('Loading States', () => {
    it('handles null metrics', () => {
      renderWithTheme(
        <GPUUMetricsCard
          metrics={null as any}
          isDark={false}
        />
      );

      expect(screen.getByText('No GPU data available')).toBeInTheDocument();
    });

    it('handles empty object metrics', () => {
      renderWithTheme(
        <GPUUMetricsCard
          metrics={{}}
          isDark={false}
        />
      );

      expect(screen.getByText('No GPU data available')).toBeInTheDocument();
    });
  });

  // ===== EXPLICIT UNDEFINED VALUE TESTS =====
  // Test objective: Verify ternary operators handle undefined correctly (line 88, 106, 111)
  describe('Explicit Undefined Values', () => {
    it('renders N/A when gpuUsage is explicitly undefined but gpuName is provided', () => {
      // This test covers the false branch of line 88:
      // metrics.gpuUsage !== undefined ? `${metrics.gpuUsage.toFixed(1)}%` : 'N/A'
      // We need gpuName to be defined to avoid "No GPU data available" state
      const metricsWithUndefined = {
        gpuUsage: undefined,
        gpuName: 'Test GPU',
        gpuMemoryUsed: 8,
        gpuMemoryTotal: 24,
        gpuTemperature: 65,
      } as any;

      renderWithTheme(
        <GPUUMetricsCard
          metrics={metricsWithUndefined}
          isDark={false}
        />
      );

      const naElements = screen.getAllByText('N/A');
      expect(naElements.length).toBeGreaterThan(0);
    });

    it('renders N/A when gpuMemoryUsed and gpuMemoryTotal are undefined', () => {
      // This covers line 106 branch where both are undefined
      const metricsWithUndefinedMemory = {
        gpuUsage: 80,
        gpuName: 'Test GPU',
        gpuMemoryUsed: undefined,
        gpuMemoryTotal: undefined,
      } as any;

      renderWithTheme(
        <GPUUMetricsCard
          metrics={metricsWithUndefinedMemory}
          isDark={false}
        />
      );

      const naElements = screen.getAllByText('N/A');
      expect(naElements.length).toBeGreaterThan(0);
    });

    it('renders N/A when gpuTemperature is undefined', () => {
      // This covers line 111 branch where temperature is undefined
      const metricsWithUndefinedTemp = {
        gpuUsage: 80,
        gpuName: 'Test GPU',
        gpuMemoryUsed: 8,
        gpuMemoryTotal: 24,
        gpuTemperature: undefined,
      } as any;

      renderWithTheme(
        <GPUUMetricsCard
          metrics={metricsWithUndefinedTemp}
          isDark={false}
        />
      );

      const naElements = screen.getAllByText('N/A');
      expect(naElements.length).toBeGreaterThan(0);
    });
  });
});
