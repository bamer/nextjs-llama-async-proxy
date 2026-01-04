/**
 * Shared test utilities for Sidebar coverage tests
 */

import React from "react";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { render } from "@testing-library/react";
import * as sidebarContext from "@/components/layout/SidebarProvider";
import * as themeContext from "@/contexts/ThemeContext";
import * as nextNavigation from "next/navigation";

const theme = createTheme();

export function renderWithTheme(
  component: React.ReactElement,
  isOpen = true,
  isDark = false,
  pathname = "/dashboard"
) {
  (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
    isOpen,
    toggleSidebar: jest.fn(),
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

  (nextNavigation.usePathname as jest.Mock).mockReturnValue(pathname);

  return render(<MuiThemeProvider theme={theme}>{component}</MuiThemeProvider>);
}

export function verifyMenuItemsExist() {
  return {
    dashboard: screen.getByTestId("menu-item-dashboard"),
    monitoring: screen.getByTestId("menu-item-monitoring"),
    models: screen.getByTestId("menu-item-models"),
    logs: screen.getByTestId("menu-item-logs"),
    settings: screen.getByTestId("menu-item-settings"),
  };
}

export function getCloseSidebarFunction() {
  return (sidebarContext.useSidebar as jest.Mock).mock.results[0].value
    .closeSidebar;
}
