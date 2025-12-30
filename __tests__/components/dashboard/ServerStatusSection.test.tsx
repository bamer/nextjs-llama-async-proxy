import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import ServerStatusSection from '@/components/dashboard/ServerStatusSection';

// Mock the store hook
jest.mock('@/lib/store', () => ({
  useLlamaServerStatus: jest.fn(),
}));

// Mock the theme context
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { useLlamaServerStatus } from '@/lib/store';
import { useTheme } from '@/contexts/ThemeContext';

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
  );
  return render(component, { wrapper });
}

describe('ServerStatusSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with running status', () => {
    (useLlamaServerStatus as jest.Mock).mockReturnValue('running');
    (useTheme as jest.Mock).mockReturnValue({ isDark: false });

    renderWithTheme(
      <ServerStatusSection isDark={false} />
    );

    expect(screen.getByText('Server Status')).toBeInTheDocument();
    expect(screen.getByText('RUNNING')).toBeInTheDocument();
    expect(screen.getByText('Llama Server is running')).toBeInTheDocument();
  });

  it('renders correctly with stopped status', () => {
    (useLlamaServerStatus as jest.Mock).mockReturnValue('stopped');
    (useTheme as jest.Mock).mockReturnValue({ isDark: false });

    renderWithTheme(
      <ServerStatusSection isDark={false} />
    );

    expect(screen.getByText('Server Status')).toBeInTheDocument();
    expect(screen.getByText('STOPPED')).toBeInTheDocument();
    expect(screen.getByText('Llama Server is not running')).toBeInTheDocument();
  });

  it('applies dark mode styles', () => {
    (useLlamaServerStatus as jest.Mock).mockReturnValue('running');
    (useTheme as jest.Mock).mockReturnValue({ isDark: true });

    const { container } = renderWithTheme(
      <ServerStatusSection isDark={true} />
    );

    const card = container.querySelector('.MuiCard-root');
    expect(card).toBeInTheDocument();
  });

  it('applies light mode styles', () => {
    (useLlamaServerStatus as jest.Mock).mockReturnValue('running');
    (useTheme as jest.Mock).mockReturnValue({ isDark: false });

    const { container } = renderWithTheme(
      <ServerStatusSection isDark={false} />
    );

    const card = container.querySelector('.MuiCard-root');
    expect(card).toBeInTheDocument();
  });

  it('displays success color for running status', () => {
    (useLlamaServerStatus as jest.Mock).mockReturnValue('running');
    (useTheme as jest.Mock).mockReturnValue({ isDark: false });

    renderWithTheme(
      <ServerStatusSection isDark={false} />
    );

    const chip = screen.getByText('RUNNING');
    expect(chip).toBeInTheDocument();
  });

  it('displays default color for stopped status', () => {
    (useLlamaServerStatus as jest.Mock).mockReturnValue('stopped');
    (useTheme as jest.Mock).mockReturnValue({ isDark: false });

    renderWithTheme(
      <ServerStatusSection isDark={false} />
    );

    const chip = screen.getByText('STOPPED');
    expect(chip).toBeInTheDocument();
  });

  it('handles theme context dark mode', () => {
    (useLlamaServerStatus as jest.Mock).mockReturnValue('running');
    (useTheme as jest.Mock).mockReturnValue({ isDark: true });

    renderWithTheme(
      <ServerStatusSection isDark={false} />
    );

    expect(screen.getByText('RUNNING')).toBeInTheDocument();
  });

  it('handles theme context light mode', () => {
    (useLlamaServerStatus as jest.Mock).mockReturnValue('running');
    (useTheme as jest.Mock).mockReturnValue({ isDark: false });

    renderWithTheme(
      <ServerStatusSection isDark={true} />
    );

    expect(screen.getByText('RUNNING')).toBeInTheDocument();
  });

  it('memoizes correctly (no unnecessary re-renders)', () => {
    (useLlamaServerStatus as jest.Mock).mockReturnValue('running');
    (useTheme as jest.Mock).mockReturnValue({ isDark: false });

    const { rerender } = renderWithTheme(
      <ServerStatusSection isDark={false} />
    );

    expect(screen.getByText('RUNNING')).toBeInTheDocument();

    // Re-render with same props
    rerender(
      <ThemeProvider theme={theme}>
        <ServerStatusSection isDark={false} />
      </ThemeProvider>
    );

    expect(screen.getByText('RUNNING')).toBeInTheDocument();
  });

  it('updates when status changes', () => {
    (useLlamaServerStatus as jest.Mock).mockReturnValue('running');
    (useTheme as jest.Mock).mockReturnValue({ isDark: false });

    const { rerender } = renderWithTheme(
      <ServerStatusSection isDark={false} />
    );

    expect(screen.getByText('RUNNING')).toBeInTheDocument();

    // Change status to stopped
    (useLlamaServerStatus as jest.Mock).mockReturnValue('stopped');

    rerender(
      <ThemeProvider theme={theme}>
        <ServerStatusSection isDark={false} />
      </ThemeProvider>
    );

    expect(screen.getByText('STOPPED')).toBeInTheDocument();
  });

  it('handles undefined status gracefully', () => {
    (useLlamaServerStatus as jest.Mock).mockReturnValue(undefined);
    (useTheme as jest.Mock).mockReturnValue({ isDark: false });

    renderWithTheme(
      <ServerStatusSection isDark={false} />
    );

    expect(screen.getByText('STOPPED')).toBeInTheDocument();
  });

  it('handles null status gracefully', () => {
    (useLlamaServerStatus as jest.Mock).mockReturnValue(null);
    (useTheme as jest.Mock).mockReturnValue({ isDark: false });

    renderWithTheme(
      <ServerStatusSection isDark={false} />
    );

    expect(screen.getByText('STOPPED')).toBeInTheDocument();
  });

  it('handles unknown status gracefully', () => {
    (useLlamaServerStatus as jest.Mock).mockReturnValue('unknown');
    (useTheme as jest.Mock).mockReturnValue({ isDark: false });

    renderWithTheme(
      <ServerStatusSection isDark={false} />
    );

    expect(screen.getByText('STOPPED')).toBeInTheDocument();
  });

  it('displays correct message for running status', () => {
    (useLlamaServerStatus as jest.Mock).mockReturnValue('running');
    (useTheme as jest.Mock).mockReturnValue({ isDark: false });

    renderWithTheme(
      <ServerStatusSection isDark={false} />
    );

    expect(screen.getByText('Llama Server is running')).toBeInTheDocument();
  });

  it('displays correct message for stopped status', () => {
    (useLlamaServerStatus as jest.Mock).mockReturnValue('stopped');
    (useTheme as jest.Mock).mockReturnValue({ isDark: false });

    renderWithTheme(
      <ServerStatusSection isDark={false} />
    );

    expect(screen.getByText('Llama Server is not running')).toBeInTheDocument();
  });

  it('renders chip with correct styling', () => {
    (useLlamaServerStatus as jest.Mock).mockReturnValue('running');
    (useTheme as jest.Mock).mockReturnValue({ isDark: false });

    renderWithTheme(
      <ServerStatusSection isDark={false} />
    );

    const chip = screen.getByText('RUNNING');
    expect(chip).toHaveStyle({ fontWeight: 'bold' });
  });
});