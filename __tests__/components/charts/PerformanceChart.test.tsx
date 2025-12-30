import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { PerformanceChart } from '@/components/charts/PerformanceChart';

// Mock @mui/x-charts v8 components
jest.mock('@mui/x-charts', () => ({
  LineChart: React.forwardRef((props: any, ref: any) =>
    React.createElement('div', { ...props, ref, 'data-testid': 'line-chart' })
  ),
  ChartsXAxis: React.forwardRef((props: any, ref: any) =>
    React.createElement('div', { ...props, ref, 'data-testid': 'charts-x-axis' })
  ),
  ChartsYAxis: React.forwardRef((props: any, ref: any) =>
    React.createElement('div', { ...props, ref, 'data-testid': 'charts-y-axis' })
  ),
  ChartsGrid: React.forwardRef((props: any, ref: any) =>
    React.createElement('div', { ...props, ref, 'data-testid': 'charts-grid' })
  ),
  ChartsTooltip: React.forwardRef((props: any, ref: any) =>
    React.createElement('div', { ...props, ref, 'data-testid': 'charts-tooltip' })
  ),
}));

describe('PerformanceChart', () => {
  const mockData = [
    { time: '10:00', displayTime: '10:00', value: 45 },
    { time: '10:05', displayTime: '10:05', value: 50 },
    { time: '10:10', displayTime: '10:10', value: 55 },
  ];

  it('renders correctly with basic props', () => {
    render(
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

  it('renders chart component when data is valid', () => {
    render(
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

  it('shows empty state when no data provided', () => {
    render(
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

  it('handles multiple datasets', () => {
    render(
      <PerformanceChart
        title="Multi Dataset"
        description="Multiple metrics"
        datasets={[
          {
            dataKey: 'value1',
            label: 'Value 1',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            valueFormatter: (val) => `${val}`,
            data: mockData,
          },
          {
            dataKey: 'value2',
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

  it('applies different xAxis types', () => {
    const { rerender } = render(
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

    rerender(
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

  it('handles animation settings', () => {
    const { rerender } = render(
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

    rerender(
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

  it('handles custom value formatters', () => {
    render(
      <PerformanceChart
        title="Custom Formatter"
        description="Testing custom formatter"
        datasets={[{
          dataKey: 'value',
          label: 'Value',
          colorDark: '#60a5fa',
          colorLight: '#2563eb',
          valueFormatter: (val) => `${val?.toFixed(2)} units`,
          data: mockData,
        }]}
        isDark={false}
      />
    );

    expect(screen.getByText('Custom Formatter')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('handles null values in data', () => {
    const dataWithNulls = [
      { time: '10:00', displayTime: '10:00', value: 45 },
      { time: '10:05', displayTime: '10:05', value: null as any },
      { time: '10:10', displayTime: '10:10', value: 55 },
    ];

    render(
      <PerformanceChart
        title="Null Values"
        description="Testing null values"
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

  it('handles datasets with different data lengths', () => {
    const longData = [
      { time: '10:00', displayTime: '10:00', value: 45 },
      { time: '10:05', displayTime: '10:05', value: 50 },
      { time: '10:10', displayTime: '10:10', value: 55 },
      { time: '10:15', displayTime: '10:15', value: 60 },
    ];

    const shortData = [
      { time: '10:00', displayTime: '10:00', value: 30 },
      { time: '10:05', displayTime: '10:05', value: 35 },
    ];

    render(
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

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('shows empty state for insufficient data points', () => {
    const insufficientData = [
      { time: '10:00', displayTime: '10:00', value: 45 },
    ];

    render(
      <PerformanceChart
        title="Insufficient Data"
        description="Only one data point"
        datasets={[{
          dataKey: 'value',
          label: 'Value',
          colorDark: '#60a5fa',
          colorLight: '#2563eb',
          data: insufficientData,
        }]}
        isDark={false}
      />
    );

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('handles empty datasets array', () => {
    render(
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
    render(
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

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('handles large datasets', () => {
    const largeData = Array.from({ length: 100 }, (_, i) => ({
      time: `${String(Math.floor(i / 12)).padStart(2, '0')}:${String((i % 12) * 5).padStart(2, '0')}`,
      displayTime: `${String(Math.floor(i / 12)).padStart(2, '0')}:${String((i % 12) * 5).padStart(2, '0')}`,
      value: Math.random() * 100,
    }));

    render(
      <PerformanceChart
        title="Large Dataset"
        description="100 data points"
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

  it('handles zero and negative values', () => {
    const mixedData = [
      { time: '10:00', displayTime: '10:00', value: -10 },
      { time: '10:05', displayTime: '10:05', value: 0 },
      { time: '10:10', displayTime: '10:10', value: 10 },
    ];

    render(
      <PerformanceChart
        title="Mixed Values"
        description="Negative and zero values"
        datasets={[{
          dataKey: 'value',
          label: 'Value',
          colorDark: '#60a5fa',
          colorLight: '#2563eb',
          data: mixedData,
        }]}
        isDark={false}
      />
    );

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('handles decimal values', () => {
    const decimalData = [
      { time: '10:00', displayTime: '10:00', value: 45.67 },
      { time: '10:05', displayTime: '10:05', value: 50.25 },
      { time: '10:10', displayTime: '10:10', value: 55.89 },
    ];

    render(
      <PerformanceChart
        title="Decimal Values"
        description="Testing decimal values"
        datasets={[{
          dataKey: 'value',
          label: 'Value',
          colorDark: '#60a5fa',
          colorLight: '#2563eb',
          data: decimalData,
        }]}
        isDark={false}
      />
    );

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('handles very long titles and descriptions', () => {
    const longTitle = 'This is a very long title that might cause wrapping issues in the component layout';
    const longDescription = 'This is also a very long description that might cause wrapping issues in the component layout when displayed';

    render(
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

  it('renders with default props', () => {
    render(
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
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('updates when props change', () => {
    const { rerender } = render(
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
    expect(screen.queryByText('Original Title')).not.toBeInTheDocument();
  });

  it('applies custom yAxisLabel', () => {
    render(
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

  it('handles multiple datasets with different configurations', () => {
    render(
      <PerformanceChart
        title="Complex Configuration"
        description="Multiple datasets with different configs"
        datasets={[
          {
            dataKey: 'cpu',
            label: 'CPU Usage',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            valueFormatter: (val) => `${val}%`,
            yAxisLabel: 'CPU %',
            data: mockData,
          },
          {
            dataKey: 'memory',
            label: 'Memory Usage',
            colorDark: '#4ade80',
            colorLight: '#16a34a',
            valueFormatter: (val) => `${val}GB`,
            yAxisLabel: 'Memory (GB)',
            data: mockData,
          },
        ]}
        isDark={true}
        height={500}
        xAxisType="point"
        showAnimation={true}
      />
    );

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  // Additional tests for missing branch coverage
  it('renders chart when showAnimation is true', () => {
    render(
      <PerformanceChart
        title="Animated Chart"
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

    expect(screen.getByText('Animated Chart')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('renders chart when showAnimation is false', () => {
    render(
      <PerformanceChart
        title="Static Chart"
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

    expect(screen.getByText('Static Chart')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('shows empty state when all datasets have invalid values', () => {
    const invalidData = [
      { time: '10:00', displayTime: '10:00', value: NaN },
      { time: '10:05', displayTime: '10:05', value: null as any },
    ];

    render(
      <PerformanceChart
        title="Invalid Data"
        description="Testing invalid values"
        datasets={[{
          dataKey: 'value',
          label: 'Value',
          colorDark: '#60a5fa',
          colorLight: '#2563eb',
          data: invalidData,
        }]}
        isDark={false}
      />
    );

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('shows empty state when merged data has less than 2 points', () => {
    const shortData = [
      { time: '10:00', displayTime: '10:00', value: 45 },
    ];

    render(
      <PerformanceChart
        title="Short Data"
        description="Less than 2 points"
        datasets={[{
          dataKey: 'value',
          label: 'Value',
          colorDark: '#60a5fa',
          colorLight: '#2563eb',
          data: shortData,
        }]}
        isDark={false}
      />
    );

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('handles datasets with NaN values mixed with valid values', () => {
    const mixedData = [
      { time: '10:00', displayTime: '10:00', value: 45 },
      { time: '10:05', displayTime: '10:05', value: NaN },
      { time: '10:10', displayTime: '10:10', value: 55 },
    ];

    render(
      <PerformanceChart
        title="Mixed NaN"
        description="Testing NaN values"
        datasets={[{
          dataKey: 'value',
          label: 'Value',
          colorDark: '#60a5fa',
          colorLight: '#2563eb',
          valueFormatter: (val) => isNaN(Number(val)) ? 'N/A' : `${val}%`,
          data: mixedData,
        }]}
        isDark={false}
      />
    );

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('handles single dataset with exact 2 data points', () => {
    const exactTwoPoints = [
      { time: '10:00', displayTime: '10:00', value: 45 },
      { time: '10:05', displayTime: '10:05', value: 50 },
    ];

    render(
      <PerformanceChart
        title="Two Points"
        description="Exactly 2 points"
        datasets={[{
          dataKey: 'value',
          label: 'Value',
          colorDark: '#60a5fa',
          colorLight: '#2563eb',
          data: exactTwoPoints,
        }]}
        isDark={false}
      />
    );

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('memoizes chart properly with same datasets', () => {
    const datasets = [{
      dataKey: 'value',
      label: 'Value',
      colorDark: '#60a5fa',
      colorLight: '#2563eb',
      data: mockData,
    }];

    const { rerender } = render(
      <PerformanceChart
        title="Memo Test"
        description="Testing memoization"
        datasets={datasets}
        isDark={false}
      />
    );

    expect(screen.getByText('Memo Test')).toBeInTheDocument();

    rerender(
      <PerformanceChart
        title="Memo Test"
        description="Testing memoization"
        datasets={datasets}
        isDark={false}
      />
    );

    expect(screen.getByText('Memo Test')).toBeInTheDocument();
  });

  it('handles datasets with only one data point in first dataset', () => {
    const singlePointData = [
      { time: '10:00', displayTime: '10:00', value: 45 },
    ];

    render(
      <PerformanceChart
        title="Single Point"
        description="First dataset has one point"
        datasets={[{
          dataKey: 'value',
          label: 'Value',
          colorDark: '#60a5fa',
          colorLight: '#2563eb',
          data: singlePointData,
        }]}
        isDark={false}
      />
    );

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('handles all empty datasets', () => {
    render(
      <PerformanceChart
        title="All Empty"
        description="All datasets have no data"
        datasets={[
          {
            dataKey: 'value1',
            label: 'Value 1',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: [],
          },
          {
            dataKey: 'value2',
            label: 'Value 2',
            colorDark: '#4ade80',
            colorLight: '#16a34a',
            data: [],
          },
        ]}
        isDark={false}
      />
    );

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('handles first dataset empty but second dataset has data', () => {
    const data = [
      { time: '10:00', displayTime: '10:00', value: 45 },
      { time: '10:05', displayTime: '10:05', value: 50 },
    ];

    render(
      <PerformanceChart
        title="First Empty"
        description="First dataset empty, second has data"
        datasets={[
          {
            dataKey: 'value1',
            label: 'Value 1',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: [],
          },
          {
            dataKey: 'value2',
            label: 'Value 2',
            colorDark: '#4ade80',
            colorLight: '#16a34a',
            data: data,
          },
        ]}
        isDark={false}
      />
    );

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('handles datasets with 3 data points', () => {
    const threePointData = [
      { time: '10:00', displayTime: '10:00', value: 45 },
      { time: '10:05', displayTime: '10:05', value: 50 },
      { time: '10:10', displayTime: '10:10', value: 55 },
    ];

    render(
      <PerformanceChart
        title="Three Points"
        description="Exactly 3 points"
        datasets={[{
          dataKey: 'value',
          label: 'Value',
          colorDark: '#60a5fa',
          colorLight: '#2563eb',
          data: threePointData,
        }]}
        isDark={false}
      />
    );

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('handles animation toggle between true and false', () => {
    const { rerender } = render(
      <PerformanceChart
        title="Animation Toggle"
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

    expect(screen.getByText('Animation Toggle')).toBeInTheDocument();

    rerender(
      <PerformanceChart
        title="Animation Toggle"
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

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });
});