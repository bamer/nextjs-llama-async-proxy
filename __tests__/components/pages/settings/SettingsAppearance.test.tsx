import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { SettingsAppearance } from '@/components/pages/settings/SettingsAppearance';
import type { MotionComponentProps } from '__tests__/types/mock-types';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: MotionComponentProps) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: MotionComponentProps) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('SettingsAppearance', () => {
  const mockOnThemeChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const settings = { theme: 'System' as 'light' | 'dark' | 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    expect(screen.getByRole('heading', { name: /appearance/i })).toBeInTheDocument();
  });

  it('displays theme options', () => {
    const settings = { theme: 'System' as 'light' | 'dark' | 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('highlights selected theme', () => {
    const settings = { theme: 'Dark' as 'light' | 'dark' | 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const darkButton = screen.getByText('Dark').closest('button');
    expect(darkButton).toBeInTheDocument();
  });

  it('calls onThemeChange when light theme is clicked', () => {
    const settings = { theme: 'Dark' as 'light' | 'dark' | 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const lightButton = screen.getByText('Light').closest('button');
    fireEvent.click(lightButton!);

    expect(mockOnThemeChange).toHaveBeenCalledTimes(1);
    expect(mockOnThemeChange).toHaveBeenCalledWith('light');
  });

  it('calls onThemeChange when dark theme is clicked', () => {
    const settings = { theme: 'Light' as 'light' | 'dark' | 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const darkButton = screen.getByText('Dark').closest('button');
    fireEvent.click(darkButton!);

    expect(mockOnThemeChange).toHaveBeenCalledTimes(1);
    expect(mockOnThemeChange).toHaveBeenCalledWith('dark');
  });

  it('calls onThemeChange when system theme is clicked', () => {
    const settings = { theme: 'Light' as 'light' | 'dark' | 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const systemButton = screen.getByText('System').closest('button');
    fireEvent.click(systemButton!);

    expect(mockOnThemeChange).toHaveBeenCalledTimes(1);
    expect(mockOnThemeChange).toHaveBeenCalledWith('system');
  });

  it('renders with light theme selected by default', () => {
    const settings = { theme: 'Light' as 'light' | 'dark' | 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const lightButton = screen.getByText('Light').closest('button');
    expect(lightButton).toBeInTheDocument();
  });

  it('renders with dark theme selected', () => {
    const settings = { theme: 'Dark' as 'light' | 'dark' | 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const darkButton = screen.getByText('Dark').closest('button');
    expect(darkButton).toBeInTheDocument();
  });

  it('renders with system theme selected', () => {
    const settings = { theme: 'System' as 'light' | 'dark' | 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const systemButton = screen.getByText('System').closest('button');
    expect(systemButton).toBeInTheDocument();
  });

  it('handles theme switching from light to dark', () => {
    const settings = { theme: 'Light' as 'light' | 'dark' | 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const darkButton = screen.getByText('Dark').closest('button');
    fireEvent.click(darkButton!);

    expect(mockOnThemeChange).toHaveBeenCalledWith('dark');
  });

  it('handles theme switching from dark to system', () => {
    const settings = { theme: 'Dark' as 'light' | 'dark' | 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const systemButton = screen.getByText('System').closest('button');
    fireEvent.click(systemButton!);

    expect(mockOnThemeChange).toHaveBeenCalledWith('system');
  });

  it('handles multiple theme changes in sequence', () => {
    const settings = { theme: 'Light' as 'light' | 'dark' | 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const darkButton = screen.getByText('Dark').closest('button');
    const systemButton = screen.getByText('System').closest('button');

    fireEvent.click(darkButton!);
    fireEvent.click(systemButton!);
    fireEvent.click(darkButton!);

    expect(mockOnThemeChange).toHaveBeenCalledTimes(3);
    expect(mockOnThemeChange).toHaveBeenNthCalledWith(1, 'dark');
    expect(mockOnThemeChange).toHaveBeenNthCalledWith(2, 'system');
    expect(mockOnThemeChange).toHaveBeenNthCalledWith(3, 'dark');
  });

  it('renders with all three buttons', () => {
    const settings = { theme: 'System' as 'light' | 'dark' | 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(3);
  });

  it('displays theme names', () => {
    const settings = { theme: 'System' as 'light' | 'dark' | 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('handles rapid clicking on same theme button', () => {
    const settings = { theme: 'Light' as 'light' | 'dark' | 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const lightButton = screen.getByText('Light').closest('button');
    fireEvent.click(lightButton!);
    fireEvent.click(lightButton!);
    fireEvent.click(lightButton!);

    expect(mockOnThemeChange).toHaveBeenCalledTimes(3);
    expect(mockOnThemeChange).toHaveBeenCalledWith('light');
  });

  it('displays icons for themes', () => {
    const settings = { theme: 'System' as 'light' | 'dark' | 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('highlights selected theme with MUI styling', () => {
    const settings = { theme: 'Dark' as 'light' | 'dark' | 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const darkButton = screen.getByText('Dark').closest('button');
    expect(darkButton).toBeInTheDocument();
  });

  it('calls onThemeChange when light theme is clicked', () => {
    const settings = { theme: 'Dark' as 'light' | 'dark' | 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const lightButton = screen.getByText('Light').closest('button');
    fireEvent.click(lightButton!);

    expect(mockOnThemeChange).toHaveBeenCalledTimes(1);
    expect(mockOnThemeChange).toHaveBeenCalledWith('light');
  });

  it('calls onThemeChange when dark theme is clicked', () => {
    const settings = { theme: 'Light' as 'light' | 'dark' | 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const darkButton = screen.getByText('Dark').closest('button');
    fireEvent.click(darkButton!);

    expect(mockOnThemeChange).toHaveBeenCalledTimes(1);
    expect(mockOnThemeChange).toHaveBeenCalledWith('dark');
  });

  it('calls onThemeChange when system theme is clicked', () => {
    const settings = { theme: 'Light' as 'light' | 'dark' | 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const systemButton = screen.getByText('System').closest('button');
    fireEvent.click(systemButton!);

    expect(mockOnThemeChange).toHaveBeenCalledTimes(1);
    expect(mockOnThemeChange).toHaveBeenCalledWith('system');
  });

  it('renders with light theme selected by default', () => {
    const settings = { theme: 'Light' as 'light' | 'dark' | 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const lightButton = screen.getByText('Light').closest('button');
    expect(lightButton).toBeInTheDocument();
  });

  it('renders with dark theme selected', () => {
    const settings = { theme: 'Dark' as 'light' | 'dark' | 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const darkButton = screen.getByText('Dark').closest('button');
    expect(darkButton).toBeInTheDocument();
  });

  it('renders with system theme selected', () => {
    const settings = { theme: 'System' as 'light' | 'dark' | 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const systemButton = screen.getByText('System').closest('button');
    expect(systemButton).toBeInTheDocument();
  });

  it('handles theme switching from light to dark', () => {
    const settings = { theme: 'Light' as 'light' | 'dark' | 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const darkButton = screen.getByText('Dark').closest('button');
    fireEvent.click(darkButton!);

    expect(mockOnThemeChange).toHaveBeenCalledWith('dark');
  });

  it('handles theme switching from dark to system', () => {
    const settings = { theme: 'Dark' as 'light' | 'dark' | 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const systemButton = screen.getByText('System').closest('button');
    fireEvent.click(systemButton!);

    expect(mockOnThemeChange).toHaveBeenCalledWith('system');
  });

  it('handles multiple theme changes in sequence', () => {
    const settings = { theme: 'Light' as 'light' | 'dark' | 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const darkButton = screen.getByText('Dark').closest('button');
    const systemButton = screen.getByText('System').closest('button');

    fireEvent.click(darkButton!);
    fireEvent.click(systemButton!);
    fireEvent.click(darkButton!);

    expect(mockOnThemeChange).toHaveBeenCalledTimes(3);
    expect(mockOnThemeChange).toHaveBeenNthCalledWith(1, 'dark');
    expect(mockOnThemeChange).toHaveBeenNthCalledWith(2, 'system');
    expect(mockOnThemeChange).toHaveBeenNthCalledWith(3, 'dark');
  });

  it('renders with all three buttons', () => {
    const settings = { theme: 'System' as 'light' | 'dark' | 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(3);
  });

  it('displays theme names', () => {
    const settings = { theme: 'System' as 'light' | 'dark' | 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('handles theme set to null', () => {
    const settings = { theme: null as unknown as 'light' | 'dark' | 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    expect(screen.getByText('Appearance')).toBeInTheDocument();
  });

  it('handles theme set to undefined', () => {
    const settings = { theme: undefined as unknown as 'light' | 'dark' | 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    expect(screen.getByText('Appearance')).toBeInTheDocument();
  });

  it('handles rapid clicking on same theme button', () => {
    const settings = { theme: 'Light' as 'light' | 'dark' | 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const lightButton = screen.getByText('Light').closest('button');
    fireEvent.click(lightButton!);
    fireEvent.click(lightButton!);
    fireEvent.click(lightButton!);

    expect(mockOnThemeChange).toHaveBeenCalledTimes(3);
    expect(mockOnThemeChange).toHaveBeenCalledWith('light');
  });

  it('renders correctly with empty settings object', () => {
    const settings = { theme: 'Light' as 'light' | 'dark' | 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    expect(screen.getByText('Appearance')).toBeInTheDocument();
  });
});
