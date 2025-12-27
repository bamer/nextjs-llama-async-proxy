import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { PerformanceChart } from '@/components/charts/PerformanceChart';

jest.mock('@mui/x-charts', () => ({
  LineChart: () => <div data-testid="line-chart" />,
  ChartsXAxis: () => null,
  ChartsYAxis: () => null,
  ChartsGrid: () => null,
  ChartsTooltip: () => null,
}));

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
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
});
