import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import ModernDashboard from "@/components/dashboard/ModernDashboard";
import type { StoreSelector } from "__tests__/types/mock-types";
import { renderWithProviders } from "./test-utils.tsx";

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

const { useStore: mockedUseStore } = require('@/lib/store') as { useStore: jest.Mock };
const { useWebSocket: mockedUseWebSocket } = require('@/hooks/use-websocket') as { useWebSocket: jest.Mock };
const { useChartHistory: mockedUseChartHistory } = require('@/hooks/useChartHistory') as { useChartHistory: jest.Mock };
const mockSendMessage = jest.fn();

function setupMocks() {
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
}

function cleanupMocks() {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
}

async function waitForLoadingToFinish() {
  await waitFor(() => {
    expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
  });
}

describe("ModernDashboard Negative Tests - Edge Cases", () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    cleanupMocks();
  });

  it("handles empty models array gracefully", async () => {
    mockedUseStore.mockImplementation((selector: StoreSelector) => {
      if (typeof selector === "function") {
        return selector({ ...mockState, models: [] });
      }
      return { ...mockState, models: [] };
    });

    renderWithProviders(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitForLoadingToFinish();

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

    await waitForLoadingToFinish();

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

    await waitForLoadingToFinish();

    expect(screen.getByText("0.0%")).toBeInTheDocument();
  });

  it("handles zero uptime", async () => {
    mockedUseStore.mockImplementation((selector: StoreSelector) => {
      if (typeof selector === "function") {
        return selector({ ...mockState, metrics: { ...mockState.metrics, uptime: 0 } });
      }
      return { ...mockState, metrics: { ...mockState.metrics, uptime: 0 } };
    });

    renderWithProviders(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitForLoadingToFinish();

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

    await waitForLoadingToFinish();

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

    await waitForLoadingToFinish();

    expect(screen.getByText("DISCONNECTED")).toBeInTheDocument();
  });

  it("handles no GPU metrics", async () => {
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

    await waitForLoadingToFinish();

    expect(screen.queryByText("GPU Utilization & Power")).not.toBeInTheDocument();
  });

  it("handles extreme metric values (100%)", async () => {
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

    await waitForLoadingToFinish();

    expect(screen.getByText("100.0%")).toBeInTheDocument();
  });
});
