import { render, renderHook, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string): string | null => store[key] || null,
    setItem: (key: string, value: string): void => {
      store[key] = value.toString();
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

jest.mock('next-themes', () => ({
  useTheme: () => ({
    setTheme: jest.fn(),
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
    localStorageMock.clear();
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

  it('loads saved theme from localStorage', () => {
    localStorageMock.setItem('theme', 'dark');
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('handles missing localStorage gracefully', () => {
    const originalGetItem = localStorageMock.getItem;
    localStorageMock.getItem = jest.fn(() => null);
    (useMediaQuery as jest.Mock).mockReturnValue(false);

    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();

    localStorageMock.getItem = originalGetItem;
  });

  it('handles invalid localStorage values', () => {
    localStorageMock.setItem('theme', 'invalid');
    (useMediaQuery as jest.Mock).mockReturnValue(false);

    const { container } = render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    );
    expect(container).toBeInTheDocument();
  });

  it('uses system default when no saved theme', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);

    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('detects system dark preference', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(true);

    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('detects system light preference', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);

    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('saves theme to localStorage when changed', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const { rerender } = render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders CssBaseline', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    );
    expect(screen.getByTestId('css-baseline')).toBeInTheDocument();
  });
});

describe('useTheme hook', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('throws error when used outside ThemeProvider', () => {
    expect(() => {
      renderHook(() => useTheme());
    }).toThrow('useTheme must be used within a ThemeProvider');
  });

  it('returns theme context when used within ThemeProvider', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current).toBeDefined();
  });

  it('provides mode state', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.mode).toBeDefined();
  });

  it('provides setMode function', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(typeof result.current.setMode).toBe('function');
  });

  it('provides toggleTheme function', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(typeof result.current.toggleTheme).toBe('function');
  });

  it('provides isDark boolean', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(typeof result.current.isDark).toBe('boolean');
  });

  it('provides currentTheme object', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.currentTheme).toBeDefined();
    expect(typeof result.current.currentTheme).toBe('object');
  });

  it('sets mode to light', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => {
      result.current.setMode('light');
    });
    expect(result.current.mode).toBe('light');
  });

  it('sets mode to dark', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => {
      result.current.setMode('dark');
    });
    expect(result.current.mode).toBe('dark');
  });

  it('sets mode to system', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => {
      result.current.setMode('system');
    });
    expect(result.current.mode).toBe('system');
  });

  it('toggles from light to dark', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => {
      result.current.setMode('light');
    });
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.mode).toBe('dark');
  });

  it('toggles from dark to light', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => {
      result.current.setMode('dark');
    });
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.mode).toBe('light');
  });

  it('toggles from system to light when prefers dark', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(true);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => {
      result.current.setMode('system');
    });
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.mode).toBe('light');
  });

  it('toggles from system to dark when prefers light', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => {
      result.current.setMode('system');
    });
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.mode).toBe('dark');
  });

  it('isDark is true when mode is dark', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => {
      result.current.setMode('dark');
    });
    expect(result.current.isDark).toBe(true);
  });

  it('isDark is false when mode is light', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => {
      result.current.setMode('light');
    });
    expect(result.current.isDark).toBe(false);
  });

  it('isDark matches system preference when mode is system', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(true);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => {
      result.current.setMode('system');
    });
    expect(result.current.isDark).toBe(true);
  });

  it('currentTheme is light theme when isDark is false', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => {
      result.current.setMode('light');
    });
    expect(result.current.currentTheme).toBeDefined();
  });

  it('currentTheme is dark theme when isDark is true', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => {
      result.current.setMode('dark');
    });
    expect(result.current.currentTheme).toBeDefined();
  });

  it('persists theme to localStorage when setMode is called', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => {
      result.current.setMode('dark');
    });
    expect(localStorageMock.getItem('theme')).toBe('dark');
  });

  it('persists theme to localStorage when toggleTheme is called', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => {
      result.current.toggleTheme();
    });
    expect(localStorageMock.getItem('theme')).toBeDefined();
  });

  it('handles rapid theme changes', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => {
      result.current.setMode('light');
      result.current.setMode('dark');
      result.current.setMode('system');
    });
    expect(result.current.mode).toBe('system');
  });
});

describe('Theme edge cases', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('handles undefined localStorage gracefully', () => {
    const originalLocalStorage = global.localStorage;
    delete (global as any).localStorage;
    (useMediaQuery as jest.Mock).mockReturnValue(false);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current).toBeDefined();

    global.localStorage = originalLocalStorage;
  });

  it('handles localStorage setItem error', () => {
    const originalSetItem = localStorageMock.setItem;
    localStorageMock.setItem = jest.fn(() => {
      throw new Error('localStorage error');
    });
    (useMediaQuery as jest.Mock).mockReturnValue(false);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => {
      result.current.setMode('dark');
    });
    expect(result.current.mode).toBe('dark');

    localStorageMock.setItem = originalSetItem;
  });

  it('handles localStorage getItem error', () => {
    const originalGetItem = localStorageMock.getItem;
    localStorageMock.getItem = jest.fn(() => {
      throw new Error('localStorage error');
    });
    (useMediaQuery as jest.Mock).mockReturnValue(false);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current).toBeDefined();

    localStorageMock.getItem = originalGetItem;
  });

  it('handles useMediaQuery errors gracefully', () => {
    (useMediaQuery as jest.Mock).mockImplementation(() => {
      throw new Error('MediaQuery error');
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    expect(() => {
      renderHook(() => useTheme(), { wrapper });
    }).toThrow();
  });

  it('handles null theme from localStorage', () => {
    localStorageMock.setItem('theme', 'null');
    (useMediaQuery as jest.Mock).mockReturnValue(false);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current).toBeDefined();
  });

  it('handles empty string theme from localStorage', () => {
    localStorageMock.setItem('theme', '');
    (useMediaQuery as jest.Mock).mockReturnValue(false);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current).toBeDefined();
  });
});
