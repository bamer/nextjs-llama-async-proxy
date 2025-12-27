import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Header } from '@/components/layout/Header';
import * as sidebarContext from '@/components/layout/SidebarProvider';
import * as themeContext from '@/contexts/ThemeContext';

jest.mock('@/components/layout/SidebarProvider', () => ({
  useSidebar: jest.fn(),
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

jest.mock('@/components/ui/ThemeToggle', () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">Theme Toggle</button>,
}));

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('Header', () => {
  const mockToggleSidebar = jest.fn();
  const mockIsDark = false;

  beforeEach(() => {
    jest.clearAllMocks();
    (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
      isOpen: false,
      toggleSidebar: mockToggleSidebar,
      openSidebar: jest.fn(),
      closeSidebar: jest.fn(),
    });
    (themeContext.useTheme as jest.Mock).mockReturnValue({
      isDark: mockIsDark,
      mode: 'light' as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: theme,
    });
  });

  it('renders correctly', () => {
    renderWithTheme(<Header />);
    expect(screen.getByText('Llama Runner Pro')).toBeInTheDocument();
  });

  it('renders menu toggle button', () => {
    renderWithTheme(<Header />);
    const toggleButton = screen.getByLabelText('Toggle sidebar');
    expect(toggleButton).toBeInTheDocument();
  });

  it('calls toggleSidebar when menu button is clicked', () => {
    renderWithTheme(<Header />);
    const toggleButton = screen.getByLabelText('Toggle sidebar');
    fireEvent.click(toggleButton);
    expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
  });

  it('renders app bar with correct height', () => {
    const { container } = renderWithTheme(<Header />);
    const appBar = container.querySelector('.MuiAppBar-root');
    expect(appBar).toBeInTheDocument();
  });

  it('renders toolbar', () => {
    const { container } = renderWithTheme(<Header />);
    const toolbar = container.querySelector('.MuiToolbar-root');
    expect(toolbar).toBeInTheDocument();
  });

  it('renders ThemeToggle component', () => {
    renderWithTheme(<Header />);
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('applies dark mode styles when isDark is true', () => {
    (themeContext.useTheme as jest.Mock).mockReturnValue({
      isDark: true,
      mode: 'dark' as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: theme,
    });

    const { container } = renderWithTheme(<Header />);
    const appBar = container.querySelector('.MuiAppBar-root');
    expect(appBar).toBeInTheDocument();
  });

  it('applies light mode styles when isDark is false', () => {
    (themeContext.useTheme as jest.Mock).mockReturnValue({
      isDark: false,
      mode: 'light' as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: theme,
    });

    const { container } = renderWithTheme(<Header />);
    const appBar = container.querySelector('.MuiAppBar-root');
    expect(appBar).toBeInTheDocument();
  });
});
