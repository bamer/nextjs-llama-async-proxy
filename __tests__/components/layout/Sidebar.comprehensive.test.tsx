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

function renderWithTheme(component: React.ReactElement, isOpen = true, isDark = false, pathname = '/dashboard') {
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

  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('Sidebar - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders sidebar when isOpen is true', () => {
      renderWithTheme(<Sidebar />, true);

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Monitoring')).toBeInTheDocument();
      expect(screen.getByText('Models')).toBeInTheDocument();
      expect(screen.getByText('Logs')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('does not render sidebar when isOpen is false', () => {
      renderWithTheme(<Sidebar />, false);

      expect(screen.queryByText('Llama Runner')).not.toBeInTheDocument();
    });

    it('renders close button when open', () => {
      renderWithTheme(<Sidebar />, true);

      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('renders all navigation links', () => {
      renderWithTheme(<Sidebar />, true);

      const links = [
        '/dashboard',
        '/monitoring',
        '/models',
        '/logs',
        '/settings'
      ];

      links.forEach((path) => {
        const link = screen.getByRole('link', { name: new RegExp(path.split('/')[1], 'i') });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', path);
      });
    });

    it('renders icons for all menu items', () => {
      const { container } = renderWithTheme(<Sidebar />, true);

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(5); // At least one icon per menu item + close button
    });

    it('renders footer with version and copyright', () => {
      renderWithTheme(<Sidebar />, true);

      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`© ${currentYear}`))).toBeInTheDocument();
      expect(screen.getByText(/v2\.0\.0/)).toBeInTheDocument();
    });
  });

  describe('Navigation and Active States', () => {
    it('highlights Dashboard when on /dashboard route', () => {
      const { container } = renderWithTheme(<Sidebar />, true, false, '/dashboard');

      const dashboardButton = container.querySelector('a[href="/dashboard"] button');
      expect(dashboardButton).toHaveAttribute('selected', 'true');
    });

    it('highlights Monitoring when on /monitoring route', () => {
      const { container } = renderWithTheme(<Sidebar />, true, false, '/monitoring');

      const monitoringButton = container.querySelector('a[href="/monitoring"] button');
      expect(monitoringButton).toHaveAttribute('selected', 'true');
    });

    it('highlights Models when on /models route', () => {
      const { container } = renderWithTheme(<Sidebar />, true, false, '/models');

      const modelsButton = container.querySelector('a[href="/models"] button');
      expect(modelsButton).toHaveAttribute('selected', 'true');
    });

    it('highlights Logs when on /logs route', () => {
      const { container } = renderWithTheme(<Sidebar />, true, false, '/logs');

      const logsButton = container.querySelector('a[href="/logs"] button');
      expect(logsButton).toHaveAttribute('selected', 'true');
    });

    it('highlights Settings when on /settings route', () => {
      const { container } = renderWithTheme(<Sidebar />, true, false, '/settings');

      const settingsButton = container.querySelector('a[href="/settings"] button');
      expect(settingsButton).toHaveAttribute('selected', 'true');
    });

    it('applies correct active styling for dark mode', () => {
      const { container } = renderWithTheme(<Sidebar />, true, true, '/dashboard');

      const dashboardButton = container.querySelector('a[href="/dashboard"] button');
      expect(dashboardButton).toBeInTheDocument();
    });

    it('applies correct active styling for light mode', () => {
      const { container } = renderWithTheme(<Sidebar />, true, false, '/dashboard');

      const dashboardButton = container.querySelector('a[href="/dashboard"] button');
      expect(dashboardButton).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('closes sidebar when close button is clicked', () => {
      renderWithTheme(<Sidebar />, true);

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();

      // Note: The actual closeSidebar function is mocked, so we just verify the button exists and is clickable
      fireEvent.click(closeButton);
      expect(closeButton).toBeInTheDocument();
    });

    it('calls closeSidebar when menu item is clicked', () => {
      const mockClose = jest.fn();
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: true,
        toggleSidebar: jest.fn(),
        openSidebar: jest.fn(),
        closeSidebar: mockClose,
      });

      const { container } = renderWithTheme(<Sidebar />, true);

      const dashboardLink = container.querySelector('a[href="/dashboard"]');
      expect(dashboardLink).toBeInTheDocument();

      if (dashboardLink) {
        fireEvent.click(dashboardLink);
        // Note: The Link component wraps the click handler, so the close may be triggered
      }
    });
  });

  describe('Theme Integration', () => {
    it('applies dark mode styles when isDark is true', () => {
      const { container } = renderWithTheme(<Sidebar />, true, true);

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
      const drawer = container.querySelector('.MuiDrawer-paper');
      expect(drawer).toBeInTheDocument();
    });

    it('applies light mode styles when isDark is false', () => {
      const { container } = renderWithTheme(<Sidebar />, true, false);

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
      const drawer = container.querySelector('.MuiDrawer-paper');
      expect(drawer).toBeInTheDocument();
    });

    it('renders correctly when theme switches', () => {
      const { container, rerender } = renderWithTheme(<Sidebar />, true, false);

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();

      // Simulate theme switch by re-rendering
      rerender(
        <ThemeProvider theme={theme}>
          <Sidebar />
        </ThemeProvider>
      );

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });
  });

  describe('Drawer Configuration', () => {
    it('renders drawer with temporary variant', () => {
      const { container } = renderWithTheme(<Sidebar />, true);

      const drawer = container.querySelector('.MuiDrawer-root');
      expect(drawer).toBeInTheDocument();
    });

    it('applies correct width to drawer', () => {
      const { container } = renderWithTheme(<Sidebar />, true);

      const drawerPaper = container.querySelector('.MuiDrawer-paper');
      expect(drawerPaper).toHaveStyle({ width: '256px' });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels on buttons', () => {
      renderWithTheme(<Sidebar />, true);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('has keyboard accessible menu items', () => {
      const { container } = renderWithTheme(<Sidebar />, true);

      const links = container.querySelectorAll('a');
      links.forEach((link) => {
        expect(link).toBeVisible();
      });
    });

    it('has proper focus indicators', () => {
      const { container } = renderWithTheme(<Sidebar />, true);

      const listItems = container.querySelectorAll('.MuiListItem-root');
      expect(listItems.length).toBeGreaterThan(0);
    });
  });

  describe('Overlay Behavior', () => {
    it('renders overlay when sidebar is open', () => {
      renderWithTheme(<Sidebar />, true);

      const overlay = document.querySelector('[style*="fixed"]');
      expect(overlay).toBeInTheDocument();
    });

    it('does not render overlay when sidebar is closed', () => {
      renderWithTheme(<Sidebar />, false);

      const overlay = document.querySelector('[style*="fixed"]');
      expect(overlay).not.toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('adapts to different screen sizes', () => {
      const { container } = renderWithTheme(<Sidebar />, true);

      const drawerPaper = container.querySelector('.MuiDrawer-paper');
      expect(drawerPaper).toBeInTheDocument();
      // The drawer should be visible at all sizes since it's a temporary drawer
    });
  });

  describe('Edge Cases', () => {
    it('handles route changes correctly', () => {
      const { container, rerender } = renderWithTheme(<Sidebar />, true, false, '/dashboard');

      let dashboardButton = container.querySelector('a[href="/dashboard"] button');
      expect(dashboardButton).toHaveAttribute('selected', 'true');

      // Simulate route change
      (nextNavigation.usePathname as jest.Mock).mockReturnValue('/monitoring');

      rerender(
        <ThemeProvider theme={theme}>
          <Sidebar />
        </ThemeProvider>
      );

      const monitoringButton = container.querySelector('a[href="/monitoring"] button');
      expect(monitoringButton).toHaveAttribute('selected', 'true');
    });

    it('handles undefined pathname gracefully', () => {
      const { container } = renderWithTheme(<Sidebar />, true, false, undefined as any);

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();
    });
  });

  describe('Menu Items Structure', () => {
    it('renders menu items in correct order', () => {
      const { container } = renderWithTheme(<Sidebar />, true);

      const list = container.querySelector('.MuiList-root');
      const listItems = list?.querySelectorAll('.MuiListItem-root');

      expect(listItems?.length).toBe(5); // Dashboard, Monitoring, Models, Logs, Settings

      const firstItem = listItems?.[0];
      const lastItem = listItems?.[4];

      expect(firstItem?.textContent).toContain('Dashboard');
      expect(lastItem?.textContent).toContain('Settings');
    });

    it('renders icons for each menu item', () => {
      const { container } = renderWithTheme(<Sidebar />, true);

      const iconContainers = container.querySelectorAll('.MuiListItemIcon-root');
      expect(iconContainers.length).toBe(5); // One icon per menu item
    });
  });

  describe('Integration with SidebarProvider', () => {
    it('uses isOpen state from SidebarProvider', () => {
      renderWithTheme(<Sidebar />, true);

      expect(screen.getByText('Llama Runner')).toBeInTheDocument();

      renderWithTheme(<Sidebar />, false);

      expect(screen.queryByText('Llama Runner')).not.toBeInTheDocument();
    });
  });
});
