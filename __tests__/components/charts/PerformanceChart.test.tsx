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
    { time: '10:00', value: 45 },
    { time: '10:05', value: 50 },
    { time: '10:10', value: 55 },
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
  });
});
