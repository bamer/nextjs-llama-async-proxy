import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import ModernDashboard from "@/components/dashboard/ModernDashboard";
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

describe("ModernDashboard Rendering", () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    cleanupMocks();
  });

  it("renders loading state initially", () => {
    renderWithProviders(<ModernDashboard />);

    expect(screen.getByText("Loading Dashboard...")).toBeInTheDocument();
  });

  it("renders dashboard after loading completes", async () => {
    renderWithProviders(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitForLoadingToFinish();

    expect(screen.getByText("Dashboard Overview")).toBeInTheDocument();
  });

  it("displays all metric cards", async () => {
    renderWithProviders(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitForLoadingToFinish();

    expect(screen.getByText("CPU Usage")).toBeInTheDocument();
    expect(screen.getByText("Memory Usage")).toBeInTheDocument();
    expect(screen.getByText("Disk Usage")).toBeInTheDocument();
    expect(screen.getByText("Active Models")).toBeInTheDocument();
  });

  it("displays correct metric values", async () => {
    renderWithProviders(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitForLoadingToFinish();

    expect(screen.getByText("50.0%")).toBeInTheDocument();
    expect(screen.getByText("60.0%")).toBeInTheDocument();
    expect(screen.getByText("70.0%")).toBeInTheDocument();
  });

  it("renders models list card", async () => {
    renderWithProviders(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitForLoadingToFinish();

    expect(screen.getByText("Llama 2 7B")).toBeInTheDocument();
    expect(screen.getByText("Mistral 7B")).toBeInTheDocument();
  });

  it("renders quick actions card", async () => {
    renderWithProviders(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitForLoadingToFinish();

    expect(screen.getByText(/Restart/i)).toBeInTheDocument();
    expect(screen.getByText(/Start/i)).toBeInTheDocument();
  });

  it("displays performance chart", async () => {
    renderWithProviders(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitForLoadingToFinish();

    expect(screen.getByText("System Performance")).toBeInTheDocument();
  });

  it("displays GPU utilization chart when GPU metrics available", async () => {
    renderWithProviders(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitForLoadingToFinish();

    expect(screen.getByText("GPU Utilization & Power")).toBeInTheDocument();
  });

  it("displays uptime information", async () => {
    renderWithProviders(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitForLoadingToFinish();

    expect(screen.getByText("Uptime")).toBeInTheDocument();
  });

  it("displays total requests", async () => {
    renderWithProviders(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitForLoadingToFinish();

    expect(screen.getByText("Total Requests")).toBeInTheDocument();
    expect(screen.getByText("1000")).toBeInTheDocument();
  });

  it("displays average response time", async () => {
    renderWithProviders(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitForLoadingToFinish();

    expect(screen.getByText("Avg Response Time")).toBeInTheDocument();
    expect(screen.getByText("150ms")).toBeInTheDocument();
  });
});
