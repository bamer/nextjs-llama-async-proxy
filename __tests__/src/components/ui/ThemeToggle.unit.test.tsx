import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

// Mock the ThemeContext
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

describe("ThemeToggle (Unit Tests)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseTheme.mockReturnValue({
      mode: "light",
      setMode: mockSetMode,
      toggleTheme: mockToggleTheme,
      isDark: false,
    });
  });

  describe("Initial Rendering", () => {
    it("renders with light theme icon initially", () => {
      mockedUseTheme.mockReturnValue({
        mode: "light",
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: false,
      });

      render(<ThemeToggle />);

      const button = screen.getByRole("button", { name: /toggle theme/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeVisible();
    });

    it("renders with dark theme icon when in dark mode", () => {
      mockedUseTheme.mockReturnValue({
        mode: "dark",
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: true,
      });

      render(<ThemeToggle />);

      const button = screen.getByRole("button", { name: /toggle theme/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeVisible();
    });

    it("renders with system theme icon when in system mode", () => {
      mockedUseTheme.mockReturnValue({
        mode: "system",
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: false,
      });

      render(<ThemeToggle />);

      const button = screen.getByRole("button", { name: /toggle theme/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeVisible();
    });
  });
});
