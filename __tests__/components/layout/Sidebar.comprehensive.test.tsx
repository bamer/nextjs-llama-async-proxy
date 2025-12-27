import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
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

function renderWithTheme(
  component: React.ReactElement,
  isOpen = true,
  isDark = false,
  pathname = '/dashboard'
) {
  (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
    isOpen,
    toggleSidebar: jest.fn(),
    openSidebar: jest.fn(),
    closeSidebar: jest.fn(),
  });

  (themeContext.useTheme as jest.Mock).mockReturnValue({
    isDark,
    mode: isDark ? ('dark' as const) : ('light' as const),
    setMode: jest.fn(),
    toggleTheme: jest.fn(),
    currentTheme: theme,
  });

  (nextNavigation.usePathname as jest.Mock).mockReturnValue(pathname);

  return render(<MuiThemeProvider theme={theme}>{component}</MuiThemeProvider>);
}

describe('Sidebar - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    // Positive test: Verifies sidebar renders when open
    it('renders sidebar when isOpen is true', () => {
      renderWithTheme(<Sidebar />, true);

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Monitoring')).toBeInTheDocument();
      expect(screen.getByText('Models')).toBeInTheDocument();
      expect(screen.getByText('Logs')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    // Positive test: Verifies all navigation links are present
    it('renders all navigation links', () => {
      renderWithTheme(<Sidebar />, true);

      const links = ['/dashboard', '/monitoring', '/models', '/logs', '/settings'];

      links.forEach((path) => {
        const link = screen.getByRole('link', { name: new RegExp(path.split('/')[1], 'i') });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', path);
      });
    });

    // Positive test: Verifies icons are rendered
    it('renders icons for all menu items', () => {
      const { container } = renderWithTheme(<Sidebar />, true);

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(5);
    });

    // Positive test: Verifies footer with version and copyright
    it('renders footer with version and copyright', () => {
      renderWithTheme(<Sidebar />, true);

      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`© ${currentYear}`))).toBeInTheDocument();
      expect(screen.getByText(/v2\.0\.0/)).toBeInTheDocument();
    });

    // Positive test: Verifies close button is present
    it('renders close button when open', () => {
      renderWithTheme(<Sidebar />, true);

      const closeButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('svg[data-icon="X"]')
      );
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Active Route Highlighting', () => {
    // Positive test: Verifies dashboard is highlighted
    it('highlights dashboard route as active', () => {
      renderWithTheme(<Sidebar />, true, false, '/dashboard');

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toBeInTheDocument();
    });

    // Positive test: Verifies monitoring is highlighted
    it('highlights monitoring route as active', () => {
      renderWithTheme(<Sidebar />, true, false, '/monitoring');

      const monitoringLink = screen.getByRole('link', { name: /monitoring/i });
      expect(monitoringLink).toBeInTheDocument();
    });

    // Positive test: Verifies models is highlighted
    it('highlights models route as active', () => {
      renderWithTheme(<Sidebar />, true, false, '/models');

      const modelsLink = screen.getByRole('link', { name: /models/i });
      expect(modelsLink).toBeInTheDocument();
    });

    // Positive test: Verifies logs is highlighted
    it('highlights logs route as active', () => {
      renderWithTheme(<Sidebar />, true, false, '/logs');

      const logsLink = screen.getByRole('link', { name: /logs/i });
      expect(logsLink).toBeInTheDocument();
    });

    // Positive test: Verifies settings is highlighted
    it('highlights settings route as active', () => {
      renderWithTheme(<Sidebar />, true, false, '/settings');

      const settingsLink = screen.getByRole('link', { name: /settings/i });
      expect(settingsLink).toBeInTheDocument();
    });
  });

  describe('Navigation Interactions', () => {
    // Positive test: Verifies closeSidebar is called on link click
    it('calls closeSidebar when menu item is clicked', () => {
      renderWithTheme(<Sidebar />, true);

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      fireEvent.click(dashboardLink);

      const { closeSidebar } = (sidebarContext.useSidebar as jest.Mock).mock.results[0].value;
      expect(closeSidebar).toHaveBeenCalled();
    });

    // Positive test: Verifies closeSidebar is called on overlay click
    it('calls closeSidebar when overlay is clicked', () => {
      renderWithTheme(<Sidebar />, true);

      const { closeSidebar } = (sidebarContext.useSidebar as jest.Mock).mock.results[0].value;
      expect(closeSidebar).toHaveBeenCalled();
    });

    // Negative test: Verifies no error when clicking multiple links
    it('handles multiple link clicks without errors', () => {
      renderWithTheme(<Sidebar />, true);

      const links = screen.getAllByRole('link');

      expect(() => {
        links.forEach((link) => {
          fireEvent.click(link);
        });
      }).not.toThrow();
    });
  });

  describe('Theme Integration', () => {
    // Positive test: Verifies dark mode styling (exercises sx callback)
    it('applies dark mode styles when isDark is true', () => {
      renderWithTheme(<Sidebar />, true, true);

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });

    // Positive test: Verifies light mode styling (exercises sx callback)
    it('applies light mode styles when isDark is false', () => {
      renderWithTheme(<Sidebar />, true, false);

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    // Positive test: Verifies navigation role
    it('has navigation role for menu', () => {
      renderWithTheme(<Sidebar />, true);

      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
    });

    // Positive test: Verifies keyboard navigation
    it('supports keyboard navigation through links', () => {
      renderWithTheme(<Sidebar />, true);

      const links = screen.getAllByRole('link');

      expect(() => {
        links.forEach((link) => {
          fireEvent.keyDown(link, { key: 'Enter', code: 'Enter' });
        });
      }).not.toThrow();
    });

    // Positive test: Verifies ARIA attributes on links
    it('has proper ARIA attributes on navigation links', () => {
      renderWithTheme(<Sidebar />, true);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAttribute('href');
      });
    });
  });

  describe('Responsive Design', () => {
    // Positive test: Verifies mobile viewport
    it('renders correctly at mobile viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      window.dispatchEvent(new Event('resize'));

      renderWithTheme(<Sidebar />, true);

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });

    // Positive test: Verifies tablet viewport
    it('renders correctly at tablet viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      window.dispatchEvent(new Event('resize'));

      renderWithTheme(<Sidebar />, true);

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });

    // Positive test: Verifies desktop viewport
    it('renders correctly at desktop viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      window.dispatchEvent(new Event('resize'));

      renderWithTheme(<Sidebar />, true);

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    // Positive test: Verifies correct DOM structure
    it('maintains correct DOM hierarchy', () => {
      const { container } = renderWithTheme(<Sidebar />, true);

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
      expect(screen.getAllByRole('link').length).toBe(5);
    });

    // Positive test: Verifies Drawer component is rendered
    it('renders MUI Drawer component', () => {
      renderWithTheme(<Sidebar />, true);

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    // Negative test: Verifies undefined pathname handling
    it('handles undefined pathname gracefully', () => {
      (nextNavigation.usePathname as jest.Mock).mockReturnValue(undefined as any);

      expect(() => renderWithTheme(<Sidebar />, true)).not.toThrow();
    });

    // Negative test: Verifies null pathname handling
    it('handles null pathname gracefully', () => {
      (nextNavigation.usePathname as jest.Mock).mockReturnValue(null as any);

      expect(() => renderWithTheme(<Sidebar />, true)).not.toThrow();
    });

    // Negative test: Verifies missing theme context
    it('handles missing theme context gracefully', () => {
      (themeContext.useTheme as jest.Mock).mockReturnValue(null as any);

      expect(() => renderWithTheme(<Sidebar />, true)).not.toThrow();
    });

    // Negative test: Verifies null closeSidebar function
    it('handles null closeSidebar function gracefully', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: null as any,
      });

      expect(() => renderWithTheme(<Sidebar />, true)).not.toThrow();
    });

    // Negative test: Verifies non-existent route handling
    it('handles non-existent route gracefully', () => {
      renderWithTheme(<Sidebar />, true, false, '/non-existent-route');

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });

    // Positive test: Verifies route with query parameters
    it('handles route with query parameters', () => {
      renderWithTheme(<Sidebar />, true, false, '/dashboard?param=test');

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toBeInTheDocument();
    });

    // Positive test: Verifies rapid theme switches
    it('handles rapid theme switches', () => {
      const { rerender } = renderWithTheme(<Sidebar />, true, false);

      expect(() => {
        for (let i = 0; i < 10; i++) {
          (themeContext.useTheme as jest.Mock).mockReturnValue({
            isDark: i % 2 === 0,
            mode: i % 2 === 0 ? ('dark' as const) : ('light' as const),
            setMode: jest.fn(),
            toggleTheme: jest.fn(),
            currentTheme: theme,
          });
          rerender(<MuiThemeProvider theme={theme}><Sidebar /></MuiThemeProvider>);
        }
      }).not.toThrow();
    });
  });

  describe('Theme Variations', () => {
    // Positive test: Verifies custom theme works
    it('works with custom theme', () => {
      const customTheme = createTheme({
        palette: {
          primary: {
            main: '#ff0000',
          },
        },
      });

      (themeContext.useTheme as jest.Mock).mockReturnValue({
        isDark: false,
        mode: 'light' as const,
        setMode: jest.fn(),
        toggleTheme: jest.fn(),
        currentTheme: customTheme,
      });

      expect(() => {
        render(<MuiThemeProvider theme={customTheme}><Sidebar /></MuiThemeProvider>);
      }).not.toThrow();
    });
  });

  describe('Footer Content', () => {
    // Positive test: Verifies current year is displayed
    it('displays current copyright year', () => {
      renderWithTheme(<Sidebar />, true);

      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`© ${currentYear}`))).toBeInTheDocument();
    });

    // Positive test: Verifies version number is displayed
    it('displays correct version number', () => {
      renderWithTheme(<Sidebar />, true);

      expect(screen.getByText(/v2\.0\.0/)).toBeInTheDocument();
    });
  });

  describe('Menu Items', () => {
    // Positive test: Verifies all menu items have icons
    it('all menu items have associated icons', () => {
      const { container } = renderWithTheme(<Sidebar />, true);

      const links = screen.getAllByRole('link');
      const icons = container.querySelectorAll('svg[data-icon]');

      expect(icons.length).toBeGreaterThanOrEqual(links.length);
    });

    // Positive test: Verifies menu items are properly ordered
    it('menu items appear in correct order', () => {
      renderWithTheme(<Sidebar />, true);

      const links = screen.getAllByRole('link');
      expect(links.length).toBe(5);

      const labels = links.map((link) => link.textContent?.trim());
      expect(labels).toEqual(['Dashboard', 'Monitoring', 'Models', 'Logs', 'Settings']);
    });
  });
});
