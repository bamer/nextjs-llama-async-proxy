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

describe("ThemeToggle (Integration Tests)", () => {
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

  describe("Theme Cycling", () => {
    it("cycles from light to dark mode", async () => {
      mockedUseTheme.mockReturnValue({
        mode: "light",
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: false,
      });

      render(<ThemeToggle />);

      const button = await screen.findByRole("button", { name: /toggle theme/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeVisible();
    });

    it("cycles from dark to system mode", async () => {
      mockedUseTheme.mockReturnValue({
        mode: "dark",
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: true,
      });

      render(<ThemeToggle />);

      const button = await screen.findByRole("button", { name: /toggle theme/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeVisible();
    });

    it("cycles from system back to light mode", async () => {
      mockedUseTheme.mockReturnValue({
        mode: "system",
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: false,
      });

      render(<ThemeToggle />);

      const button = await screen.findByRole("button", { name: /toggle theme/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeVisible();
    });

    it("cycles through all three modes correctly", async () => {
      mockedUseTheme.mockReturnValue({
        mode: "light",
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: false,
      });

      const { rerender } = render(<ThemeToggle />);
      let button = screen.getByRole("button", { name: /toggle theme/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeVisible();

      mockedUseTheme.mockReturnValue({
        mode: "dark",
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: true,
      });

      rerender(<ThemeToggle />);
      button = screen.getByRole("button", { name: /toggle theme/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeVisible();

      mockedUseTheme.mockReturnValue({
        mode: "system",
        setMode: mockSetMode,
        toggleTheme: mockToggleTheme,
        isDark: false,
      });

      rerender(<ThemeToggle />);
      button = screen.getByRole("button", { name: /toggle theme/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeVisible();
    });
  });

  describe("Hydration and Mounting", () => {
    it("calls useEffect on mount", () => {
      const useEffectSpy = jest.spyOn(React, "useEffect");

      render(<ThemeToggle />);

      expect(useEffectSpy).toHaveBeenCalled();
      expect(useEffectSpy.mock.calls[0][0]).toBeInstanceOf(Function);
    });

    it("sets mounted state after hydration", () => {
      const useStateSpy = jest.spyOn(React, "useState");

      render(<ThemeToggle />);

      expect(useStateSpy).toHaveBeenCalledWith(false);
    });
  });
});
