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

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
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
    const settings = { theme: 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    expect(screen.getByRole('heading', { name: /appearance/i })).toBeInTheDocument();
  });

  it('displays theme options', () => {
    const settings = { theme: 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    expect(screen.getByText('light')).toBeInTheDocument();
    expect(screen.getByText('dark')).toBeInTheDocument();
    expect(screen.getByText('system')).toBeInTheDocument();
  });

  it('displays correct emojis for themes', () => {
    const settings = { theme: 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    expect(screen.getByText('☀️')).toBeInTheDocument();
    expect(screen.getByText('🌙')).toBeInTheDocument();
    expect(screen.getByText('💻')).toBeInTheDocument();
  });

  it('highlights selected theme', () => {
    const settings = { theme: 'dark' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const darkButton = screen.getByText('dark').closest('button');
    expect(darkButton).toHaveClass('border-blue-500');
  });

  it('calls onThemeChange when light theme is clicked', () => {
    const settings = { theme: 'dark' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const lightButton = screen.getByText('light').closest('button');
    fireEvent.click(lightButton!);

    expect(mockOnThemeChange).toHaveBeenCalledTimes(1);
    expect(mockOnThemeChange).toHaveBeenCalledWith('light');
  });

  it('calls onThemeChange when dark theme is clicked', () => {
    const settings = { theme: 'light' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const darkButton = screen.getByText('dark').closest('button');
    fireEvent.click(darkButton!);

    expect(mockOnThemeChange).toHaveBeenCalledTimes(1);
    expect(mockOnThemeChange).toHaveBeenCalledWith('dark');
  });

  it('calls onThemeChange when system theme is clicked', () => {
    const settings = { theme: 'light' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const systemButton = screen.getByText('system').closest('button');
    fireEvent.click(systemButton!);

    expect(mockOnThemeChange).toHaveBeenCalledTimes(1);
    expect(mockOnThemeChange).toHaveBeenCalledWith('system');
  });

  it('applies correct styling for unselected themes', () => {
    const settings = { theme: 'light' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const darkButton = screen.getByText('dark').closest('button');
    expect(darkButton).toHaveClass('border-gray-300', 'hover:border-blue-300');
  });

  it('applies correct styling for selected theme', () => {
    const settings = { theme: 'light' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const lightButton = screen.getByText('light').closest('button');
    expect(lightButton).toHaveClass('border-blue-500', 'bg-blue-50');
  });

  it('renders with light theme selected by default', () => {
    const settings = { theme: 'light' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const lightButton = screen.getByText('light').closest('button');
    expect(lightButton).toHaveClass('border-blue-500');
  });

  it('renders with dark theme selected', () => {
    const settings = { theme: 'dark' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const darkButton = screen.getByText('dark').closest('button');
    expect(darkButton).toHaveClass('border-blue-500');
  });

  it('renders with system theme selected', () => {
    const settings = { theme: 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const systemButton = screen.getByText('system').closest('button');
    expect(systemButton).toHaveClass('border-blue-500');
  });

  it('handles theme switching from light to dark', () => {
    const settings = { theme: 'light' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const darkButton = screen.getByText('dark').closest('button');
    fireEvent.click(darkButton!);

    expect(mockOnThemeChange).toHaveBeenCalledWith('dark');
  });

  it('handles theme switching from dark to system', () => {
    const settings = { theme: 'dark' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const systemButton = screen.getByText('system').closest('button');
    fireEvent.click(systemButton!);

    expect(mockOnThemeChange).toHaveBeenCalledWith('system');
  });

  it('handles multiple theme changes in sequence', () => {
    const settings = { theme: 'light' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const darkButton = screen.getByText('dark').closest('button');
    const systemButton = screen.getByText('system').closest('button');

    fireEvent.click(darkButton!);
    fireEvent.click(systemButton!);
    fireEvent.click(darkButton!);

    expect(mockOnThemeChange).toHaveBeenCalledTimes(3);
    expect(mockOnThemeChange).toHaveBeenNthCalledWith(1, 'dark');
    expect(mockOnThemeChange).toHaveBeenNthCalledWith(2, 'system');
    expect(mockOnThemeChange).toHaveBeenNthCalledWith(3, 'dark');
  });

  it('renders with all three buttons', () => {
    const settings = { theme: 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(3);
  });

  it('applies transition classes to buttons', () => {
    const settings = { theme: 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('transition-all');
    });
  });

  it('displays theme names', () => {
    const settings = { theme: 'system' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    expect(screen.getByText('light')).toBeInTheDocument();
    expect(screen.getByText('dark')).toBeInTheDocument();
    expect(screen.getByText('system')).toBeInTheDocument();
  });

  it('handles theme set to null', () => {
    const settings = { theme: null };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    expect(screen.getByText('Appearance')).toBeInTheDocument();
  });

  it('handles theme set to undefined', () => {
    const settings = { theme: undefined };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    expect(screen.getByText('Appearance')).toBeInTheDocument();
  });

  it('handles rapid clicking on same theme button', () => {
    const settings = { theme: 'light' };
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    const lightButton = screen.getByText('light').closest('button');
    fireEvent.click(lightButton!);
    fireEvent.click(lightButton!);
    fireEvent.click(lightButton!);

    expect(mockOnThemeChange).toHaveBeenCalledTimes(3);
    expect(mockOnThemeChange).toHaveBeenCalledWith('light');
  });

  it('renders correctly with empty settings object', () => {
    const settings = {};
    renderWithTheme(
      <SettingsAppearance settings={settings} onThemeChange={mockOnThemeChange} />
    );

    expect(screen.getByText('Appearance')).toBeInTheDocument();
  });
});
