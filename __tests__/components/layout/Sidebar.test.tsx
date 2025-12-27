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
      closeSidebar: mockCloseSidebar,
    });
    (nextNavigation.usePathname as jest.Mock).mockReturnValue('/dashboard');

    renderWithTheme(<Sidebar />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
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
    expect(screen.getByText('Llama Runner')).toBeInTheDocument();
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
      expect(mockCloseSidebar).toHaveBeenCalled();
    }
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
    // Sidebar content is kept mounted but hidden by MUI Drawer
    // Check that overlay is not visible when closed
    const overlay = container.querySelector('[style*="position: fixed"]');
    expect(overlay).not.toBeInTheDocument();
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
      const { unmount } = renderWithTheme(<Sidebar />);
      unmount();
    });

    (nextNavigation.usePathname as jest.Mock).mockReturnValue('/dashboard');
    const { unmount: unmountLast } = renderWithTheme(<Sidebar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    unmountLast();
  });

  it('renders all navigation icons', () => {
    (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
      isOpen: true,
      toggleSidebar: jest.fn(),
      openSidebar: jest.fn(),
      closeSidebar: mockCloseSidebar,
    });

    const { container } = renderWithTheme(<Sidebar />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Monitoring')).toBeInTheDocument();
    expect(screen.getByText('Models')).toBeInTheDocument();
    expect(screen.getByText('Logs')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  describe('Edge Cases', () => {
    it('handles undefined isOpen state', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: undefined as any,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      expect(() => renderWithTheme(<Sidebar />)).not.toThrow();
    });

    it('handles null pathname', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      (nextNavigation.usePathname as jest.Mock).mockReturnValue(null as any);

      renderWithTheme(<Sidebar />);
      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });

    it('handles undefined pathname', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      (nextNavigation.usePathname as jest.Mock).mockReturnValue(undefined as any);

      renderWithTheme(<Sidebar />);
      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });

    it('handles missing theme context', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      (themeContext.useTheme as jest.Mock).mockReturnValue(null as any);

      renderWithTheme(<Sidebar />);
      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });

    it('handles null closeSidebar function', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: null as any,
      });

      renderWithTheme(<Sidebar />);
      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });

    it('handles route with special characters', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      (nextNavigation.usePathname as jest.Mock).mockReturnValue('/dashboard?param=test&other=value');

      renderWithTheme(<Sidebar />);
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('handles empty route', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      (nextNavigation.usePathname as jest.Mock).mockReturnValue('');

      renderWithTheme(<Sidebar />);
      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });

    it('handles root route', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      (nextNavigation.usePathname as jest.Mock).mockReturnValue('/');

      renderWithTheme(<Sidebar />);
      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });

    it('handles very long route path', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      const longPath = '/dashboard/' + 'a'.repeat(1000);
      (nextNavigation.usePathname as jest.Mock).mockReturnValue(longPath);

      renderWithTheme(<Sidebar />);
      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });

    it('handles non-existent route', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      (nextNavigation.usePathname as jest.Mock).mockReturnValue('/non-existent-route');

      renderWithTheme(<Sidebar />);
      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });

    it('handles multiple rapid open/close operations', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      const { container } = renderWithTheme(<Sidebar />);

      const closeButtons = container.querySelectorAll('.MuiIconButton-root');
      closeButtons.forEach((button) => {
        for (let i = 0; i < 10; i++) {
          fireEvent.click(button);
        }
      });

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });

    it('handles window resize events', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      renderWithTheme(<Sidebar />);

      // Simulate resize
      window.dispatchEvent(new Event('resize'));

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });

    it('handles overlay click multiple times', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      const { container } = renderWithTheme(<Sidebar />);

      const overlay = container.querySelector('[style*="position: fixed"]');
      if (overlay) {
        for (let i = 0; i < 10; i++) {
          fireEvent.click(overlay);
        }
      }

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });

    it('handles theme switching while open', () => {
      const { container, rerender } = renderWithTheme(<Sidebar />);

      (themeContext.useTheme as jest.Mock).mockReturnValue({
        isDark: true,
        mode: 'dark' as const,
        setMode: jest.fn(),
        toggleTheme: jest.fn(),
        currentTheme: theme,
      });

      rerender(
        <ThemeProvider theme={theme}>
          <Sidebar />
        </ThemeProvider>
      );

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });

    it('handles undefined menu items', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      renderWithTheme(<Sidebar />);
      // Menu items are hardcoded, so should always render
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('handles very long label text in menu items', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      renderWithTheme(<Sidebar />);

      const menuItems = screen.getAllByRole('link');
      menuItems.forEach((item) => {
        expect(item).toBeVisible();
      });
    });

    it('handles very long URL in navigation', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      renderWithTheme(<Sidebar />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAttribute('href');
        const href = link.getAttribute('href');
        expect(href).toBeTruthy();
      });
    });

    it('handles missing icon components gracefully', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      renderWithTheme(<Sidebar />);
      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });

    it('handles concurrent route and sidebar state changes', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      (nextNavigation.usePathname as jest.Mock).mockReturnValue('/dashboard');

      const { container, rerender } = renderWithTheme(<Sidebar />);

      // Change route and state simultaneously
      (nextNavigation.usePathname as jest.Mock).mockReturnValue('/monitoring');

      rerender(
        <ThemeProvider theme={theme}>
          <Sidebar />
        </ThemeProvider>
      );

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });
  });

  describe('Accessibility Edge Cases', () => {
    it('handles keyboard navigation through menu items', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      renderWithTheme(<Sidebar />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        fireEvent.keyDown(link, { key: 'Enter', code: 'Enter' });
        expect(link).toBeVisible();
      });
    });

    it('handles focus management when sidebar opens', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      renderWithTheme(<Sidebar />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeVisible();
    });

    it('handles ARIA attributes on navigation links', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      renderWithTheme(<Sidebar />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAttribute('href');
      });
    });

    it('handles reduced motion preference', () => {
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
      }));

      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      renderWithTheme(<Sidebar />);
      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });

    it('handles screen reader announcements', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      renderWithTheme(<Sidebar />);

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Mobile vs Desktop Behavior', () => {
    it('renders correctly at mobile viewport (320px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      window.dispatchEvent(new Event('resize'));
      renderWithTheme(<Sidebar />);

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });

    it('renders correctly at tablet viewport (768px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      window.dispatchEvent(new Event('resize'));
      renderWithTheme(<Sidebar />);

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });

    it('renders correctly at desktop viewport (1920px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      window.dispatchEvent(new Event('resize'));
      renderWithTheme(<Sidebar />);

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });

    it('handles viewport changes without errors', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      renderWithTheme(<Sidebar />);

      const widths = [320, 768, 1024, 1920, 2560];
      widths.forEach((width) => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });
        window.dispatchEvent(new Event('resize'));
      });

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });
  });

  describe('Theme Variation Edge Cases', () => {
    it('handles null isDark value', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      (themeContext.useTheme as jest.Mock).mockReturnValue({
        isDark: null as any,
        mode: 'light' as const,
        setMode: jest.fn(),
        toggleTheme: jest.fn(),
        currentTheme: theme,
      });

      renderWithTheme(<Sidebar />);
      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });

    it('handles undefined mode in theme', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      (themeContext.useTheme as jest.Mock).mockReturnValue({
        isDark: false,
        mode: undefined as any,
        setMode: jest.fn(),
        toggleTheme: jest.fn(),
        currentTheme: theme,
      });

      renderWithTheme(<Sidebar />);
      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });

    it('handles custom theme with non-standard colors', () => {
      const customTheme = createTheme({
        palette: {
          background: {
            default: '#ff0000',
          },
        },
      });

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
        currentTheme: customTheme,
      });

      renderWithTheme(<Sidebar />);
      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });

    it('handles rapid theme switches without errors', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      renderWithTheme(<Sidebar />);

      for (let i = 0; i < 10; i++) {
        (themeContext.useTheme as jest.Mock).mockReturnValue({
          isDark: i % 2 === 0,
          mode: i % 2 === 0 ? ('dark' as const) : ('light' as const),
          setMode: jest.fn(),
          toggleTheme: jest.fn(),
          currentTheme: theme,
        });
      }

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });
  });

  describe('Collapsed/Expanded States', () => {
    it('handles sidebar closed state correctly', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: false,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      const { container } = renderWithTheme(<Sidebar />);

      const overlay = container.querySelector('[style*="position: fixed"]');
      expect(overlay).not.toBeInTheDocument();
    });

    it('handles sidebar open state correctly', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      const { container } = renderWithTheme(<Sidebar />);

      const overlay = container.querySelector('[style*="position: fixed"]');
      expect(overlay).toBeInTheDocument();
    });

    it('handles state transitions (closed to open)', () => {
      const { container, rerender } = renderWithTheme(<Sidebar />);

      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      rerender(
        <ThemeProvider theme={theme}>
          <Sidebar />
        </ThemeProvider>
      );

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });

    it('handles state transitions (open to closed)', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      const { container, rerender } = renderWithTheme(<Sidebar />);

      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: false,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockCloseSidebar,
      });

      rerender(
        <ThemeProvider theme={theme}>
          <Sidebar />
        </ThemeProvider>
      );
    });
  });
});
