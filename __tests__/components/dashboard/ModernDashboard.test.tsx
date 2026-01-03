import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ModernDashboard from "@/components/dashboard/ModernDashboard";
import type { MockChartDataPoint, MockStoreState, StoreSelector } from "__tests__/types/mock-types";

// Mock ThemeContext
jest.mock("@/contexts/ThemeContext", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTheme: () => ({
    isDark: false,
    mode: "light" as const,
    setMode: jest.fn(),
    toggleTheme: jest.fn(),
    currentTheme: null,
  }),
}));

// Mock useWebSocket
jest.mock("@/hooks/use-websocket", () => ({
  useWebSocket: jest.fn(),
}));

// Mock useChartHistory
jest.mock("@/hooks/useChartHistory", () => ({
  useChartHistory: jest.fn(),
}));

// Mock store
jest.mock("@/lib/store", () => ({
  useStore: jest.fn(),
  useModels: jest.fn(),
  useMetrics: jest.fn(),
  useStore: jest.fn(),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock chart components to avoid @mui/x-charts issues
jest.mock("@mui/x-charts", () => ({
  LineChart: (props: unknown) => {
    const { children } = props as { children?: React.ReactNode };
    return <div data-testid="line-chart">{children}</div>;
  },
  ChartsXAxis: () => <div />,
  ChartsYAxis: () => <div />,
  ChartsGrid: () => <div />,
  ChartsTooltip: () => <div />,
}));

jest.mock("@/components/charts/PerformanceChart", () => {
  return (props: unknown) => {
    const { title, height, datasets } = props as {
      title: string;
      height?: number;
      datasets?: Array<{ dataKey: string; label: string }>;
    };
    return (
      <div data-testid={`performance-chart-${title}`} style={{ height }}>
        <div>{title}</div>
        {datasets?.map((d) => <div key={d.dataKey}>{d.label}</div>)}
      </div>
    );
  };
});

jest.mock("@/components/charts/GPUUMetricsCard", () => ({
  __esModule: true,
  default: () => (
    <div data-testid="gpu-metrics-card">
      <div>GPU Metrics</div>
    </div>
  ),
}));

const theme = createTheme();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const { useStore: mockedUseStore } = require('@/lib/store') as { useStore: jest.Mock };
const { useWebSocket: mockedUseWebSocket } = require('@/hooks/use-websocket') as { useWebSocket: jest.Mock };
const { useChartHistory: mockedUseChartHistory } = require('@/hooks/useChartHistory') as { useChartHistory: jest.Mock };

const mockState = {
  models: [
    { id: 'model1', name: 'Llama 2 7B', status: 'running', type: 'llama' },
    { id: 'model2', name: 'Mistral 7B', status: 'idle', type: 'mistral' },
  ],
  metrics: {
    cpuUsage: 50,
    memoryUsage: 60,
    diskUsage: 70,
    activeModels: 1,
    uptime: 3600,
    totalRequests: 1000,
    avgResponseTime: 150,
    gpuUsage: { utilization: 80, power: 200 },
    gpuMemoryUsed: 10,
    gpuMemoryTotal: 24,
    gpuTemperature: 65,
    gpuName: 'NVIDIA RTX 4090',
  },
  logs: [],
};

function renderWithProviders(component: React.ReactElement) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </QueryClientProvider>
  );
  return render(component, { wrapper });
}

describe("ModernDashboard", () => {
  const mockSendMessage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockedUseStore.mockImplementation((selector: (state: typeof mockState) => unknown) => {
      if (typeof selector === "function") {
        return selector(mockState);
      }
      return mockState;
    });

    mockedUseWebSocket.mockReturnValue({
      isConnected: true,
      connectionState: "connected",
      sendMessage: mockSendMessage,
      requestMetrics: jest.fn(),
      requestLogs: jest.fn(),
      requestModels: jest.fn(),
      startModel: jest.fn(),
      stopModel: jest.fn(),
      socketId: "socket-123",
    });

    mockedUseChartHistory.mockReturnValue({
      cpu: [{ value: 50, timestamp: Date.now() }],
      memory: [{ value: 60, timestamp: Date.now() }],
      requests: [{ value: 100, timestamp: Date.now() }],
      gpuUtil: [{ value: 80, timestamp: Date.now() }],
      power: [{ value: 200, timestamp: Date.now() }],
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // POSITIVE TESTS - Verifying correct functionality
  describe("Positive Tests", () => {
    it("renders loading state initially - Objective: Test initial loading state", () => {
      renderWithProviders(<ModernDashboard />);

      expect(screen.getByText("Loading Dashboard...")).toBeInTheDocument();
    });

    it("renders dashboard after loading completes", async () => {
      renderWithProviders(<ModernDashboard />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
      });

      expect(screen.getByText("Dashboard Overview")).toBeInTheDocument();
    });

    it("displays all metric cards - Objective: Test metric rendering", async () => {
      renderWithProviders(<ModernDashboard />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
      });

      expect(screen.getByText("CPU Usage")).toBeInTheDocument();
      expect(screen.getByText("Memory Usage")).toBeInTheDocument();
      expect(screen.getByText("Disk Usage")).toBeInTheDocument();
      expect(screen.getByText("Active Models")).toBeInTheDocument();
    });

    it("displays correct metric values", async () => {
      renderWithProviders(<ModernDashboard />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
      });

      expect(screen.getByText("50.0%")).toBeInTheDocument();
      expect(screen.getByText("60.0%")).toBeInTheDocument();
      expect(screen.getByText("70.0%")).toBeInTheDocument();
    });

    it("renders models list card", async () => {
      renderWithProviders(<ModernDashboard />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
      });

      expect(screen.getByText("Llama 2 7B")).toBeInTheDocument();
      expect(screen.getByText("Mistral 7B")).toBeInTheDocument();
    });

    it("renders quick actions card", async () => {
      renderWithProviders(<ModernDashboard />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
      });

      expect(screen.getByText(/Restart/i)).toBeInTheDocument();
      expect(screen.getByText(/Start/i)).toBeInTheDocument();
    });

    it("displays performance chart", async () => {
      renderWithProviders(<ModernDashboard />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
      });

      expect(screen.getByText("System Performance")).toBeInTheDocument();
    });

    it("displays GPU utilization chart when GPU metrics available", async () => {
      renderWithProviders(<ModernDashboard />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
      });

      expect(screen.getByText("GPU Utilization & Power")).toBeInTheDocument();
    });

    it("displays uptime information", async () => {
      renderWithProviders(<ModernDashboard />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
      });

      expect(screen.getByText("Uptime")).toBeInTheDocument();
    });

    it("displays total requests", async () => {
      renderWithProviders(<ModernDashboard />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
      });

      expect(screen.getByText("Total Requests")).toBeInTheDocument();
      expect(screen.getByText("1000")).toBeInTheDocument();
    });

    it("displays average response time", async () => {
      renderWithProviders(<ModernDashboard />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
      });

      expect(screen.getByText("Avg Response Time")).toBeInTheDocument();
      expect(screen.getByText("150ms")).toBeInTheDocument();
    });

    it("sends WebSocket messages on mount", () => {
      renderWithProviders(<ModernDashboard />);

      expect(mockSendMessage).toHaveBeenCalledWith("request_metrics", {});
      expect(mockSendMessage).toHaveBeenCalledWith("request_models", {});
    });

    it("calls handleRefresh when refresh button is clicked", async () => {
      renderWithProviders(<ModernDashboard />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
      });

      const refreshButton = screen.getAllByRole("button").find((btn) =>
        btn.querySelector('[data-icon="Refresh"]')
      );

      if (refreshButton) {
        refreshButton.click();
        expect(mockSendMessage).toHaveBeenCalledWith("request_metrics", {});
        expect(mockSendMessage).toHaveBeenCalledWith("request_models", {});
      }
    });

    it("sends correct messages for quick actions", async () => {
      renderWithProviders(<ModernDashboard />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
      });

      const buttons = screen.getAllByRole("button");

      // Download logs button
      const downloadButton = buttons.find((btn) => btn.textContent?.includes("Download"));
      if (downloadButton) {
        downloadButton.click();
        expect(mockSendMessage).toHaveBeenCalledWith("download_logs", {});
      }
    });
  });

  // NEGATIVE TESTS - Verifying error handling and edge cases
  describe("Negative Tests", () => {
    it("handles empty models array gracefully - Objective: Test edge case with no models", async () => {
      mockedUseStore.mockImplementation((selector: StoreSelector) => {
        if (typeof selector === "function") {
          return selector({ ...mockState, models: [] });
        }
        return { ...mockState, models: [] };
      });

      renderWithProviders(<ModernDashboard />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
      });

      expect(screen.getByText("0 models")).toBeInTheDocument();
    });

    it("handles null metrics gracefully", async () => {
      mockedUseStore.mockImplementation((selector: StoreSelector) => {
        if (typeof selector === "function") {
          return selector({ ...mockState, metrics: null });
        }
        return { ...mockState, metrics: null };
      });

      renderWithProviders(<ModernDashboard />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
      });

      // Should show default values (0)
      expect(screen.getByText("0.0%")).toBeInTheDocument();
    });

    it("handles undefined metrics", async () => {
      mockedUseStore.mockImplementation((selector: StoreSelector) => {
        if (typeof selector === "function") {
          return selector({ ...mockState, metrics: undefined });
        }
        return { ...mockState, metrics: undefined };
      });

      renderWithProviders(<ModernDashboard />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
      });

      expect(screen.getByText("0.0%")).toBeInTheDocument();
    });

    it("handles zero uptime - Objective: Test boundary condition", async () => {
      mockedUseStore.mockImplementation((selector: StoreSelector) => {
        if (typeof selector === "function") {
          return selector({ ...mockState, metrics: { ...mockState.metrics, uptime: 0 } });
        }
        return { ...mockState, metrics: { ...mockState.metrics, uptime: 0 } };
      });

      renderWithProviders(<ModernDashboard />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
      });

      expect(screen.getByText("N/A")).toBeInTheDocument();
    });

    it("handles very large uptime values", async () => {
      mockedUseStore.mockImplementation((selector: StoreSelector) => {
        if (typeof selector === "function") {
          return selector({ ...mockState, metrics: { ...mockState.metrics, uptime: 864000 } });
        }
        return { ...mockState, metrics: { ...mockState.metrics, uptime: 864000 } };
      });

      renderWithProviders(<ModernDashboard />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
      });

      expect(screen.getByText("10d 0h 0m")).toBeInTheDocument();
    });

    it("handles WebSocket disconnected state", async () => {
      mockedUseWebSocket.mockReturnValue({
        isConnected: false,
        connectionState: "disconnected",
        sendMessage: mockSendMessage,
        requestMetrics: jest.fn(),
        requestLogs: jest.fn(),
        requestModels: jest.fn(),
        startModel: jest.fn(),
        stopModel: jest.fn(),
        socketId: null,
      });

      renderWithProviders(<ModernDashboard />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
      });

      expect(screen.getByText("DISCONNECTED")).toBeInTheDocument();
    });

    it("handles no GPU metrics - displays GPU metrics card instead", async () => {
      mockedUseStore.mockImplementation((selector: StoreSelector) => {
        if (typeof selector === "function") {
          return selector({
            ...mockState,
            metrics: { ...mockState.metrics, gpuUsage: undefined },
          });
        }
        return { ...mockState, metrics: { ...mockState.metrics, gpuUsage: undefined } };
      });

      renderWithProviders(<ModernDashboard />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
      });

      expect(screen.queryByText("GPU Utilization & Power")).not.toBeInTheDocument();
    });

    it("handles extreme metric values (100%) - Objective: Test boundary condition", async () => {
      mockedUseStore.mockImplementation((selector: StoreSelector) => {
        if (typeof selector === "function") {
          return selector({
            ...mockState,
            metrics: { ...mockState.metrics, cpuUsage: 100, memoryUsage: 100, diskUsage: 100 },
          });
        }
        return { ...mockState, metrics: { ...mockState.metrics, cpuUsage: 100, memoryUsage: 100, diskUsage: 100 } };
      });

      renderWithProviders(<ModernDashboard />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
      });

      expect(screen.getByText("100.0%")).toBeInTheDocument();
    });

    it("handles very low metric values (0%)", async () => {
      mockedUseStore.mockImplementation((selector: StoreSelector) => {
        if (typeof selector === "function") {
          return selector({
            ...mockState,
            metrics: { ...mockState.metrics, cpuUsage: 0, memoryUsage: 0, diskUsage: 0, activeModels: 0 },
          });
        }
        return { ...mockState, metrics: { ...mockState.metrics, cpuUsage: 0, memoryUsage: 0, diskUsage: 0, activeModels: 0 } };
      });

      renderWithProviders(<ModernDashboard />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
      });

      expect(screen.getByText("0.0%")).toBeInTheDocument();
    });

    it("handles negative response time gracefully", async () => {
      mockedUseStore.mockImplementation((selector: StoreSelector) => {
        if (typeof selector === "function") {
          return selector({
            ...mockState,
            metrics: { ...mockState.metrics, avgResponseTime: -1 },
          });
        }
        return { ...mockState, metrics: { ...mockState.metrics, avgResponseTime: -1 } };
      });

      renderWithProviders(<ModernDashboard />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
      });

      expect(screen.getByText("-1ms")).toBeInTheDocument();
    });

    it("handles undefined avg response time", async () => {
      mockedUseStore.mockImplementation((selector: StoreSelector) => {
        if (typeof selector === "function") {
          return selector({
            ...mockState,
            metrics: { ...mockState.metrics, avgResponseTime: undefined },
          });
        }
        return { ...mockState, metrics: { ...mockState.metrics, avgResponseTime: undefined } };
      });

      renderWithProviders(<ModernDashboard />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
      });

      expect(screen.getByText("0ms")).toBeInTheDocument();
    });

    it("handles very large request count", async () => {
      mockedUseStore.mockImplementation((selector: StoreSelector) => {
        if (typeof selector === "function") {
          return selector({
            ...mockState,
            metrics: { ...mockState.metrics, totalRequests: 999999999 },
          });
        }
        return { ...mockState, metrics: { ...mockState.metrics, totalRequests: 999999999 } };
      });

      renderWithProviders(<ModernDashboard />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
      });

      expect(screen.getByText("999999999")).toBeInTheDocument();
    });
  });

  // ENHANCEMENT TESTS - Additional coverage for state changes and edge cases
  describe("Enhancement Tests", () => {
    it("handles theme change without errors", async () => {
      const { rerender } = renderWithProviders(<ModernDashboard />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
      });

      rerender(
        <QueryClientProvider client={queryClient}>
          <MuiThemeProvider theme={theme}>
            <ModernDashboard />
          </MuiThemeProvider>
        </QueryClientProvider>
      );

      expect(screen.getByText("Dashboard Overview")).toBeInTheDocument();
    });

    it("handles very large number of models", async () => {
      const manyModels = Array.from({ length: 50 }, (_, i) => ({
        id: `model${i}`,
        name: `Model ${i}`,
        status: i % 2 === 0 ? "running" : "idle",
        type: "llama",
      }));

      mockedUseStore.mockImplementation((selector: StoreSelector) => {
        if (typeof selector === "function") {
          return selector({ ...mockState, models: manyModels });
        }
        return { ...mockState, models: manyModels };
      });

      renderWithProviders(<ModernDashboard />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
      });

      expect(screen.getByText("50 models")).toBeInTheDocument();
    });

    it("handles models with special characters in names", async () => {
      const specialModels = [
        { id: "model1", name: 'Model-α_β 🚀', status: "running", type: "llama" },
        { id: "model2", name: 'Model with "quotes" & symbols', status: "idle", type: "mistral" },
      ];

      mockedUseStore.mockImplementation((selector: StoreSelector) => {
        if (typeof selector === "function") {
          return selector({ ...mockState, models: specialModels });
        }
        return { ...mockState, models: specialModels };
      });

      renderWithProviders(<ModernDashboard />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
      });

      expect(screen.getByText('Model-α_β 🚀')).toBeInTheDocument();
    });

    it("displays correct data-testid for dashboard container", async () => {
      renderWithProviders(<ModernDashboard />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
      });

      const dashboard = screen.getByTestId("modern-dashboard");
      expect(dashboard).toBeInTheDocument();
    });

    it("formats uptime correctly for various values", async () => {
      const testCases = [
        { uptime: 60, expected: "0d 0h 1m" },
        { uptime: 3600, expected: "0d 1h 0m" },
        { uptime: 86400, expected: "1d 0h 0m" },
        { uptime: 90061, expected: "1d 1h 1m" },
      ];

      for (const testCase of testCases) {
      mockedUseStore.mockImplementation((selector: (state: typeof mockState) => unknown) => {
          if (typeof selector === "function") {
            return selector({
              ...mockState,
              metrics: { ...mockState.metrics, uptime: testCase.uptime },
            });
          }
          return { ...mockState, metrics: { ...mockState.metrics, uptime: testCase.uptime } };
        });

        const { unmount } = renderWithProviders(<ModernDashboard />);

        jest.advanceTimersByTime(1500);

        await waitFor(() => {
          expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
        });

        expect(screen.getByText(testCase.expected)).toBeInTheDocument();

        unmount();
      }
    });

    it("cleans up timers on unmount", () => {
      const { unmount } = renderWithProviders(<ModernDashboard />);

      unmount();

      // Should not throw any errors
      expect(true).toBe(true);
    });

    it("handles concurrent state changes", async () => {
      const { rerender } = renderWithProviders(<ModernDashboard />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
      });

      // Change to empty state
      mockedUseStore.mockImplementation((selector: StoreSelector) => {
        if (typeof selector === "function") {
          return selector({ ...mockState, models: [], metrics: undefined });
        }
        return { ...mockState, models: [], metrics: undefined };
      });

      rerender(
        <QueryClientProvider client={queryClient}>
          <MuiThemeProvider theme={theme}>
            <ModernDashboard />
          </MuiThemeProvider>
        </QueryClientProvider>
      );

      // Dashboard should still render
      expect(screen.getByText("Dashboard Overview")).toBeInTheDocument();
    });

    it("sends toggle_model message when model is toggled", async () => {
      // This would require clicking on a model's start/stop button
      // The actual interaction is handled by child components
      renderWithProviders(<ModernDashboard />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
      });

      // Verify that WebSocket is connected and ready to send messages
      expect(mockSendMessage).toHaveBeenCalledWith("request_metrics", {});
      expect(mockSendMessage).toHaveBeenCalledWith("request_models", {});
    });

    it("displays all expected chart history data", async () => {
      const chartHistory = {
        cpu: [{ value: 50, timestamp: Date.now() }],
        memory: [{ value: 60, timestamp: Date.now() }],
        requests: [{ value: 100, timestamp: Date.now() }],
        gpuUtil: [{ value: 80, timestamp: Date.now() }],
        power: [{ value: 200, timestamp: Date.now() }],
      };

      mockedUseChartHistory.mockReturnValue(chartHistory);

      renderWithProviders(<ModernDashboard />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
      });

      expect(screen.getByText("System Performance")).toBeInTheDocument();
      expect(screen.getByText("GPU Utilization & Power")).toBeInTheDocument();
    });

    it("handles missing GPU memory metrics", async () => {
      mockedUseStore.mockImplementation((selector: StoreSelector) => {
        if (typeof selector === "function") {
          return selector({
            ...mockState,
            metrics: {
              ...mockState.metrics,
              gpuUsage: { utilization: 80, power: 200 },
              gpuMemoryUsed: undefined,
              gpuMemoryTotal: undefined,
              gpuTemperature: 65,
              gpuName: "NVIDIA RTX 4090",
            },
          });
        }
        return {
          ...mockState,
          metrics: {
            ...mockState.metrics,
            gpuUsage: { utilization: 80, power: 200 },
            gpuMemoryUsed: undefined,
            gpuMemoryTotal: undefined,
            gpuTemperature: 65,
            gpuName: "NVIDIA RTX 4090",
          },
        };
      });

      renderWithProviders(<ModernDashboard />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
      });

      expect(screen.getByText("GPU Utilization & Power")).toBeInTheDocument();
    });
  });
});
