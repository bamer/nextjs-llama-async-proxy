import { render } from "@testing-library/react";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import React from "react";

/**
 * Renders a component wrapped with MUI theme provider
 *
 * @param component - The React component to render
 * @param options - Optional configuration
 * @param options.isOpen - Sidebar open state (default: true)
 * @param options.isDark - Dark mode theme (default: false)
 * @param options.pathname - Current pathname for navigation mock (default: '/dashboard')
 *
 * @returns Rendered component with testing utilities
 *
 * @example
 * ```tsx
 * renderWithTheme(<MyComponent />);
 * renderWithTheme(<MyComponent />, { isOpen: false, isDark: true });
 * ```
 */
export function renderWithTheme(
  component: React.ReactElement,
  options: {
    isOpen?: boolean;
    isDark?: boolean;
    pathname?: string;
  } = {}
) {
  const { isOpen = true, isDark = false, pathname = "/dashboard" } = options;

  // Mock useSidebar context
  const mockUseSidebar = jest.fn(() => ({
    isOpen,
    toggleSidebar: jest.fn(),
    openSidebar: jest.fn(),
    closeSidebar: jest.fn(),
  }));

  // Mock useTheme context
  const mockUseTheme = jest.fn(() => ({
    isDark,
    mode: isDark ? ("dark" as const) : ("light" as const),
    setMode: jest.fn(),
    toggleTheme: jest.fn(),
    currentTheme: createTheme(),
  }));

  // Mock usePathname
  const mockUsePathname = jest.fn(() => pathname);

  jest.mock("@/components/layout/SidebarProvider", () => ({
    useSidebar: mockUseSidebar,
  }));

  jest.mock("@/contexts/ThemeContext", () => ({
    useTheme: mockUseTheme,
  }));

  jest.mock("next/navigation", () => ({
    usePathname: mockUsePathname,
  }));

  const theme = createTheme();

  return render(
    React.createElement(MuiThemeProvider, { theme }, component)
  );
}

/**
 * Default form configuration for testing form components
 *
 * This object provides sensible defaults for form props used in GeneralSettingsTab
 * and other form components.
 */
export const defaultFormConfig = {
  basePath: "/models",
  logLevel: "info",
  maxConcurrentModels: 5,
  autoUpdate: true,
  notificationsEnabled: false,
  llamaServerPath: "/path/to/llama-server",
};

/**
 * Type definitions for test utilities
 */
export type MockedUseTheme = {
  isDark: boolean;
  mode: "light" | "dark";
  setMode: jest.Mock;
  toggleTheme: jest.Mock;
  currentTheme: ReturnType<typeof createTheme>;
};

export type MockedUseSidebar = {
  isOpen: boolean;
  toggleSidebar: jest.Mock;
  openSidebar: jest.Mock;
  closeSidebar: jest.Mock;
};

export type RenderWithThemeOptions = {
  isOpen?: boolean;
  isDark?: boolean;
  pathname?: string;
};
