'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'system' | 'light' | 'dark';
type ThemeContextProps = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: Theme;
  setActualTheme: (theme: Theme) => void;
};

export const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [actualTheme, setActualTheme] = useState<Theme>('system');
  const [theme, setTheme] = useState<Theme>(actualTheme);

  // Sync with localStorage and system preference
  useEffect(() => {
    const lsTheme = localStorage.getItem('theme') as Theme | null;
    if (lsTheme) {
      setTheme(lsTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  const setThemeHandler = (theme: Theme) => {
    setTheme(theme);
    if (theme !== 'system') {
      localStorage.setItem('theme', theme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeHandler, actualTheme, setActualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook for consuming the context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}