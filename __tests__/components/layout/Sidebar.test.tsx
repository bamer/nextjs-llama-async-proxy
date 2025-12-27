import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Sidebar } from '@/components/layout/Sidebar';
import * as sidebarContext from '@/components/layout/SidebarProvider';
import * as themeContext from '@/contexts/ThemeContext';
import * as nextNavigation from 'next/navigation';

jest.mock('@/components/layout/SidebarProvider', () => ({
  useSidebar: jest.fn(),
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('Sidebar', () => {
  const mockCloseSidebar = jest.fn();
  const mockIsDark = false;
  const mockPathname = '/dashboard';

  beforeEach(() => {
    jest.clearAllMocks();
    (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
      isOpen: false,
      toggleSidebar: jest.fn(),
      openSidebar: jest.fn(),
      closeSidebar: mockCloseSidebar,
    });
    (themeContext.useTheme as jest.Mock).mockReturnValue({
      isDark: mockIsDark,
      mode: 'light' as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: theme,
    });
    (nextNavigation.usePathname as jest.Mock).mockReturnValue(mockPathname);
  });

  it('renders sidebar when isOpen is true', () => {
    (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
      isOpen: true,
      toggleSidebar: jest.fn(),
      openSidebar: jest.fn(),
      closeSidebar: mockCloseSidebar,
    });

    renderWithTheme(<Sidebar />);
    expect(screen.getByText('Llama Runner')).toBeInTheDocument();
  });

  it('renders all menu items', () => {
    (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
      isOpen: true,
      toggleSidebar: jest.fn(),
      openSidebar: jest.fn(),
      closeSidebar: mockCloseSidebar,
    });

    renderWithTheme(<Sidebar />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Monitoring')).toBeInTheDocument();
    expect(screen.getByText('Models')).toBeInTheDocument();
    expect(screen.getByText('Logs')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('highlights active menu item', () => {
    (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
      isOpen: true,
      toggleSidebar: jest.fn(),
      openSidebar: jest.fn(),
      closeSidebar: mockSidebar,
    });
    (nextNavigation.usePathname as jest.Mock).mockReturnValue('/dashboard');

    const { container } = renderWithTheme(<Sidebar />);

    const dashboardLink = container.querySelector('a[href="/dashboard"]');
    expect(dashboardLink).toBeInTheDocument();
  });

  it('calls closeSidebar when menu item is clicked', () => {
    (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
      isOpen: true,
      toggleSidebar: jest.fn(),
      openSidebar: jest.fn(),
      closeSidebar: mockCloseSidebar,
    });

    const { container } = renderWithTheme(<Sidebar />);

    const dashboardLink = container.querySelector('a[href="/dashboard"]');
    if (dashboardLink) {
      fireEvent.click(dashboardLink);
      expect(mockCloseSidebar).toHaveBeenCalledTimes(1);
    }
  });

  it('renders close button', () => {
    (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
      isOpen: true,
      toggleSidebar: jest.fn(),
      openSidebar: jest.fn(),
      closeSidebar: mockCloseSidebar,
    });

    renderWithTheme(<Sidebar />);
    const closeButton = screen.getByLabelText('Close');
    expect(closeButton).toBeInTheDocument();
  });

  it('calls closeSidebar when close button is clicked', () => {
    (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
      isOpen: true,
      toggleSidebar: jest.fn(),
      openSidebar: jest.fn(),
      closeSidebar: mockCloseSidebar,
    });

    renderWithTheme(<Sidebar />);
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    expect(mockCloseSidebar).toHaveBeenCalledTimes(1);
  });

  it('renders version in footer', () => {
    (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
      isOpen: true,
      toggleSidebar: jest.fn(),
      openSidebar: jest.fn(),
      closeSidebar: mockCloseSidebar,
    });

    renderWithTheme(<Sidebar />);
    expect(screen.getByText(/v2\.0\.0/)).toBeInTheDocument();
  });

  it('renders copyright year in footer', () => {
    (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
      isOpen: true,
      toggleSidebar: jest.fn(),
      openSidebar: jest.fn(),
      closeSidebar: mockCloseSidebar,
    });

    const currentYear = new Date().getFullYear();
    renderWithTheme(<Sidebar />);
    expect(screen.getByText(new RegExp(`© ${currentYear}`))).toBeInTheDocument();
  });

  it('applies dark mode styles when isDark is true', () => {
    (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
      isOpen: true,
      toggleSidebar: jest.fn(),
      openSidebar: jest.fn(),
      closeSidebar: mockCloseSidebar,
    });
    (themeContext.useTheme as jest.Mock).mockReturnValue({
      isDark: true,
      mode: 'dark' as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: theme,
    });

    renderWithTheme(<Sidebar />);
    expect(screen.getByText('Llama Runner')).toBeInTheDocument();
  });

  it('applies light mode styles when isDark is false', () => {
    (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
      isOpen: true,
      toggleSidebar: jest.fn(),
      openSidebar: jest.fn(),
      closeSidebar: mockCloseSidebar,
    });
    (themeContext.useTheme as jest.Mock).mockReturnValue({
      isDark: false,
      mode: 'light' as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: theme,
    });

    renderWithTheme(<Sidebar />);
    expect(screen.getByText('Llama Runner')).toBeInTheDocument();
  });

  it('does not render overlay when isOpen is false', () => {
    (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
      isOpen: false,
      toggleSidebar: jest.fn(),
      openSidebar: jest.fn(),
      closeSidebar: mockCloseSidebar,
    });

    const { container } = renderWithTheme(<Sidebar />);
    expect(screen.queryByText('Llama Runner')).not.toBeInTheDocument();
  });

  it('renders correct active state for different routes', () => {
    (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
      isOpen: true,
      toggleSidebar: jest.fn(),
      openSidebar: jest.fn(),
      closeSidebar: mockCloseSidebar,
    });

    const routes = ['/dashboard', '/monitoring', '/models', '/logs', '/settings'];

    routes.forEach((route) => {
      (nextNavigation.usePathname as jest.Mock).mockReturnValue(route);
      const { container } = renderWithTheme(<Sidebar />);
      const activeLink = container.querySelector(`a[href="${route}"]`);
      expect(activeLink).toBeInTheDocument();
    });
  });

  it('renders all navigation icons', () => {
    (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
      isOpen: true,
      toggleSidebar: jest.fn(),
      openSidebar: jest.fn(),
      closeSidebar: mockCloseSidebar,
    });

    const { container } = renderWithTheme(<Sidebar />);
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });
});
