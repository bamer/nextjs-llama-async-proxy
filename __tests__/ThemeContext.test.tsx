import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
  };
})();

// Mock window.matchMedia
const matchMediaMock = (matches: boolean) => {
  return {
    matches,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
};

// Mock window.matchMedia globally
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => matchMediaMock(false)),
});

// Mock localStorage globally
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  // Wrapper for ThemeProvider
  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <ThemeProvider>{children}</ThemeProvider>;
  };

  it('should initialize with default theme as system', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe('system');
  });

  it('should load theme from localStorage', () => {
    localStorageMock.setItem('theme', 'dark');
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe('dark');
  });

  it('should update actualTheme based on system preference when theme is system', () => {
    // Mock system preference as dark
    window.matchMedia = jest.fn().mockImplementation((query) => matchMediaMock(true));
    
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.actualTheme).toBe('dark');
  });

  it('should update actualTheme when theme changes', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    act(() => {
      result.current.setTheme('light');
    });
    expect(result.current.actualTheme).toBe('light');
  });

  it('should update localStorage when theme changes', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    act(() => {
      result.current.setTheme('dark');
    });
    expect(localStorageMock.getItem('theme')).toBe('dark');
  });
});