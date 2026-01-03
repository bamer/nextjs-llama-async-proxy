import { screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { ThemeProvider } from "@mui/material/styles";
import { Sidebar } from "@/components/layout/Sidebar";
import * as sidebarContext from "@/components/layout/SidebarProvider";
import * as themeContext from "@/contexts/ThemeContext";
import * as nextNavigation from "next/navigation";
import {
  renderWithTheme,
  mockCloseSidebar,
  theme,
} from "./Sidebar.test.helpers";

jest.mock("@/components/layout/SidebarProvider", () => ({
  useSidebar: jest.fn(),
}));

jest.mock("@/contexts/ThemeContext", () => ({
  useTheme: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

function setupRouteEdgeCasesMocks() {
  (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
    isOpen: true,
    toggleSidebar: jest.fn(),
    openSidebar: jest.fn(),
    closeSidebar: mockCloseSidebar,
  });

  (themeContext.useTheme as jest.Mock).mockReturnValue({
    isDark: false,
    mode: "light" as const,
    setMode: jest.fn(),
    toggleTheme: jest.fn(),
    currentTheme: theme,
  });

  (nextNavigation.usePathname as jest.Mock).mockReturnValue("/dashboard");
}

describe("Sidebar - Route Edge Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupRouteEdgeCasesMocks();
  });

  it("handles null pathname", () => {
    (nextNavigation.usePathname as jest.Mock).mockReturnValue(null as unknown);

    renderWithTheme(<Sidebar />);
    expect(screen.getByText("Llama Runner")).toBeInTheDocument();
  });

  it("handles undefined pathname", () => {
    (nextNavigation.usePathname as jest.Mock).mockReturnValue(undefined as unknown);

    renderWithTheme(<Sidebar />);
    expect(screen.getByText("Llama Runner")).toBeInTheDocument();
  });

  it("handles route with special characters", () => {
    (nextNavigation.usePathname as jest.Mock).mockReturnValue(
      "/dashboard?param=test&other=value",
    );

    renderWithTheme(<Sidebar />);
    expect(screen.getByTestId("menu-item-dashboard")).toBeInTheDocument();
  });

  it("handles empty route", () => {
    (nextNavigation.usePathname as jest.Mock).mockReturnValue("");

    renderWithTheme(<Sidebar />);
    expect(screen.getByText("Llama Runner")).toBeInTheDocument();
  });

  it("handles root route", () => {
    (nextNavigation.usePathname as jest.Mock).mockReturnValue("/");

    renderWithTheme(<Sidebar />);
    expect(screen.getByText("Llama Runner")).toBeInTheDocument();
  });

  it("handles very long route path", () => {
    const longPath = "/dashboard/" + "a".repeat(1000);
    (nextNavigation.usePathname as jest.Mock).mockReturnValue(longPath);

    renderWithTheme(<Sidebar />);
    expect(screen.getByText("Llama Runner")).toBeInTheDocument();
  });

  it("handles non-existent route", () => {
    (nextNavigation.usePathname as jest.Mock).mockReturnValue(
      "/non-existent-route",
    );

    renderWithTheme(<Sidebar />);
    expect(screen.getByText("Llama Runner")).toBeInTheDocument();
  });

  it("handles concurrent route and sidebar state changes", () => {
    (nextNavigation.usePathname as jest.Mock).mockReturnValue("/dashboard");

    const { rerender } = renderWithTheme(<Sidebar />);

    (nextNavigation.usePathname as jest.Mock).mockReturnValue("/monitoring");

    rerender(
      React.createElement(
        ThemeProvider,
        { theme },
        React.createElement(Sidebar),
      ),
    );

    expect(screen.getByText("Llama Runner")).toBeInTheDocument();
  });
});
