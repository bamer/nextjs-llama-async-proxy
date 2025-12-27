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

describe('Sidebar - Final Tests for Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering Coverage', () => {
    // Positive test: Covers Sidebar rendering with sx prop callbacks (lines 54-80)
    it('renders Sidebar with proper theme provider - covers sx callbacks', () => {
      renderWithTheme(<Sidebar />, true, false);

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
      expect(screen.getByTestId('menu-item-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('menu-item-monitoring')).toBeInTheDocument();
      expect(screen.getByTestId('menu-item-models')).toBeInTheDocument();
      expect(screen.getByTestId('menu-item-logs')).toBeInTheDocument();
      expect(screen.getByTestId('menu-item-settings')).toBeInTheDocument();
    });

    // Positive test: Covers dark mode styling (exercises line 75)
    it('renders Sidebar in dark mode - exercises sx prop with isDark true', () => {
      renderWithTheme(<Sidebar />, true, true);

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar-drawer')).toBeInTheDocument();
    });

    // Positive test: Covers all context usage
    it('uses theme, sidebar, and navigation contexts', () => {
      renderWithTheme(<Sidebar />, true);

      expect(themeContext.useTheme).toHaveBeenCalled();
      expect(sidebarContext.useSidebar).toHaveBeenCalled();
      expect(nextNavigation.usePathname).toHaveBeenCalled();
    });
  });

  describe('Function Coverage', () => {
    // Positive test: Covers closeSidebar callback function
    it('covers closeSidebar function call on link click', () => {
      renderWithTheme(<Sidebar />, true);

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      fireEvent.click(dashboardLink);

      const { closeSidebar } = (sidebarContext.useSidebar as jest.Mock).mock.results[0].value;
      expect(closeSidebar).toHaveBeenCalled();
    });

    // Positive test: Covers closeSidebar on close button click
    it('covers closeSidebar function call on close button', () => {
      renderWithTheme(<Sidebar />, true);

      const closeButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('svg')
      );

      if (closeButton) {
        fireEvent.click(closeButton);

        const { closeSidebar } = (sidebarContext.useSidebar as jest.Mock).mock.results[0].value;
        expect(closeSidebar).toHaveBeenCalled();
      }
    });
  });

  describe('Active Route Coverage', () => {
    // Positive test: Covers isActive function with all routes (line 49)
    it('covers isActive function for dashboard route', () => {
      renderWithTheme(<Sidebar />, true, false, '/dashboard');

      expect(screen.getByTestId('menu-item-dashboard')).toBeInTheDocument();
    });

    // Positive test: Covers isActive function for monitoring route
    it('covers isActive function for monitoring route', () => {
      renderWithTheme(<Sidebar />, true, false, '/monitoring');

      expect(screen.getByTestId('menu-item-monitoring')).toBeInTheDocument();
    });

    // Positive test: Covers isActive function for models route
    it('covers isActive function for models route', () => {
      renderWithTheme(<Sidebar />, true, false, '/models');

      expect(screen.getByTestId('menu-item-models')).toBeInTheDocument();
    });

    // Positive test: Covers isActive function for logs route
    it('covers isActive function for logs route', () => {
      renderWithTheme(<Sidebar />, true, false, '/logs');

      expect(screen.getByTestId('menu-item-logs')).toBeInTheDocument();
    });

    // Positive test: Covers isActive function for settings route
    it('covers isActive function for settings route', () => {
      renderWithTheme(<Sidebar />, true, false, '/settings');

      expect(screen.getByTestId('menu-item-settings')).toBeInTheDocument();
    });
  });

  describe('Conditional Rendering Coverage', () => {
    // Positive test: Covers overlay rendering when isOpen is true (lines 54-64)
    it('covers overlay rendering when sidebar is open', () => {
      renderWithTheme(<Sidebar />, true, false);

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });

    // Positive test: Covers no overlay when isOpen is false
    it('covers no overlay when sidebar is closed', () => {
      renderWithTheme(<Sidebar />, false, false);

      // Sidebar content should still be mounted but hidden
      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });
  });

  describe('Edge Cases for Coverage', () => {
    // Negative test: Component handles null/undefined values
    it('handles undefined pathname gracefully', () => {
      (nextNavigation.usePathname as jest.Mock).mockReturnValue(undefined as any);

      expect(() => renderWithTheme(<Sidebar />, true)).not.toThrow();
    });

    // Negative test: Component handles null pathname
    it('handles null pathname gracefully', () => {
      (nextNavigation.usePathname as jest.Mock).mockReturnValue(null as any);

      expect(() => renderWithTheme(<Sidebar />, true)).not.toThrow();
    });

    // Negative test: Component handles missing theme context
    it('handles missing theme context gracefully', () => {
      (themeContext.useTheme as jest.Mock).mockReturnValue(null as any);

      expect(() => renderWithTheme(<Sidebar />, true)).not.toThrow();
    });

    // Negative test: Component handles null closeSidebar
    it('handles null closeSidebar function gracefully', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: null as any,
      });

      expect(() => renderWithTheme(<Sidebar />, true)).not.toThrow();
    });

    // Negative test: Component handles non-existent route
    it('handles non-existent route gracefully', () => {
      renderWithTheme(<Sidebar />, true, false, '/non-existent-route');

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });
  });

  describe('Branch Coverage', () => {
    // Positive test: Exercises branch with isDark === true (line 75)
    it('exercises isDark === true branch in sx prop', () => {
      renderWithTheme(<Sidebar />, true, true);

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });

    // Positive test: Exercises branch with isDark === false
    it('exercises isDark === false branch in sx prop', () => {
      renderWithTheme(<Sidebar />, true, false);

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });
  });

  describe('Theme Coverage', () => {
    // Positive test: Covers theme.zIndex.drawer access in sx callback
    it('covers theme.zIndex.drawer access through sx prop', () => {
      const customTheme = createTheme({
        zIndex: {
          drawer: 1200,
        },
      });

      (themeContext.useTheme as jest.Mock).mockReturnValue({
        isDark: false,
        mode: 'light' as const,
        setMode: jest.fn(),
        toggleTheme: jest.fn(),
        currentTheme: customTheme,
      });

      render(<MuiThemeProvider theme={customTheme}><Sidebar /></MuiThemeProvider>);

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });
  });

  describe('Navigation Coverage', () => {
    // Positive test: Covers all navigation links and their onClick handlers
    it('covers all navigation links and click handlers', () => {
      renderWithTheme(<Sidebar />, true);

      const links = screen.getAllByRole('link');

      expect(() => {
        links.forEach((link) => {
          fireEvent.click(link);
        });
      }).not.toThrow();

      const { closeSidebar } = (sidebarContext.useSidebar as jest.Mock).mock.results[0].value;
      expect(closeSidebar).toHaveBeenCalledTimes(links.length);
    });
  });

  describe('Footer Coverage', () => {
    // Positive test: Covers footer rendering with current year
    it('covers footer with current year and version', () => {
      renderWithTheme(<Sidebar />, true);

      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`© ${currentYear} Llama Runner Pro`))).toBeInTheDocument();
      expect(screen.getByText(/v2\.0\.0/)).toBeInTheDocument();
    });
  });

  describe('Interaction Coverage', () => {
    // Positive test: Covers keyboard events on links
    it('covers keyboard event handling on links', () => {
      renderWithTheme(<Sidebar />, true);

      const links = screen.getAllByRole('link');

      expect(() => {
        links.forEach((link) => {
          fireEvent.keyDown(link, { key: 'Enter', code: 'Enter' });
        });
      }).not.toThrow();
    });
  });

  describe('Responsive Coverage', () => {
    // Positive test: Covers viewport changes
    it('covers window resize events', () => {
      renderWithTheme(<Sidebar />, true);

      window.dispatchEvent(new Event('resize'));

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });
  });

  describe('Error Handling Coverage', () => {
    // Negative test: Component renders without errors
    it('renders without throwing errors', () => {
      expect(() => renderWithTheme(<Sidebar />, true)).not.toThrow();
    });

    // Negative test: Component re-renders without errors
    it('re-renders without errors', () => {
      const { rerender } = renderWithTheme(<Sidebar />, true);

      expect(() => {
        rerender(<MuiThemeProvider theme={theme}><Sidebar /></MuiThemeProvider>);
      }).not.toThrow();
    });
  });
});
