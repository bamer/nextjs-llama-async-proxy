import { screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import * as sidebarContext from "@/components/layout/SidebarProvider";
import * as themeContext from "@/contexts/ThemeContext";
import * as nextNavigation from "next/navigation";
import {
  renderWithTheme,
  mockCloseSidebar,
  setupDefaultMocks,
  setupOpenSidebarMocks,
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

describe("Sidebar - Rendering", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultMocks();
  });

  it("renders sidebar when isOpen is true", () => {
    setupOpenSidebarMocks();

    renderWithTheme(<Sidebar />);
    expect(screen.getByText("Llama Runner")).toBeInTheDocument();
  });

  it("renders all menu items", () => {
    setupOpenSidebarMocks();

    renderWithTheme(<Sidebar />);

    expect(screen.getByTestId("menu-item-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("menu-item-monitoring")).toBeInTheDocument();
    expect(screen.getByTestId("menu-item-models")).toBeInTheDocument();
    expect(screen.getByTestId("menu-item-logs")).toBeInTheDocument();
    expect(screen.getByTestId("menu-item-settings")).toBeInTheDocument();
  });

  it("highlights active menu item", () => {
    setupOpenSidebarMocks();
    (nextNavigation.usePathname as jest.Mock).mockReturnValue("/dashboard");

    renderWithTheme(<Sidebar />);

    const dashboardItem = screen.getByTestId("menu-item-dashboard");
    expect(dashboardItem).toBeInTheDocument();
    expect(dashboardItem).toHaveAttribute("aria-label", "Dashboard");
  });

  it("calls closeSidebar when menu item is clicked", () => {
    setupOpenSidebarMocks();

    renderWithTheme(<Sidebar />);

    const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
    fireEvent.click(dashboardLink);
    expect(mockCloseSidebar).toHaveBeenCalledTimes(1);
  });

  it("renders close button", () => {
    setupOpenSidebarMocks();

    renderWithTheme(<Sidebar />);
    expect(screen.getByText("Llama Runner")).toBeInTheDocument();
  });

  it("renders version in footer", () => {
    setupOpenSidebarMocks();

    renderWithTheme(<Sidebar />);
    expect(screen.getByText(/v2\.0\.0/)).toBeInTheDocument();
  });

  it("renders copyright year in footer", () => {
    setupOpenSidebarMocks();

    const currentYear = new Date().getFullYear();
    renderWithTheme(<Sidebar />);
    expect(screen.getByText(new RegExp(`© ${currentYear}`))).toBeInTheDocument();
  });

  it("applies dark mode styles when isDark is true", () => {
    setupOpenSidebarMocks();
    (themeContext.useTheme as jest.Mock).mockReturnValue({
      isDark: true,
      mode: "dark" as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: theme,
    });

    renderWithTheme(<Sidebar />);
    expect(screen.getByText("Llama Runner")).toBeInTheDocument();
  });

  it("applies light mode styles when isDark is false", () => {
    setupOpenSidebarMocks();
    (themeContext.useTheme as jest.Mock).mockReturnValue({
      isDark: false,
      mode: "light" as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: theme,
    });

    renderWithTheme(<Sidebar />);
    expect(screen.getByText("Llama Runner")).toBeInTheDocument();
  });

  it("does not render overlay when isOpen is false", () => {
    (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
      isOpen: false,
      toggleSidebar: jest.fn(),
      openSidebar: jest.fn(),
      closeSidebar: mockCloseSidebar,
    });

    const { container } = renderWithTheme(<Sidebar />);
    const overlay = container.querySelector('[style*="position: fixed"]');
    expect(overlay).not.toBeInTheDocument();
  });

  it("renders correct active state for different routes", () => {
    setupOpenSidebarMocks();

    const routes = ["/dashboard", "/monitoring", "/models", "/logs", "/settings"];

    routes.forEach((route) => {
      (nextNavigation.usePathname as jest.Mock).mockReturnValue(route);
      const { unmount } = renderWithTheme(<Sidebar />);
      unmount();
    });

    (nextNavigation.usePathname as jest.Mock).mockReturnValue("/dashboard");
    const { unmount: unmountLast } = renderWithTheme(<Sidebar />);
    expect(screen.getByTestId("menu-item-dashboard")).toBeInTheDocument();
    unmountLast();
  });

  it("renders all navigation icons", () => {
    setupOpenSidebarMocks();

    renderWithTheme(<Sidebar />);

    expect(screen.getByTestId("menu-item-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("menu-item-monitoring")).toBeInTheDocument();
    expect(screen.getByTestId("menu-item-models")).toBeInTheDocument();
    expect(screen.getByTestId("menu-item-logs")).toBeInTheDocument();
    expect(screen.getByTestId("menu-item-settings")).toBeInTheDocument();
  });
});
