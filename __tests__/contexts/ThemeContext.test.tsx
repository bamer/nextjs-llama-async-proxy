import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";

// Mock next-themes - must come before any imports that use it
jest.mock("next-themes", () => ({
  useTheme: jest.fn(() => ({
    setTheme: jest.fn(),
    resolvedTheme: "light",
  })),
}));

// Mock MUI components
jest.mock("@mui/material/styles", () => {
  return {
    ThemeProvider: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="mui-theme-provider">{children}</div>
    ),
    createTheme: jest.fn(() => ({ palette: { mode: "light" } })),
    useTheme: jest.fn(() => ({ palette: { mode: "light" } })),
  };
});

jest.mock("@mui/material", () => ({
  CssBaseline: () => <div data-testid="css-baseline" />,
  useMediaQuery: jest.fn(() => false),
}));

jest.mock("@/styles/theme", () => ({
  lightTheme: { palette: { mode: "light" } },
  darkTheme: { palette: { mode: "dark" } },
}));

const mockUseTheme = (require("next-themes") as any).useTheme;
const mockUseMediaQuery = (require("@mui/material") as any).useMediaQuery;

describe("ThemeContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const setThemeMock = jest.fn();
    mockUseTheme.mockReturnValue({
      setTheme: setThemeMock,
      resolvedTheme: "light",
    });
    mockUseMediaQuery.mockReturnValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const TestComponent = () => {
    const { mode, isDark, toggleTheme, setMode } = useTheme();
    return (
      <div>
        <span data-testid="mode">{mode}</span>
        <span data-testid="isDark">{String(isDark)}</span>
        <button data-testid="toggle" onClick={toggleTheme}>
          Toggle
        </button>
        <button data-testid="set-light" onClick={() => setMode("light")}>
          Set Light
        </button>
        <button data-testid="set-dark" onClick={() => setMode("dark")}>
          Set Dark
        </button>
        <button data-testid="set-system" onClick={() => setMode("system")}>
          Set System
        </button>
      </div>
    );
  };

  describe("Basic Rendering", () => {
    it("renders children", () => {
      render(
        <ThemeProvider>
          <div>Test Child</div>
        </ThemeProvider>
      );

      expect(screen.getByText("Test Child")).toBeInTheDocument();
    });

    it("renders CssBaseline", () => {
      render(
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      );

      expect(screen.getByTestId("css-baseline")).toBeInTheDocument();
    });

    it("renders MUI ThemeProvider", () => {
      const { container } = render(
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      );

      expect(screen.getByTestId("mui-theme-provider")).toBeInTheDocument();
    });
  });

  describe("useTheme hook", () => {
    it("provides context values", () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId("mode")).toBeInTheDocument();
      expect(screen.getByTestId("isDark")).toBeInTheDocument();
    });

    it("provides mode value", () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId("mode")).toHaveTextContent("system");
    });

    it("provides isDark value", () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId("isDark")).toHaveTextContent("false");
    });

    it("provides setMode function", () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const setLightButton = screen.getByTestId("set-light");
      expect(setLightButton).toBeInTheDocument();
    });

    it("provides toggleTheme function", () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const toggleButton = screen.getByTestId("toggle");
      expect(toggleButton).toBeInTheDocument();
    });

    it("throws error when used outside provider", () => {
      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const TestNoProvider = () => {
        try {
          useTheme();
          return <div>No Error</div>;
        } catch (error) {
          return <div>Error Caught</div>;
        }
      };

      render(<TestNoProvider />);

      expect(screen.getByText("Error Caught")).toBeInTheDocument();
      consoleError.mockRestore();
    });
  });

  describe("Theme Mode Management", () => {
    it("initializes with system mode", () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId("mode")).toHaveTextContent("system");
    });

    it("allows setting light mode", () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      act(() => {
        screen.getByTestId("set-light").click();
      });

      expect(screen.getByTestId("mode")).toHaveTextContent("light");
    });

    it("allows setting dark mode", () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      act(() => {
        screen.getByTestId("set-dark").click();
      });

      expect(screen.getByTestId("mode")).toHaveTextContent("dark");
    });

    it("allows setting system mode", () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // First set to light
      act(() => {
        screen.getByTestId("set-light").click();
      });

      expect(screen.getByTestId("mode")).toHaveTextContent("light");

      // Then set back to system
      act(() => {
        screen.getByTestId("set-system").click();
      });

      expect(screen.getByTestId("mode")).toHaveTextContent("system");
    });

    it("updates next-themes when mode changes", () => {
      const mockSetTheme = jest.fn();
      mockUseTheme.mockReturnValue({
        setTheme: mockSetTheme,
        resolvedTheme: "light",
      });

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      act(() => {
        screen.getByTestId("set-dark").click();
      });

      expect(mockSetTheme).toHaveBeenCalledWith("dark");
    });
  });

  describe("Dark Mode Detection", () => {
    it("isDark is false when mode is light", () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      act(() => {
        screen.getByTestId("set-light").click();
      });

      expect(screen.getByTestId("isDark")).toHaveTextContent("false");
    });

    it("isDark is true when mode is dark", () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      act(() => {
        screen.getByTestId("set-dark").click();
      });

      expect(screen.getByTestId("isDark")).toHaveTextContent("true");
    });

    it("isDark follows system preference when mode is system", () => {
      // Prefers dark
      mockUseMediaQuery.mockReturnValue(true);

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      act(() => {
        screen.getByTestId("set-system").click();
      });

      expect(screen.getByTestId("isDark")).toHaveTextContent("true");
    });

    it("isDark false when system prefers light", () => {
      // Prefers light
      mockUseMediaQuery.mockReturnValue(false);

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      act(() => {
        screen.getByTestId("set-system").click();
      });

      expect(screen.getByTestId("isDark")).toHaveTextContent("false");
    });
  });

  describe("Toggle Theme", () => {
    it("toggles from system to opposite", () => {
      mockUseMediaQuery.mockReturnValue(false); // Prefers light

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      act(() => {
        screen.getByTestId("toggle").click();
      });

      // Should toggle to dark when system prefers light
      expect(screen.getByTestId("mode")).toHaveTextContent("dark");
    });

    it("toggles between light and dark", () => {
      mockUseMediaQuery.mockReturnValue(false);

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Set to light first
      act(() => {
        screen.getByTestId("set-light").click();
      });
      expect(screen.getByTestId("mode")).toHaveTextContent("light");

      // Toggle to dark
      act(() => {
        screen.getByTestId("toggle").click();
      });
      expect(screen.getByTestId("mode")).toHaveTextContent("dark");

      // Toggle back to light
      act(() => {
        screen.getByTestId("toggle").click();
      });
      expect(screen.getByTestId("mode")).toHaveTextContent("light");
    });
  });

  describe("Edge Cases", () => {
    it("handles null children", () => {
      const { container } = render(<ThemeProvider>{null}</ThemeProvider>);

      expect(container).toBeInTheDocument();
    });

    it("handles undefined children", () => {
      const { container } = render(
        <ThemeProvider>{undefined}</ThemeProvider>
      );

      expect(container).toBeInTheDocument();
    });

    it("handles string children", () => {
      render(<ThemeProvider>String Content</ThemeProvider>);

      expect(screen.getByText("String Content")).toBeInTheDocument();
    });

    it("handles number children", () => {
      render(<ThemeProvider>{42}</ThemeProvider>);

      expect(screen.getByText("42")).toBeInTheDocument();
    });

    it("handles multiple children", () => {
      render(
        <ThemeProvider>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </ThemeProvider>
      );

      expect(screen.getByText("Child 1")).toBeInTheDocument();
      expect(screen.getByText("Child 2")).toBeInTheDocument();
      expect(screen.getByText("Child 3")).toBeInTheDocument();
    });

    it("handles nested children", () => {
      render(
        <ThemeProvider>
          <div>
            <span>Nested</span>
          </div>
        </ThemeProvider>
      );

      expect(screen.getByText("Nested")).toBeInTheDocument();
    });
  });

  describe("Multiple Consumers", () => {
    it("shares state across consumers", () => {
      render(
        <ThemeProvider>
          <TestComponent />
          <TestComponent />
        </ThemeProvider>
      );

      const modes = screen.getAllByTestId("mode");
      expect(modes).toHaveLength(2);
    });

    it("updates all consumers on mode change", () => {
      render(
        <ThemeProvider>
          <TestComponent />
          <TestComponent />
        </ThemeProvider>
      );

      act(() => {
        // Get all set-dark buttons and click first one
        const setDarkButtons = screen.getAllByTestId("set-dark");
        setDarkButtons[0].click();
      });

      const modes = screen.getAllByTestId("mode");
      modes.forEach((mode) => {
        expect(mode).toHaveTextContent("dark");
      });
    });
  });

  describe("Rapid Changes", () => {
    it("handles rapid mode changes", () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Rapid changes
      act(() => {
        screen.getByTestId("set-light").click();
      });
      act(() => {
        screen.getByTestId("set-dark").click();
      });
      act(() => {
        screen.getByTestId("set-light").click();
      });
      act(() => {
        screen.getByTestId("set-dark").click();
      });

      expect(screen.getByTestId("mode")).toHaveTextContent("dark");
    });
  });
});
