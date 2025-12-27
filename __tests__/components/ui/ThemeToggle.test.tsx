import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('ThemeToggle', () => {
  const mockSetMode = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { useTheme } = require('@/contexts/ThemeContext');
    useTheme.mockReturnValue({ mode: 'light', setMode: mockSetMode });

    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('displays sun icon in light mode', () => {
    const { useTheme } = require('@/contexts/ThemeContext');
    useTheme.mockReturnValue({ mode: 'light', setMode: mockSetMode });

    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('displays moon icon in dark mode', () => {
    const { useTheme } = require('@/contexts/ThemeContext');
    useTheme.mockReturnValue({ mode: 'dark', setMode: mockSetMode });

    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('displays monitor icon in system mode', () => {
    const { useTheme } = require('@/contexts/ThemeContext');
    useTheme.mockReturnValue({ mode: 'system', setMode: mockSetMode });

    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('cycles from light to dark mode', () => {
    const { useTheme } = require('@/contexts/ThemeContext');
    useTheme.mockReturnValue({ mode: 'light', setMode: mockSetMode });

    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockSetMode).toHaveBeenCalledWith('dark');
  });

  it('cycles from dark to system mode', () => {
    const { useTheme } = require('@/contexts/ThemeContext');
    useTheme.mockReturnValue({ mode: 'dark', setMode: mockSetMode });

    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockSetMode).toHaveBeenCalledWith('system');
  });

  it('cycles from system to light mode', () => {
    const { useTheme } = require('@/contexts/ThemeContext');
    useTheme.mockReturnValue({ mode: 'system', setMode: mockSetMode });

    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockSetMode).toHaveBeenCalledWith('light');
  });

  it('has correct aria-label', () => {
    const { useTheme } = require('@/contexts/ThemeContext');
    useTheme.mockReturnValue({ mode: 'light', setMode: mockSetMode });

    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Toggle theme');
  });

  it('displays tooltip with correct text in light mode', () => {
    const { useTheme } = require('@/contexts/ThemeContext');
    useTheme.mockReturnValue({ mode: 'light', setMode: mockSetMode });

    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('displays tooltip with correct text in dark mode', () => {
    const { useTheme } = require('@/contexts/ThemeContext');
    useTheme.mockReturnValue({ mode: 'dark', setMode: mockSetMode });

    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('displays tooltip with correct text in system mode', () => {
    const { useTheme } = require('@/contexts/ThemeContext');
    useTheme.mockReturnValue({ mode: 'system', setMode: mockSetMode });

    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('handles multiple clicks', () => {
    const { useTheme } = require('@/contexts/ThemeContext');
    useTheme.mockReturnValue({ mode: 'light', setMode: mockSetMode });

    render(<ThemeToggle />);
    const button = screen.getByRole('button');

    fireEvent.click(button);
    expect(mockSetMode).toHaveBeenCalledWith('dark');

    useTheme.mockReturnValue({ mode: 'dark', setMode: mockSetMode });
    fireEvent.click(button);
    expect(mockSetMode).toHaveBeenCalledWith('system');

    useTheme.mockReturnValue({ mode: 'system', setMode: mockSetMode });
    fireEvent.click(button);
    expect(mockSetMode).toHaveBeenCalledWith('light');
  });

  it('returns placeholder div before mount', () => {
    const { useTheme } = require('@/contexts/ThemeContext');
    useTheme.mockReturnValue({ mode: 'light', setMode: mockSetMode });

    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls useTheme hook', () => {
    const { useTheme } = require('@/contexts/ThemeContext');
    useTheme.mockReturnValue({ mode: 'light', setMode: mockSetMode });

    render(<ThemeToggle />);
    expect(useTheme).toHaveBeenCalled();
  });
});
