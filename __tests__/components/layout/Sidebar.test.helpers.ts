import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import "@testing-library/jest-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import * as sidebarContext from "@/components/layout/SidebarProvider";
import * as themeContext from "@/contexts/ThemeContext";
import * as nextNavigation from "next/navigation";

jest.mock("@/components/layout/SidebarProvider", () => ({
  useSidebar: jest.fn(),
}));

jest.mock("@/contexts/ThemeContext", () => ({
  useTheme: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

export const theme = createTheme();

export function renderWithTheme(
  component: React.ReactElement,
  options?: RenderOptions,
) {
  return render(
    React.createElement(
      ThemeProvider,
      { theme },
      component,
    ),
    options,
  );
}

export const mockCloseSidebar = jest.fn();
export const mockIsDark = false;
export const mockPathname = "/dashboard";

export function setupDefaultMocks() {
  (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
    isOpen: false,
    toggleSidebar: jest.fn(),
    openSidebar: jest.fn(),
    closeSidebar: mockCloseSidebar,
  });

  (themeContext.useTheme as jest.Mock).mockReturnValue({
    isDark: mockIsDark,
    mode: "light" as const,
    setMode: jest.fn(),
    toggleTheme: jest.fn(),
    currentTheme: theme,
  });

  (nextNavigation.usePathname as jest.Mock).mockReturnValue(mockPathname);
}

export function setupOpenSidebarMocks() {
  (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
    isOpen: true,
    toggleSidebar: jest.fn(),
    openSidebar: jest.fn(),
    closeSidebar: mockCloseSidebar,
  });
}
