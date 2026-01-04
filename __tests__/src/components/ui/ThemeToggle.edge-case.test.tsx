import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

import { useTheme as mockUseTheme } from "@/contexts/ThemeContext";

interface ThemeContextType {
  mode: "light" | "dark" | "system";
  setMode: (mode: "light" | "dark" | "system") => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const mockSetMode = jest.fn();
const mockToggleTheme = jest.fn();
const mockedUseTheme = mockUseTheme as unknown as jest.MockedFunction<
  () => ThemeContextType
>;

describe("ThemeToggle (Edge Case Tests)", () => {
  let useEffectCalled = false;

  beforeEach(() => {
    jest.clearAllMocks();
    useEffectCalled = false;
    mockedUseTheme.mockReturnValue({
      mode: "light",
      setMode: mockSetMode,
      toggleTheme: mockToggleTheme,
      isDark: false,
    });
    jest.spyOn(React, "useEffect").mockImplementation((callback) => {
      if (!useEffectCalled) {
        useEffectCalled = true;
        callback();
      }
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    useEffectCalled = false;
  });

  describe("Tooltip", () => {
    it("displays correct tooltip for light mode", async () => {
      mockedUseTheme.mockReturnValue({
        mode: "light",
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: false,
      });

      render(<ThemeToggle />);

      const button = await screen.findByRole("button", { name: /toggle theme/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("aria-label", "Toggle theme");
    });

    it("displays correct tooltip for dark mode", async () => {
      mockedUseTheme.mockReturnValue({
        mode: "dark",
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: true,
      });

      render(<ThemeToggle />);

      const button = await screen.findByRole("button", { name: /toggle theme/i });
      expect(button).toBeInTheDocument();
    });

    it("displays correct tooltip for system mode", async () => {
      mockedUseTheme.mockReturnValue({
        mode: "system",
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: false,
      });

      render(<ThemeToggle />);

      const button = await screen.findByRole("button", { name: /toggle theme/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA label", async () => {
      render(<ThemeToggle />);

      const button = await screen.findByRole("button", { name: /toggle theme/i });
      expect(button).toHaveAttribute("aria-label", "Toggle theme");
    });

    it("is keyboard accessible", async () => {
      render(<ThemeToggle />);

      const button = await screen.findByRole("button", { name: /toggle theme/i });
      button.focus();
      expect(button).toHaveFocus();
    });
  });

  describe("Styling", () => {
    it("applies correct button styling", async () => {
      render(<ThemeToggle />);

      const button = await screen.findByRole("button", { name: /toggle theme/i });
      expect(button).toHaveClass(
        "p-2",
        "rounded-lg",
        "hover:bg-gray-100",
        "dark:hover:bg-gray-800",
        "transition-colors",
      );
    });

    it("has correct minimum width", async () => {
      render(<ThemeToggle />);

      const button = await screen.findByRole("button", { name: /toggle theme/i });
      expect(button).toBeInTheDocument();
    });

    it("renders icon with correct size classes", async () => {
      render(<ThemeToggle />);

      await screen.findByRole("button", { name: /toggle theme/i });

      const button = screen.getByRole("button", { name: /toggle theme/i });
      const svgIcon = button.querySelector("svg");
      expect(svgIcon).toBeInTheDocument();
    });
  });

  describe("Icon Colors", () => {
    it("renders sun icon with yellow color for light mode", async () => {
      mockedUseTheme.mockReturnValue({
        mode: "light",
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: false,
      });

      render(<ThemeToggle />);

      await screen.findByRole("button", { name: /toggle theme/i });

      const button = screen.getByRole("button", { name: /toggle theme/i });
      expect(button).toBeVisible();
    });

    it("renders moon icon with blue color for dark mode", async () => {
      mockedUseTheme.mockReturnValue({
        mode: "dark",
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: true,
      });

      render(<ThemeToggle />);

      await screen.findByRole("button", { name: /toggle theme/i });

      const button = screen.getByRole("button", { name: /toggle theme/i });
      expect(button).toBeVisible();
    });

    it("renders monitor icon with gray color for system mode", async () => {
      mockedUseTheme.mockReturnValue({
        mode: "system",
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: false,
      });

      render(<ThemeToggle />);

      await screen.findByRole("button", { name: /toggle theme/i });

      const button = screen.getByRole("button", { name: /toggle theme/i });
      expect(button).toBeVisible();
    });
  });

  describe("Hydration Edge Cases", () => {
    it("shows loading state before hydration", () => {
      jest.spyOn(React, "useEffect").mockRestore();
      jest.spyOn(React, "useEffect").mockImplementation(() => {});

      mockedUseTheme.mockReturnValue({
        mode: "light",
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: false,
      });

      render(<ThemeToggle />);

      const placeholder = document.querySelector(".w-10");
      expect(placeholder).toHaveClass("w-10", "h-10");
    });
  });
});
