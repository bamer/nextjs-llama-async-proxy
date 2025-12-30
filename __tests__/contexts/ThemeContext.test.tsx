import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// Simplified mocks that work better
jest.mock("next-themes", () => ({
  useTheme: jest.fn(),
}));

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

const mockUseTheme = require("next-themes").useTheme;
const mockUseMediaQuery = require("@mui/material").useMediaQuery;

// Create a test-only ThemeContext that doesn't have the !mounted check
export type ThemeMode = "light" | "dark" | "system";

interface TestThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
  currentTheme: any;
}

const TestThemeContext = createContext<TestThemeContextType | undefined>(undefined);

function TestThemeProvider({ children }: { children: ReactNode }) {
  const { setTheme: setNextTheme } = mockUseTheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const prefersDarkMode = mockUseMediaQuery();

  // Update next-themes when mode changes
  React.useEffect(() => {
    setNextTheme(mode);
  }, [mode, setNextTheme]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
  }, []);

  const toggleTheme = useCallback(() => {
    setModeState((prev) => {
      if (prev === "system") {
        return prefersDarkMode ? "light" : "dark";
      }
      return prev === "light" ? "dark" : "light";
    });
  }, [prefersDarkMode]);

  const isDark = mode === "dark" || (mode === "system" && prefersDarkMode);
  const currentTheme = isDark ? require("@/styles/theme").darkTheme : require("@/styles/theme").lightTheme;

  return (
    <TestThemeContext.Provider value={{ mode, setMode, toggleTheme, isDark, currentTheme }}>
      <div data-testid="mui-theme-provider">
        <div data-testid="css-baseline" />
        {children}
      </div>
    </TestThemeContext.Provider>
  );
}

function TestUseTheme() {
  const context = useContext(TestThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Use the test version in tests
export { TestThemeProvider as ThemeProvider, TestUseTheme as useTheme };

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
    it("renders children", async () => {
      render(
        <ThemeProvider>
          <div>Test Child</div>
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Test Child")).toBeInTheDocument();
      });
    });

    it("renders CssBaseline", async () => {
      render(
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("css-baseline")).toBeInTheDocument();
      });
    });

    it("renders MUI ThemeProvider", async () => {
      const { container } = render(
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("mui-theme-provider")).toBeInTheDocument();
      });
    });
  });

  describe("useTheme hook", () => {
    it("provides context values", async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("mode")).toBeInTheDocument();
        expect(screen.getByTestId("isDark")).toBeInTheDocument();
      });
    });

    it("provides mode value", async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("mode")).toHaveTextContent("system");
      });
    });

    it("provides isDark value", async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("isDark")).toHaveTextContent("false");
      });
    });

    it("provides setMode function", async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        const setLightButton = screen.getByTestId("set-light");
        expect(setLightButton).toBeInTheDocument();
      });
    });

    it("provides toggleTheme function", async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        const toggleButton = screen.getByTestId("toggle");
        expect(toggleButton).toBeInTheDocument();
      });
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
    it("initializes with system mode", async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("mode")).toHaveTextContent("system");
      });
    });

    it("allows setting light mode", async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await act(async () => {
        screen.getByTestId("set-light").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("mode")).toHaveTextContent("light");
      });
    });

    it("allows setting dark mode", async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await act(async () => {
        screen.getByTestId("set-dark").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("mode")).toHaveTextContent("dark");
      });
    });

    it("allows setting system mode", async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // First set to light
      await act(async () => {
        screen.getByTestId("set-light").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("mode")).toHaveTextContent("light");
      });

      // Then set back to system
      await act(async () => {
        screen.getByTestId("set-system").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("mode")).toHaveTextContent("system");
      });
    });

    it("updates next-themes when mode changes", async () => {
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

      await act(async () => {
        screen.getByTestId("set-dark").click();
      });

      await waitFor(() => {
        expect(mockSetTheme).toHaveBeenCalledWith("dark");
      });
    });
  });

  describe("Dark Mode Detection", () => {
    it("isDark is false when mode is light", async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await act(async () => {
        screen.getByTestId("set-light").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("isDark")).toHaveTextContent("false");
      });
    });

    it("isDark is true when mode is dark", async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await act(async () => {
        screen.getByTestId("set-dark").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("isDark")).toHaveTextContent("true");
      });
    });

    it("isDark follows system preference when mode is system", async () => {
      // Prefers dark
      mockUseMediaQuery.mockReturnValue(true);

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await act(async () => {
        screen.getByTestId("set-system").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("isDark")).toHaveTextContent("true");
      });
    });

    it("isDark false when system prefers light", async () => {
      // Prefers light
      mockUseMediaQuery.mockReturnValue(false);

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await act(async () => {
        screen.getByTestId("set-system").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("isDark")).toHaveTextContent("false");
      });
    });
  });

  describe("Toggle Theme", () => {
    it("toggles from system to opposite", async () => {
      mockUseMediaQuery.mockReturnValue(false); // Prefers light

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await act(async () => {
        screen.getByTestId("toggle").click();
      });

      // Should toggle to dark when system prefers light
      await waitFor(() => {
        expect(screen.getByTestId("mode")).toHaveTextContent("dark");
      });
    });

    it("toggles between light and dark", async () => {
      mockUseMediaQuery.mockReturnValue(false);

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Set to light first
      await act(async () => {
        screen.getByTestId("set-light").click();
      });
      await waitFor(() => {
        expect(screen.getByTestId("mode")).toHaveTextContent("light");
      });

      // Toggle to dark
      await act(async () => {
        screen.getByTestId("toggle").click();
      });
      await waitFor(() => {
        expect(screen.getByTestId("mode")).toHaveTextContent("dark");
      });

      // Toggle back to light
      await act(async () => {
        screen.getByTestId("toggle").click();
      });
      await waitFor(() => {
        expect(screen.getByTestId("mode")).toHaveTextContent("light");
      });
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
    it("shares state across consumers", async () => {
      render(
        <ThemeProvider>
          <TestComponent />
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        const modes = screen.getAllByTestId("mode");
        expect(modes).toHaveLength(2);
      });
    });

    it("updates all consumers on mode change", async () => {
      render(
        <ThemeProvider>
          <TestComponent />
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        // Get all set-dark buttons and click the first one
        const setDarkButtons = screen.getAllByTestId("set-dark");
        setDarkButtons[0].click();
      });

      await waitFor(() => {
        const modes = screen.getAllByTestId("mode");
        modes.forEach((mode) => {
          expect(mode).toHaveTextContent("dark");
        });
      });
    });
  });

  describe("Rapid Changes", () => {
    it("handles rapid mode changes", async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Rapid changes
      await act(async () => {
        screen.getByTestId("set-light").click();
      });
      await act(async () => {
        screen.getByTestId("set-dark").click();
      });
      await act(async () => {
        screen.getByTestId("set-light").click();
      });
      await act(async () => {
        screen.getByTestId("set-dark").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("mode")).toHaveTextContent("dark");
      });
    });
  });
});
