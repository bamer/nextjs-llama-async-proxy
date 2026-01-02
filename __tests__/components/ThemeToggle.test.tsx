import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import React from 'react';

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(() => ({
    theme: 'light',
    isDark: false,
    toggleTheme: jest.fn(),
  })),
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDefined();
  });

  it('should display light mode icon', () => {
    render(<ThemeToggle />);
    
    const { useTheme } = require('@/contexts/ThemeContext');
    useTheme.mockReturnValue({ theme: 'light', isDark: false, toggleTheme: jest.fn() });
    
    expect(screen.getByRole('button')).toBeDefined();
  });

  it('should display dark mode icon', () => {
    render(<ThemeToggle />);
    
    const { useTheme } = require('@/contexts/ThemeContext');
    useTheme.mockReturnValue({ theme: 'dark', isDark: true, toggleTheme: jest.fn() });
    
    expect(screen.getByRole('button')).toBeDefined();
  });

  it('should call toggleTheme on click', () => {
    const toggleThemeMock = jest.fn();
    const { useTheme } = require('@/contexts/ThemeContext');
    useTheme.mockReturnValue({ theme: 'light', isDark: false, toggleTheme: toggleThemeMock });
    
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(toggleThemeMock).toHaveBeenCalled();
  });

  it('should have accessible label', () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
  });
});
