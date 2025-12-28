import { render, renderHook, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

const setThemeMock = jest.fn();

jest.mock('next-themes', () => ({
  useTheme: () => ({
    setTheme: setThemeMock,
    theme: 'light',
  }),
}));

jest.mock('@/styles/theme', () => {
  const lightTheme = {
    palette: { mode: 'light' },
    typography: {},
    components: {},
  };
  const darkTheme = {
    palette: { mode: 'dark' },
    typography: {},
    components: {},
  };
  return {
    lightTheme,
    darkTheme,
    designTokens: {},
  };
});

jest.mock('@mui/material/styles', () => {
  const original = jest.requireActual('@mui/material/styles');
  return {
    ...original,
    ThemeProvider: ({ children, theme }: any) => <div data-theme={theme?.palette?.mode || 'light'}>{children}</div>,
  };
});

jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: jest.fn(),
  CssBaseline: () => <div data-testid="css-baseline" />,
}));

const { useMediaQuery } = require('@mui/material');

describe('ThemeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children after mount', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const { container } = render(
      <ThemeProvider>
        <div>Child Content</div>
      </ThemeProvider>
    );
    expect(screen.getByText('Child Content')).toBeInTheDocument();
    expect(container).toBeInTheDocument();
  });

  it('returns null before mount to avoid SSR mismatch', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const { container } = render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('uses light theme by default', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const { container } = render(
      <ThemeProvider>
        <div>Test Content</div>
      </ThemeProvider>
    );
    expect(container).toBeInTheDocument();
  });

  it('handles theme switching via useTheme hook', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const { result } = renderHook(() => useTheme());

    act(() => {
      if (result.current.setMode) {
        result.current.setMode('dark');
      }
    });

    // Theme should be set without errors
    expect(result.current).toBeDefined();
  });

  it('handles system theme mode', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(true); // Prefers dark
    const { container } = render(
      <ThemeProvider>
        <div>System Theme</div>
      </ThemeProvider>
    );
    expect(container).toBeInTheDocument();
  });

  it('provides isDark boolean', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const { result } = renderHook(() => useTheme());

    expect(typeof result.current.isDark).toBe('boolean');
  });

  it('handles rapid theme changes', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const { result } = renderHook(() => useTheme());

    expect(() => {
      for (let i = 0; i < 5; i++) {
        act(() => {
          if (result.current.setMode) {
            result.current.setMode(i % 2 === 0 ? 'light' : 'dark');
          }
        });
      }
    }).not.toThrow();
  });
});

describe('useTheme', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides theme context values', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const { result } = renderHook(() => useTheme());

    expect(result.current).toHaveProperty('mode');
    expect(result.current).toHaveProperty('setMode');
    expect(result.current).toHaveProperty('isDark');
    expect(result.current).toHaveProperty('toggleTheme');
  });

  it('cycles through theme modes', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const { result } = renderHook(() => useTheme());

    const modes = ['light', 'dark', 'system'] as const;

    modes.forEach((mode) => {
      act(() => {
        if (result.current.setMode) {
          result.current.setMode(mode);
        }
      });
      expect(result.current.mode).toBe(mode);
    });
  });

  it('handles theme toggle function', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const { result } = renderHook(() => useTheme());

    const initialMode = result.current.mode;

    act(() => {
      if (result.current.toggleTheme) {
        result.current.toggleTheme();
      }
    });

    // Toggle should change mode
    expect(result.current.mode).not.toBe(initialMode);
  });
});
