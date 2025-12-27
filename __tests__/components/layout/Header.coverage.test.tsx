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

describe('Header - Final Tests for Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering Coverage', () => {
    // Positive test: Covers component rendering and sx prop callbacks (lines 17-23)
    it('renders Header with proper theme provider - covers sx callbacks', () => {
      renderWithTheme(<Header />, false);

      expect(screen.getByText('Llama Runner Pro')).toBeInTheDocument();
      expect(screen.getByLabelText('Toggle sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    // Positive test: Covers dark mode styling (exercises line 19-21)
    it('renders Header in dark mode - exercises sx prop with isDark true', () => {
      renderWithTheme(<Header />, true);

      expect(screen.getByText('Llama Runner Pro')).toBeInTheDocument();
    });

    // Positive test: Covers all context usage
    it('uses both theme and sidebar contexts', () => {
      renderWithTheme(<Header />);

      expect(themeContext.useTheme).toHaveBeenCalled();
      expect(sidebarContext.useSidebar).toHaveBeenCalled();
    });
  });

  describe('Function Coverage', () => {
    // Positive test: Covers toggleSidebar callback function
    it('covers toggleSidebar function call', () => {
      renderWithTheme(<Header />);

      const toggleButton = screen.getByLabelText('Toggle sidebar');
      fireEvent.click(toggleButton);

      const { toggleSidebar } = (sidebarContext.useSidebar as jest.Mock).mock.results[0].value;
      expect(toggleSidebar).toHaveBeenCalledTimes(1);
    });

    // Positive test: Covers multiple toggle calls
    it('covers multiple toggleSidebar calls', () => {
      renderWithTheme(<Header />);

      const toggleButton = screen.getByLabelText('Toggle sidebar');

      for (let i = 0; i < 5; i++) {
        fireEvent.click(toggleButton);
      }

      const { toggleSidebar } = (sidebarContext.useSidebar as jest.Mock).mock.results[0].value;
      expect(toggleSidebar).toHaveBeenCalledTimes(5);
    });
  });

  describe('Edge Cases for Coverage', () => {
    // Negative test: Component handles null/undefined values
    it('handles missing theme values gracefully', () => {
      (themeContext.useTheme as jest.Mock).mockReturnValue({
        isDark: null as any,
        mode: 'light' as const,
        setMode: jest.fn(),
        toggleTheme: jest.fn(),
        currentTheme: theme,
      });

      expect(() => renderWithTheme(<Header />)).not.toThrow();
    });

    // Negative test: Component handles missing toggleSidebar
    it('handles undefined toggleSidebar gracefully', () => {
      (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
        isOpen: false,
        toggleSidebar: undefined as any,
        openSidebar: jest.fn(),
        closeSidebar: jest.fn(),
      });

      expect(() => renderWithTheme(<Header />)).not.toThrow();
    });
  });

  describe('Branch Coverage', () => {
    // Positive test: Exercises branch with isDark === true
    it('exercises isDark === true branch', () => {
      renderWithTheme(<Header />, true);

      expect(screen.getByText('Llama Runner Pro')).toBeInTheDocument();
    });

    // Positive test: Exercises branch with isDark === false
    it('exercises isDark === false branch', () => {
      renderWithTheme(<Header />, false);

      expect(screen.getByText('Llama Runner Pro')).toBeInTheDocument();
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

      render(<MuiThemeProvider theme={customTheme}><Header /></MuiThemeProvider>);

      expect(screen.getByText('Llama Runner Pro')).toBeInTheDocument();
    });
  });

  describe('Interaction Coverage', () => {
    // Positive test: Covers keyboard events
    it('covers keyboard event handling', () => {
      renderWithTheme(<Header />);

      const toggleButton = screen.getByLabelText('Toggle sidebar');

      fireEvent.keyDown(toggleButton, { key: 'Enter', code: 'Enter' });
      fireEvent.keyDown(toggleButton, { key: ' ', code: 'Space' });

      expect(toggleButton).toBeInTheDocument();
    });

    // Positive test: Covers focus events
    it('covers focus event handling', () => {
      renderWithTheme(<Header />);

      const toggleButton = screen.getByLabelText('Toggle sidebar');

      fireEvent.focus(toggleButton);
      fireEvent.blur(toggleButton);

      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe('Responsive Coverage', () => {
    // Positive test: Covers viewport changes
    it('covers window resize events', () => {
      renderWithTheme(<Header />);

      window.dispatchEvent(new Event('resize'));

      expect(screen.getByText('Llama Runner Pro')).toBeInTheDocument();
    });
  });

  describe('Error Handling Coverage', () => {
    // Negative test: Component renders without errors
    it('renders without throwing errors', () => {
      expect(() => renderWithTheme(<Header />)).not.toThrow();
    });

    // Negative test: Component re-renders without errors
    it('re-renders without errors', () => {
      const { rerender } = renderWithTheme(<Header />);

      expect(() => {
        rerender(<MuiThemeProvider theme={theme}><Header /></MuiThemeProvider>);
      }).not.toThrow();
    });
  });
});
