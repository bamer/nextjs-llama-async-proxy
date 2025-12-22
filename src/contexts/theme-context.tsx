"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useMediaQuery } from "@mui/material";
import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles";
import { deepmerge } from "@mui/utils";
import { APP_CONFIG } from "@/config/app.config";

// Define theme types
type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Base theme configurations
const baseTheme = {
  typography: {
    fontFamily: ["Inter", "sans-serif"].join(","),
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.6,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          padding: "8px 24px",
          textTransform: "none",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
        },
      },
    },
  },
};

// Light theme
const lightTheme = createTheme(
  deepmerge(baseTheme, {
    palette: {
      mode: "light",
      primary: {
        main: "#3B82F6",
        contrastText: "#FFFFFF",
      },
      secondary: {
        main: "#8B5CF6",
        contrastText: "#FFFFFF",
      },
      background: {
        default: "#F8FAFC",
        paper: "#FFFFFF",
      },
      text: {
        primary: "#1E293B",
        secondary: "#64748B",
      },
      error: {
        main: "#EF4444",
      },
      warning: {
        main: "#F59E0B",
      },
      success: {
        main: "#10B981",
      },
      info: {
        main: "#3B82F6",
      },
    },
  })
);

// Dark theme
const darkTheme = createTheme(
  deepmerge(baseTheme, {
    palette: {
      mode: "dark",
      primary: {
        main: "#60A5FA",
        contrastText: "#FFFFFF",
      },
      secondary: {
        main: "#A78BFA",
        contrastText: "#FFFFFF",
      },
      background: {
        default: "#0F172A",
        paper: "#1E293B",
      },
      text: {
        primary: "#F1F5F9",
        secondary: "#CBD5E1",
      },
      error: {
        main: "#F87171",
      },
      warning: {
        main: "#FBBF24",
      },
      success: {
        main: "#34D399",
      },
      info: {
        main: "#60A5FA",
      },
    },
  })
);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(APP_CONFIG.theme.default as ThemeMode);
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem("theme") as ThemeMode | null;
    if (savedTheme) {
      setModeState(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem("theme", mode);
  }, [mode]);

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

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggleTheme, isDark }}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
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