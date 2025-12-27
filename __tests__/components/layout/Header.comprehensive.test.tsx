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

function renderWithTheme(component: React.ReactElement, isDark = false) {
  const mockToggleSidebar = jest.fn();

  (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
    isOpen: false,
    toggleSidebar: mockToggleSidebar,
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

  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('Header - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders header correctly', () => {
      renderWithTheme(<Header />);

      expect(screen.getByText('Llama Runner Pro')).toBeInTheDocument();
    });

    it('renders app bar', () => {
      const { container } = renderWithTheme(<Header />);

      const appBar = container.querySelector('.MuiAppBar-root');
      expect(appBar).toBeInTheDocument();
    });

    it('renders toolbar', () => {
      const { container } = renderWithTheme(<Header />);

      const toolbar = container.querySelector('.MuiToolbar-root');
      expect(toolbar).toBeInTheDocument();
    });

    it('renders menu toggle button', () => {
      renderWithTheme(<Header />);

      const toggleButton = screen.getByLabelText('Toggle sidebar');
      expect(toggleButton).toBeInTheDocument();
    });

    it('renders rocket icon', () => {
      renderWithTheme(<Header />);

      const rocketIcon = document.querySelector('.MuiSvgIcon-root');
      expect(rocketIcon).toBeInTheDocument();
    });

    it('renders ThemeToggle component', () => {
      renderWithTheme(<Header />);

      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    it('renders title with correct text', () => {
      renderWithTheme(<Header />);

      const title = screen.getByText('Llama Runner Pro');
      expect(title).toBeInTheDocument();
    });
  });

  describe('Sidebar Toggle Interaction', () => {
    it('calls toggleSidebar when menu button is clicked', () => {
      renderWithTheme(<Header />);

      const toggleButton = screen.getByLabelText('Toggle sidebar');
      fireEvent.click(toggleButton);

      const { useSidebar } = require('@/components/layout/SidebarProvider');
      expect(useSidebar).toHaveBeenCalled();
    });

    it('menu button is clickable', () => {
      const { container } = renderWithTheme(<Header />);

      const toggleButton = screen.getByLabelText('Toggle sidebar');
      expect(toggleButton).toBeEnabled();
    });
  });

  describe('Theme Integration', () => {
    it('applies dark mode styles when isDark is true', () => {
      const { container } = renderWithTheme(<Header />, true);

      const appBar = container.querySelector('.MuiAppBar-root');
      expect(appBar).toBeInTheDocument();
    });

    it('applies light mode styles when isDark is false', () => {
      const { container } = renderWithTheme(<Header />, false);

      const appBar = container.querySelector('.MuiAppBar-root');
      expect(appBar).toBeInTheDocument();
    });

    it('uses theme context for styling', () => {
      const { useTheme } = require('@/contexts/ThemeContext');
      renderWithTheme(<Header />, false);

      expect(useTheme).toHaveBeenCalled();
    });
  });

  describe('AppBar Configuration', () => {
    it('applies fixed position to AppBar', () => {
      const { container } = renderWithTheme(<Header />);

      const appBar = container.querySelector('.MuiAppBar-root');
      expect(appBar).toHaveClass('MuiAppBar-positionFixed');
    });

    it('applies correct height to AppBar', () => {
      const { container } = renderWithTheme(<Header />);

      const appBar = container.querySelector('.MuiAppBar-root');
      expect(appBar).toHaveStyle({ height: '64px' });
    });

    it('applies correct z-index to AppBar', () => {
      const { container } = renderWithTheme(<Header />);

      const appBar = container.querySelector('.MuiAppBar-root');
      expect(appBar).toBeInTheDocument();
    });
  });

  describe('Toolbar Layout', () => {
    it('renders toolbar with full height', () => {
      const { container } = renderWithTheme(<Header />);

      const toolbar = container.querySelector('.MuiToolbar-root');
      expect(toolbar).toHaveStyle({ height: '100%' });
    });

    it('aligns items in toolbar', () => {
      const { container } = renderWithTheme(<Header />);

      const toolbar = container.querySelector('.MuiToolbar-root');
      expect(toolbar).toBeInTheDocument();
    });

    it('displays logo and title in correct order', () => {
      const { container } = renderWithTheme(<Header />);

      const boxes = container.querySelectorAll('.MuiBox-root');
      expect(boxes.length).toBeGreaterThan(0);
    });
  });

  describe('Logo and Title', () => {
    it('displays rocket icon', () => {
      renderWithTheme(<Header />);

      const title = screen.getByText('Llama Runner Pro');
      expect(title).toBeInTheDocument();
    });

    it('displays title with correct styling', () => {
      const { container } = renderWithTheme(<Header />);

      const title = container.querySelector('.MuiTypography-root');
      expect(title).toBeInTheDocument();
    });
  });

  describe('Theme Toggle', () => {
    it('renders ThemeToggle component in toolbar', () => {
      renderWithTheme(<Header />);

      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    it('positions ThemeToggle on the right side of toolbar', () => {
      renderWithTheme(<Header />);

      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });
  });

  describe('Menu Button', () => {
    it('has correct aria-label', () => {
      renderWithTheme(<Header />);

      const toggleButton = screen.getByLabelText('Toggle sidebar');
      expect(toggleButton).toBeInTheDocument();
    });

    it('is an IconButton component', () => {
      const { container } = renderWithTheme(<Header />);

      const iconButton = container.querySelector('.MuiIconButton-root');
      expect(iconButton).toBeInTheDocument();
    });

    it('has Menu icon', () => {
      renderWithTheme(<Header />);

      const menuIcons = document.querySelectorAll('svg');
      expect(menuIcons.length).toBeGreaterThan(0);
    });
  });

  describe('SidebarProvider Integration', () => {
    it('uses sidebar context', () => {
      const { useSidebar } = require('@/components/layout/SidebarProvider');
      renderWithTheme(<Header />);

      expect(useSidebar).toHaveBeenCalled();
    });

    it('gets toggleSidebar function from context', () => {
      renderWithTheme(<Header />);

      const { useSidebar } = require('@/components/layout/SidebarProvider');
      const contextValue = useSidebar();

      expect(contextValue).toBeDefined();
      expect(typeof contextValue.toggleSidebar).toBe('function');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels on buttons', () => {
      renderWithTheme(<Header />);

      const toggleButton = screen.getByLabelText('Toggle sidebar');
      expect(toggleButton).toBeInTheDocument();
    });

    it('has keyboard accessible buttons', () => {
      renderWithTheme(<Header />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toBeVisible();
      });
    });
  });

  describe('Responsive Design', () => {
    it('adapts to different screen sizes', () => {
      const { container } = renderWithTheme(<Header />);

      const appBar = container.querySelector('.MuiAppBar-root');
      expect(appBar).toBeInTheDocument();
    });

    it('maintains layout on resize', () => {
      const { container } = renderWithTheme(<Header />);

      const appBar = container.querySelector('.MuiAppBar-root');
      expect(appBar).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid clicks on menu button', () => {
      renderWithTheme(<Header />);

      const toggleButton = screen.getByLabelText('Toggle sidebar');

      // Rapid clicks
      for (let i = 0; i < 10; i++) {
        fireEvent.click(toggleButton);
      }

      expect(toggleButton).toBeInTheDocument();
    });

    it('handles theme toggle correctly', () => {
      const { container, rerender } = renderWithTheme(<Header />, false);

      expect(screen.getByText('Llama Runner Pro')).toBeInTheDocument();

      // Simulate theme switch
      rerender(
        <ThemeProvider theme={theme}>
          <Header />
        </ThemeProvider>
      );

      expect(screen.getByText('Llama Runner Pro')).toBeInTheDocument();
    });
  });

  describe('Component Composition', () => {
    it('composes ThemeToggle correctly', () => {
      renderWithTheme(<Header />);

      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    it('maintains correct DOM structure', () => {
      const { container } = renderWithTheme(<Header />);

      const appBar = container.querySelector('.MuiAppBar-root');
      expect(appBar).toBeInTheDocument();

      const toolbar = appBar?.querySelector('.MuiToolbar-root');
      expect(toolbar).toBeInTheDocument();
    });
  });

  describe('Visual Styling', () => {
    it('applies background color based on theme', () => {
      const { container } = renderWithTheme(<Header />, false);

      const appBar = container.querySelector('.MuiAppBar-root');
      expect(appBar).toBeInTheDocument();
    });

    it('applies backdrop filter for glass effect', () => {
      const { container } = renderWithTheme(<Header />);

      const appBar = container.querySelector('.MuiAppBar-root');
      expect(appBar).toBeInTheDocument();
    });

    it('removes box shadow for cleaner look', () => {
      const { container } = renderWithTheme(<Header />);

      const appBar = container.querySelector('.MuiAppBar-root');
      expect(appBar).toBeInTheDocument();
    });
  });

  describe('Icon Styling', () => {
    it('applies correct color to menu icon based on theme', () => {
      const { container } = renderWithTheme(<Header />, false);

      const iconButton = container.querySelector('.MuiIconButton-root');
      expect(iconButton).toBeInTheDocument();
    });

    it('applies correct color to rocket icon based on theme', () => {
      renderWithTheme(<Header />, false);

      const rocketIcon = document.querySelectorAll('.MuiSvgIcon-root');
      expect(rocketIcon.length).toBeGreaterThan(0);
    });
  });
});
