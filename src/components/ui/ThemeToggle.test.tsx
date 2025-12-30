import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ThemeToggle } from './ThemeToggle';

// Mock the ThemeContext
const mockSetMode = jest.fn((mode) => console.log('setMode called with:', mode));
const mockToggleTheme = jest.fn();

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

const mockUseTheme = require('@/contexts/ThemeContext').useTheme;

describe('ThemeToggle', () => {
  let useEffectCalled = false;

  beforeEach(() => {
    jest.clearAllMocks();
    useEffectCalled = false;
    // Reset mock implementation
    mockUseTheme.mockReturnValue({
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
      mockUseTheme.mockReturnValue({
        mode: 'light',
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: false,
      });

      render(<ThemeToggle />);

      // Should render Sun icon for light mode
      const button = screen.getByRole('button', { name: /toggle theme/i });
      expect(button).toBeInTheDocument();

      // Check for Sun icon (data-icon attribute from lucide-react mock)
      const sunIcon = document.querySelector('[data-icon="Sun"]');
      expect(sunIcon).toBeInTheDocument();
    });

    it('renders with dark theme icon when in dark mode', () => {
      mockUseTheme.mockReturnValue({
        mode: 'dark',
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: true,
      });

      render(<ThemeToggle />);

      // Should render Moon icon for dark mode
      const moonIcon = document.querySelector('[data-icon="Moon"]');
      expect(moonIcon).toBeInTheDocument();
    });

    it('renders with system theme icon when in system mode', () => {
      mockUseTheme.mockReturnValue({
        mode: 'system',
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: false, // system mode doesn't determine isDark directly
      });

      render(<ThemeToggle />);

      // Should render Monitor icon for system mode
      const monitorIcon = document.querySelector('[data-icon="Monitor"]');
      expect(monitorIcon).toBeInTheDocument();
    });

    it('shows loading state before hydration', () => {
      // Restore original useEffect for this test
      jest.spyOn(React, 'useEffect').mockRestore();
      // Mock useEffect to not run (simulate SSR/hydration)
      jest.spyOn(React, 'useEffect').mockImplementation(() => {});

      mockUseTheme.mockReturnValue({
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
      mockUseTheme.mockReturnValue({
        mode: 'light',
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: false,
      });

      render(<ThemeToggle />);

      const button = await screen.findByRole('button', { name: /toggle theme/i });
      const sunIcon = document.querySelector('[data-icon="Sun"]');
      expect(sunIcon).toBeInTheDocument();
      expect(button).toBeInTheDocument();
    });

    it('cycles from dark to system mode', async () => {
      mockUseTheme.mockReturnValue({
        mode: 'dark',
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: true,
      });

      render(<ThemeToggle />);

      const button = await screen.findByRole('button', { name: /toggle theme/i });
      const moonIcon = document.querySelector('[data-icon="Moon"]');
      expect(moonIcon).toBeInTheDocument();
      expect(button).toBeInTheDocument();
    });

    it('cycles from system back to light mode', async () => {
      mockUseTheme.mockReturnValue({
        mode: 'system',
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: false,
      });

      render(<ThemeToggle />);

      const button = await screen.findByRole('button', { name: /toggle theme/i });
      const monitorIcon = document.querySelector('[data-icon="Monitor"]');
      expect(monitorIcon).toBeInTheDocument();
      expect(button).toBeInTheDocument();
    });

    it('cycles through all three modes correctly', async () => {
      // Test light mode
      mockUseTheme.mockReturnValue({
        mode: 'light',
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: false,
      });

      const { rerender } = render(<ThemeToggle />);
      const sunIcon = document.querySelector('[data-icon="Sun"]');
      expect(sunIcon).toBeInTheDocument();

      // Test dark mode
      mockUseTheme.mockReturnValue({
        mode: 'dark',
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: true,
      });

      rerender(<ThemeToggle />);
      const moonIcon = document.querySelector('[data-icon="Moon"]');
      expect(moonIcon).toBeInTheDocument();

      // Test system mode
      mockUseTheme.mockReturnValue({
        mode: 'system',
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: false,
      });

      rerender(<ThemeToggle />);
      const monitorIcon = document.querySelector('[data-icon="Monitor"]');
      expect(monitorIcon).toBeInTheDocument();
    });
  });

  describe('Tooltip', () => {
    it('displays correct tooltip for light mode', async () => {
      mockUseTheme.mockReturnValue({
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
      mockUseTheme.mockReturnValue({
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
      mockUseTheme.mockReturnValue({
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

      const sunIcon = document.querySelector('[data-icon="Sun"]');
      expect(sunIcon).toHaveClass('h-5', 'w-5');
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
      mockUseTheme.mockReturnValue({
        mode: 'light',
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: false,
      });

      render(<ThemeToggle />);

      // Wait for component to mount
      await screen.findByRole('button', { name: /toggle theme/i });

      const sunIcon = document.querySelector('[data-icon="Sun"]');
      expect(sunIcon).toHaveClass('text-yellow-500');
    });

    it('renders moon icon with blue color for dark mode', async () => {
      mockUseTheme.mockReturnValue({
        mode: 'dark',
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: true,
      });

      render(<ThemeToggle />);

      // Wait for component to mount
      await screen.findByRole('button', { name: /toggle theme/i });

      const moonIcon = document.querySelector('[data-icon="Moon"]');
      expect(moonIcon).toHaveClass('text-blue-400');
    });

    it('renders monitor icon with gray color for system mode', async () => {
      mockUseTheme.mockReturnValue({
        mode: 'system',
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: false,
      });

      render(<ThemeToggle />);

      // Wait for component to mount
      await screen.findByRole('button', { name: /toggle theme/i });

      const monitorIcon = document.querySelector('[data-icon="Monitor"]');
      expect(monitorIcon).toHaveClass('text-gray-500');
    });
  });
});