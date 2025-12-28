import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AdvancedSettingsTab } from '@/components/configuration/AdvancedSettingsTab';
import { useTheme } from '@/contexts/ThemeContext';

jest.mock('framer-motion', () => ({
  m: {
    div: (props: unknown) => {
      const { children } = props as { children?: React.ReactNode };
      return <div>{children}</div>;
    },
  },
}));

jest.mock('@/contexts/ThemeContext');

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('AdvancedSettingsTab', () => {
  const mockOnReset = jest.fn();
  const mockOnSync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useTheme).mockReturnValue({
      isDark: false,
      mode: 'light' as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: theme,
    });
  });

  it('renders correctly', () => {
    renderWithTheme(
      <AdvancedSettingsTab isSaving={false} onReset={mockOnReset} onSync={mockOnSync} />
    );
    expect(screen.getByText('Advanced Settings')).toBeInTheDocument();
  });

  it('renders description text', () => {
    renderWithTheme(
      <AdvancedSettingsTab isSaving={false} onReset={mockOnReset} onSync={mockOnSync} />
    );
    expect(screen.getByText('Advanced configuration options for power users.')).toBeInTheDocument();
  });

  it('renders Reset to Defaults button', () => {
    renderWithTheme(
      <AdvancedSettingsTab isSaving={false} onReset={mockOnReset} onSync={mockOnSync} />
    );
    expect(screen.getByText('Reset to Defaults')).toBeInTheDocument();
  });

  it('renders Sync with Backend button', () => {
    renderWithTheme(
      <AdvancedSettingsTab isSaving={false} onReset={mockOnReset} onSync={mockOnSync} />
    );
    expect(screen.getByText('Sync with Backend')).toBeInTheDocument();
  });

  it('calls onReset when Reset to Defaults button is clicked', () => {
    renderWithTheme(
      <AdvancedSettingsTab isSaving={false} onReset={mockOnReset} onSync={mockOnSync} />
    );
    const button = screen.getByText('Reset to Defaults');
    fireEvent.click(button);
    expect(mockOnReset).toHaveBeenCalledTimes(1);
  });

  it('calls onSync when Sync with Backend button is clicked', () => {
    renderWithTheme(
      <AdvancedSettingsTab isSaving={false} onReset={mockOnReset} onSync={mockOnSync} />
    );
    const button = screen.getByText('Sync with Backend');
    fireEvent.click(button);
    expect(mockOnSync).toHaveBeenCalledTimes(1);
  });

  it('disables Reset to Defaults button when isSaving is true', () => {
    renderWithTheme(
      <AdvancedSettingsTab isSaving={true} onReset={mockOnReset} onSync={mockOnSync} />
    );
    const button = screen.getByText('Reset to Defaults');
    expect(button).toBeDisabled();
  });

  it('disables Sync with Backend button when isSaving is true', () => {
    renderWithTheme(
      <AdvancedSettingsTab isSaving={true} onReset={mockOnReset} onSync={mockOnSync} />
    );
    const button = screen.getByText('Sync with Backend');
    expect(button).toBeDisabled();
  });

  it('enables buttons when isSaving is false', () => {
    renderWithTheme(
      <AdvancedSettingsTab isSaving={false} onReset={mockOnReset} onSync={mockOnSync} />
    );
    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).not.toBeDisabled();
    });
  });

  it('renders configuration version', () => {
    renderWithTheme(
      <AdvancedSettingsTab isSaving={false} onReset={mockOnReset} onSync={mockOnSync} />
    );
    expect(screen.getByText('Current configuration version: 2.0')).toBeInTheDocument();
  });

  it('does not call onReset when button is disabled', () => {
    renderWithTheme(
      <AdvancedSettingsTab isSaving={true} onReset={mockOnReset} onSync={mockOnSync} />
    );
    const button = screen.getByText('Reset to Defaults');
    fireEvent.click(button);
    expect(mockOnReset).not.toHaveBeenCalled();
  });

  it('does not call onSync when button is disabled', () => {
    renderWithTheme(
      <AdvancedSettingsTab isSaving={true} onReset={mockOnReset} onSync={mockOnSync} />
    );
    const button = screen.getByText('Sync with Backend');
    fireEvent.click(button);
    expect(mockOnSync).not.toHaveBeenCalled();
  });

  it('renders with dark theme', () => {
    const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;
    mockUseTheme.mockReturnValue({
      isDark: true,
      mode: 'dark' as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: theme,
    });
    renderWithTheme(
      <AdvancedSettingsTab isSaving={false} onReset={mockOnReset} onSync={mockOnSync} />
    );
    expect(screen.getByText('Advanced Settings')).toBeInTheDocument();
  });
});
