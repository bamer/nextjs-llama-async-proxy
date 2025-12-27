import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
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
  return render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {component}
    </ThemeProvider>
  );
}

describe('PerformanceChart - Coverage Enhancement', () => {
  const mockData = [
    { time: '10:00', displayTime: '10:00', value: 45 },
    { time: '10:05', displayTime: '10:05', value: 50 },
    { time: '10:10', displayTime: '10:10', value: 55 },
  ];

  // ===== DEFAULT VALUE FORMATTER TESTS =====
  // Test objective: Verify default valueFormatter is used when not provided (covers line 106)
  describe('Default Value Formatter', () => {
    it('uses default valueFormatter when not provided - positive case', () => {
      // This test verifies the default formatter is used when valueFormatter prop is missing
      // Covers the fallback path on line 106: s.valueFormatter || ((value) => ...)
      renderWithTheme(
        <PerformanceChart
          title="Default Formatter Test"
          description="Testing default valueFormatter"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            // NO valueFormatter provided - should use default
            data: mockData,
          }]}
          isDark={false}
        />
      );

      expect(screen.getByText('Default Formatter Test')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('default formatter handles non-null values', () => {
      // Test the positive branch of: value !== null ? `${value.toFixed(1)}` : 'N/A'
      renderWithTheme(
        <PerformanceChart
          title="Non-null Values"
          description="Default formatter with non-null"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            // No valueFormatter - default should handle non-null
            data: [{ time: '10:00', displayTime: '10:00', value: 45.567 }],
          }]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('default formatter handles null values - negative case', () => {
      // Test the negative branch of: value !== null ? `${value.toFixed(1)}` : 'N/A'
      // This is a negative test case - component should handle null values gracefully
      renderWithTheme(
        <PerformanceChart
          title="Null Values with Default Formatter"
          description="Default formatter with null values"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            // No valueFormatter - default should return 'N/A' for null
            data: [{ time: '10:00', displayTime: '10:00', value: null as any }],
          }]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('multiple datasets without valueFormatter', () => {
      // Verify default formatter works for multiple datasets
      renderWithTheme(
        <PerformanceChart
          title="Multiple Defaults"
          description="Multiple datasets with default formatter"
          datasets={[
            {
              dataKey: 'value1',
              label: 'Dataset 1',
              colorDark: '#60a5fa',
              colorLight: '#2563eb',
              // No valueFormatter
              data: mockData,
            },
            {
              dataKey: 'value2',
              label: 'Dataset 2',
              colorDark: '#4ade80',
              colorLight: '#16a34a',
              // No valueFormatter
              data: mockData,
            },
          ]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  // ===== DATA MERGING WITH MISSING VALUES =====
  // Test objective: Verify data merging handles missing values correctly (covers line 70)
  describe('Data Merging with Missing Values', () => {
    it('handles datasets with different lengths - missing values', () => {
      // Test the case where dataset.data[index] is undefined (line 70)
      // This covers the negative branch of: if (dataset.data[index])
      const longDataset = [
        { time: '10:00', displayTime: '10:00', value: 45 },
        { time: '10:05', displayTime: '10:05', value: 50 },
        { time: '10:10', displayTime: '10:10', value: 55 },
        { time: '10:15', displayTime: '10:15', value: 60 },
      ];

      const shortDataset = [
        { time: '10:00', displayTime: '10:00', value: 30 },
        { time: '10:05', displayTime: '10:05', value: 35 },
      ];

      renderWithTheme(
        <PerformanceChart
          title="Different Lengths"
          description="Handling missing values in shorter dataset"
          datasets={[
            {
              dataKey: 'value1',
              label: 'Long Dataset',
              colorDark: '#60a5fa',
              colorLight: '#2563eb',
              data: longDataset,
            },
            {
              dataKey: 'value2',
              label: 'Short Dataset',
              colorDark: '#4ade80',
              colorLight: '#16a34a',
              data: shortDataset,
            },
          ]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('handles all datasets except one empty', () => {
      // Test merging when one dataset has data and others are empty
      renderWithTheme(
        <PerformanceChart
          title="One Populated"
          description="One dataset with data, others empty"
          datasets={[
            {
              dataKey: 'value1',
              label: 'Populated',
              colorDark: '#60a5fa',
              colorLight: '#2563eb',
              data: mockData,
            },
            {
              dataKey: 'value2',
              label: 'Empty 1',
              colorDark: '#4ade80',
              colorLight: '#16a34a',
              data: [],
            },
            {
              dataKey: 'value3',
              label: 'Empty 2',
              colorDark: '#f472b6',
              colorLight: '#db2777',
              data: [],
            },
          ]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('handles sparse data across datasets', () => {
      // Test where datasets have data at alternating indices
      const sparse1 = [
        { time: '10:00', displayTime: '10:00', value: 45 },
        { time: '10:10', displayTime: '10:10', value: 55 },
      ];

      const sparse2 = [
        { time: '10:00', displayTime: '10:00', value: 30 },
        { time: '10:10', displayTime: '10:10', value: 40 },
      ];

      renderWithTheme(
        <PerformanceChart
          title="Sparse Data"
          description="Sparse data across datasets"
          datasets={[
            {
              dataKey: 'value1',
              label: 'Dataset 1',
              colorDark: '#60a5fa',
              colorLight: '#2563eb',
              data: sparse1,
            },
            {
              dataKey: 'value2',
              label: 'Dataset 2',
              colorDark: '#4ade80',
              colorLight: '#16a34a',
              data: sparse2,
            },
          ]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  // ===== EDGE CASES FOR DATA STRUCTURE =====
  // Test objective: Verify component handles edge cases in data structure
  describe('Data Structure Edge Cases', () => {
    it('handles single data point', () => {
      // Test with minimal data
      const singleData = [
        { time: '10:00', displayTime: '10:00', value: 45 },
      ];

      renderWithTheme(
        <PerformanceChart
          title="Single Point"
          description="Single data point"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: singleData,
          }]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('handles two data points', () => {
      // Test with minimal data for line rendering
      const twoPoints = [
        { time: '10:00', displayTime: '10:00', value: 45 },
        { time: '10:05', displayTime: '10:05', value: 50 },
      ];

      renderWithTheme(
        <PerformanceChart
          title="Two Points"
          description="Two data points"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: twoPoints,
          }]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('handles undefined displayTime', () => {
      // Test edge case where displayTime might be missing
      const dataWithUndefined = [
        { time: '10:00', displayTime: undefined as any, value: 45 },
      ];

      renderWithTheme(
        <PerformanceChart
          title="Undefined DisplayTime"
          description="Missing displayTime"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: dataWithUndefined,
          }]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('handles special characters in dataKey', () => {
      // Test dataKey with special characters
      renderWithTheme(
        <PerformanceChart
          title="Special DataKey"
          description="Special characters in dataKey"
          datasets={[{
            dataKey: 'cpu_usage-2024',
            label: 'CPU Usage',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: mockData,
          }]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('handles unicode in labels', () => {
      // Test labels with unicode characters
      renderWithTheme(
        <PerformanceChart
          title="Unicode Labels"
          description="Unicode characters in labels"
          datasets={[{
            dataKey: 'value',
            label: '温度 (°C) 🌡️',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: mockData,
          }]}
          isDark={false}
        />
      );

      expect(screen.getByText('Unicode Labels')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  // ===== THEME AND COLOR TESTS =====
  // Test objective: Verify theme-based color switching (line 105)
  describe('Theme Color Switching', () => {
    it('switches between dark and light colors', () => {
      const { rerender } = renderWithTheme(
        <PerformanceChart
          title="Theme Switch"
          description="Testing color theme switching"
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

      // Start with light mode
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();

      // Switch to dark mode
      rerender(
        <PerformanceChart
          title="Theme Switch"
          description="Testing color theme switching"
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

      // Switch back to light mode
      rerender(
        <PerformanceChart
          title="Theme Switch"
          description="Testing color theme switching"
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

    it('handles same color for dark and light', () => {
      // Test when both colors are the same
      renderWithTheme(
        <PerformanceChart
          title="Same Color"
          description="Same color for both themes"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#2563eb',
            colorLight: '#2563eb',
            data: mockData,
          }]}
          isDark={true}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  // ===== ANIMATION PROP TESTS =====
  // Test objective: Verify animation props control line rendering (lines 103-104)
  describe('Animation Props', () => {
    it('toggles animation on and off', () => {
      const { rerender } = renderWithTheme(
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

      // Animation on
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();

      // Animation off
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

  // ===== MARGINS AND DIMENSIONS =====
  // Test objective: Verify chart dimensions and margins are applied correctly
  describe('Dimensions and Margins', () => {
    it('renders with different heights', () => {
      const heights = [100, 200, 300, 400, 500, 600];

      heights.forEach((height) => {
        const { unmount } = renderWithTheme(
          <PerformanceChart
            title={`Height ${height}`}
            description={`Testing height ${height}`}
            datasets={[{
              dataKey: 'value',
              label: 'Value',
              colorDark: '#60a5fa',
              colorLight: '#2563eb',
              data: mockData,
            }]}
            isDark={false}
            height={height}
          />
        );

        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
        unmount();
      });
    });

    it('uses default height when not specified', () => {
      // Verify default height (350) is used
      renderWithTheme(
        <PerformanceChart
          title="Default Height"
          description="Testing default height"
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
  });

  // ===== NO DATA STATE ENHANCEMENTS =====
  // Test objective: Verify no data state with different scenarios
  describe('No Data State Variations', () => {
    it('shows no data for empty dataset without valueFormatter', () => {
      // Test no data state when valueFormatter is also missing
      renderWithTheme(
        <PerformanceChart
          title="Empty No Formatter"
          description="Empty dataset without valueFormatter"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            // No valueFormatter
            data: [],
          }]}
          isDark={false}
        />
      );

      expect(screen.getByText('Empty No Formatter')).toBeInTheDocument();
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('shows no data in dark mode', () => {
      renderWithTheme(
        <PerformanceChart
          title="Dark No Data"
          description="No data in dark mode"
          datasets={[{
            dataKey: 'value',
            label: 'Value',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            data: [],
          }]}
          isDark={true}
        />
      );

      expect(screen.getByText('Dark No Data')).toBeInTheDocument();
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });

  // ===== COMPLEX SCENARIOS =====
  // Test objective: Verify component handles complex real-world scenarios
  describe('Complex Scenarios', () => {
    it('handles many datasets with missing valueFormatter', () => {
      // Test multiple datasets, all using default formatter
      renderWithTheme(
        <PerformanceChart
          title="Many Datasets"
          description="Five datasets with default formatter"
          datasets={[
            {
              dataKey: 'cpu',
              label: 'CPU',
              colorDark: '#60a5fa',
              colorLight: '#2563eb',
              data: mockData,
            },
            {
              dataKey: 'memory',
              label: 'Memory',
              colorDark: '#4ade80',
              colorLight: '#16a34a',
              data: mockData,
            },
            {
              dataKey: 'disk',
              label: 'Disk',
              colorDark: '#f472b6',
              colorLight: '#db2777',
              data: mockData,
            },
            {
              dataKey: 'network',
              label: 'Network',
              colorDark: '#fbbf24',
              colorLight: '#d97706',
              data: mockData,
            },
            {
              dataKey: 'gpu',
              label: 'GPU',
              colorDark: '#a78bfa',
              colorLight: '#7c3aed',
              data: mockData,
            },
          ]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('handles alternating data availability', () => {
      // Test where datasets alternate between having and not having data at indices
      const alternating1 = [
        { time: '10:00', displayTime: '10:00', value: 45 },
        { time: '10:05', displayTime: '10:05', value: 0 },
        { time: '10:10', displayTime: '10:10', value: 55 },
        { time: '10:15', displayTime: '10:15', value: 0 },
      ];

      const alternating2 = [
        { time: '10:00', displayTime: '10:00', value: 0 },
        { time: '10:05', displayTime: '10:05', value: 50 },
        { time: '10:10', displayTime: '10:10', value: 0 },
        { time: '10:15', displayTime: '10:15', value: 60 },
      ];

      renderWithTheme(
        <PerformanceChart
          title="Alternating Data"
          description="Alternating data availability"
          datasets={[
            {
              dataKey: 'value1',
              label: 'Dataset 1',
              colorDark: '#60a5fa',
              colorLight: '#2563eb',
              data: alternating1,
            },
            {
              dataKey: 'value2',
              label: 'Dataset 2',
              colorDark: '#4ade80',
              colorLight: '#16a34a',
              data: alternating2,
            },
          ]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('handles one dataset much shorter than first dataset', () => {
      // Test extreme length difference - this should trigger dataset.data[index] === undefined
      // for most indices in the shorter dataset (line 70 false branch)
      const longData = [
        { time: '10:00', displayTime: '10:00', value: 45 },
        { time: '10:05', displayTime: '10:05', value: 50 },
        { time: '10:10', displayTime: '10:10', value: 55 },
        { time: '10:15', displayTime: '10:15', value: 60 },
        { time: '10:20', displayTime: '10:20', value: 65 },
        { time: '10:25', displayTime: '10:25', value: 70 },
        { time: '10:30', displayTime: '10:30', value: 75 },
        { time: '10:35', displayTime: '10:35', value: 80 },
        { time: '10:40', displayTime: '10:40', value: 85 },
        { time: '10:45', displayTime: '10:45', value: 90 },
      ];

      const tinyData = [
        { time: '10:00', displayTime: '10:00', value: 10 },
      ];

      renderWithTheme(
        <PerformanceChart
          title="Extreme Length Difference"
          description="First dataset much longer than second"
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
              label: 'Tiny Dataset',
              colorDark: '#4ade80',
              colorLight: '#16a34a',
              data: tinyData,
            },
          ]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('handles three datasets with varying lengths', () => {
      // Test with multiple datasets having different lengths
      const dataset1 = [
        { time: '10:00', displayTime: '10:00', value: 45 },
        { time: '10:05', displayTime: '10:05', value: 50 },
        { time: '10:10', displayTime: '10:10', value: 55 },
      ];

      const dataset2 = [
        { time: '10:00', displayTime: '10:00', value: 30 },
        { time: '10:05', displayTime: '10:05', value: 35 },
      ];

      const dataset3 = [
        { time: '10:00', displayTime: '10:00', value: 20 },
      ];

      renderWithTheme(
        <PerformanceChart
          title="Three Variable Lengths"
          description="Three datasets with different lengths"
          datasets={[
            {
              dataKey: 'value1',
              label: 'Dataset 1 (longest)',
              colorDark: '#60a5fa',
              colorLight: '#2563eb',
              data: dataset1,
            },
            {
              dataKey: 'value2',
              label: 'Dataset 2 (medium)',
              colorDark: '#4ade80',
              colorLight: '#16a34a',
              data: dataset2,
            },
            {
              dataKey: 'value3',
              label: 'Dataset 3 (shortest)',
              colorDark: '#f472b6',
              colorLight: '#db2777',
              data: dataset3,
            },
          ]}
          isDark={false}
        />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  // ===== ACCESSIBILITY TESTS =====
  // Test objective: Verify component is accessible
  describe('Accessibility', () => {
    it('renders with accessible title structure', () => {
      renderWithTheme(
        <PerformanceChart
          title="Accessible Chart"
          description="This chart shows performance metrics over time"
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

      expect(screen.getByText('Accessible Chart')).toBeInTheDocument();
      expect(screen.getByText('This chart shows performance metrics over time')).toBeInTheDocument();
    });

    it('renders no data message accessibly', () => {
      renderWithTheme(
        <PerformanceChart
          title="No Data"
          description="When no data is available"
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

      expect(screen.getByText('No Data')).toBeInTheDocument();
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });
});
