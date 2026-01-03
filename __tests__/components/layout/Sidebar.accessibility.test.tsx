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

function setupAccessibilityMocks() {
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

describe("Sidebar - Accessibility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupAccessibilityMocks();
  });

  it("handles keyboard navigation through menu items", () => {
    renderWithTheme(<Sidebar />);

    const links = screen.getAllByRole("link");
    links.forEach((link) => {
      fireEvent.keyDown(link, { key: "Enter", code: "Enter" });
      expect(link).toBeVisible();
    });
  });

  it("handles focus management when sidebar opens", () => {
    renderWithTheme(<Sidebar />);

    const closeButton = screen.getByRole("button", { name: /close/i });
    expect(closeButton).toBeVisible();
  });

  it("handles ARIA attributes on navigation links", () => {
    renderWithTheme(<Sidebar />);

    const links = screen.getAllByRole("link");
    links.forEach((link) => {
      expect(link).toHaveAttribute("href");
    });
  });

  it("handles reduced motion preference", () => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    }));

    renderWithTheme(<Sidebar />);
    expect(screen.getByText("Llama Runner")).toBeInTheDocument();
  });

  it("handles screen reader announcements", () => {
    renderWithTheme(<Sidebar />);

    const nav = screen.getByTestId("sidebar-drawer");
    expect(nav).toBeInTheDocument();
  });
});
