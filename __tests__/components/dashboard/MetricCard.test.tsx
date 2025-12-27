import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { MetricCard } from '@/components/dashboard/MetricCard';

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
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
});
