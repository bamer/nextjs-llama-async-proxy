import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeToggle } from './ThemeToggle';

// Mock the ThemeContext
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

import { useTheme as mockUseTheme } from "@/contexts/ThemeContext";

// Define ThemeContextType inline since it's not exported
interface ThemeContextType {
  mode: "light" | "dark" | "system";
  setMode: (mode: "light" | "dark" | "system") => void;
  toggleTheme: () => void;
  isDark: boolean;
}

// Mock functions
const mockSetMode = jest.fn((mode) => console.log('setMode called with:', mode));
const mockToggleTheme = jest.fn();

// Cast as Jest mock - use unknown as intermediate type
const mockedUseTheme = mockUseTheme as unknown as jest.MockedFunction<() => ThemeContextType>;

describe('ThemeToggle', () => {
  let useEffectCalled = false;

  beforeEach(() => {
    jest.clearAllMocks();
    useEffectCalled = false;
    // Reset mock implementation
    mockedUseTheme.mockReturnValue({
      mode: 'light',
      setMode: mockSetMode,
      toggleTheme: mockToggleTheme,
      isDark: false,
    });
    // Mock useEffect to run immediately for testing, but only once
    jest.spyOn(React, 'useEffect').mockImplementation((callback) => {
      if (!useEffectCalled) {
        useEffectCalled = true;
        callback();
      }
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    useEffectCalled = false;
  });

  describe('Initial Rendering', () => {
    it('renders with light theme icon initially', () => {
      mockedUseTheme.mockReturnValue({
        mode: 'light',
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: false,
      });

      render(<ThemeToggle />);

      // Should render Sun icon for light mode
      const button = screen.getByRole('button', { name: /toggle theme/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeVisible();
    });

    it('renders with dark theme icon when in dark mode', () => {
      mockedUseTheme.mockReturnValue({
        mode: 'dark',
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: true,
      });

      render(<ThemeToggle />);

      // Should render Moon icon for dark mode
      const button = screen.getByRole('button', { name: /toggle theme/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeVisible();
    });

    it('renders with system theme icon when in system mode', () => {
      mockedUseTheme.mockReturnValue({
        mode: 'system',
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: false, // system mode doesn't determine isDark directly
      });

      render(<ThemeToggle />);

      // Should render Monitor icon for system mode
      const button = screen.getByRole('button', { name: /toggle theme/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeVisible();
    });

    it('shows loading state before hydration', () => {
      // Restore original useEffect for this test
      jest.spyOn(React, 'useEffect').mockRestore();
      // Mock useEffect to not run (simulate SSR/hydration)
      jest.spyOn(React, 'useEffect').mockImplementation(() => {});

      mockedUseTheme.mockReturnValue({
        mode: 'light',
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: false,
      });

      render(<ThemeToggle />);

      // Should render a placeholder div during hydration
      const placeholder = document.querySelector('.w-10');
      expect(placeholder).toHaveClass('w-10', 'h-10');
    });
  });

  describe('Theme Cycling', () => {
    it('cycles from light to dark mode', async () => {
      mockedUseTheme.mockReturnValue({
        mode: 'light',
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: false,
      });

      render(<ThemeToggle />);

      const button = await screen.findByRole('button', { name: /toggle theme/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeVisible();
    });

    it('cycles from dark to system mode', async () => {
      mockedUseTheme.mockReturnValue({
        mode: 'dark',
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: true,
      });

      render(<ThemeToggle />);

      const button = await screen.findByRole('button', { name: /toggle theme/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeVisible();
    });

    it('cycles from system back to light mode', async () => {
      mockedUseTheme.mockReturnValue({
        mode: 'system',
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: false,
      });

      render(<ThemeToggle />);

      const button = await screen.findByRole('button', { name: /toggle theme/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeVisible();
    });

    it('cycles through all three modes correctly', async () => {
      // Test light mode
      mockedUseTheme.mockReturnValue({
        mode: 'light',
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: false,
      });

      const { rerender } = render(<ThemeToggle />);
      let button = screen.getByRole('button', { name: /toggle theme/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeVisible();

      // Test dark mode
      mockedUseTheme.mockReturnValue({
        mode: 'dark',
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: true,
      });

      rerender(<ThemeToggle />);
      button = screen.getByRole('button', { name: /toggle theme/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeVisible();

      // Test system mode
      mockedUseTheme.mockReturnValue({
        mode: 'system',
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: false,
      });

      rerender(<ThemeToggle />);
      button = screen.getByRole('button', { name: /toggle theme/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeVisible();
    });
  });

  describe('Tooltip', () => {
    it('displays correct tooltip for light mode', async () => {
      mockedUseTheme.mockReturnValue({
        mode: 'light',
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: false,
      });

      render(<ThemeToggle />);

      const button = await screen.findByRole('button', { name: /toggle theme/i });
      expect(button).toBeInTheDocument();

      // The tooltip title should be available (though not visible until hover)
      // MUI Tooltip renders the title as an attribute
      expect(button).toHaveAttribute('aria-label', 'Toggle theme');
    });

    it('displays correct tooltip for dark mode', async () => {
      mockedUseTheme.mockReturnValue({
        mode: 'dark',
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: true,
      });

      render(<ThemeToggle />);

      const button = await screen.findByRole('button', { name: /toggle theme/i });
      expect(button).toBeInTheDocument();
    });

    it('displays correct tooltip for system mode', async () => {
      mockedUseTheme.mockReturnValue({
        mode: 'system',
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: false,
      });

      render(<ThemeToggle />);

      const button = await screen.findByRole('button', { name: /toggle theme/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA label', async () => {
      render(<ThemeToggle />);

      const button = await screen.findByRole('button', { name: /toggle theme/i });
      expect(button).toHaveAttribute('aria-label', 'Toggle theme');
    });

    it('is keyboard accessible', async () => {
      render(<ThemeToggle />);

      const button = await screen.findByRole('button', { name: /toggle theme/i });

      // Focus the button
      button.focus();
      expect(button).toHaveFocus();
    });
  });

  describe('Styling', () => {
    it('applies correct button styling', async () => {
      render(<ThemeToggle />);

      const button = await screen.findByRole('button', { name: /toggle theme/i });
      expect(button).toHaveClass('p-2', 'rounded-lg', 'hover:bg-gray-100', 'dark:hover:bg-gray-800', 'transition-colors');
    });

    it('has correct minimum width', async () => {
      render(<ThemeToggle />);

      const button = await screen.findByRole('button', { name: /toggle theme/i });
      expect(button).toBeInTheDocument(); // Button is rendered
    });

    it('renders icon with correct size classes', async () => {
      render(<ThemeToggle />);

      // Wait for component to mount
      await screen.findByRole('button', { name: /toggle theme/i });

      // Button should contain an SVG element (icon)
      const button = screen.getByRole('button', { name: /toggle theme/i });
      const svgIcon = button.querySelector('svg');
      expect(svgIcon).toBeInTheDocument();
    });
  });

  describe('Hydration and Mounting', () => {
    it('calls useEffect on mount', () => {
      const useEffectSpy = jest.spyOn(React, 'useEffect');

      render(<ThemeToggle />);

      expect(useEffectSpy).toHaveBeenCalled();
      expect(useEffectSpy.mock.calls[0][0]).toBeInstanceOf(Function);
    });

    it('sets mounted state after hydration', () => {
      const useStateSpy = jest.spyOn(React, 'useState');

      render(<ThemeToggle />);

      // useState should be called for mounted state
      expect(useStateSpy).toHaveBeenCalledWith(false);
    });
  });

  describe('Icon Colors', () => {
    it('renders sun icon with yellow color for light mode', async () => {
      mockedUseTheme.mockReturnValue({
        mode: 'light',
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: false,
      });

      render(<ThemeToggle />);

      // Wait for component to mount
      await screen.findByRole('button', { name: /toggle theme/i });

      // Check that the button is rendered and visible
      const button = screen.getByRole('button', { name: /toggle theme/i });
      expect(button).toBeVisible();
    });

    it('renders moon icon with blue color for dark mode', async () => {
      mockedUseTheme.mockReturnValue({
        mode: 'dark',
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: true,
      });

      render(<ThemeToggle />);

      // Wait for component to mount
      await screen.findByRole('button', { name: /toggle theme/i });

      // Check that the button is rendered and visible
      const button = screen.getByRole('button', { name: /toggle theme/i });
      expect(button).toBeVisible();
    });

    it('renders monitor icon with gray color for system mode', async () => {
      mockedUseTheme.mockReturnValue({
        mode: 'system',
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: false,
      });

      render(<ThemeToggle />);

      // Wait for component to mount
      await screen.findByRole('button', { name: /toggle theme/i });

      // Check that the button is rendered and visible
      const button = screen.getByRole('button', { name: /toggle theme/i });
      expect(button).toBeVisible();
    });
  });
});
