import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { ThemeProvider } from "../../../src/contexts/ThemeContext";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import MonitoringPage from "../../../app/monitoring/page";

jest.mock("../../../src/lib/store", () => ({
  useStore: jest.fn(),
}));

jest.mock("../../../src/hooks/useChartHistory", () => ({
  useChartHistory: jest.fn(),
}));

jest.mock("../../../src/components/charts/PerformanceChart", () => ({
  PerformanceChart: () => <div data-testid="performance-chart">PerformanceChart</div>,
}));

jest.mock("../../../src/components/charts/GPUUMetricsCard", () => ({
  GPUUMetricsCard: () => <div data-testid="gpu-metrics-card">GPUUMetricsCard</div>,
}));

jest.mock("../../../src/components/layout/main-layout", () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="main-layout">{children}</div>,
}));

const { useStore } = require("../../../src/lib/store");
const { useChartHistory } = require("../../../src/hooks/useChartHistory");

const createMockMetrics = (overrides = {}) => ({
  cpuUsage: 45,
  memoryUsage: 60,
  diskUsage: 55,
  activeModels: 2,
  uptime: 86400,
  totalRequests: 1250,
  avgResponseTime: 45,
  gpuUsage: 75,
  gpuPowerUsage: 150,
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

describe("MonitoringPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    useStore.mockReturnValue({
      metrics: createMockMetrics(),
    });

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
      gpuUtil: [
        { time: "2024-01-01T00:00:00.000Z", displayTime: "12:00:00", value: 75 },
      ],
      power: [
        { time: "2024-01-01T00:00:00.000Z", displayTime: "12:00:00", value: 150 },
      ],
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("renders loading state when metrics not available", () => {
    useStore.mockReturnValue({
      metrics: null,
    });

    renderWithTheme(<MonitoringPage />);

    expect(screen.getByText("Loading Monitoring Data...")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("renders page content after metrics are available", () => {
    renderWithTheme(<MonitoringPage />);

    expect(screen.getByText("System Monitoring")).toBeInTheDocument();
    expect(screen.getByText("Real-time performance and health monitoring")).toBeInTheDocument();
  });

  it("displays all key metrics cards", () => {
    renderWithTheme(<MonitoringPage />);

    expect(screen.getByText("Memory Usage")).toBeInTheDocument();
    expect(screen.getByText("CPU Usage")).toBeInTheDocument();
    expect(screen.getByText("Disk Usage")).toBeInTheDocument();
    expect(screen.getByText("Available Models")).toBeInTheDocument();
  });

  it("displays correct metric values", () => {
    const mockMetrics = createMockMetrics({
      cpuUsage: 75,
      memoryUsage: 65,
      diskUsage: 80,
      activeModels: 3,
    });

    useStore.mockReturnValue({
      metrics: mockMetrics,
    });

    renderWithTheme(<MonitoringPage />);

    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("65%")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("displays status chips correctly", () => {
    const mockMetrics = createMockMetrics({
      cpuUsage: 95,
      memoryUsage: 90,
      diskUsage: 98,
    });

    useStore.mockReturnValue({
      metrics: mockMetrics,
    });

    renderWithTheme(<MonitoringPage />);

    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("displays refresh button", () => {
    renderWithTheme(<MonitoringPage />);

    const refreshButton = screen.getByRole("button", { name: /refresh/i });
    expect(refreshButton).toBeInTheDocument();
  });

  it("updates metrics on refresh click", () => {
    const mockSetMetrics = jest.fn();
    const mockMetrics = createMockMetrics();

    useStore.mockReturnValue({
      metrics: mockMetrics,
      setMetrics: mockSetMetrics,
    });

    renderWithTheme(<MonitoringPage />);

    const refreshButton = screen.getByRole("button", { name: /refresh/i });
    fireEvent.click(refreshButton);

    expect(mockSetMetrics).toHaveBeenCalled();
  });

  it("renders system performance chart", () => {
    renderWithTheme(<MonitoringPage />);

    expect(screen.getByTestId("performance-chart")).toBeInTheDocument();
  });

  it("displays GPU metrics card when GPU data available", () => {
    const mockMetrics = createMockMetrics({
      gpuUsage: 75,
      gpuPowerUsage: 150,
    });

    useStore.mockReturnValue({
      metrics: mockMetrics,
    });

    renderWithTheme(<MonitoringPage />);

    expect(screen.getByTestId("gpu-metrics-card")).toBeInTheDocument();
  });

  it("does not display GPU metrics when GPU data not available", () => {
    const mockMetrics = createMockMetrics({
      gpuUsage: undefined,
      gpuPowerUsage: undefined,
    });

    useStore.mockReturnValue({
      metrics: mockMetrics,
    });

    renderWithTheme(<MonitoringPage />);

    expect(screen.queryByTestId("gpu-metrics-card")).not.toBeInTheDocument();
  });

  it("renders GPU power chart when power data available", () => {
    const mockMetrics = createMockMetrics({
      gpuPowerUsage: 150,
    });

    useStore.mockReturnValue({
      metrics: mockMetrics,
    });

    renderWithTheme(<MonitoringPage />);

    expect(screen.getByText("GPU Power & Utilization")).toBeInTheDocument();
  });

  it("does not render GPU power chart when power data not available", () => {
    const mockMetrics = createMockMetrics({
      gpuPowerUsage: undefined,
    });

    useStore.mockReturnValue({
      metrics: mockMetrics,
    });

    renderWithTheme(<MonitoringPage />);

    expect(screen.queryByText("GPU Power & Utilization")).not.toBeInTheDocument();
  });

  it("displays system health summary", () => {
    renderWithTheme(<MonitoringPage />);

    expect(screen.getByText("System Health Summary")).toBeInTheDocument();
  });

  it("displays uptime formatted correctly", () => {
    const mockMetrics = createMockMetrics({
      uptime: 90061,
    });

    useStore.mockReturnValue({
      metrics: mockMetrics,
    });

    renderWithTheme(<MonitoringPage />);

    expect(screen.getByText("1d 1h 1m")).toBeInTheDocument();
  });

  it("displays performance status", () => {
    const mockMetrics = createMockMetrics({
      avgResponseTime: 45,
      totalRequests: 1250,
    });

    useStore.mockReturnValue({
      metrics: mockMetrics,
    });

    renderWithTheme(<MonitoringPage />);

    expect(screen.getByText("45ms avg")).toBeInTheDocument();
    expect(screen.getByText("1250 requests processed")).toBeInTheDocument();
  });

  it("displays health indicators", () => {
    const mockMetrics = createMockMetrics({
      memoryUsage: 90,
      cpuUsage: 95,
      diskUsage: 97,
      activeModels: 2,
    });

    useStore.mockReturnValue({
      metrics: mockMetrics,
    });

    renderWithTheme(<MonitoringPage />);

    expect(screen.getByText("Health Indicators")).toBeInTheDocument();
    expect(screen.getByText("Memory: 90%")).toBeInTheDocument();
    expect(screen.getByText("CPU: 95%")).toBeInTheDocument();
    expect(screen.getByText("Disk: 97%")).toBeInTheDocument();
    expect(screen.getByText("Models: 2 active")).toBeInTheDocument();
  });

  it("applies dark mode styles correctly", () => {
    renderWithTheme(<MonitoringPage />, true);

    expect(screen.getByText("System Monitoring")).toBeInTheDocument();
  });

  it("displays normal status for healthy metrics", () => {
    const mockMetrics = createMockMetrics({
      cpuUsage: 45,
      memoryUsage: 55,
      diskUsage: 60,
    });

    useStore.mockReturnValue({
      metrics: mockMetrics,
    });

    renderWithTheme(<MonitoringPage />);

    expect(screen.getAllByText("Normal").length).toBeGreaterThan(0);
  });

  it("displays medium status for elevated metrics", () => {
    const mockMetrics = createMockMetrics({
      cpuUsage: 70,
      memoryUsage: 75,
    });

    useStore.mockReturnValue({
      metrics: mockMetrics,
    });

    renderWithTheme(<MonitoringPage />);

    expect(screen.getAllByText("Medium").length).toBeGreaterThan(0);
  });

  it("displays high/critical status for critical metrics", () => {
    const mockMetrics = createMockMetrics({
      cpuUsage: 95,
      memoryUsage: 90,
      diskUsage: 98,
    });

    useStore.mockReturnValue({
      metrics: mockMetrics,
    });

    renderWithTheme(<MonitoringPage />);

    expect(screen.getByText("Critical")).toBeInTheDocument();
  });

  it("displays active models count", () => {
    const mockMetrics = createMockMetrics({
      activeModels: 5,
    });

    useStore.mockReturnValue({
      metrics: mockMetrics,
    });

    renderWithTheme(<MonitoringPage />);

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("5/10 models active")).toBeInTheDocument();
  });

  it("handles zero active models", () => {
    const mockMetrics = createMockMetrics({
      activeModels: 0,
    });

    useStore.mockReturnValue({
      metrics: mockMetrics,
    });

    renderWithTheme(<MonitoringPage />);

    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("0/10 models active")).toBeInTheDocument();
  });

  it("displays check circle icons for healthy metrics", () => {
    const mockMetrics = createMockMetrics({
      memoryUsage: 45,
      cpuUsage: 50,
      diskUsage: 55,
    });

    useStore.mockReturnValue({
      metrics: mockMetrics,
    });

    renderWithTheme(<MonitoringPage />);

    const healthIndicators = screen.getAllByText((text, node) => {
      return node?.textContent?.includes("running smoothly") ?? false;
    });
    expect(healthIndicators.length).toBeGreaterThan(0);
  });

  it("displays warning icons for critical metrics", () => {
    const mockMetrics = createMockMetrics({
      memoryUsage: 90,
      cpuUsage: 95,
      diskUsage: 97,
    });

    useStore.mockReturnValue({
      metrics: mockMetrics,
    });

    renderWithTheme(<MonitoringPage />);

    expect(screen.getByText("Memory: 90%")).toBeInTheDocument();
    expect(screen.getByText("CPU: 95%")).toBeInTheDocument();
    expect(screen.getByText("Disk: 97%")).toBeInTheDocument();
  });

  it("handles very large uptime values", () => {
    const mockMetrics = createMockMetrics({
      uptime: 345600,
    });

    useStore.mockReturnValue({
      metrics: mockMetrics,
    });

    renderWithTheme(<MonitoringPage />);

    expect(screen.getByText("4d 0h 0m")).toBeInTheDocument();
  });

  it("handles zero uptime", () => {
    const mockMetrics = createMockMetrics({
      uptime: 0,
    });

    useStore.mockReturnValue({
      metrics: mockMetrics,
    });

    renderWithTheme(<MonitoringPage />);

    expect(screen.getByText("0d 0h 0m")).toBeInTheDocument();
  });
});
