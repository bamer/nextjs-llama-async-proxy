"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useEffectEvent as ReactUseEffectEvent } from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { useMediaQuery } from "@mui/material";
import { CssBaseline } from "@mui/material";
import { lightTheme, darkTheme } from "@/styles/theme";
import { useTheme as useNextTheme } from "next-themes";
import { setItem, getItem, setItemCritical } from "@/utils/local-storage-batch";
import { requestIdleCallbackPromise } from "@/utils/request-idle-callback";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
  currentTheme: any;
  requestIdle: <T>(callback: () => T | Promise<T>) => Promise<T>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { setTheme: setNextTheme } = useNextTheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Stable function to update next theme - prevents re-renders
  const updateNextTheme = ReactUseEffectEvent((themeMode: ThemeMode) => {
    requestIdleCallbackPromise(() => {
      setNextTheme(themeMode);
    });
  });

  // Stable function to save theme to localStorage - prevents re-renders
  const saveTheme = ReactUseEffectEvent((themeMode: ThemeMode) => {
    // Use batch storage with critical priority for theme preference
    setItemCritical("theme", themeMode);
    // Update next-themes using requestIdleCallbackPromise
    requestIdleCallbackPromise(() => {
      setNextTheme(themeMode);
    });
  });

  // Request idle callback wrapper - provided to consumers for non-blocking operations
  const requestIdle = <T,>(callback: () => T | Promise<T>): Promise<T> => {
    return requestIdleCallbackPromise(callback);
  };

  useEffect(() => {
    // Load saved theme from localStorage on mount
    const savedTheme = getItem("theme") as ThemeMode | null;
    if (savedTheme) {
      setModeState(savedTheme);
      updateNextTheme(savedTheme);
    }
  }, []); // No dependencies - runs once on mount

  useEffect(() => {
    // Save theme to localStorage and update next-themes
    if (mode) {
      saveTheme(mode);
    }
  }, [mode]); // saveTheme is stable (wrapped in useEffectEvent) - not in deps

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  const toggleTheme = () => {
    setModeState((prev) => {
      if (prev === "system") {
        return prefersDarkMode ? "light" : "dark";
      }
      return prev === "light" ? "dark" : "light";
    });
  };

  const isDark = mode === "dark" || (mode === "system" && prefersDarkMode);
  const currentTheme = isDark ? darkTheme : lightTheme;

  if (!mounted) {
    return null; // Avoid SSR mismatch
  }

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggleTheme, isDark, currentTheme, requestIdle }}>
      <MuiThemeProvider theme={currentTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export { lightTheme, darkTheme } from "@/styles/theme";
