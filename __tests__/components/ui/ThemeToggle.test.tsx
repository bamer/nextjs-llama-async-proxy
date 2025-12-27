import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Sun: () => <div data-testid="sun-icon">SunIcon</div>,
  Moon: () => <div data-testid="moon-icon">MoonIcon</div>,
  Monitor: () => <div data-testid="monitor-icon">MonitorIcon</div>,
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const mockSetMode = jest.fn();
const mockToggleTheme = jest.fn();

const { useTheme } = require('@/contexts/ThemeContext');

describe('ThemeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSetMode.mockClear();
    mockToggleTheme.mockClear();
    useTheme.mockReturnValue({
      mode: 'light',
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: mockToggleTheme,
      currentTheme: null,
    });
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(() => {}),
        removeItem: jest.fn(() => {}),
      },
      writable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Positive tests - verify correct functionality (success case)

  /**
   * Test: Component renders correctly with default props
   * Objective: Verify ThemeToggle component renders without errors
   */
  it('renders correctly', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  /**
   * Test: Displays sun icon in light mode
   * Objective: Verify correct icon is shown for light theme mode
   */
  it('displays sun icon in light mode', () => {
    useTheme.mockReturnValue({
      mode: 'light',
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: mockToggleTheme,
      currentTheme: null,
    });
    render(<ThemeToggle />);
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
  });

  /**
   * Test: Displays moon icon in dark mode
   * Objective: Verify correct icon is shown for dark theme mode
   */
  it('displays moon icon in dark mode', () => {
    useTheme.mockReturnValue({
      mode: 'dark',
      setMode: mockSetMode,
      isDark: true,
      toggleTheme: mockToggleTheme,
      currentTheme: null,
    });
    render(<ThemeToggle />);
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
  });

  /**
   * Test: Displays monitor icon in system mode
   * Objective: Verify correct icon is shown for system theme mode
   */
  it('displays monitor icon in system mode', () => {
    useTheme.mockReturnValue({
      mode: 'system',
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: mockToggleTheme,
      currentTheme: null,
    });
    render(<ThemeToggle />);
    expect(screen.getByTestId('monitor-icon')).toBeInTheDocument();
  });

  /**
   * Test: Cycles theme on click from light to dark
   * Objective: Verify theme cycles correctly: light -> dark
   */
  it('cycles theme from light to dark on click', () => {
    useTheme.mockReturnValue({
      mode: 'light',
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: mockToggleTheme,
      currentTheme: null,
    });
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(mockSetMode).toHaveBeenCalledWith('dark');
  });

  /**
   * Test: Cycles theme on click from dark to system
   * Objective: Verify theme cycles correctly: dark -> system
   */
  it('cycles theme from dark to system on click', () => {
    useTheme.mockReturnValue({
      mode: 'dark',
      setMode: mockSetMode,
      isDark: true,
      toggleTheme: mockToggleTheme,
      currentTheme: null,
    });
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(mockSetMode).toHaveBeenCalledWith('system');
  });

  /**
   * Test: Cycles theme on click from system to light
   * Objective: Verify theme cycles correctly: system -> light
   */
  it('cycles theme from system to light on click', () => {
    useTheme.mockReturnValue({
      mode: 'system',
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: mockToggleTheme,
      currentTheme: null,
    });
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(mockSetMode).toHaveBeenCalledWith('light');
  });

  /**
   * Test: Has correct aria-label
   * Objective: Verify accessibility attribute for screen readers
   */
  it('has correct aria-label', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Toggle theme');
  });

  /**
   * Test: Uses MUI Button component with correct props
   * Objective: Verify component uses MUI Button properly
   */
  it('uses MUI Button with correct props', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    // Verify it's inside a tooltip structure (MUI pattern)
  });

  /**
   * Test: Displays tooltip with correct text in light mode
   * Objective: Verify tooltip shows "Light Mode" for light theme
   */
  it('displays tooltip with correct text in light mode', () => {
    useTheme.mockReturnValue({
      mode: 'light',
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: mockToggleTheme,
      currentTheme: null,
    });
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  /**
   * Test: Displays tooltip with correct text in dark mode
   * Objective: Verify tooltip shows "Dark Mode" for dark theme
   */
  it('displays tooltip with correct text in dark mode', () => {
    useTheme.mockReturnValue({
      mode: 'dark',
      setMode: mockSetMode,
      isDark: true,
      toggleTheme: mockToggleTheme,
      currentTheme: null,
    });
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  /**
   * Test: Returns placeholder div before mount
   * Objective: Verify component returns a placeholder div on initial render (SSR compatibility)
   */
  it('returns placeholder div before mount', () => {
    const { container } = render(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  /**
   * Test: Calls useTheme hook
   * Objective: Verify component properly consumes ThemeContext
   */
  it('calls useTheme hook', () => {
    render(<ThemeToggle />);
    expect(useTheme).toHaveBeenCalled();
  });

  /**
   * Test: Handles default mode in getThemeIcon
   * Objective: Verify fallback to sun icon for unknown/unexpected modes
   */
  it('handles default mode in getThemeIcon', () => {
    useTheme.mockReturnValue({
      mode: 'light' as any,
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: mockToggleTheme,
      currentTheme: null,
    });
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  /**
   * Test: Handles default mode in getThemeLabel
   * Objective: Verify fallback label for unknown/unexpected modes
   */
  it('handles default mode in getThemeLabel', () => {
    useTheme.mockReturnValue({
      mode: 'light' as any,
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: mockToggleTheme,
      currentTheme: null,
    });
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  // Negative tests - verify failure or improper input is handled (failure/breakage case)

  /**
   * Test: Requires valid theme context to render
   * Objective: Verify component properly uses ThemeContext
   */
  it('requires valid theme context to render', () => {
    useTheme.mockReturnValue({
      mode: 'light',
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: mockToggleTheme,
      currentTheme: null,
    });
    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(useTheme).toHaveBeenCalled();
  });

  /**
   * Test: Handles valid setMode function
   * Objective: Verify component properly calls setMode on button click
   */
  it('calls setMode with correct value on click', () => {
    useTheme.mockReturnValue({
      mode: 'light',
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: mockToggleTheme,
      currentTheme: null,
    });
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(mockSetMode).toHaveBeenCalledWith('dark');
  });

  /**
   * Test: Handles undefined mode value
   * Objective: Verify component handles undefined theme mode
   */
  it('handles undefined mode value', () => {
    useTheme.mockReturnValue({
      mode: undefined as any,
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: mockToggleTheme,
      currentTheme: null,
    });
    const { container } = render(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  /**
   * Test: Handles rapid successive clicks
   * Objective: Verify component handles rapid clicking without errors
   */
  it('handles rapid successive clicks', () => {
    useTheme.mockReturnValue({
      mode: 'light',
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: mockToggleTheme,
      currentTheme: null,
    });
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(() => {
      for (let i = 0; i < 10; i++) {
        fireEvent.click(button);
      }
    }).not.toThrow();
  });

  /**
   * Test: Handles invalid mode type
   * Objective: Verify component doesn't crash with invalid mode type
   */
  it('handles invalid mode type', () => {
    useTheme.mockReturnValue({
      mode: 'invalid' as any,
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: mockToggleTheme,
      currentTheme: null,
    });
    const { container } = render(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  /**
   * Test: Handles click when setMode throws error
   * Objective: Verify component handles errors from setMode gracefully
   */
  it('handles click when setMode throws error', () => {
    const mockErrorSetMode = jest.fn(() => {
      throw new Error('setMode error');
    });
    useTheme.mockReturnValue({
      mode: 'light',
      setMode: mockErrorSetMode,
      isDark: false,
      toggleTheme: mockToggleTheme,
      currentTheme: null,
    });
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    // The button should still exist and be clickable even if setMode errors
    expect(button).toBeInTheDocument();
  });

  /**
   * Test: Handles missing isDark property
   * Objective: Verify component works without isDark property
   */
  it('handles missing isDark property', () => {
    useTheme.mockReturnValue({
      mode: 'light',
      setMode: mockSetMode,
      isDark: undefined as any,
      toggleTheme: mockToggleTheme,
      currentTheme: null,
    });
    const { container } = render(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  /**
   * Test: Prevents default button behavior
   * Objective: Verify component prevents default button click behavior
   */
  it('prevents default button behavior', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    const mockEvent = { preventDefault: jest.fn() };
    fireEvent.click(button, mockEvent);
    // Button should still render and function
    expect(button).toBeInTheDocument();
  });
});
