"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { useMediaQuery } from "@mui/material";
import { CssBaseline } from "@mui/material";
import { lightTheme, darkTheme } from "@/styles/theme";
import { useTheme as useNextTheme } from "next-themes";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
  currentTheme: any;
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

  // Update next-themes when mode changes
  useEffect(() => {
    setNextTheme(mode);
  }, [mode, setNextTheme]);

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
    <ThemeContext.Provider value={{ mode, setMode, toggleTheme, isDark, currentTheme }}>
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
