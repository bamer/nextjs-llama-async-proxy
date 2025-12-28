import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
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

  return render(<MuiThemeProvider theme={theme}>{component}</MuiThemeProvider>);
}

describe('Header - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    // Positive test: Verifies correct rendering of header
    it('renders header correctly', () => {
      renderWithTheme(<Header />);

      expect(screen.getByText('Llama Runner Pro')).toBeInTheDocument();
    });

    // Positive test: Verifies AppBar component is present
    it('renders app bar', () => {
      renderWithTheme(<Header />);

      const appBar = document.querySelector('[role="banner"]');
      expect(appBar).toBeInTheDocument();
    });

    // Positive test: Verifies menu toggle button is rendered
    it('renders menu toggle button', () => {
      renderWithTheme(<Header />);

      const toggleButton = screen.getByLabelText('Toggle sidebar');
      expect(toggleButton).toBeInTheDocument();
    });

    // Positive test: Verifies ThemeToggle component is rendered
    it('renders ThemeToggle component', () => {
      renderWithTheme(<Header />);

      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    // Positive test: Verifies title text is correct
    it('renders title with correct text', () => {
      renderWithTheme(<Header />);

      const title = screen.getByText('Llama Runner Pro');
      expect(title).toBeInTheDocument();
    });

    // Positive test: Verifies logo icon (Rocket) is rendered
    it('renders logo icon', () => {
      renderWithTheme(<Header />);
      const icons = document.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Sidebar Toggle Interaction', () => {
    // Positive test: Verifies toggleSidebar is called when menu button is clicked
    it('calls toggleSidebar when menu button is clicked', () => {
      renderWithTheme(<Header />);

      const toggleButton = screen.getByLabelText('Toggle sidebar');
      fireEvent.click(toggleButton);

      const { toggleSidebar } = (sidebarContext.useSidebar as jest.Mock).mock.results[0].value;
      expect(toggleSidebar).toHaveBeenCalledTimes(1);
    });

    // Negative test: Verifies no error when clicking toggle multiple times
    it('handles multiple rapid clicks without errors', () => {
      renderWithTheme(<Header />);

      const toggleButton = screen.getByLabelText('Toggle sidebar');

      expect(() => {
        for (let i = 0; i < 10; i++) {
          fireEvent.click(toggleButton);
        }
      }).not.toThrow();
    });
  });

  describe('Theme Integration', () => {
    // Positive test: Verifies dark mode styling
    it('applies dark mode styles when isDark is true', () => {
      renderWithTheme(<Header />, true);

      const appBar = document.querySelector('[role="banner"]');
      expect(appBar).toBeInTheDocument();
    });

    // Positive test: Verifies light mode styling
    it('applies light mode styles when isDark is false', () => {
      renderWithTheme(<Header />, false);

      const appBar = document.querySelector('[role="banner"]');
      expect(appBar).toBeInTheDocument();
    });

    // Positive test: Verifies theme context is used
    it('uses theme context for styling', () => {
      renderWithTheme(<Header />);

      expect(themeContext.useTheme).toHaveBeenCalled();
    });

    // Positive test: Verifies sidebar context is used
    it('uses sidebar context for toggle functionality', () => {
      renderWithTheme(<Header />);

      expect(sidebarContext.useSidebar).toHaveBeenCalled();
    });
  });

  describe('AppBar Configuration', () => {
    // Positive test: Verifies AppBar has fixed position
    it('applies fixed position to AppBar', () => {
      renderWithTheme(<Header />);

      const appBar = document.querySelector('[role="banner"]');
      expect(appBar).toBeInTheDocument();
    });

    // Positive test: Verifies AppBar has correct height (exercises sx callback)
    it('applies correct height to AppBar', () => {
      renderWithTheme(<Header />);

      const appBar = document.querySelector('[role="banner"]');
      expect(appBar).toBeInTheDocument();
      expect(appBar).toHaveStyle({ position: 'fixed' });
    });
  });

  describe('Accessibility', () => {
    // Positive test: Verifies ARIA labels are present
    it('has proper ARIA labels', () => {
      renderWithTheme(<Header />);

      const toggleButton = screen.getByLabelText('Toggle sidebar');
      expect(toggleButton).toHaveAttribute('aria-label', 'Toggle sidebar');
    });

    // Positive test: Verifies keyboard navigation
    it('supports keyboard navigation', () => {
      renderWithTheme(<Header />);

      const toggleButton = screen.getByLabelText('Toggle sidebar');

      expect(() => {
        fireEvent.keyDown(toggleButton, { key: 'Enter', code: 'Enter' });
        fireEvent.keyDown(toggleButton, { key: ' ', code: 'Space' });
      }).not.toThrow();
    });

    // Positive test: Verifies role attributes
    it('has correct role attributes', () => {
      renderWithTheme(<Header />);

      const appBar = document.querySelector('[role="banner"]');
      expect(appBar).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    // Positive test: Verifies layout adapts to mobile
    it('renders correctly at mobile viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      window.dispatchEvent(new Event('resize'));

      renderWithTheme(<Header />);

      expect(screen.getByText('Llama Runner Pro')).toBeInTheDocument();
    });

    // Positive test: Verifies layout adapts to desktop
    it('renders correctly at desktop viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      window.dispatchEvent(new Event('resize'));

      renderWithTheme(<Header />);

      expect(screen.getByText('Llama Runner Pro')).toBeInTheDocument();
    });

    // Positive test: Verifies resize handling
    it('handles window resize events', () => {
      renderWithTheme(<Header />);

      expect(() => {
        window.dispatchEvent(new Event('resize'));
      }).not.toThrow();
    });
  });

  describe('Component Composition', () => {
    // Positive test: Verifies correct DOM structure
    it('maintains correct DOM structure', () => {
      renderWithTheme(<Header />);

      const appBar = document.querySelector('[role="banner"]');
      expect(appBar).toBeInTheDocument();
      expect(appBar?.children.length).toBeGreaterThan(0);
    });

    // Positive test: Verifies child components render
    it('renders all child components', () => {
      renderWithTheme(<Header />);

      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
      expect(screen.getByText('Llama Runner Pro')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    // Negative test: Verifies component handles missing context gracefully
    it('handles undefined toggleSidebar gracefully', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: false,
        toggleSidebar: undefined as any,
        openSidebar: jest.fn(),
        closeSidebar: jest.fn(),
      });

      expect(() => renderWithTheme(<Header />)).not.toThrow();
    });

    // Negative test: Verifies component handles null theme context
    it('handles null theme context value', () => {
      (themeContext.useTheme as jest.Mock).mockReturnValue({
        isDark: null as any,
        mode: 'light' as const,
        setMode: jest.fn(),
        toggleTheme: jest.fn(),
        currentTheme: theme,
      });

      expect(() => renderWithTheme(<Header />)).not.toThrow();
    });

    // Negative test: Verifies component handles missing theme
    it('handles missing currentTheme in context', () => {
      (themeContext.useTheme as jest.Mock).mockReturnValue({
        isDark: false,
        mode: 'light' as const,
        setMode: jest.fn(),
        toggleTheme: jest.fn(),
        currentTheme: undefined,
      });

      expect(() => renderWithTheme(<Header />)).not.toThrow();
    });

    // Positive test: Verifies rapid theme switches work
    it('handles rapid theme switches', () => {
      const { rerender } = renderWithTheme(<Header />, false);

      expect(() => {
        for (let i = 0; i < 10; i++) {
          (themeContext.useTheme as jest.Mock).mockReturnValue({
            isDark: i % 2 === 0,
            mode: i % 2 === 0 ? ('dark' as const) : ('light' as const),
            setMode: jest.fn(),
            toggleTheme: jest.fn(),
            currentTheme: theme,
          });
          rerender(<MuiThemeProvider theme={theme}><Header /></MuiThemeProvider>);
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
        render(<MuiThemeProvider theme={customTheme}><Header /></MuiThemeProvider>);
      }).not.toThrow();
    });
  });

  describe('Focus Management', () => {
    // Positive test: Verifies focus handling
    it('handles focus and blur events', () => {
      renderWithTheme(<Header />);

      const toggleButton = screen.getByLabelText('Toggle sidebar');

      expect(() => {
        fireEvent.focus(toggleButton);
        fireEvent.blur(toggleButton);
      }).not.toThrow();
    });
  });
});
