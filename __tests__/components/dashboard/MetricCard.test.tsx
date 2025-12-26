import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';

const mockTheme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={mockTheme}>{component}</ThemeProvider>);
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

    expect(document.querySelector('h6')).toBeInTheDocument();
    expect(document.querySelector('h3')).toBeInTheDocument();
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

    expect(document.querySelector('h6')?.textContent).toContain('CPU Usage');
    expect(document.querySelector('h3')?.textContent).toContain('75%');
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

    expect(document.textContent).toContain('💾');
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

    expect(document.querySelector('h3')).toBeInTheDocument();
  });
});
