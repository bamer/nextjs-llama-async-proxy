import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import HomePage from "@/app/page";

// Mock MainLayout
jest.mock("@/components/layout/main-layout", () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "main-layout" }, children),
}));

// Mock next/link
jest.mock("next/link", () => {
  const MockLink = ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => React.createElement("a", { href, "data-href": href }, children);
  return MockLink;
});

// Mock MUI components with proper prop filtering
jest.mock("@mui/material", () => ({
  Typography: ({
    children,
    variant,
    ...props
  }: {
    children: React.ReactNode;
    variant?: string;
    [key: string]: unknown;
  }) => {
    const { gutterBottom, paragraph, ...filteredProps } = props;
    return React.createElement(
      variant === "h1" || variant === "h2" || variant === "h4" ? "h1" : "p",
      filteredProps,
      children
    );
  },
  Box: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => {
    const { sx, ...filteredProps } = props;
    return React.createElement("div", filteredProps, children);
  },
  Button: ({
    children,
    href,
    component,
    ...props
  }: {
    children: React.ReactNode;
    href?: string;
    component?: unknown;
    [key: string]: unknown;
  }) => {
    const { sx, variant, color, ...filteredProps } = props;
    if (typeof component === "function" && href) {
      return React.createElement(
        "a",
        { ...filteredProps, href, "data-href": href, role: "button" },
        children
      );
    }
    return React.createElement("button", filteredProps, children);
  },
  Card: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => {
    const { sx, ...filteredProps } = props;
    return React.createElement("div", filteredProps, children);
  },
  CardContent: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { children }),
  Grid: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => {
    const { size, spacing, justifyContent, ...filteredProps } = props;
    return React.createElement("div", filteredProps, children);
  },
}));

// Mock MUI icons
jest.mock("@mui/icons-material", () => ({
  Rocket: (props: unknown) =>
    React.createElement("svg", { ...props, "data-icon": "Rocket", width: 24, height: 24 }),
  Dashboard: (props: unknown) =>
    React.createElement("svg", { ...props, "data-icon": "Dashboard", width: 24, height: 24 }),
  ModelTraining: (props: unknown) =>
    React.createElement("svg", { ...props, "data-icon": "ModelTraining", width: 24, height: 24 }),
  Monitor: (props: unknown) =>
    React.createElement("svg", { ...props, "data-icon": "Monitor", width: 24, height: 24 }),
  Settings: (props: unknown) =>
    React.createElement("svg", { ...props, "data-icon": "Settings", width: 24, height: 24 }),
  BarChart: (props: unknown) =>
    React.createElement("svg", { ...props, "data-icon": "BarChart", width: 24, height: 24 }),
  Code: (props: unknown) =>
    React.createElement("svg", { ...props, "data-icon": "Code", width: 24, height: 24 }),
  Cloud: (props: unknown) =>
    React.createElement("svg", { ...props, "data-icon": "Cloud", width: 24, height: 24 }),
  Terminal: (props: unknown) =>
    React.createElement("svg", { ...props, "data-icon": "Terminal", width: 24, height: 24 }),
}));

// Mock ThemeContext
const mockUseTheme = jest.fn();
jest.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => mockUseTheme(),
}));

export const renderHomePage = (themeMode: "light" | "dark" = "light") => {
  mockUseTheme.mockReturnValue({
    isDark: themeMode === "dark",
    mode: themeMode as const,
    setMode: jest.fn(),
    toggleTheme: jest.fn(),
  });
  return render(<HomePage />);
};

export const mockThemeLight = {
  isDark: false,
  mode: "light" as const,
  setMode: jest.fn(),
  toggleTheme: jest.fn(),
};

export const mockThemeDark = {
  isDark: true,
  mode: "dark" as const,
  setMode: jest.fn(),
  toggleTheme: jest.fn(),
};

export const expectedFeatures = [
  "Real-time Dashboard",
  "Model Management",
  "Advanced Monitoring",
  "Custom Configuration",
];

export const expectedTechStack = ["Next.js", "Material UI", "WebSocket", "TypeScript"];

export const featureIcons = ["Dashboard", "ModelTraining", "Monitor", "Settings"];
export const techStackIcons = ["BarChart", "Code", "Cloud", "Terminal"];
export const navigationPaths = [
  "/dashboard",
  "/models",
  "/monitoring",
  "/settings",
  "/docs",
];
