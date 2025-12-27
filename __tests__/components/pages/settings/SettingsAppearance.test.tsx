import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { SettingsAppearance } from '@/components/pages/settings/SettingsAppearance';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('SettingsAppearance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    renderWithTheme(<SettingsAppearance />);
    expect(screen.getByRole('heading', { name: /appearance/i })).toBeInTheDocument();
  });

  it('displays appearance settings options', () => {
    renderWithTheme(<SettingsAppearance />);
    expect(screen.getByText(/theme/i)).toBeInTheDocument();
  });

  it('handles theme selection', () => {
    renderWithTheme(<SettingsAppearance />);
    const buttons = screen.getAllByRole('radio');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('displays color mode options', () => {
    renderWithTheme(<SettingsAppearance />);
    expect(screen.getByText(/light/i)).toBeInTheDocument();
    expect(screen.getByText(/dark/i)).toBeInTheDocument();
    expect(screen.getByText(/system/i)).toBeInTheDocument();
  });
});
