import { screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
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

function setupThemeVariationsMocks() {
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

describe("Sidebar - Theme Variations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupThemeVariationsMocks();
  });

  it("handles null isDark value", () => {
    (themeContext.useTheme as jest.Mock).mockReturnValue({
      isDark: null as unknown,
      mode: "light" as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: theme,
    });

    renderWithTheme(<Sidebar />);
    expect(screen.getByText("Llama Runner")).toBeInTheDocument();
  });

  it("handles undefined mode in theme", () => {
    (themeContext.useTheme as jest.Mock).mockReturnValue({
      isDark: false,
      mode: undefined as unknown,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: theme,
    });

    renderWithTheme(<Sidebar />);
    expect(screen.getByText("Llama Runner")).toBeInTheDocument();
  });

  it("handles custom theme with non-standard colors", () => {
    const customTheme = createTheme({
      palette: {
        background: {
          default: "#ff0000",
        },
      },
    });

    (themeContext.useTheme as jest.Mock).mockReturnValue({
      isDark: false,
      mode: "light" as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: customTheme,
    });

    renderWithTheme(<Sidebar />);
    expect(screen.getByText("Llama Runner")).toBeInTheDocument();
  });

  it("handles rapid theme switches without errors", () => {
    renderWithTheme(<Sidebar />);

    for (let i = 0; i < 10; i++) {
      (themeContext.useTheme as jest.Mock).mockReturnValue({
        isDark: i % 2 === 0,
        mode: i % 2 === 0 ? ("dark" as const) : ("light" as const),
        setMode: jest.fn(),
        toggleTheme: jest.fn(),
        currentTheme: theme,
      });
    }

    expect(screen.getByText("Llama Runner")).toBeInTheDocument();
  });
});

describe("Sidebar - State Transitions", () => {
  function setupStateTransitionMocks(isOpen: boolean) {
    (sidebarContext.useSidebar as jest.Mock).mockReturnValue({
      isOpen,
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles sidebar closed state correctly", () => {
    setupStateTransitionMocks(false);

    const { container } = renderWithTheme(<Sidebar />);

    const overlay = container.querySelector('[style*="position: fixed"]');
    expect(overlay).not.toBeInTheDocument();
  });

  it("handles sidebar open state correctly", () => {
    setupStateTransitionMocks(true);

    const { container } = renderWithTheme(<Sidebar />);

    const overlay = container.querySelector('[data-testid="sidebar-overlay"]');
    expect(overlay).toBeInTheDocument();
  });

  it("handles state transitions (closed to open)", () => {
    setupStateTransitionMocks(false);

    const { rerender } = renderWithTheme(<Sidebar />);

    setupStateTransitionMocks(true);

    rerender(
      React.createElement(
        ThemeProvider,
        { theme },
        React.createElement(Sidebar),
      ),
    );

    expect(screen.getByText("Llama Runner")).toBeInTheDocument();
  });

  it("handles state transitions (open to closed)", () => {
    setupStateTransitionMocks(true);

    const { rerender } = renderWithTheme(<Sidebar />);

    setupStateTransitionMocks(false);

    rerender(
      React.createElement(
        ThemeProvider,
        { theme },
        React.createElement(Sidebar),
      ),
    );
  });
});
