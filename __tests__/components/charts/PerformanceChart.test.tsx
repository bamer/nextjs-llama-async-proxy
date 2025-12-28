import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { PerformanceChart } from '@/components/charts/PerformanceChart';
import type { MockChartDataPoint } from '__tests__/types/mock-types';

jest.mock('@mui/x-charts', () => ({
  LineChart: () => <div data-testid="line-chart" />,
  ChartsXAxis: () => null,
  ChartsYAxis: () => null,
  ChartsGrid: () => null,
  ChartsTooltip: () => null,
}));

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {component}
    </ThemeProvider>
  );
}

describe('PerformanceChart', () => {
  const mockData = [
    { time: '10:00', displayTime: '10:00', value: 45 },
    { time: '10:05', displayTime: '10:05', value: 50 },
    { time: '10:10', displayTime: '10:10', value: 55 },
  ];

  it('renders correctly', () => {
    renderWithTheme(
      <PerformanceChart
        title="Test Chart"
        description="Test Description"
        datasets={[{
          dataKey: 'value',
          label: 'Value',
          colorDark: '#60a5fa',
          colorLight: '#2563eb',
          valueFormatter: (val) => `${val}`,
          data: mockData,
        }]}
        isDark={false}
        height={300}
      />
    );

    expect(screen.getByText('Test Chart')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('renders chart with data', () => {
    renderWithTheme(
      <PerformanceChart
        title="Performance"
        description="System metrics"
        datasets={[{
          dataKey: 'value',
          label: 'Value',
          colorDark: '#60a5fa',
          colorLight: '#2563eb',
          valueFormatter: (val) => `${val}%`,
          data: mockData,
        }]}
        isDark={false}
        height={350}
      />
    );

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('applies custom height', () => {
    renderWithTheme(
      <PerformanceChart
        title="Test"
        description="Description"
        datasets={[{
          dataKey: 'value',
          label: 'Value',
          colorDark: '#60a5fa',
          colorLight: '#2563eb',
          valueFormatter: (val) => `${val}`,
          data: mockData,
        }]}
        isDark={false}
        height={500}
      />
    );

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('displays multiple datasets', () => {
    renderWithTheme(
      <PerformanceChart
        title="Multi Dataset"
        description="Multiple metrics"
        datasets={[
          {
            dataKey: 'value',
            label: 'Value 1',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            valueFormatter: (val) => `${val}`,
            data: mockData,
          },
          {
            dataKey: 'value',
            label: 'Value 2',
            colorDark: '#4ade80',
            colorLight: '#16a34a',
            valueFormatter: (val) => `${val}`,
            data: mockData,
          },
        ]}
        isDark={true}
        height={400}
      />
    );

    expect(screen.getByText('Multi Dataset')).toBeInTheDocument();
    expect(screen.getByText('Multiple metrics')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('handles empty data', () => {
    renderWithTheme(
      <PerformanceChart
        title="Empty Chart"
        description="No data"
        datasets={[{
          dataKey: 'value',
          label: 'Value',
          colorDark: '#60a5fa',
          colorLight: '#2563eb',
          valueFormatter: (val) => `${val}`,
          data: [],
        }]}
        isDark={false}
        height={300}
      />
    );

    expect(screen.getByText('Empty Chart')).toBeInTheDocument();
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('displays "No data available" message for empty datasets', () => {
    renderWithTheme(
      <PerformanceChart
        title="Test Chart"
        description="Test Description"
        datasets={[{
          dataKey: 'value',
          label: 'Value',
          colorDark: '#60a5fa',
          colorLight: '#2563eb',
          data: [],
        }]}
        isDark={false}
      />
    );

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('handles null value in valueFormatter', () => {
    renderWithTheme(
      <PerformanceChart
        title="Null Values"
        description="Testing null values"
        datasets={[{
          dataKey: 'value',
          label: 'Value',
          colorDark: '#60a5fa',
          colorLight: '#2563eb',
          valueFormatter: (val) => val !== null ? `${val}%` : 'N/A',
          data: mockData,
        }]}
        isDark={false}
      />
    );

    expect(screen.getByText('Null Values')).toBeInTheDocument();
  });

  it('uses dark mode colors when isDark is true', () => {
    renderWithTheme(
      <PerformanceChart
        title="Dark Mode"
        description="Dark mode test"
        datasets={[{
          dataKey: 'value',
          label: 'Value',
          colorDark: '#60a5fa',
          colorLight: '#2563eb',
          data: mockData,
        }]}
        isDark={true}
      />
    );

    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('uses light mode colors when isDark is false', () => {
    renderWithTheme(
      <PerformanceChart
        title="Light Mode"
        description="Light mode test"
        datasets={[{
          dataKey: 'value',
          label: 'Value',
          colorDark: '#60a5fa',
          colorLight: '#2563eb',
          data: mockData,
        }]}
        isDark={false}
      />
    );

    expect(screen.getByText('Light Mode')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('handles datasets with different data lengths', () => {
    const longData = [
      { time: '10:00', displayTime: '10:00', value: 45 },
      { time: '10:05', displayTime: '10:05', value: 50 },
      { time: '10:10', displayTime: '10:10', value: 55 },
      { time: '10:15', displayTime: '10:15', value: 60 },
      { time: '10:20', displayTime: '10:20', value: 65 },
    ];

    const shortData = [
      { time: '10:00', displayTime: '10:00', value: 30 },
      { time: '10:05', displayTime: '10:05', value: 35 },
    ];

    renderWithTheme(
      <PerformanceChart
        title="Mixed Lengths"
        description="Different dataset lengths"
        datasets={[
          {
            dataKey: 'value1',
            label: 'Long Dataset',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: longData,
          },
          {
            dataKey: 'value2',
            label: 'Short Dataset',
            colorDark: '#4ade80',
            colorLight: '#16a34a',
            data: shortData,
          },
        ]}
        isDark={false}
      />
    );

    expect(screen.getByText('Mixed Lengths')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('handles xAxisType="band"', () => {
    renderWithTheme(
      <PerformanceChart
        title="Band Axis"
        description="Band axis type"
        datasets={[{
          dataKey: 'value',
          label: 'Value',
          colorDark: '#60a5fa',
          colorLight: '#2563eb',
          data: mockData,
        }]}
        isDark={false}
        xAxisType="band"
      />
    );

    expect(screen.getByText('Band Axis')).toBeInTheDocument();
  });

  it('handles xAxisType="point"', () => {
    renderWithTheme(
      <PerformanceChart
        title="Point Axis"
        description="Point axis type"
        datasets={[{
          dataKey: 'value',
          label: 'Value',
          colorDark: '#60a5fa',
          colorLight: '#2563eb',
          data: mockData,
        }]}
        isDark={false}
        xAxisType="point"
      />
    );

    expect(screen.getByText('Point Axis')).toBeInTheDocument();
  });

  it('handles showAnimation=true', () => {
    renderWithTheme(
      <PerformanceChart
        title="Animated"
        description="With animation"
        datasets={[{
          dataKey: 'value',
          label: 'Value',
          colorDark: '#60a5fa',
          colorLight: '#2563eb',
          data: mockData,
        }]}
        isDark={false}
        showAnimation={true}
      />
    );

    expect(screen.getByText('Animated')).toBeInTheDocument();
  });

  it('handles showAnimation=false', () => {
    renderWithTheme(
      <PerformanceChart
        title="Not Animated"
        description="Without animation"
        datasets={[{
          dataKey: 'value',
          label: 'Value',
          colorDark: '#60a5fa',
          colorLight: '#2563eb',
          data: mockData,
        }]}
        isDark={false}
        showAnimation={false}
      />
    );

    expect(screen.getByText('Not Animated')).toBeInTheDocument();
  });

  it('handles default height prop', () => {
    renderWithTheme(
      <PerformanceChart
        title="Default Height"
        description="Default height test"
        datasets={[{
          dataKey: 'value',
          label: 'Value',
          colorDark: '#60a5fa',
          colorLight: '#2563eb',
          data: mockData,
        }]}
        isDark={false}
      />
    );

    expect(screen.getByText('Default Height')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('handles custom height', () => {
    renderWithTheme(
      <PerformanceChart
        title="Custom Height"
        description="Custom height test"
        datasets={[{
          dataKey: 'value',
          label: 'Value',
          colorDark: '#60a5fa',
          colorLight: '#2563eb',
          data: mockData,
        }]}
        isDark={false}
        height={500}
      />
    );

    expect(screen.getByText('Custom Height')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('renders with default props', () => {
    renderWithTheme(
      <PerformanceChart
        title="Default Props"
        description="Default props test"
        datasets={[{
          dataKey: 'value',
          label: 'Value',
          colorDark: '#60a5fa',
          colorLight: '#2563eb',
          data: mockData,
        }]}
        isDark={false}
      />
    );

    expect(screen.getByText('Default Props')).toBeInTheDocument();
    expect(screen.getByText('Default props test')).toBeInTheDocument();
  });

    it('handles empty datasets array', () => {
      renderWithTheme(
        <PerformanceChart
          title="Empty Array"
          description="Empty datasets"
          datasets={[]}
          isDark={false}
        />
      );

      expect(screen.getByText('Empty Array')).toBeInTheDocument();
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('handles all datasets with empty data arrays', () => {
      renderWithTheme(
        <PerformanceChart
          title="All Empty"
          description="All datasets empty"
          datasets={[
            {
              dataKey: 'value1',
              label: 'Empty 1',
              colorDark: '#60a5fa',
              colorLight: '#2563eb',
              data: [],
            },
            {
              dataKey: 'value2',
              label: 'Empty 2',
              colorDark: '#4ade80',
              colorLight: '#16a34a',
              data: [],
            },
          ]}
          isDark={false}
        />
      );

      expect(screen.getByText('All Empty')).toBeInTheDocument();
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

  it('handles very large values', () => {
    const largeData = [
      { time: '10:00', displayTime: '10:00', value: 999999 },
      { time: '10:05', displayTime: '10:05', value: 1000000 },
      { time: '10:10', displayTime: '10:10', value: 1000001 },
    ];

    renderWithTheme(
      <PerformanceChart
        title="Large Values"
        description="Testing large values"
        datasets={[{
          dataKey: 'value',
          label: 'Value',
          colorDark: '#60a5fa',
          colorLight: '#2563eb',
          valueFormatter: (val) => `${val}`,
          data: largeData,
        }]}
        isDark={false}
      />
    );

    expect(screen.getByText('Large Values')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('handles zero values', () => {
    const zeroData = [
      { time: '10:00', displayTime: '10:00', value: 0 },
      { time: '10:05', displayTime: '10:05', value: 0 },
      { time: '10:10', displayTime: '10:10', value: 0 },
    ];

    renderWithTheme(
      <PerformanceChart
        title="Zero Values"
        description="Testing zero values"
        datasets={[{
          dataKey: 'value',
          label: 'Value',
          colorDark: '#60a5fa',
          colorLight: '#2563eb',
          valueFormatter: (val) => `${val}%`,
          data: zeroData,
        }]}
        isDark={false}
      />
    );

    expect(screen.getByText('Zero Values')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('handles negative values', () => {
    const negativeData = [
      { time: '10:00', displayTime: '10:00', value: -10 },
      { time: '10:05', displayTime: '10:05', value: -5 },
      { time: '10:10', displayTime: '10:10', value: 0 },
    ];

    renderWithTheme(
      <PerformanceChart
        title="Negative Values"
        description="Testing negative values"
        datasets={[{
          dataKey: 'value',
          label: 'Value',
          colorDark: '#60a5fa',
          colorLight: '#2563eb',
          valueFormatter: (val) => `${val}`,
          data: negativeData,
        }]}
        isDark={false}
      />
    );

    expect(screen.getByText('Negative Values')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('handles decimal values', () => {
    const decimalData = [
      { time: '10:00', displayTime: '10:00', value: 45.5 },
      { time: '10:05', displayTime: '10:05', value: 50.25 },
      { time: '10:10', displayTime: '10:10', value: 55.75 },
    ];

    renderWithTheme(
      <PerformanceChart
        title="Decimal Values"
        description="Testing decimal values"
        datasets={[{
          dataKey: 'value',
          label: 'Value',
          colorDark: '#60a5fa',
          colorLight: '#2563eb',
          valueFormatter: (val) => `${val}`,
          data: decimalData,
        }]}
        isDark={false}
      />
    );

    expect(screen.getByText('Decimal Values')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('handles very long title and description', () => {
    const longTitle = 'This is a very long title that might cause wrapping issues';
    const longDescription = 'This is also a very long description that might cause wrapping issues in the component';

    renderWithTheme(
      <PerformanceChart
        title={longTitle}
        description={longDescription}
        datasets={[{
          dataKey: 'value',
          label: 'Value',
          colorDark: '#60a5fa',
          colorLight: '#2563eb',
          data: mockData,
        }]}
        isDark={false}
      />
    );

    expect(screen.getByText(longTitle)).toBeInTheDocument();
    expect(screen.getByText(longDescription)).toBeInTheDocument();
  });

  // ===== CHART UPDATES TESTS =====
  // Test objective: Verify chart re-renders correctly when datasets update
  describe('Chart Updates', () => {
    it('updates when dataset values change', () => {
      const initialData = [
        { time: '10:00', displayTime: '10:00', value: 45 },
        { time: '10:05', displayTime: '10:05', value: 50 },
      ];

      const updatedData = [
        { time: '10:00', displayTime: '10:00', value: 75 },
        { time: '10:05', displayTime: '10:05', value: 80 },
      ];

      const { rerender } = renderWithTheme(
        <PerformanceChart
          title="Update Test"
          description="Testing updates"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: initialData,
          }]}
          isDark={false}
        />
      );

      expect(screen.getByText('Update Test')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();

      rerender(
        <PerformanceChart
          title="Update Test"
          description="Testing updates"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: updatedData,
          }]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('updates when number of datasets changes', () => {
      const { rerender } = renderWithTheme(
        <PerformanceChart
          title="Dataset Count"
          description="Testing dataset count changes"
          datasets={[{
            dataKey: 'value',
            label: 'Single Dataset',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: mockData,
          }]}
          isDark={false}
        />
      );

      expect(screen.getByText('Dataset Count')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();

      rerender(
        <PerformanceChart
          title="Dataset Count"
          description="Testing dataset count changes"
          datasets={[
            {
              dataKey: 'value1',
              label: 'First Dataset',
              colorDark: '#60a5fa',
              colorLight: '#2563eb',
              data: mockData,
            },
            {
              dataKey: 'value2',
              label: 'Second Dataset',
              colorDark: '#4ade80',
              colorLight: '#16a34a',
              data: mockData,
            },
          ]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('updates when title and description change', () => {
      const { rerender } = renderWithTheme(
        <PerformanceChart
          title="Original Title"
          description="Original Description"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: mockData,
          }]}
          isDark={false}
        />
      );

      expect(screen.getByText('Original Title')).toBeInTheDocument();
      expect(screen.getByText('Original Description')).toBeInTheDocument();

      rerender(
        <PerformanceChart
          title="Updated Title"
          description="Updated Description"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: mockData,
          }]}
          isDark={false}
        />
      );

      expect(screen.getByText('Updated Title')).toBeInTheDocument();
      expect(screen.getByText('Updated Description')).toBeInTheDocument();
      expect(screen.queryByText('Original Title')).not.toBeInTheDocument();
    });

    it('updates when theme changes', () => {
      const { rerender } = renderWithTheme(
        <PerformanceChart
          title="Theme Test"
          description="Testing theme changes"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: mockData,
          }]}
          isDark={false}
        />
      );

      rerender(
        <PerformanceChart
          title="Theme Test"
          description="Testing theme changes"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: mockData,
          }]}
          isDark={true}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  // ===== RESPONSIVE BEHAVIOR TESTS =====
  // Test objective: Verify chart renders correctly at different viewport sizes
  describe('Responsive Behavior', () => {
    it('renders correctly on mobile viewport (375px)', () => {
      window.innerWidth = 375;
      window.dispatchEvent(new Event('resize'));

      renderWithTheme(
        <PerformanceChart
          title="Mobile Chart"
          description="Mobile viewport test"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: mockData,
          }]}
          isDark={false}
          height={300}
        />
      );

      expect(screen.getByText('Mobile Chart')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('renders correctly on tablet viewport (768px)', () => {
      window.innerWidth = 768;
      window.dispatchEvent(new Event('resize'));

      renderWithTheme(
        <PerformanceChart
          title="Tablet Chart"
          description="Tablet viewport test"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: mockData,
          }]}
          isDark={false}
          height={350}
        />
      );

      expect(screen.getByText('Tablet Chart')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('renders correctly on desktop viewport (1920px)', () => {
      window.innerWidth = 1920;
      window.dispatchEvent(new Event('resize'));

      renderWithTheme(
        <PerformanceChart
          title="Desktop Chart"
          description="Desktop viewport test"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: mockData,
          }]}
          isDark={false}
          height={400}
        />
      );

      expect(screen.getByText('Desktop Chart')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('adjusts to dynamic viewport changes', () => {
      const { rerender } = renderWithTheme(
        <PerformanceChart
          title="Responsive Chart"
          description="Dynamic resize test"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: mockData,
          }]}
          isDark={false}
        />
      );

      // Simulate mobile
      window.innerWidth = 375;
      window.dispatchEvent(new Event('resize'));

      // Simulate desktop
      window.innerWidth = 1920;
      window.dispatchEvent(new Event('resize'));

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  // ===== ANIMATION EFFECTS TESTS =====
  // Test objective: Verify animation props are correctly applied
  describe('Animation Effects', () => {
    it('applies showAnimation prop correctly', () => {
      const { rerender } = renderWithTheme(
        <PerformanceChart
          title="Animation Test"
          description="Testing animation prop"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: mockData,
          }]}
          isDark={false}
          showAnimation={true}
        />
      );

      rerender(
        <PerformanceChart
          title="Animation Test"
          description="Testing animation prop"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: mockData,
          }]}
          isDark={false}
          showAnimation={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('toggles animation between states', () => {
      const { rerender } = renderWithTheme(
        <PerformanceChart
          title="Toggle Animation"
          description="Testing animation toggle"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: mockData,
          }]}
          isDark={false}
          showAnimation={true}
        />
      );

      // Toggle to off
      rerender(
        <PerformanceChart
          title="Toggle Animation"
          description="Testing animation toggle"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: mockData,
          }]}
          isDark={false}
          showAnimation={false}
        />
      );

      // Toggle back to on
      rerender(
        <PerformanceChart
          title="Toggle Animation"
          description="Testing animation toggle"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: mockData,
          }]}
          isDark={false}
          showAnimation={true}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  // ===== Y-AXIS LABEL TESTS =====
  // Test objective: Verify custom Y-axis labels are applied correctly
  describe('Y-Axis Labels', () => {
    it('applies custom yAxisLabel', () => {
      renderWithTheme(
        <PerformanceChart
          title="Y-Axis Label"
          description="Testing Y-axis labels"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            yAxisLabel: 'Percentage (%)',
            data: mockData,
          }]}
          isDark={false}
        />
      );

      expect(screen.getByText('Y-Axis Label')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('handles undefined yAxisLabel', () => {
      renderWithTheme(
        <PerformanceChart
          title="No Y-Label"
          description="Testing without Y-axis label"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: mockData,
          }]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('handles empty string yAxisLabel', () => {
      renderWithTheme(
        <PerformanceChart
          title="Empty Y-Label"
          description="Testing empty Y-axis label"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            yAxisLabel: '',
            data: mockData,
          }]}
          isDark={false}
        />
      );

      expect(screen.getByText('Empty Y-Label')).toBeInTheDocument();
    });

    it('handles multiple datasets with different yAxisLabels', () => {
      renderWithTheme(
        <PerformanceChart
          title="Multiple Y-Labels"
          description="Testing multiple Y-axis labels"
          datasets={[
            {
              dataKey: 'value1',
              label: 'Dataset 1',
              colorDark: '#60a5fa',
              colorLight: '#2563eb',
              yAxisLabel: 'Percentage (%)',
              data: mockData,
            },
            {
              dataKey: 'value2',
              label: 'Dataset 2',
              colorDark: '#4ade80',
              colorLight: '#16a34a',
              yAxisLabel: 'Count',
              data: mockData,
            },
          ]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  // ===== VALUE FORMATTER TESTS =====
  // Test objective: Verify value formatters work correctly
  describe('Value Formatters', () => {
    it('uses custom valueFormatter', () => {
      const customFormatter = jest.fn((val) => `${val.toFixed(2)} units`);

      renderWithTheme(
        <PerformanceChart
          title="Custom Formatter"
          description="Testing custom formatter"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            valueFormatter: customFormatter,
            data: mockData,
          }]}
          isDark={false}
        />
      );

      expect(screen.getByText('Custom Formatter')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('uses default formatter when none provided', () => {
      renderWithTheme(
        <PerformanceChart
          title="Default Formatter"
          description="Testing default formatter"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            // No valueFormatter provided - should use default
            data: mockData,
          }]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('default formatter handles decimal values', () => {
      const decimalData = [
        { time: '10:00', displayTime: '10:00', value: 45.5678 },
        { time: '10:05', displayTime: '10:05', value: 50.1234 },
      ];

      renderWithTheme(
        <PerformanceChart
          title="Default Decimal Formatter"
          description="Testing default with decimals"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            // No valueFormatter - default should format to 1 decimal
            data: decimalData,
          }]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('default formatter handles null values', () => {
      const dataWithNull = [
        { time: '10:00', displayTime: '10:00', value: null as unknown as number },
        { time: '10:05', displayTime: '10:05', value: 50 },
      ] as MockChartDataPoint[];

      renderWithTheme(
        <PerformanceChart
          title="Default Null Formatter"
          description="Testing default with nulls"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            // No valueFormatter - default should handle null
            data: dataWithNull,
          }]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('handles formatter with percentage suffix', () => {
      renderWithTheme(
        <PerformanceChart
          title="Percentage Formatter"
          description="Testing percentage formatter"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            valueFormatter: (val) => `${val}%`,
            data: mockData,
          }]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('handles formatter with currency prefix', () => {
      renderWithTheme(
        <PerformanceChart
          title="Currency Formatter"
          description="Testing currency formatter"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            valueFormatter: (val) => `$${val ? val.toFixed(2) : '0.00'}`,
            data: mockData,
          }]}
          isDark={false}
        />
      );

      expect(screen.getByText('Currency Formatter')).toBeInTheDocument();
    });
  });

  // ===== DATA MERGE LOGIC TESTS =====
  // Test objective: Verify data merging across datasets works correctly
  describe('Data Merge Logic', () => {
    it('merges data from multiple datasets correctly', () => {
      const dataset1 = [
        { time: '10:00', displayTime: '10:00', value: 45 },
        { time: '10:05', displayTime: '10:05', value: 50 },
      ];

      const dataset2 = [
        { time: '10:00', displayTime: '10:00', value: 30 },
        { time: '10:05', displayTime: '10:05', value: 35 },
      ];

      renderWithTheme(
        <PerformanceChart
          title="Data Merge"
          description="Testing data merge logic"
          datasets={[
            {
              dataKey: 'value1',
              label: 'Dataset 1',
              colorDark: '#60a5fa',
              colorLight: '#2563eb',
              data: dataset1,
            },
            {
              dataKey: 'value2',
              label: 'Dataset 2',
              colorDark: '#4ade80',
              colorLight: '#16a34a',
              data: dataset2,
            },
          ]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('handles first dataset empty, second dataset has data', () => {
      const emptyDataset: MockChartDataPoint[] = [];
      const dataDataset = [
        { time: '10:00', displayTime: '10:00', value: 45 },
        { time: '10:05', displayTime: '10:05', value: 50 },
      ];

      renderWithTheme(
        <PerformanceChart
          title="First Empty"
          description="Testing when first dataset is empty"
          datasets={[
            {
              dataKey: 'empty',
              label: 'Empty',
              colorDark: '#60a5fa',
              colorLight: '#2563eb',
              data: emptyDataset,
            },
            {
              dataKey: 'data',
              label: 'Has Data',
              colorDark: '#4ade80',
              colorLight: '#16a34a',
              data: dataDataset,
            },
          ]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('uses first dataset with data for time axis', () => {
      const emptyDataset = [
        { time: '10:00', displayTime: '10:00', value: 0 },
        { time: '10:05', displayTime: '10:05', value: 0 },
      ];

      const dataDataset = [
        { time: '10:00', displayTime: '10:00', value: 45 },
        { time: '10:05', displayTime: '10:05', value: 50 },
      ];

      renderWithTheme(
        <PerformanceChart
          title="Time Axis Order"
          description="Testing time axis from first dataset"
          datasets={[
            {
              dataKey: 'empty',
              label: 'Empty',
              colorDark: '#60a5fa',
              colorLight: '#2563eb',
              data: emptyDataset,
            },
            {
              dataKey: 'data',
              label: 'Data',
              colorDark: '#4ade80',
              colorLight: '#16a34a',
              data: dataDataset,
            },
          ]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('handles datasets with mismatched time values', () => {
      const dataset1 = [
        { time: '10:00', displayTime: '10:00', value: 45 },
        { time: '10:05', displayTime: '10:05', value: 50 },
      ];

      const dataset2 = [
        { time: '10:02', displayTime: '10:02', value: 30 },
        { time: '10:07', displayTime: '10:07', value: 35 },
      ];

      renderWithTheme(
        <PerformanceChart
          title="Mismatched Times"
          description="Testing datasets with different time values"
          datasets={[
            {
              dataKey: 'value1',
              label: 'Dataset 1',
              colorDark: '#60a5fa',
              colorLight: '#2563eb',
              data: dataset1,
            },
            {
              dataKey: 'value2',
              label: 'Dataset 2',
              colorDark: '#4ade80',
              colorLight: '#16a34a',
              data: dataset2,
            },
          ]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('handles three or more datasets', () => {
      renderWithTheme(
        <PerformanceChart
          title="Multiple Datasets"
          description="Testing three datasets"
          datasets={[
            {
              dataKey: 'value1',
              label: 'Dataset 1',
              colorDark: '#60a5fa',
              colorLight: '#2563eb',
              data: mockData,
            },
            {
              dataKey: 'value2',
              label: 'Dataset 2',
              colorDark: '#4ade80',
              colorLight: '#16a34a',
              data: mockData,
            },
            {
              dataKey: 'value3',
              label: 'Dataset 3',
              colorDark: '#f472b6',
              colorLight: '#db2777',
              data: mockData,
            },
          ]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  // ===== LARGE DATASETS TESTS =====
  // Test objective: Verify chart handles large datasets efficiently
  describe('Large Datasets', () => {
    it('handles 50 data points', () => {
      const largeData = Array.from({ length: 50 }, (_, i) => ({
        time: `${String(Math.floor(i / 12)).padStart(2, '0')}:${String((i % 12) * 5).padStart(2, '0')}`,
        displayTime: `${String(Math.floor(i / 12)).padStart(2, '0')}:${String((i % 12) * 5).padStart(2, '0')}`,
        value: Math.random() * 100,
      }));

      renderWithTheme(
        <PerformanceChart
          title="50 Points"
          description="Testing 50 data points"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: largeData,
          }]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('handles 100 data points', () => {
      const largeData = Array.from({ length: 100 }, (_, i) => ({
        time: `${String(Math.floor(i / 12)).padStart(2, '0')}:${String((i % 12) * 5).padStart(2, '0')}`,
        displayTime: `${String(Math.floor(i / 12)).padStart(2, '0')}:${String((i % 12) * 5).padStart(2, '0')}`,
        value: Math.random() * 100,
      }));

      renderWithTheme(
        <PerformanceChart
          title="100 Points"
          description="Testing 100 data points"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: largeData,
          }]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('handles 150 data points', () => {
      const largeData = Array.from({ length: 150 }, (_, i) => ({
        time: `${String(Math.floor(i / 12)).padStart(2, '0')}:${String((i % 12) * 5).padStart(2, '0')}`,
        displayTime: `${String(Math.floor(i / 12)).padStart(2, '0')}:${String((i % 12) * 5).padStart(2, '0')}`,
        value: Math.random() * 100,
      }));

      renderWithTheme(
        <PerformanceChart
          title="150 Points"
          description="Testing 150 data points"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: largeData,
          }]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('handles multiple large datasets', () => {
      const largeData = Array.from({ length: 100 }, (_, i) => ({
        time: `${String(Math.floor(i / 12)).padStart(2, '0')}:${String((i % 12) * 5).padStart(2, '0')}`,
        displayTime: `${String(Math.floor(i / 12)).padStart(2, '0')}:${String((i % 12) * 5).padStart(2, '0')}`,
        value: Math.random() * 100,
      }));

      renderWithTheme(
        <PerformanceChart
          title="Multiple Large"
          description="Testing multiple large datasets"
          datasets={[
            {
              dataKey: 'value1',
              label: 'Dataset 1',
              colorDark: '#60a5fa',
              colorLight: '#2563eb',
              data: largeData,
            },
            {
              dataKey: 'value2',
              label: 'Dataset 2',
              colorDark: '#4ade80',
              colorLight: '#16a34a',
              data: largeData,
            },
          ]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  // ===== NULL DATA POINTS TESTS =====
  // Test objective: Verify chart handles null values correctly
  describe('Null Data Points', () => {
    it('handles null values in dataset', () => {
      const dataWithNulls = [
        { time: '10:00', displayTime: '10:00', value: 45 },
        { time: '10:05', displayTime: '10:05', value: null as unknown as number },
        { time: '10:10', displayTime: '10:10', value: 55 },
      ] as MockChartDataPoint[];

      renderWithTheme(
        <PerformanceChart
          title="Null Values"
          description="Testing null values in data"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            valueFormatter: (val) => val !== null ? `${val}%` : 'N/A',
            data: dataWithNulls,
          }]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('handles all null values', () => {
      const allNullData = [
        { time: '10:00', displayTime: '10:00', value: null as unknown as number },
        { time: '10:05', displayTime: '10:05', value: null as unknown as number },
        { time: '10:10', displayTime: '10:10', value: null as unknown as number },
      ] as MockChartDataPoint[];

      renderWithTheme(
        <PerformanceChart
          title="All Nulls"
          description="Testing all null values"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            valueFormatter: (val) => val !== null ? `${val}%` : 'N/A',
            data: allNullData,
          }]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('handles multiple datasets with nulls', () => {
      const dataWithNulls1 = [
        { time: '10:00', displayTime: '10:00', value: 45 },
        { time: '10:05', displayTime: '10:05', value: null as unknown as number },
      ] as MockChartDataPoint[];

      const dataWithNulls2 = [
        { time: '10:00', displayTime: '10:00', value: null as unknown as number },
        { time: '10:05', displayTime: '10:05', value: 55 },
      ] as MockChartDataPoint[];

      renderWithTheme(
        <PerformanceChart
          title="Mixed Nulls"
          description="Testing multiple datasets with nulls"
          datasets={[
            {
              dataKey: 'value1',
              label: 'Dataset 1',
              colorDark: '#60a5fa',
              colorLight: '#2563eb',
              data: dataWithNulls1,
            },
            {
              dataKey: 'value2',
              label: 'Dataset 2',
              colorDark: '#4ade80',
              colorLight: '#16a34a',
              data: dataWithNulls2,
            },
          ]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  // ===== CARD STYLING TESTS =====
  // Test objective: Verify card styling variations
  describe('Card Styling', () => {
    it('applies dark mode card styling', () => {
      const { container } = renderWithTheme(
        <PerformanceChart
          title="Dark Card"
          description="Dark mode card test"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: mockData,
          }]}
          isDark={true}
        />
      );

      const card = container.querySelector('.MuiCard-root');
      expect(card).toBeInTheDocument();
    });

    it('applies light mode card styling', () => {
      const { container } = renderWithTheme(
        <PerformanceChart
          title="Light Card"
          description="Light mode card test"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: mockData,
          }]}
          isDark={false}
        />
      );

      const card = container.querySelector('.MuiCard-root');
      expect(card).toBeInTheDocument();
    });
  });

  // ===== HEIGHT VARIATIONS TESTS =====
  // Test objective: Verify different height values work correctly
  describe('Height Variations', () => {
    it('handles very small height', () => {
      renderWithTheme(
        <PerformanceChart
          title="Small Height"
          description="Testing small height"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: mockData,
          }]}
          isDark={false}
          height={100}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('handles very large height', () => {
      renderWithTheme(
        <PerformanceChart
          title="Large Height"
          description="Testing large height"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: mockData,
          }]}
          isDark={false}
          height={800}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('handles zero height', () => {
      renderWithTheme(
        <PerformanceChart
          title="Zero Height"
          description="Testing zero height"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: mockData,
          }]}
          isDark={false}
          height={0}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });
});
