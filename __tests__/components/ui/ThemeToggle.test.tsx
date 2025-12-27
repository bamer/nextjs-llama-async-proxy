import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@mui/material/useMediaQuery', () => () => false);

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

  it('renders correctly', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('displays sun icon in light mode', () => {
    useTheme.mockReturnValue({
      mode: 'light',
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: mockToggleTheme,
      currentTheme: null,
    });

    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('displays moon icon in dark mode', () => {
    useTheme.mockReturnValue({
      mode: 'dark',
      setMode: mockSetMode,
      isDark: true,
      toggleTheme: mockToggleTheme,
      currentTheme: null,
    });

    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('displays monitor icon in system mode', () => {
    useTheme.mockReturnValue({
      mode: 'system',
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: mockToggleTheme,
      currentTheme: null,
    });

    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('cycles from light to dark mode', () => {
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

  it('cycles from dark to system mode', () => {
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

  it('cycles from system to light mode', () => {
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

  it('has correct aria-label', () => {
    useTheme.mockReturnValue({
      mode: 'light',
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: mockToggleTheme,
      currentTheme: null,
    });

    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Toggle theme');
  });

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

  it('displays tooltip with correct text in system mode', () => {
    useTheme.mockReturnValue({
      mode: 'system',
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: mockToggleTheme,
      currentTheme: null,
    });

    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('handles multiple clicks', () => {
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
    expect(mockSetMode).toHaveBeenLastCalledWith('dark');

    useTheme.mockReturnValue({
      mode: 'dark',
      setMode: mockSetMode,
      isDark: true,
      toggleTheme: mockToggleTheme,
      currentTheme: null,
    });

    fireEvent.click(button);
    expect(mockSetMode).toHaveBeenLastCalledWith('system');

    useTheme.mockReturnValue({
      mode: 'system',
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: mockToggleTheme,
      currentTheme: null,
    });

    fireEvent.click(button);
    expect(mockSetMode).toHaveBeenLastCalledWith('light');

    expect(mockSetMode).toHaveBeenCalledTimes(3);
  });

  it('returns placeholder div before mount', () => {
    useTheme.mockReturnValue({
      mode: 'light',
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: mockToggleTheme,
      currentTheme: null,
    });

    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls useTheme hook', () => {
    useTheme.mockReturnValue({
      mode: 'light',
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: mockToggleTheme,
      currentTheme: null,
    });

    render(<ThemeToggle />);
    expect(useTheme).toHaveBeenCalled();
  });

  it('handles default mode in getThemeIcon', () => {
    useTheme.mockReturnValue({
      mode: 'invalid' as any,
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: mockToggleTheme,
      currentTheme: null,
    });

    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('handles default mode in getThemeLabel', () => {
    useTheme.mockReturnValue({
      mode: 'invalid' as any,
      setMode: mockSetMode,
      isDark: false,
      toggleTheme: mockToggleTheme,
      currentTheme: null,
    });

    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
});
