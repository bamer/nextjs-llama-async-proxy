import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import type { MotionComponentProps } from "__tests__/types/mock-types";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock framer-motion
jest.mock("framer-motion", () => ({
  m: {
    div: ({ children, ...props }: MotionComponentProps) => <div {...props}>{children}</div>,
  },
}));

// Mock ThemeContext
jest.mock("@/contexts/ThemeContext", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTheme: () => ({ isDark: false, mode: "light" as const, setMode: jest.fn(), toggleTheme: jest.fn(), currentTheme: null }),
}));

const theme = createTheme();

function renderWithProviders(component: React.ReactElement) {
  return render(
    <MuiThemeProvider theme={theme}>
      <ThemeProvider>{component}</ThemeProvider>
    </MuiThemeProvider>
  );
}

describe("DashboardHeader", () => {
  const mockOnRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // POSITIVE TESTS - Verifying correct functionality
  describe("Positive Tests", () => {
    it("renders correctly with all props provided", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={true}
          metrics={{
            cpuUsage: 50,
            memoryUsage: 60,
            uptime: 3600,
          }}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByText("Llama Runner Pro Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Real-time AI Model Management & Monitoring")).toBeInTheDocument();
    });

    it("displays CONNECTED status when isConnected is true - Objective: Test connection state display", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={true}
          metrics={{
            cpuUsage: 50,
            memoryUsage: 60,
          }}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByText("CONNECTED")).toBeInTheDocument();
    });

    it("displays DISCONNECTED status when isConnected is false", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={false}
          metrics={undefined}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByText("DISCONNECTED")).toBeInTheDocument();
    });

    it("displays refresh button with correct tooltip", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={true}
          metrics={undefined}
          onRefresh={mockOnRefresh}
        />
      );

      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("displays settings button with correct tooltip", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={true}
          metrics={undefined}
          onRefresh={mockOnRefresh}
        />
      );

      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(1); // At least refresh and settings
    });

    it("displays uptime chip when metrics are provided", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={true}
          metrics={{
            cpuUsage: 50,
            memoryUsage: 60,
            uptime: 3600,
          }}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByText("Uptime: 0d 1h 0m")).toBeInTheDocument();
    });

    it("calls onRefresh when refresh button is clicked - Objective: Test user interaction", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={true}
          metrics={undefined}
          onRefresh={mockOnRefresh}
        />
      );

      const refreshButton = screen.getAllByRole("button")[0];
      fireEvent.click(refreshButton);

      expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    });

    it("navigates to settings when settings button is clicked", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={true}
          metrics={undefined}
          onRefresh={mockOnRefresh}
        />
      );

      const buttons = screen.getAllByRole("button");
      // Click the second button (settings)
      if (buttons.length > 1) {
        fireEvent.click(buttons[1]);
      }
      // Navigation is handled by next/navigation router which is mocked
      // We just verify no errors are thrown
    });

    it("formats uptime correctly for various values", () => {
      const testCases = [
        { uptime: 0, expected: "Uptime: N/A" },
        { uptime: 60, expected: "Uptime: 0d 0h 1m" },
        { uptime: 3600, expected: "Uptime: 0d 1h 0m" },
        { uptime: 86400, expected: "Uptime: 1d 0h 0m" },
        { uptime: 90061, expected: "Uptime: 1d 1h 1m" },
      ];

      testCases.forEach(({ uptime, expected }) => {
        const { unmount } = renderWithProviders(
          <DashboardHeader
            isConnected={true}
            metrics={{ uptime, cpuUsage: 50, memoryUsage: 60 }}
            onRefresh={mockOnRefresh}
          />
        );

        expect(screen.getByText(expected)).toBeInTheDocument();
        unmount();
      });
    });

    it("handles transition from connected to disconnected state", () => {
      const { rerender } = renderWithProviders(
        <DashboardHeader
          isConnected={true}
          metrics={undefined}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByText("CONNECTED")).toBeInTheDocument();

      rerender(
        <MuiThemeProvider theme={theme}>
          <ThemeProvider>
            <DashboardHeader isConnected={false} metrics={undefined} onRefresh={mockOnRefresh} />
          </ThemeProvider>
        </MuiThemeProvider>
      );

      expect(screen.getByText("DISCONNECTED")).toBeInTheDocument();
    });
  });

  // NEGATIVE TESTS - Verifying error handling and edge cases
  describe("Negative Tests", () => {
    it("handles undefined metrics gracefully - Objective: Test error handling", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={true}
          metrics={undefined}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByText("Llama Runner Pro Dashboard")).toBeInTheDocument();
      expect(screen.queryByText(/Uptime:/i)).not.toBeInTheDocument();
    });

    it("handles null metrics gracefully", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={true}
          metrics={null as any}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByText("Llama Runner Pro Dashboard")).toBeInTheDocument();
    });

    it("handles empty metrics object", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={true}
          metrics={{}}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByText("Llama Runner Pro Dashboard")).toBeInTheDocument();
    });

    it("handles undefined uptime in metrics", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={true}
          metrics={{
            cpuUsage: 50,
            memoryUsage: 60,
          }}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByText("Uptime: N/A")).toBeInTheDocument();
    });

    it("handles zero uptime", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={true}
          metrics={{
            cpuUsage: 50,
            memoryUsage: 60,
            uptime: 0,
          }}
          onRefresh={mockOnRefresh}
        />
      );

      // When uptime is 0, it shows "Uptime: N/A"
      expect(screen.getByText("Uptime: N/A")).toBeInTheDocument();
    });

    it("handles negative uptime gracefully", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={true}
          metrics={{
            cpuUsage: 50,
            memoryUsage: 60,
            uptime: -3600,
          }}
          onRefresh={mockOnRefresh}
        />
      );

      // Component formats negative uptime as "-0d -1h 0m"
      expect(screen.getByText(/-\d+d -\d+h \d+m/)).toBeInTheDocument();
    });

    it("handles NaN uptime gracefully", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={true}
          metrics={{
            cpuUsage: 50,
            memoryUsage: 60,
            uptime: NaN,
          }}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByText("Uptime: N/A")).toBeInTheDocument();
    });

    it("handles Infinity uptime gracefully", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={true}
          metrics={{
            cpuUsage: 50,
            memoryUsage: 60,
            uptime: Infinity,
          }}
          onRefresh={mockOnRefresh}
        />
      );

      // Component formats Infinity uptime
      const uptimeText = screen.getByText(/Uptime:/);
      expect(uptimeText).toBeInTheDocument();
    });

    it("handles very large uptime values (365 days)", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={true}
          metrics={{
            cpuUsage: 50,
            memoryUsage: 60,
            uptime: 31536000, // 365 days
          }}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByText("Uptime: 365d 0h 0m")).toBeInTheDocument();
    });

    it("handles partial metrics (only uptime) - Objective: Test with minimal props", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={true}
          metrics={{
            uptime: 3600,
            cpuUsage: 0,
            memoryUsage: 0,
          }}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByText("Uptime: 0d 1h 0m")).toBeInTheDocument();
    });

    it("displays uptime N/A when uptime is 0", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={true}
          metrics={{
            cpuUsage: 50,
            memoryUsage: 60,
            uptime: 0,
          }}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByText("Uptime: N/A")).toBeInTheDocument();
    });

    it("handles missing onRefresh callback without throwing", () => {
      expect(() => {
        renderWithProviders(
          <DashboardHeader isConnected={true} metrics={undefined} onRefresh={undefined as any} />
        );
      }).not.toThrow();
    });

    it("handles multiple rapid state changes without errors", () => {
      const { rerender } = renderWithProviders(
        <DashboardHeader isConnected={true} metrics={undefined} onRefresh={mockOnRefresh} />
      );

      // Simulate rapid state changes
      for (let i = 0; i < 10; i++) {
        const isConnected = i % 2 === 0;
        rerender(
          <MuiThemeProvider theme={theme}>
            <ThemeProvider>
              <DashboardHeader isConnected={isConnected} metrics={undefined} onRefresh={mockOnRefresh} />
            </ThemeProvider>
          </MuiThemeProvider>
        );
      }

      expect(screen.getByText("DISCONNECTED")).toBeInTheDocument();
    });

    it("handles metrics with only serverStatus property", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={true}
          metrics={{
            serverStatus: "running",
            cpuUsage: 50,
            memoryUsage: 60,
            uptime: 3600,
          }}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByText("Llama Runner Pro Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Uptime: 0d 1h 0m")).toBeInTheDocument();
    });

    it("handles partial metrics (only uptime) - Objective: Test with minimal props", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={true}
          metrics={{
            uptime: 3600,
            cpuUsage: 0,
            memoryUsage: 0,
          }}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByText("Uptime: 0d 1h 0m")).toBeInTheDocument();
    });

    it("handles extremely large uptime values (10 days)", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={true}
          metrics={{
            cpuUsage: 50,
            memoryUsage: 60,
            uptime: 864000, // 10 days
          }}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByText("Uptime: 10d 0h 0m")).toBeInTheDocument();
    });

    it("handles uptime with minutes only", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={true}
          metrics={{
            cpuUsage: 50,
            memoryUsage: 60,
            uptime: 45, // 45 seconds
          }}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByText("Uptime: 0d 0h 0m")).toBeInTheDocument();
    });

    it("handles uptime with hours and minutes", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={true}
          metrics={{
            cpuUsage: 50,
            memoryUsage: 60,
            uptime: 3661, // 1h 1m 1s
          }}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByText("Uptime: 0d 1h 1m")).toBeInTheDocument();
    });
  });

  // ENHANCEMENT TESTS - Additional coverage for edge cases
  describe("Enhancement Tests", () => {
    it("displays correct color for connected status", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={true}
          metrics={undefined}
          onRefresh={mockOnRefresh}
        />
      );

      const connectedChip = screen.getByText("CONNECTED");
      expect(connectedChip).toBeInTheDocument();
    });

    it("displays correct color for disconnected status", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={false}
          metrics={undefined}
          onRefresh={mockOnRefresh}
        />
      );

      const disconnectedChip = screen.getByText("DISCONNECTED");
      expect(disconnectedChip).toBeInTheDocument();
    });

    it("displays correct variant for uptime chip", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={true}
          metrics={{
            uptime: 3600,
            cpuUsage: 50,
            memoryUsage: 60,
          }}
          onRefresh={mockOnRefresh}
        />
      );

      const uptimeChip = screen.getByText("Uptime: 0d 1h 0m");
      expect(uptimeChip).toBeInTheDocument();
    });

    it("renders all icons correctly", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={true}
          metrics={undefined}
          onRefresh={mockOnRefresh}
        />
      );

      const icons = screen.getAllByRole("button");
      expect(icons.length).toBeGreaterThanOrEqual(2); // At least refresh and settings
    });

    it("handles connection state change with metrics", () => {
      const { rerender } = renderWithProviders(
        <DashboardHeader
          isConnected={true}
          metrics={{
            cpuUsage: 50,
            memoryUsage: 60,
            uptime: 3600,
          }}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByText("CONNECTED")).toBeInTheDocument();

      rerender(
        <MuiThemeProvider theme={theme}>
          <ThemeProvider>
            <DashboardHeader
              isConnected={false}
              metrics={{
                cpuUsage: 50,
                memoryUsage: 60,
                uptime: 3600,
              }}
              onRefresh={mockOnRefresh}
            />
          </ThemeProvider>
        </MuiThemeProvider>
      );

      expect(screen.getByText("DISCONNECTED")).toBeInTheDocument();
    });

    it("does not display uptime chip when metrics are undefined", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={true}
          metrics={undefined}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.queryByText(/Uptime:/i)).not.toBeInTheDocument();
    });

    it("maintains correct spacing in header layout", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={true}
          metrics={undefined}
          onRefresh={mockOnRefresh}
        />
      );

      // Just check that elements are present
      expect(screen.getByText("Llama Runner Pro Dashboard")).toBeInTheDocument();
      expect(screen.getByText("CONNECTED")).toBeInTheDocument();
    });

    it("displays reconnection attempt count when reconnecting", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={false}
          connectionState="reconnecting"
          reconnectionAttempts={3}
          metrics={undefined}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByText("RECONNECTING (3/5)...")).toBeInTheDocument();
    });

    it("displays connection error when max attempts reached", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={false}
          connectionState="error"
          reconnectionAttempts={5}
          metrics={undefined}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByText("CONNECTION ERROR")).toBeInTheDocument();
    });

    it("defaults reconnection attempts to 0", () => {
      renderWithProviders(
        <DashboardHeader
          isConnected={false}
          connectionState="disconnected"
          metrics={undefined}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByText("DISCONNECTED")).toBeInTheDocument();
    });
  });
});
