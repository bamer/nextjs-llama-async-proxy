import { screen } from "@testing-library/react";
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

function setupViewportMocks() {
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

describe("Sidebar - Viewport", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupViewportMocks();
  });

  it("renders correctly at mobile viewport (320px)", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 320,
    });

    window.dispatchEvent(new Event("resize"));
    renderWithTheme(<Sidebar />);

    expect(screen.getByText("Llama Runner")).toBeInTheDocument();
  });

  it("renders correctly at tablet viewport (768px)", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 768,
    });

    window.dispatchEvent(new Event("resize"));
    renderWithTheme(<Sidebar />);

    expect(screen.getByText("Llama Runner")).toBeInTheDocument();
  });

  it("renders correctly at desktop viewport (1920px)", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1920,
    });

    window.dispatchEvent(new Event("resize"));
    renderWithTheme(<Sidebar />);

    expect(screen.getByText("Llama Runner")).toBeInTheDocument();
  });

  it("handles viewport changes without errors", () => {
    renderWithTheme(<Sidebar />);

    const widths = [320, 768, 1024, 1920, 2560];
    widths.forEach((width) => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: width,
      });
      window.dispatchEvent(new Event("resize"));
    });

    expect(screen.getByText("Llama Runner")).toBeInTheDocument();
  });
});
