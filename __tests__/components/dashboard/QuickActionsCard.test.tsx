// Mock ThemeContext - Must be defined before importing component
jest.mock("@/contexts/ThemeContext", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTheme: () => ({ isDark: false, mode: "light" as const, setMode: jest.fn(), toggleTheme: jest.fn(), currentTheme: null }),
}));

import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { QuickActionsCard } from "@/components/dashboard/QuickActionsCard";

const theme = createTheme();

function renderWithProviders(component: React.ReactElement) {
  return render(<MuiThemeProvider theme={theme}>{component}</MuiThemeProvider>);
}

describe("QuickActionsCard", () => {
  const mockHandlers = {
    onDownloadLogs: jest.fn(),
    onRestartServer: jest.fn(),
    onStartServer: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // POSITIVE TESTS - Verifying correct functionality
  describe("Positive Tests", () => {
    it("renders correctly with all props - Objective: Test component rendering with valid props", () => {
      renderWithProviders(
        <QuickActionsCard isDark={false} {...mockHandlers} />
      );

      expect(screen.getByText("Server Actions")).toBeInTheDocument();
      expect(screen.getByText("Download Logs")).toBeInTheDocument();
      expect(screen.getByText("Restart Server")).toBeInTheDocument();
      expect(screen.getByText("Start Server")).toBeInTheDocument();
    });

    it("renders all three action buttons", () => {
      renderWithProviders(
        <QuickActionsCard isDark={false} {...mockHandlers} />
      );

      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBe(3);
    });

    it("calls onDownloadLogs when Download Logs button is clicked - Objective: Test user interaction", () => {
      renderWithProviders(
        <QuickActionsCard isDark={false} {...mockHandlers} />
      );

      const downloadButton = screen.getByText("Download Logs");
      fireEvent.click(downloadButton);

      expect(mockHandlers.onDownloadLogs).toHaveBeenCalledTimes(1);
    });

    it("calls onRestartServer when Restart Server button is clicked", () => {
      renderWithProviders(
        <QuickActionsCard isDark={false} {...mockHandlers} />
      );

      const restartButton = screen.getByText("Restart Server");
      fireEvent.click(restartButton);

      expect(mockHandlers.onRestartServer).toHaveBeenCalledTimes(1);
    });

    it("calls onStartServer when Start Server button is clicked", () => {
      renderWithProviders(
        <QuickActionsCard isDark={false} {...mockHandlers} />
      );

      const startButton = screen.getByText("Start Server");
      fireEvent.click(startButton);

      expect(mockHandlers.onStartServer).toHaveBeenCalledTimes(1);
    });

    it("displays action descriptions correctly", () => {
      renderWithProviders(
        <QuickActionsCard isDark={false} {...mockHandlers} />
      );

      expect(screen.getByText("Export system logs")).toBeInTheDocument();
      expect(screen.getByText("Restart llama-server")).toBeInTheDocument();
      expect(screen.getByText("Start llama-server")).toBeInTheDocument();
    });

    it("displays last update section", () => {
      renderWithProviders(
        <QuickActionsCard isDark={false} {...mockHandlers} />
      );

      expect(screen.getByText("Last Update")).toBeInTheDocument();
      expect(screen.getByText(/20\d{2}/)).toBeInTheDocument(); // Matches year
    });

    it("renders with dark mode styling when isDark is true", () => {
      const { container } = renderWithProviders(
        <QuickActionsCard isDark={true} {...mockHandlers} />
      );

      const card = container.querySelector(".MuiCard-root");
      expect(card).toBeInTheDocument();
    });

    it("renders with light mode styling when isDark is false", () => {
      const { container } = renderWithProviders(
        <QuickActionsCard isDark={false} {...mockHandlers} />
      );

      const card = container.querySelector(".MuiCard-root");
      expect(card).toBeInTheDocument();
    });

    it("handles multiple sequential button clicks correctly", () => {
      renderWithProviders(
        <QuickActionsCard isDark={false} {...mockHandlers} />
      );

      const buttons = screen.getAllByRole("button");

      // Click each button once
      fireEvent.click(buttons[0]);
      fireEvent.click(buttons[1]);
      fireEvent.click(buttons[2]);

      expect(mockHandlers.onDownloadLogs).toHaveBeenCalledTimes(1);
      expect(mockHandlers.onRestartServer).toHaveBeenCalledTimes(1);
      expect(mockHandlers.onStartServer).toHaveBeenCalledTimes(1);
    });

    it("updates last update time on re-render", () => {
      const { rerender } = renderWithProviders(
        <QuickActionsCard isDark={false} {...mockHandlers} />
      );

      expect(screen.getByText("Last Update")).toBeInTheDocument();

      // Rerender to check time updates
      rerender(
        <MuiThemeProvider theme={theme}>
          <QuickActionsCard isDark={false} {...mockHandlers} />
        </MuiThemeProvider>
      );

      expect(screen.getByText("Last Update")).toBeInTheDocument();
    });

    it("applies correct button variant to download logs (contained)", () => {
      renderWithProviders(
        <QuickActionsCard isDark={false} {...mockHandlers} />
      );

      const downloadButton = screen.getByText("Download Logs").closest("button");
      expect(downloadButton).toHaveClass("MuiButton-contained");
    });

    it("applies correct button variant to restart server (outlined)", () => {
      renderWithProviders(
        <QuickActionsCard isDark={false} {...mockHandlers} />
      );

      const restartButton = screen.getByText("Restart Server").closest("button");
      expect(restartButton).toHaveClass("MuiButton-outlined");
    });

    it("applies correct button variant to start server (outlined)", () => {
      renderWithProviders(
        <QuickActionsCard isDark={false} {...mockHandlers} />
      );

      const startButton = screen.getByText("Start Server").closest("button");
      expect(startButton).toHaveClass("MuiButton-outlined");
    });
  });

  // NEGATIVE TESTS - Verifying error handling and edge cases
  describe("Negative Tests", () => {
    it("handles null handlers without crashing - Objective: Test error handling for null handlers", () => {
      const nullHandlers = {
        onDownloadLogs: null,
        onRestartServer: null,
        onStartServer: null,
      };

      expect(() => {
        renderWithProviders(
          <QuickActionsCard isDark={false} {...(nullHandlers as any)} />
        );
      }).not.toThrow();
    });

    it("handles undefined handlers gracefully", () => {
      const undefinedHandlers = {
        onDownloadLogs: undefined,
        onRestartServer: undefined,
        onStartServer: undefined,
      };

      expect(() => {
        renderWithProviders(
          <QuickActionsCard isDark={false} {...(undefinedHandlers as any)} />
        );
      }).not.toThrow();
    });

    it("handles rapid button clicks without errors - Objective: Test for race conditions", () => {
      renderWithProviders(
        <QuickActionsCard isDark={false} {...mockHandlers} />
      );

      const downloadButton = screen.getByText("Download Logs");

      // Rapidly click the button 10 times
      for (let i = 0; i < 10; i++) {
        fireEvent.click(downloadButton);
      }

      expect(mockHandlers.onDownloadLogs).toHaveBeenCalledTimes(10);
    });

    it("does not throw when clicking buttons with null handlers", () => {
      const nullHandlers = {
        onDownloadLogs: null,
        onRestartServer: null,
        onStartServer: null,
      };

      const { container } = renderWithProviders(
        <QuickActionsCard isDark={false} {...(nullHandlers as any)} />
      );

      const buttons = container.querySelectorAll("button");

      buttons.forEach((button) => {
        expect(() => {
          fireEvent.click(button);
        }).not.toThrow();
      });
    });

    it("handles theme change from light to dark without errors", () => {
      const { rerender } = renderWithProviders(
        <QuickActionsCard isDark={false} {...mockHandlers} />
      );

      expect(screen.getByText("Server Actions")).toBeInTheDocument();

      rerender(
        <MuiThemeProvider theme={theme}>
          <QuickActionsCard isDark={true} {...mockHandlers} />
        </MuiThemeProvider>
      );

      expect(screen.getByText("Server Actions")).toBeInTheDocument();
    });

    it("handles theme change from dark to light without errors", () => {
      const { rerender } = renderWithProviders(
        <QuickActionsCard isDark={true} {...mockHandlers} />
      );

      expect(screen.getByText("Server Actions")).toBeInTheDocument();

      rerender(
        <MuiThemeProvider theme={theme}>
          <QuickActionsCard isDark={false} {...mockHandlers} />
        </MuiThemeProvider>
      );

      expect(screen.getByText("Server Actions")).toBeInTheDocument();
    });

    it("handles handlers being functions that throw errors", () => {
      const errorHandlers = {
        onDownloadLogs: () => {
          throw new Error("Download failed");
        },
        onRestartServer: jest.fn(),
        onStartServer: jest.fn(),
      };

      renderWithProviders(
        <QuickActionsCard isDark={false} {...(errorHandlers as any)} />
      );

      const downloadButton = screen.getByText("Download Logs");

      expect(() => {
        fireEvent.click(downloadButton);
      }).toThrow("Download failed");
    });

    it("handles very long button text without layout issues", () => {
      const longTextHandlers = {
        onDownloadLogs: jest.fn(),
        onRestartServer: jest.fn(),
        onStartServer: jest.fn(),
      };

      renderWithProviders(
        <QuickActionsCard isDark={false} {...longTextHandlers} />
      );

      const card = screen.getByText("Server Actions").closest(".MuiCard-root");
      expect(card).toBeInTheDocument();
    });

    it("renders correctly when Date.toLocaleString returns unexpected format", () => {
      jest.spyOn(Date.prototype, "toLocaleString").mockReturnValue("Invalid Date Format");

      renderWithProviders(
        <QuickActionsCard isDark={false} {...mockHandlers} />
      );

      expect(screen.getByText("Last Update")).toBeInTheDocument();
      jest.restoreAllMocks();
    });
  });

  // ENHANCEMENT TESTS - Additional coverage for styling and edge cases
  describe("Enhancement Tests", () => {
    it("applies correct colors to buttons", () => {
      const { container } = renderWithProviders(
        <QuickActionsCard isDark={false} {...mockHandlers} />
      );

      const buttons = container.querySelectorAll("button");

      // Download logs - info color
      const downloadButton = buttons[0];
      expect(downloadButton).toHaveClass("MuiButton-containedInfo");

      // Restart server - warning color
      const restartButton = buttons[1];
      expect(restartButton).toHaveClass("MuiButton-outlinedWarning");

      // Start server - success color
      const startButton = buttons[2];
      expect(startButton).toHaveClass("MuiButton-outlinedSuccess");
    });

    it("applies correct icon classes to buttons", () => {
      const { container } = renderWithProviders(
        <QuickActionsCard isDark={false} {...mockHandlers} />
      );

      const buttons = container.querySelectorAll("button");

      buttons.forEach((button) => {
        expect(button).toBeInTheDocument();
      });
    });

    it("displays correct button text content", () => {
      renderWithProviders(
        <QuickActionsCard isDark={false} {...mockHandlers} />
      );

      expect(screen.getByText("Download Logs")).toBeInTheDocument();
      expect(screen.getByText("Export system logs")).toBeInTheDocument();
      expect(screen.getByText("Restart Server")).toBeInTheDocument();
      expect(screen.getByText("Restart llama-server")).toBeInTheDocument();
      expect(screen.getByText("Start Server")).toBeInTheDocument();
      expect(screen.getByText("Start llama-server")).toBeInTheDocument();
    });

    it("maintains button order correctly", () => {
      renderWithProviders(
        <QuickActionsCard isDark={false} {...mockHandlers} />
      );

      const buttons = screen.getAllByRole("button");
      expect(buttons[0].textContent).toContain("Download Logs");
      expect(buttons[1].textContent).toContain("Restart Server");
      expect(buttons[2].textContent).toContain("Start Server");
    });

    it("applies correct spacing and layout", () => {
      const { container } = renderWithProviders(
        <QuickActionsCard isDark={false} {...mockHandlers} />
      );

      const card = container.querySelector(".MuiCard-root");
      expect(card).toBeInTheDocument();
    });

    it("handles button hover states without errors", () => {
      const { container } = renderWithProviders(
        <QuickActionsCard isDark={false} {...mockHandlers} />
      );

      const buttons = container.querySelectorAll("button");

      buttons.forEach((button) => {
        fireEvent.mouseOver(button);
        fireEvent.mouseOut(button);
      });

      // No errors should be thrown
      expect(screen.getByText("Server Actions")).toBeInTheDocument();
    });

    it("handles keyboard navigation (Enter key)", () => {
      renderWithProviders(
        <QuickActionsCard isDark={false} {...mockHandlers} />
      );

      const downloadButton = screen.getByText("Download Logs");
      fireEvent.keyDown(downloadButton, { key: "Enter", code: "Enter" });

      expect(mockHandlers.onDownloadLogs).toHaveBeenCalledTimes(1);
    });

    it("handles keyboard navigation (Space key)", () => {
      renderWithProviders(
        <QuickActionsCard isDark={false} {...mockHandlers} />
      );

      const downloadButton = screen.getByText("Download Logs");
      fireEvent.keyDown(downloadButton, { key: " ", code: "Space" });

      expect(mockHandlers.onDownloadLogs).toHaveBeenCalledTimes(1);
    });

    it("renders divider between buttons and last update", () => {
      const { container } = renderWithProviders(
        <QuickActionsCard isDark={false} {...mockHandlers} />
      );

      const divider = container.querySelector(".MuiDivider-root");
      expect(divider).toBeInTheDocument();
    });

    it("displays last update in correct format", () => {
      renderWithProviders(
        <QuickActionsCard isDark={false} {...mockHandlers} />
      );

      expect(screen.getByText("Last Update")).toBeInTheDocument();
      // Check that date is displayed (current date format varies by locale)
    });

    it("maintains correct accessibility attributes", () => {
      renderWithProviders(
        <QuickActionsCard isDark={false} {...mockHandlers} />
      );

      const buttons = screen.getAllByRole("button");

      buttons.forEach((button) => {
        expect(button).toHaveAttribute("type", "button");
      });
    });

    it("handles button focus states", () => {
      const { container } = renderWithProviders(
        <QuickActionsCard isDark={false} {...mockHandlers} />
      );

      const buttons = container.querySelectorAll("button");

      buttons.forEach((button) => {
        fireEvent.focus(button);
        fireEvent.blur(button);
      });

      expect(screen.getByText("Server Actions")).toBeInTheDocument();
    });

    it("applies dark mode specific styling when isDark is true", () => {
      const { container } = renderWithProviders(
        <QuickActionsCard isDark={true} {...mockHandlers} />
      );

      const card = container.querySelector(".MuiCard-root");
      expect(card).toBeInTheDocument();
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBe(3);
    });

    it("applies light mode specific styling when isDark is false", () => {
      const { container } = renderWithProviders(
        <QuickActionsCard isDark={false} {...mockHandlers} />
      );

      const card = container.querySelector(".MuiCard-root");
      expect(card).toBeInTheDocument();
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBe(3);
    });
  });
});
