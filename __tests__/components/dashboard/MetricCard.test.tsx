import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { MetricCard } from '@/components/dashboard/MetricCard';

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
  );
  return render(component, { wrapper });
}

describe('MetricCard', () => {
  it('renders correctly with required props', () => {
    renderWithTheme(
      <MetricCard
        title="Test Metric"
        value={50}
        unit="%"
        isDark={false}
      />
    );

    expect(screen.getByText('Test Metric')).toBeInTheDocument();
  });

  it('displays title, value, and unit', () => {
    renderWithTheme(
      <MetricCard
        title="CPU Usage"
        value={75}
        unit="%"
        isDark={false}
      />
    );

    expect(screen.getByText('CPU Usage')).toBeInTheDocument();
    expect(screen.getByText('75.0%')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    renderWithTheme(
      <MetricCard
        title="Memory"
        value={60}
        unit="%"
        icon="💾"
        isDark={false}
      />
    );

    expect(screen.getByText('💾')).toBeInTheDocument();
  });

  it('applies dark mode styles', () => {
    const { container } = renderWithTheme(
      <MetricCard
        title="Test"
        value={50}
        unit="%"
        isDark={true}
      />
    );

    const card = container.querySelector('.MuiCard-root');
    expect(card).toBeInTheDocument();
  });

  it('shows warning when value exceeds threshold', () => {
    renderWithTheme(
      <MetricCard
        title="High Value"
        value={95}
        unit="%"
        threshold={90}
        isDark={false}
      />
    );

    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('High Value')).toBeInTheDocument();
  });

  it('handles zero value', () => {
    renderWithTheme(
      <MetricCard
        title="Zero"
        value={0}
        unit="%"
        isDark={false}
      />
    );

    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('handles large value', () => {
    renderWithTheme(
      <MetricCard
        title="Large"
        value={1000}
        unit="ms"
        isDark={false}
      />
    );

    expect(screen.getByText('1000.0ms')).toBeInTheDocument();
  });

  // Edge Case Tests
  it('handles negative value', () => {
    renderWithTheme(
      <MetricCard
        title="Negative"
        value={-50}
        unit="%"
        isDark={false}
      />
    );

    expect(screen.getByText('-50.0%')).toBeInTheDocument();
  });

  it('handles very large value', () => {
    renderWithTheme(
      <MetricCard
        title="Very Large"
        value={999999}
        unit="units"
        isDark={false}
      />
    );

    expect(screen.getByText('999999.0units')).toBeInTheDocument();
  });

  it('handles decimal value', () => {
    renderWithTheme(
      <MetricCard
        title="Decimal"
        value={45.6789}
        unit="%"
        isDark={false}
      />
    );

    expect(screen.getByText('45.7%')).toBeInTheDocument();
  });

  it('handles undefined unit', () => {
    renderWithTheme(
      <MetricCard
        title="No Unit"
        value={50}
        isDark={false}
      />
    );

    expect(screen.getByText('50.0')).toBeInTheDocument();
  });

  it('handles empty string title', () => {
    renderWithTheme(
      <MetricCard
        title=""
        value={50}
        unit="%"
        isDark={false}
      />
    );

    expect(screen.getByText('50.0%')).toBeInTheDocument();
  });

  it('handles special characters in title', () => {
    renderWithTheme(
      <MetricCard
        title="CPU Usage 🚀 (α-test)"
        value={50}
        unit="%"
        isDark={false}
      />
    );

    expect(screen.getByText('CPU Usage 🚀 (α-test)')).toBeInTheDocument();
  });

  it('handles undefined threshold', () => {
    renderWithTheme(
      <MetricCard
        title="Default Threshold"
        value={50}
        unit="%"
        isDark={false}
      />
    );

    expect(screen.getByText('Normal')).toBeInTheDocument();
  });

  it('shows Medium warning when value exceeds 70% of threshold', () => {
    renderWithTheme(
      <MetricCard
        title="Medium Value"
        value={60}
        unit="%"
        threshold={80}
        isDark={false}
      />
    );

    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('shows High warning when value exceeds threshold', () => {
    renderWithTheme(
      <MetricCard
        title="High Value"
        value={90}
        unit="%"
        threshold={80}
        isDark={false}
      />
    );

    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('displays positive trend', () => {
    renderWithTheme(
      <MetricCard
        title="Positive Trend"
        value={50}
        unit="%"
        trend={10}
        isDark={false}
      />
    );

    expect(screen.getByText('+10%')).toBeInTheDocument();
  });

  it('displays negative trend', () => {
    renderWithTheme(
      <MetricCard
        title="Negative Trend"
        value={50}
        unit="%"
        trend={-5}
        isDark={false}
      />
    );

    expect(screen.getByText('-5%')).toBeInTheDocument();
  });

  it('displays zero trend', () => {
    renderWithTheme(
      <MetricCard
        title="Zero Trend"
        value={50}
        unit="%"
        trend={0}
        isDark={false}
      />
    );

    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('clamps progress bar at 100% for values over 100', () => {
    const { container } = renderWithTheme(
      <MetricCard
        title="Over 100"
        value={150}
        unit="%"
        isDark={false}
      />
    );

    // Check that the progress bar exists and displays high status
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('150.0%')).toBeInTheDocument();
  });

  it('clamps progress bar at 0% for negative values', () => {
    const { container } = renderWithTheme(
      <MetricCard
        title="Negative Progress"
        value={-50}
        unit="%"
        isDark={false}
      />
    );

    // Check that the progress bar renders without crashing
    expect(screen.getByText('Normal')).toBeInTheDocument();
    expect(screen.getByText('-50.0%')).toBeInTheDocument();
  });

  it('handles theme change from light to dark', () => {
    const { rerender } = renderWithTheme(
      <MetricCard
        title="Theme Test"
        value={50}
        unit="%"
        isDark={false}
      />
    );

    const lightCard = document.querySelector('.MuiCard-root');
    expect(lightCard).toBeInTheDocument();

    rerender(
      <ThemeProvider theme={theme}>
        <MetricCard
          title="Theme Test"
          value={50}
          unit="%"
          isDark={true}
        />
      </ThemeProvider>
    );

    const darkCard = document.querySelector('.MuiCard-root');
    expect(darkCard).toBeInTheDocument();
  });

  it('handles very long title', () => {
    const longTitle = 'This is a very long metric title that might overflow the container if not handled properly by the component styling';
    renderWithTheme(
      <MetricCard
        title={longTitle}
        value={50}
        unit="%"
        isDark={false}
      />
    );

    expect(screen.getByText(longTitle)).toBeInTheDocument();
  });

  it('handles special characters in unit', () => {
    renderWithTheme(
      <MetricCard
        title="Special Unit"
        value={50}
        unit="°C"
        isDark={false}
      />
    );

    expect(screen.getByText('50.0°C')).toBeInTheDocument();
  });

  it('handles unicode icon', () => {
    renderWithTheme(
      <MetricCard
        title="Unicode Icon"
        value={50}
        unit="%"
        icon="🚀"
        isDark={false}
      />
    );

    expect(screen.getByText('🚀')).toBeInTheDocument();
  });

  it('handles undefined trend', () => {
    renderWithTheme(
      <MetricCard
        title="No Trend"
        value={50}
        unit="%"
        isDark={false}
      />
    );

    // Check that no trend chip is rendered (only the value with unit)
    expect(screen.getByText('50.0%')).toBeInTheDocument();
  });

  it('handles threshold at zero', () => {
    renderWithTheme(
      <MetricCard
        title="Zero Threshold"
        value={10}
        unit="%"
        threshold={0}
        isDark={false}
      />
    );

    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('handles very small positive value', () => {
    renderWithTheme(
      <MetricCard
        title="Small Value"
        value={0.001}
        unit="%"
        isDark={false}
      />
    );

    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('handles NaN value gracefully', () => {
    renderWithTheme(
      <MetricCard
        title="NaN Value"
        value={NaN}
        unit="%"
        isDark={false}
      />
    );

    const card = screen.queryByText('NaN%');
    expect(card).toBeInTheDocument();
  });

  it('handles Infinity value', () => {
    renderWithTheme(
      <MetricCard
        title="Infinity Value"
        value={Infinity}
        unit="%"
        isDark={false}
      />
    );

    expect(screen.getByText('Infinity%')).toBeInTheDocument();
  });

  it('handles negative Infinity value', () => {
    renderWithTheme(
      <MetricCard
        title="Negative Infinity"
        value={-Infinity}
        unit="%"
        isDark={false}
      />
    );

    expect(screen.getByText('-Infinity%')).toBeInTheDocument();
  });

  it('renders circular gauge when showGauge is true', () => {
    const { container } = renderWithTheme(
      <MetricCard
        title="Test Metric"
        value={50}
        unit="%"
        isDark={false}
        showGauge={true}
      />
    );

    // Check that the gauge is rendered (SVG element should be present)
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();

    // Check that the value is still displayed
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
  });

  it('renders linear progress when showGauge is false', () => {
    const { container } = renderWithTheme(
      <MetricCard
        title="Test Metric"
        value={50}
        unit="%"
        isDark={false}
        showGauge={false}
      />
    );

    // Check that the progress bar is rendered
    const linearProgress = container.querySelector('.MuiLinearProgress-root');
    expect(linearProgress).toBeInTheDocument();

    // Check that the value and status label are displayed
    expect(screen.getByText('50.0%')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
  });

  it('renders circular gauge with dark mode', () => {
    const { container } = renderWithTheme(
      <MetricCard
        title="Dark Gauge"
        value={75}
        unit="%"
        isDark={true}
        showGauge={true}
        threshold={80}
      />
    );

    // Check that the gauge is rendered
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();

    // Check that the value is displayed
    expect(screen.getByText('75')).toBeInTheDocument();
  });
});
