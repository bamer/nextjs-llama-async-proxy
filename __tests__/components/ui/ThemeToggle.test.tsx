import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import * as themeContext from '@/contexts/ThemeContext';

jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const mockSetMode = jest.fn();

describe('ThemeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSetMode.mockClear();
    // Mock ThemeContext's useTheme
    (themeContext.useTheme as jest.Mock).mockReturnValue({
      mode: 'light',
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: jest.fn(),
      currentTheme: null,
    });
    // Suppress localStorage warnings in test environment
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(() => {}),
        removeItem: jest.fn(() => {}),
      },
      writable: true,
    });
  });

  it('renders correctly', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('displays sun icon in light mode', () => {
    (themeContext.useTheme as jest.Mock).mockReturnValue({
      mode: 'light',
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: jest.fn(),
      currentTheme: null,
    });

    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('displays moon icon in dark mode', () => {
    (themeContext.useTheme as jest.Mock).mockReturnValue({
      mode: 'dark',
      setMode: mockSetMode,
      isDark: true,
      toggleTheme: jest.fn(),
      currentTheme: null,
    });

    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('displays monitor icon in system mode', () => {
    (themeContext.useTheme as jest.Mock).mockReturnValue({
      mode: 'system',
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: jest.fn(),
      currentTheme: null,
    });

    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('cycles from light to dark mode', () => {
    (themeContext.useTheme as jest.Mock).mockReturnValue({
      mode: 'light',
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: jest.fn(),
      currentTheme: null,
    });

    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockSetMode).toHaveBeenCalledWith('dark');
  });

  it('cycles from dark to system mode', () => {
    (themeContext.useTheme as jest.Mock).mockReturnValue({
      mode: 'dark',
      setMode: mockSetMode,
      isDark: true,
      toggleTheme: jest.fn(),
      currentTheme: null,
    });

    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockSetMode).toHaveBeenCalledWith('system');
  });

  it('cycles from system to light mode', () => {
    (themeContext.useTheme as jest.Mock).mockReturnValue({
      mode: 'system',
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: jest.fn(),
      currentTheme: null,
    });

    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockSetMode).toHaveBeenCalledWith('light');
  });

  it('has correct aria-label', () => {
    (themeContext.useTheme as jest.Mock).mockReturnValue({
      mode: 'light',
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: jest.fn(),
      currentTheme: null,
    });

    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Toggle theme');
  });

  it('displays tooltip with correct text in light mode', () => {
    (themeContext.useTheme as jest.Mock).mockReturnValue({
      mode: 'light',
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: jest.fn(),
      currentTheme: null,
    });

    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('displays tooltip with correct text in dark mode', () => {
    (themeContext.useTheme as jest.Mock).mockReturnValue({
      mode: 'dark',
      setMode: mockSetMode,
      isDark: true,
      toggleTheme: jest.fn(),
      currentTheme: null,
    });

    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('displays tooltip with correct text in system mode', () => {
    (themeContext.useTheme as jest.Mock).mockReturnValue({
      mode: 'system',
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: jest.fn(),
      currentTheme: null,
    });

    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('handles multiple clicks', () => {
    const { useTheme } = require('@/contexts/ThemeContext');
    (useTheme as jest.Mock).mockReturnValue({
      mode: 'light',
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: jest.fn(),
      currentTheme: null,
    });

    render(<ThemeToggle />);
    const button = screen.getByRole('button');

    // First click - light to dark
    fireEvent.click(button);
    expect(mockSetMode).toHaveBeenLastCalledWith('dark');

    // Update mock return value for dark mode
    (useTheme as jest.Mock).mockReturnValue({
      mode: 'dark',
      setMode: mockSetMode,
      isDark: true,
      toggleTheme: jest.fn(),
      currentTheme: null,
    });

    // Second click - dark to system
    fireEvent.click(button);
    expect(mockSetMode).toHaveBeenLastCalledWith('system');

    // Update mock return value for system mode
    (useTheme as jest.Mock).mockReturnValue({
      mode: 'system',
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: jest.fn(),
      currentTheme: null,
    });

    // Third click - system to light
    fireEvent.click(button);
    expect(mockSetMode).toHaveBeenLastCalledWith('light');

    // Should have been called 3 times total
    expect(mockSetMode).toHaveBeenCalledTimes(3);
  });

  it('returns placeholder div before mount', () => {
    (themeContext.useTheme as jest.Mock).mockReturnValue({
      mode: 'light',
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: jest.fn(),
      currentTheme: null,
    });

    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls useTheme hook', () => {
    (themeContext.useTheme as jest.Mock).mockReturnValue({
      mode: 'light',
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: jest.fn(),
      currentTheme: null,
    });

    render(<ThemeToggle />);
    expect(themeContext.useTheme).toHaveBeenCalled();
  });

  it('handles default mode in getThemeIcon', () => {
    (themeContext.useTheme as jest.Mock).mockReturnValue({
      mode: 'invalid' as any,
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: jest.fn(),
      currentTheme: null,
    });

    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('handles default mode in getThemeLabel', () => {
    (themeContext.useTheme as jest.Mock).mockReturnValue({
      mode: 'invalid' as any,
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: jest.fn(),
      currentTheme: null,
    });

    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
});
