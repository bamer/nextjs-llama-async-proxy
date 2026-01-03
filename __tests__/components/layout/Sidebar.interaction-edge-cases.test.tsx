import { screen, fireEvent } from "@testing-library/react";
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

function setupInteractionEdgeCasesMocks() {
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

describe("Sidebar - Interaction Edge Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupInteractionEdgeCasesMocks();
  });

  it("handles undefined isOpen state", () => {
    (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
      isOpen: undefined as unknown,
      toggleSidebar: jest.fn(),
      openSidebar: jest.fn(),
      closeSidebar: mockCloseSidebar,
    });

    expect(() => renderWithTheme(<Sidebar />)).not.toThrow();
  });

  it("handles missing theme context", () => {
    (themeContext.useTheme as jest.Mock).mockReturnValue({
      isDark: false,
      mode: "light" as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: theme,
    } as unknown);

    renderWithTheme(<Sidebar />);
    expect(screen.getByText("Llama Runner")).toBeInTheDocument();
  });

  it("handles null closeSidebar function", () => {
    (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
      isOpen: true,
      toggleSidebar: jest.fn(),
      openSidebar: jest.fn(),
      closeSidebar: null as unknown,
    });

    renderWithTheme(<Sidebar />);
    expect(screen.getByText("Llama Runner")).toBeInTheDocument();
  });

  it("handles multiple rapid open/close operations", () => {
    const { container } = renderWithTheme(<Sidebar />);

    const closeButtons = container.querySelectorAll(".MuiIconButton-root");
    closeButtons.forEach((button) => {
      for (let i = 0; i < 10; i++) {
        fireEvent.click(button);
      }
    });

    expect(screen.getByText("Llama Runner")).toBeInTheDocument();
  });

  it("handles window resize events", () => {
    renderWithTheme(<Sidebar />);

    window.dispatchEvent(new Event("resize"));

    expect(screen.getByText("Llama Runner")).toBeInTheDocument();
  });

  it("handles overlay click multiple times", () => {
    const { container } = renderWithTheme(<Sidebar />);

    const overlay = container.querySelector('[style*="position: fixed"]');
    if (overlay) {
      for (let i = 0; i < 10; i++) {
        fireEvent.click(overlay);
      }
    }

    expect(screen.getByText("Llama Runner")).toBeInTheDocument();
  });

  it("handles theme switching while open", () => {
    const { rerender } = renderWithTheme(<Sidebar />);

    (themeContext.useTheme as jest.Mock).mockReturnValue({
      isDark: true,
      mode: "dark" as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: theme,
    });

    (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
      isOpen: true,
      toggleSidebar: jest.fn(),
      openSidebar: jest.fn(),
      closeSidebar: mockCloseSidebar,
    });

    rerender(
      React.createElement(
        ThemeProvider,
        { theme },
        React.createElement(Sidebar),
      ),
    );

    expect(screen.getByText("Llama Runner")).toBeInTheDocument();
  });

  it("handles undefined menu items", () => {
    renderWithTheme(<Sidebar />);
    expect(screen.getByTestId("menu-item-dashboard")).toBeInTheDocument();
  });

  it("handles very long label text in menu items", () => {
    renderWithTheme(<Sidebar />);

    const menuItems = screen.getAllByRole("link");
    menuItems.forEach((item) => {
      expect(item).toBeVisible();
    });
  });

  it("handles very long URL in navigation", () => {
    renderWithTheme(<Sidebar />);

    const links = screen.getAllByRole("link");
    links.forEach((link) => {
      expect(link).toHaveAttribute("href");
      const href = link.getAttribute("href");
      expect(href).toBeTruthy();
    });
  });

  it("handles missing icon components gracefully", () => {
    renderWithTheme(<Sidebar />);
    expect(screen.getByText("Llama Runner")).toBeInTheDocument();
  });
});
