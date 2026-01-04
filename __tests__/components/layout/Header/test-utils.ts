/**
 * Shared test utilities for Header tests
 */

import React from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { render } from "@testing-library/react";
import * as sidebarContext from "@/components/layout/SidebarProvider";
import * as themeContext from "@/contexts/ThemeContext";

const theme = createTheme();

export const mockToggleSidebar = jest.fn();

export function renderWithTheme(component: React.ReactElement, isDark = false) {
  (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
    isOpen: false,
    toggleSidebar: mockToggleSidebar,
    openSidebar: jest.fn(),
    closeSidebar: jest.fn(),
  });

  (themeContext.useTheme as jest.Mock).mockReturnValue({
    isDark,
    mode: isDark ? ("dark" as const) : ("light" as const),
    setMode: jest.fn(),
    toggleTheme: jest.fn(),
    currentTheme: theme,
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
  );
  return render(component, { wrapper });
}

export function mockDarkTheme() {
  (themeContext.useTheme as jest.Mock).mockReturnValue({
    isDark: true,
    mode: "dark" as const,
    setMode: jest.fn(),
    toggleTheme: jest.fn(),
    currentTheme: theme,
  });
}

export function mockLightTheme() {
  (themeContext.useTheme as jest.Mock).mockReturnValue({
    isDark: false,
    mode: "light" as const,
    setMode: jest.fn(),
    toggleTheme: jest.fn(),
    currentTheme: theme,
  });
}
