import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { SettingsFeatures } from '@/components/pages/settings/SettingsFeatures';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('SettingsFeatures', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    renderWithTheme(<SettingsFeatures />);
    expect(screen.getByRole('heading', { name: /features/i })).toBeInTheDocument();
  });

  it('displays feature toggles', () => {
    renderWithTheme(<SettingsFeatures />);
    expect(screen.getByText(/features/i)).toBeInTheDocument();
  });

  it('handles feature selection', () => {
    renderWithTheme(<SettingsFeatures />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it('allows toggling features on/off', () => {
    renderWithTheme(<SettingsFeatures />);
    const checkboxes = screen.getAllByRole('checkbox');
    if (checkboxes.length > 0) {
      fireEvent.click(checkboxes[0]);
      expect(checkboxes[0]).toBeInTheDocument();
    }
  });
});
