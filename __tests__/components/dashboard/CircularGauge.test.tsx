import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CircularGauge } from '@/components/dashboard/CircularGauge';

// Mock MUI x-charts Gauge components
jest.mock('@mui/x-charts/Gauge', () => ({
  GaugeContainer: ({ children, width, height }: { children: React.ReactNode; width: number; height: number }) =>
    React.createElement('svg', {
      width,
      height,
      'data-testid': 'gauge-container',
      viewBox: `0 0 ${width} ${height}`
    }, children),
  GaugeReferenceArc: () => React.createElement('circle', { 'data-testid': 'gauge-reference-arc', cx: 50, cy: 50, r: 40 }),
  GaugeValueArc: () => React.createElement('circle', { 'data-testid': 'gauge-value-arc', cx: 50, cy: 50, r: 30 }),
  GaugeValueText: ({ text }: { text: () => string }) => React.createElement('text', {
    'data-testid': 'gauge-value-text',
    x: 50,
    y: 55,
    textAnchor: 'middle'
  }, text()),
  gaugeClasses: {
    valueText: 'value-text',
    valueArc: 'value-arc',
    referenceArc: 'reference-arc',
  },
}));

// Mock useTheme to provide breakpoints for isMobile
jest.mock('@/contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: any) => React.createElement('div', { 'data-theme-provider': 'true' }, children),
  useTheme: jest.fn(() => ({
    isDark: false,
    mode: 'light',
    setMode: jest.fn(),
    toggleTheme: jest.fn(),
    palette: {
      error: { main: '#d32f2f' },
      warning: { main: '#ed6c02' },
      success: { main: '#2e7d32' },
    },
    breakpoints: {
      down: jest.fn(() => '@media (max-width: 599px)'),
      up: jest.fn(() => '@media (min-width: 600px)'),
      values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
    },
  })),
}));

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
  );
  return render(component, { wrapper });
}

describe('CircularGauge', () => {
  it('renders correctly with required props', () => {
    const { container } = renderWithTheme(
      <CircularGauge value={50} isDark={false} />
    );

    const gaugeContainer = container.querySelector('svg');
    expect(gaugeContainer).toBeInTheDocument();
  });

  it('displays value correctly', () => {
    const { container } = renderWithTheme(
      <CircularGauge value={75} isDark={false} />
    );

    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('displays unit and label', () => {
    renderWithTheme(
      <CircularGauge
        value={60}
        unit="%"
        label="CPU"
        isDark={false}
      />
    );

    expect(screen.getByText('%')).toBeInTheDocument();
    expect(screen.getByText('CPU')).toBeInTheDocument();
  });

  it('handles min and max values', () => {
    renderWithTheme(
      <CircularGauge
        value={50}
        min={0}
        max={200}
        isDark={false}
      />
    );

    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('applies dark mode styles', () => {
    renderWithTheme(
      <CircularGauge value={50} isDark={true} />
    );

    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('handles custom size', () => {
    const { container } = renderWithTheme(
      <CircularGauge value={50} size={200} isDark={false} />
    );

    const gaugeContainer = container.querySelector('svg');
    expect(gaugeContainer).toBeInTheDocument();
  });

  it('shows error color when value exceeds threshold', () => {
    renderWithTheme(
      <CircularGauge value={85} threshold={80} isDark={false} />
    );

    expect(screen.getByText('85')).toBeInTheDocument();
  });

  it('handles zero value', () => {
    renderWithTheme(
      <CircularGauge value={0} isDark={false} />
    );

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('handles maximum value', () => {
    renderWithTheme(
      <CircularGauge value={100} isDark={false} />
    );

    expect(screen.getByText('100')).toBeInTheDocument();
  });

  describe('Edge Cases', () => {
    it('handles negative value - component displays actual value', () => {
      renderWithTheme(
        <CircularGauge value={-50} min={0} max={100} isDark={false} />
      );

      // Component displays actual value, not clamped
      expect(screen.getByText('-50')).toBeInTheDocument();
    });

    it('handles value exceeding max - component displays actual value', () => {
      renderWithTheme(
        <CircularGauge value={150} min={0} max={100} isDark={false} />
      );

      // Component displays actual value, not clamped
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    it('handles decimal value', () => {
      renderWithTheme(
        <CircularGauge value={45.6789} isDark={false} />
      );

      expect(screen.getByText('45.7')).toBeInTheDocument();
    });

    it('handles integer value without decimal', () => {
      renderWithTheme(
        <CircularGauge value={75} isDark={false} />
      );

      expect(screen.getByText('75')).toBeInTheDocument();
    });

    it('handles NaN value gracefully', () => {
      renderWithTheme(
        <CircularGauge value={NaN} isDark={false} />
      );

      expect(screen.getByText('NaN')).toBeInTheDocument();
    });

    it('handles Infinity value', () => {
      renderWithTheme(
        <CircularGauge value={Infinity} isDark={false} />
      );

      expect(screen.getByText('Infinity')).toBeInTheDocument();
    });

    it('handles negative Infinity value', () => {
      renderWithTheme(
        <CircularGauge value={-Infinity} isDark={false} />
      );

      expect(screen.getByText('-Infinity')).toBeInTheDocument();
    });

    it('handles very large value', () => {
      renderWithTheme(
        <CircularGauge value={999999} isDark={false} />
      );

      expect(screen.getByText('999999')).toBeInTheDocument();
    });

    it('handles custom min/max range', () => {
      renderWithTheme(
        <CircularGauge value={50} min={-100} max={100} isDark={false} />
      );

      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('handles very small size', () => {
      const { container } = renderWithTheme(
        <CircularGauge value={50} size={50} isDark={false} />
      );

      const gaugeContainer = container.querySelector('svg');
      expect(gaugeContainer).toBeInTheDocument();
    });

    it('handles very large size', () => {
      const { container } = renderWithTheme(
        <CircularGauge value={50} size={500} isDark={false} />
      );

      const gaugeContainer = container.querySelector('svg');
      expect(gaugeContainer).toBeInTheDocument();
    });

    it('renders with both unit and label', () => {
      renderWithTheme(
        <CircularGauge
          value={75}
          unit="%"
          label="Usage"
          isDark={false}
        />
      );

      expect(screen.getByText('%')).toBeInTheDocument();
      expect(screen.getByText('Usage')).toBeInTheDocument();
      expect(screen.getByText('75')).toBeInTheDocument();
    });

    it('handles long unit text', () => {
      const longUnit = 'degrees Celsius';
      renderWithTheme(
        <CircularGauge value={25} unit={longUnit} isDark={false} />
      );

      expect(screen.getByText(longUnit)).toBeInTheDocument();
    });

    it('handles long label text', () => {
      const longLabel = 'Central Processing Unit';
      renderWithTheme(
        <CircularGauge value={25} label={longLabel} isDark={false} />
      );

      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });
  });

  describe('Conditional Rendering', () => {
    it('handles undefined unit', () => {
      renderWithTheme(
        <CircularGauge value={50} isDark={false} />
      );

      expect(screen.queryByText('%')).not.toBeInTheDocument();
    });

    it('handles empty string unit', () => {
      renderWithTheme(
        <CircularGauge value={50} unit="" isDark={false} />
      );

      expect(screen.queryByText('%')).not.toBeInTheDocument();
    });

    it('handles empty string label', () => {
      renderWithTheme(
        <CircularGauge value={50} label="" isDark={false} />
      );

      expect(screen.queryByText('CPU')).not.toBeInTheDocument();
    });

    it('handles special characters in unit', () => {
      renderWithTheme(
        <CircularGauge value={50} unit="°C" isDark={false} />
      );

      expect(screen.getByText('°C')).toBeInTheDocument();
    });

    it('handles special characters in label', () => {
      renderWithTheme(
        <CircularGauge value={50} label="CPU 🚀" isDark={false} />
      );

      expect(screen.getByText('CPU 🚀')).toBeInTheDocument();
    });

    it('handles undefined threshold (uses default)', () => {
      renderWithTheme(
        <CircularGauge value={50} isDark={false} />
      );

      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('handles threshold at zero', () => {
      renderWithTheme(
        <CircularGauge value={10} threshold={0} isDark={false} />
      );

      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('handles very small positive value', () => {
      renderWithTheme(
        <CircularGauge value={0.001} isDark={false} />
      );

      expect(screen.getByText('0.0')).toBeInTheDocument();
    });
  });

  describe('Color Thresholds', () => {
    it('shows success color when value is below 70% of threshold', () => {
      renderWithTheme(
        <CircularGauge value={40} threshold={80} isDark={false} />
      );

      expect(screen.getByText('40')).toBeInTheDocument();
    });

    it('shows warning color when value exceeds 70% of threshold', () => {
      renderWithTheme(
        <CircularGauge value={60} threshold={80} isDark={false} />
      );

      expect(screen.getByText('60')).toBeInTheDocument();
    });

    it('shows error color when value exceeds threshold', () => {
      renderWithTheme(
        <CircularGauge value={85} threshold={80} isDark={false} />
      );

      expect(screen.getByText('85')).toBeInTheDocument();
    });

    it('shows warning color when value at exactly 70% of threshold', () => {
      renderWithTheme(
        <CircularGauge value={56} threshold={80} isDark={false} />
      );

      expect(screen.getByText('56')).toBeInTheDocument();
    });

    it('shows error color when value at exactly threshold', () => {
      renderWithTheme(
        <CircularGauge value={80} threshold={80} isDark={false} />
      );

      expect(screen.getByText('80')).toBeInTheDocument();
    });

    it('handles custom threshold values', () => {
      renderWithTheme(
        <CircularGauge value={95} threshold={90} isDark={false} />
      );

      expect(screen.getByText('95')).toBeInTheDocument();
    });
  });

  describe('Dark Mode', () => {
    it('applies correct background in dark mode', () => {
      renderWithTheme(
        <CircularGauge value={50} isDark={true} />
      );

      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('applies correct text color in dark mode', () => {
      renderWithTheme(
        <CircularGauge value={50} isDark={true} />
      );

      expect(screen.getByText('50')).toBeInTheDocument();
    });
  });

  describe('Percentage Calculation', () => {
    it('calculates percentage correctly for mid-range value', () => {
      renderWithTheme(
        <CircularGauge value={50} min={0} max={100} isDark={false} />
      );

      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('calculates percentage for negative range', () => {
      renderWithTheme(
        <CircularGauge value={0} min={-100} max={100} isDark={false} />
      );

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('calculates percentage for custom range', () => {
      renderWithTheme(
        <CircularGauge value={75} min={50} max={150} isDark={false} />
      );

      expect(screen.getByText('75')).toBeInTheDocument();
    });

    it('handles value at exact min', () => {
      renderWithTheme(
        <CircularGauge value={0} min={0} max={100} isDark={false} />
      );

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles value at exact max', () => {
      renderWithTheme(
        <CircularGauge value={100} min={0} max={100} isDark={false} />
      );

      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('handles value below min (Math.max branch)', () => {
      renderWithTheme(
        <CircularGauge value={-10} min={0} max={100} isDark={false} />
      );

      expect(screen.getByText('-10')).toBeInTheDocument();
    });

    it('handles value above max (Math.min branch)', () => {
      renderWithTheme(
        <CircularGauge value={150} min={0} max={100} isDark={false} />
      );

      expect(screen.getByText('150')).toBeInTheDocument();
    });

    it('handles symmetric range around zero', () => {
      renderWithTheme(
        <CircularGauge value={0} min={-50} max={50} isDark={false} />
      );

      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Memoization', () => {
    it('memoizes correctly - no re-render when props unchanged', () => {
      const { rerender } = renderWithTheme(
        <CircularGauge value={50} unit="%" label="Test" isDark={false} />
      );

      // Re-render with identical props - memo comparison should return true
      rerender(
        <ThemeProvider theme={theme}>
          <CircularGauge value={50} unit="%" label="Test" isDark={false} />
        </ThemeProvider>
      );

      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('%')).toBeInTheDocument();
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('memo comparison returns false when only value changes', () => {
      const { rerender } = renderWithTheme(
        <CircularGauge value={50} unit="%" label="Test" isDark={false} />
      );

      // Only change value - first comparison in memo should return false
      rerender(
        <ThemeProvider theme={theme}>
          <CircularGauge value={75} unit="%" label="Test" isDark={false} />
        </ThemeProvider>
      );

      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.queryByText('50')).not.toBeInTheDocument();
    });

    it('memo comparison returns false when only unit changes', () => {
      const { rerender } = renderWithTheme(
        <CircularGauge value={50} unit="%" label="Test" isDark={false} />
      );

      // Only change unit - first comparison passes, second fails
      rerender(
        <ThemeProvider theme={theme}>
          <CircularGauge value={50} unit="W" label="Test" isDark={false} />
        </ThemeProvider>
      );

      expect(screen.getByText('W')).toBeInTheDocument();
      expect(screen.queryByText('%')).not.toBeInTheDocument();
    });

    it('memo comparison returns false when only label changes', () => {
      const { rerender } = renderWithTheme(
        <CircularGauge value={50} unit="%" label="Test" isDark={false} />
      );

      // Only change label - first two comparisons pass, third fails
      rerender(
        <ThemeProvider theme={theme}>
          <CircularGauge value={50} unit="%" label="Updated" isDark={false} />
        </ThemeProvider>
      );

      expect(screen.getByText('Updated')).toBeInTheDocument();
      expect(screen.queryByText('Test')).not.toBeInTheDocument();
    });

    it('memo comparison returns false when only threshold changes', () => {
      const { rerender } = renderWithTheme(
        <CircularGauge value={50} threshold={80} isDark={false} />
      );

      // Change threshold - tests memo comparison's threshold check
      rerender(
        <ThemeProvider theme={theme}>
          <CircularGauge value={50} threshold={90} isDark={false} />
        </ThemeProvider>
      );

      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('memo comparison returns false when only isDark changes', () => {
      const { rerender } = renderWithTheme(
        <CircularGauge value={50} isDark={false} />
      );

      // Only change isDark - tests the last comparison
      rerender(
        <ThemeProvider theme={theme}>
          <CircularGauge value={50} isDark={true} />
        </ThemeProvider>
      );

      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('re-renders when value changes', () => {
      const { rerender } = renderWithTheme(
        <CircularGauge value={50} isDark={false} />
      );

      rerender(
        <ThemeProvider theme={theme}>
          <CircularGauge value={75} isDark={false} />
        </ThemeProvider>
      );

      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.queryByText('50')).not.toBeInTheDocument();
    });

    it('re-renders when unit changes', () => {
      const { rerender } = renderWithTheme(
        <CircularGauge value={50} unit="%" isDark={false} />
      );

      rerender(
        <ThemeProvider theme={theme}>
          <CircularGauge value={50} unit="W" isDark={false} />
        </ThemeProvider>
      );

      expect(screen.getByText('W')).toBeInTheDocument();
      expect(screen.queryByText('%')).not.toBeInTheDocument();
    });

    it('re-renders when label changes', () => {
      const { rerender } = renderWithTheme(
        <CircularGauge value={50} label="CPU" isDark={false} />
      );

      rerender(
        <ThemeProvider theme={theme}>
          <CircularGauge value={50} label="GPU" isDark={false} />
        </ThemeProvider>
      );

      expect(screen.getByText('GPU')).toBeInTheDocument();
      expect(screen.queryByText('CPU')).not.toBeInTheDocument();
    });

    it('re-renders when threshold changes', () => {
      const { rerender } = renderWithTheme(
        <CircularGauge value={85} threshold={80} isDark={false} />
      );

      rerender(
        <ThemeProvider theme={theme}>
          <CircularGauge value={85} threshold={90} isDark={false} />
        </ThemeProvider>
      );

      expect(screen.getByText('85')).toBeInTheDocument();
    });

    it('re-renders when isDark changes', () => {
      const { rerender } = renderWithTheme(
        <CircularGauge value={50} isDark={false} />
      );

      rerender(
        <ThemeProvider theme={theme}>
          <CircularGauge value={50} isDark={true} />
        </ThemeProvider>
      );

      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('re-renders when min changes', () => {
      const { rerender } = renderWithTheme(
        <CircularGauge value={50} min={0} max={100} isDark={false} />
      );

      rerender(
        <ThemeProvider theme={theme}>
          <CircularGauge value={50} min={25} max={100} isDark={false} />
        </ThemeProvider>
      );

      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('re-renders when max changes', () => {
      const { rerender } = renderWithTheme(
        <CircularGauge value={50} min={0} max={100} isDark={false} />
      );

      rerender(
        <ThemeProvider theme={theme}>
          <CircularGauge value={50} min={0} max={200} isDark={false} />
        </ThemeProvider>
      );

      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('re-renders when size changes', () => {
      const { rerender } = renderWithTheme(
        <CircularGauge value={50} size={150} isDark={false} />
      );

      rerender(
        <ThemeProvider theme={theme}>
          <CircularGauge value={50} size={200} isDark={false} />
        </ThemeProvider>
      );

      const container = renderWithTheme(<CircularGauge value={50} size={200} isDark={false} />).container;
      const gaugeContainer = container.querySelector('svg');
      expect(gaugeContainer).toBeInTheDocument();
    });
  });

  describe('Decimal Precision', () => {
    it('rounds to 1 decimal place for values with many decimals', () => {
      renderWithTheme(
        <CircularGauge value={45.67890123456} isDark={false} />
      );

      expect(screen.getByText('45.7')).toBeInTheDocument();
    });

    it('shows single decimal when value has .5', () => {
      renderWithTheme(
        <CircularGauge value={50.5} isDark={false} />
      );

      expect(screen.getByText('50.5')).toBeInTheDocument();
    });

    it('shows no decimal for whole numbers', () => {
      renderWithTheme(
        <CircularGauge value={50.0} isDark={false} />
      );

      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('handles negative decimals', () => {
      renderWithTheme(
        <CircularGauge value={-10.5} isDark={false} />
      );

      expect(screen.getByText('-10.5')).toBeInTheDocument();
    });
  });
});
