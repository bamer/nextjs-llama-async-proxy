import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import ModernDashboard from "@/components/dashboard/ModernDashboard";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/lib/store", () => ({
  useStore: jest.fn(),
}));

jest.mock("@/hooks/use-websocket", () => ({
  useWebSocket: jest.fn(),
}));

jest.mock("@/hooks/useChartHistory", () => ({
  useChartHistory: jest.fn(),
}));

jest.mock("framer-motion", () => ({
  m: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

jest.mock("@mui/x-charts", () => ({
  LineChart: () => <div data-testid="line-chart">LineChart</div>,
  ChartsXAxis: () => <div data-testid="x-axis">ChartsXAxis</div>,
  ChartsYAxis: () => <div data-testid="y-axis">ChartsYAxis</div>,
  ChartsTooltip: () => <div data-testid="tooltip">ChartsTooltip</div>,
  ChartsLegend: () => <div data-testid="legend">ChartsLegend</div>,
  BarChart: () => <div data-testid="bar-chart">BarChart</div>,
}));

const { useStore } = require("@/lib/store");
const { useWebSocket } = require("@/hooks/use-websocket");
const { useChartHistory } = require("@/hooks/useChartHistory");

const createMockStore = (overrides = {}) => ({
  models: [
    {
      id: "model-1",
      name: "Llama-2-7b",
      type: "LLM",
      status: "running",
      createdAt: "2024-01-01T00:00:00.000Z",
    },
    {
      id: "model-2",
      name: "Mistral-7b",
      type: "LLM",
      status: "idle",
      createdAt: "2024-01-02T00:00:00.000Z",
    },
  ],
  metrics: {
    cpuUsage: 45,
    memoryUsage: 60,
    diskUsage: 55,
    activeModels: 1,
    uptime: 86400,
    totalRequests: 1250,
    avgResponseTime: 45,
  },
  chartHistory: {
    cpu: [
      { time: "2024-01-01T00:00:00.000Z", displayTime: "12:00:00", value: 45 },
      { time: "2024-01-01T00:01:00.000Z", displayTime: "12:01:00", value: 50 },
    ],
    memory: [
      { time: "2024-01-01T00:00:00.000Z", displayTime: "12:00:00", value: 60 },
      { time: "2024-01-01T00:01:00.000Z", displayTime: "12:01:00", value: 62 },
    ],
    requests: [
      { time: "2024-01-01T00:00:00.000Z", displayTime: "12:00:00", value: 1200 },
      { time: "2024-01-01T00:01:00.000Z", displayTime: "12:01:00", value: 1250 },
    ],
    gpuUtil: [],
    power: [],
  },
  ...overrides,
});

const createMockWebSocket = (overrides = {}) => ({
  isConnected: true,
  connectionState: "connected",
  sendMessage: jest.fn(),
  requestMetrics: jest.fn(),
  requestLogs: jest.fn(),
  requestModels: jest.fn(),
  startModel: jest.fn(),
  stopModel: jest.fn(),
  socketId: "test-socket-id",
  ...overrides,
});

function renderWithTheme(component: React.ReactElement, isDark = false) {
  const theme = createTheme({
    palette: {
      mode: isDark ? "dark" : "light",
    },
  });

  return render(
    <ThemeProvider>
      <MuiThemeProvider theme={theme}>{component}</MuiThemeProvider>
    </ThemeProvider>
  );
}

describe("ModernDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    useStore.mockImplementation((selector) => {
      const state = createMockStore();
      return selector ? selector(state) : state;
    });
    useWebSocket.mockReturnValue(createMockWebSocket());
    useChartHistory.mockReturnValue({
      cpu: [
        { time: "2024-01-01T00:00:00.000Z", displayTime: "12:00:00", value: 45 },
        { time: "2024-01-01T00:01:00.000Z", displayTime: "12:01:00", value: 50 },
      ],
      memory: [
        { time: "2024-01-01T00:00:00.000Z", displayTime: "12:00:00", value: 60 },
        { time: "2024-01-01T00:01:00.000Z", displayTime: "12:01:00", value: 62 },
      ],
      requests: [
        { time: "2024-01-01T00:00:00.000Z", displayTime: "12:00:00", value: 1200 },
        { time: "2024-01-01T00:01:00.000Z", displayTime: "12:01:00", value: 1250 },
      ],
      gpuUtil: [],
      power: [],
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("renders loading state initially", () => {
    useStore.mockReturnValue({
      models: [],
      metrics: null,
    });

    renderWithTheme(<ModernDashboard />);

    expect(screen.getByText("Loading Dashboard...")).toBeInTheDocument();
  });

  it("renders dashboard content after loading", async () => {
    renderWithTheme(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitFor(() => {
      expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Dashboard Overview")).toBeInTheDocument();
  });

  it("displays all metric cards", async () => {
    renderWithTheme(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitFor(() => {
      expect(screen.getByText("CPU Usage")).toBeInTheDocument();
    });

    expect(screen.getByText("Memory Usage")).toBeInTheDocument();
    expect(screen.getByText("Disk Usage")).toBeInTheDocument();
    expect(screen.getByText("Active Models")).toBeInTheDocument();
  });

  it("displays metric values correctly", async () => {
    const mockMetrics = {
      cpuUsage: 75,
      memoryUsage: 65,
      diskUsage: 80,
      activeModels: 2,
      uptime: 86400,
      totalRequests: 1500,
      avgResponseTime: 50,
    };

    useStore.mockReturnValue(createMockStore({ metrics: mockMetrics }));

    renderWithTheme(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitFor(() => {
      expect(screen.getByText("75.0%")).toBeInTheDocument();
    });
  });

  it("shows uptime formatted correctly", async () => {
    const mockMetrics = {
      cpuUsage: 45,
      memoryUsage: 60,
      diskUsage: 55,
      activeModels: 1,
      uptime: 90061,
      totalRequests: 1250,
      avgResponseTime: 45,
    };

    useStore.mockReturnValue(createMockStore({ metrics: mockMetrics }));

    renderWithTheme(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitFor(() => {
      expect(screen.getByText("1d 1h 1m")).toBeInTheDocument();
    });
  });

  it("displays system performance chart", async () => {
    renderWithTheme(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitFor(() => {
      expect(screen.getByText("System Performance")).toBeInTheDocument();
    });
  });

  it("navigates to settings when settings action is clicked", async () => {
    renderWithTheme(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitFor(() => {
      const settingsButton = screen.getByRole("button", { name: /settings/i });
      if (settingsButton) {
        fireEvent.click(settingsButton);
        expect(mockPush).toHaveBeenCalledWith("/settings");
      }
    });
  });

  it("sends refresh messages when refresh is triggered", async () => {
    const mockSendMessage = jest.fn();
    useWebSocket.mockReturnValue(
      createMockWebSocket({ sendMessage: mockSendMessage })
    );

    renderWithTheme(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitFor(() => {
      const refreshButton = screen.getByRole("button", { name: /refresh/i });
      if (refreshButton) {
        fireEvent.click(refreshButton);
        expect(mockSendMessage).toHaveBeenCalledWith("request_metrics", {});
        expect(mockSendMessage).toHaveBeenCalledWith("request_models", {});
      }
    });
  });

  it("sends download logs message", async () => {
    const mockSendMessage = jest.fn();
    useWebSocket.mockReturnValue(
      createMockWebSocket({ sendMessage: mockSendMessage })
    );

    renderWithTheme(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitFor(() => {
      const downloadButton = screen.getByRole("button", { name: /download/i });
      if (downloadButton) {
        fireEvent.click(downloadButton);
        expect(mockSendMessage).toHaveBeenCalledWith("download_logs", {});
      }
    });
  });

  it("sends restart server message", async () => {
    const mockSendMessage = jest.fn();
    useWebSocket.mockReturnValue(
      createMockWebSocket({ sendMessage: mockSendMessage })
    );

    renderWithTheme(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitFor(() => {
      const restartButton = screen.getByRole("button", { name: /restart/i });
      if (restartButton) {
        fireEvent.click(restartButton);
        expect(mockSendMessage).toHaveBeenCalledWith("restart_server", {});
      }
    });
  });

  it("sends start server message", async () => {
    const mockSendMessage = jest.fn();
    useWebSocket.mockReturnValue(
      createMockWebSocket({ sendMessage: mockSendMessage })
    );

    renderWithTheme(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitFor(() => {
      const startButton = screen.getByRole("button", { name: /start/i });
      if (startButton) {
        fireEvent.click(startButton);
        expect(mockSendMessage).toHaveBeenCalledWith("start_llama_server", {});
      }
    });
  });

  it("displays models list", async () => {
    renderWithTheme(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitFor(() => {
      expect(screen.getByText("Llama-2-7b")).toBeInTheDocument();
      expect(screen.getByText("Mistral-7b")).toBeInTheDocument();
    });
  });

  it("handles empty metrics gracefully", async () => {
    useStore.mockReturnValue({
      models: [],
      metrics: null,
    });

    renderWithTheme(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitFor(() => {
      expect(screen.queryByText("Loading Dashboard...")).not.toBeInTheDocument();
    });
  });

  it("applies dark mode styles correctly", async () => {
    renderWithTheme(<ModernDashboard />, true);

    jest.advanceTimersByTime(1500);

    await waitFor(() => {
      expect(screen.getByText("Dashboard Overview")).toBeInTheDocument();
    });
  });

  it("renders GPU utilization chart when GPU data available", async () => {
    const mockMetrics = {
      cpuUsage: 45,
      memoryUsage: 60,
      diskUsage: 55,
      activeModels: 1,
      uptime: 86400,
      totalRequests: 1250,
      avgResponseTime: 45,
      gpuUsage: 75,
      gpuPowerUsage: 150,
    };

    useStore.mockReturnValue(createMockStore({ metrics: mockMetrics }));
    useChartHistory.mockReturnValue({
      cpu: [],
      memory: [],
      requests: [],
      gpuUtil: [
        { time: "2024-01-01T00:00:00.000Z", displayTime: "12:00:00", value: 75 },
      ],
      power: [
        { time: "2024-01-01T00:00:00.000Z", displayTime: "12:00:00", value: 150 },
      ],
    });

    renderWithTheme(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitFor(() => {
      expect(screen.getByText("GPU Utilization & Power")).toBeInTheDocument();
    });
  });

  it("displays GPU metrics card when no GPU data", async () => {
    const mockMetrics = {
      cpuUsage: 45,
      memoryUsage: 60,
      diskUsage: 55,
      activeModels: 1,
      uptime: 86400,
      totalRequests: 1250,
      avgResponseTime: 45,
    };

    useStore.mockReturnValue(createMockStore({ metrics: mockMetrics }));

    renderWithTheme(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitFor(() => {
      expect(screen.queryByText("GPU Utilization & Power")).not.toBeInTheDocument();
    });
  });

  it("displays total requests count", async () => {
    const mockMetrics = {
      cpuUsage: 45,
      memoryUsage: 60,
      diskUsage: 55,
      activeModels: 1,
      uptime: 86400,
      totalRequests: 1250,
      avgResponseTime: 45,
    };

    useStore.mockReturnValue(createMockStore({ metrics: mockMetrics }));

    renderWithTheme(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitFor(() => {
      expect(screen.getByText("1250")).toBeInTheDocument();
    });
  });

  it("displays average response time", async () => {
    const mockMetrics = {
      cpuUsage: 45,
      memoryUsage: 60,
      diskUsage: 55,
      activeModels: 1,
      uptime: 86400,
      totalRequests: 1250,
      avgResponseTime: 45,
    };

    useStore.mockReturnValue(createMockStore({ metrics: mockMetrics }));

    renderWithTheme(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitFor(() => {
      expect(screen.getByText("45ms")).toBeInTheDocument();
    });
  });

  it("requests metrics and models on mount", async () => {
    const mockRequestMetrics = jest.fn();
    const mockRequestModels = jest.fn();

    useWebSocket.mockReturnValue(
      createMockWebSocket({
        requestMetrics: mockRequestMetrics,
        requestModels: mockRequestModels,
      })
    );

    renderWithTheme(<ModernDashboard />);

    expect(mockRequestMetrics).toHaveBeenCalled();
    expect(mockRequestModels).toHaveBeenCalled();
  });

  it("displays connection status", async () => {
    const mockIsConnected = false;
    useWebSocket.mockReturnValue(createMockWebSocket({ isConnected: mockIsConnected }));

    renderWithTheme(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitFor(() => {
      expect(screen.getByText("Dashboard Overview")).toBeInTheDocument();
    });
  });

  it("handles toggle model action", async () => {
    const mockSendMessage = jest.fn();
    useWebSocket.mockReturnValue(
      createMockWebSocket({ sendMessage: mockSendMessage })
    );

    renderWithTheme(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitFor(() => {
      expect(screen.getByText("Llama-2-7b")).toBeInTheDocument();
    });
  });
});
