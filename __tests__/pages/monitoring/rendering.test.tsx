import React from "react";
import { render, act, screen } from "@testing-library/react";
import { MonitoringContent } from "@/app/monitoring/page";
import { setupStore, mockMetrics } from "./test-utils";

describe("MonitoringContent - Rendering", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders without errors when metrics exist", async () => {
    setupStore(mockMetrics);

    await act(async () => {
      render(<MonitoringContent />);
    });

    expect(screen.getByText("System Monitoring")).toBeInTheDocument();
  });

  it("renders MainLayout wrapper", async () => {
    setupStore(mockMetrics);

    await act(async () => {
      render(<MonitoringContent />);
    });

    expect(screen.getByTestId("main-layout")).toBeInTheDocument();
  });

  it("renders loading state when no metrics", async () => {
    setupStore(null);

    await act(async () => {
      render(<MonitoringContent />);
    });

    expect(screen.getByText("Loading Monitoring Data...")).toBeInTheDocument();
  });

  it("renders subtitle description", async () => {
    setupStore(mockMetrics);

    await act(async () => {
      render(<MonitoringContent />);
    });

    expect(
      screen.getByText("Real-time performance and health monitoring")
    ).toBeInTheDocument();
  });

  it("renders memory usage card with correct values", async () => {
    setupStore(mockMetrics);

    await act(async () => {
      render(<MonitoringContent />);
    });

    expect(screen.getByText("Memory Usage")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
  });

  it("renders CPU usage card with correct values", async () => {
    setupStore(mockMetrics);

    await act(async () => {
      render(<MonitoringContent />);
    });

    expect(screen.getByText("CPU Usage")).toBeInTheDocument();
    expect(screen.getByText("45%")).toBeInTheDocument();
  });

  it("renders disk usage card with correct values", async () => {
    setupStore(mockMetrics);

    await act(async () => {
      render(<MonitoringContent />);
    });

    expect(screen.getByText("Disk Usage")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("renders available models card with correct values", async () => {
    setupStore(mockMetrics);

    await act(async () => {
      render(<MonitoringContent />);
    });

    expect(screen.getByText("Available Models")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("4/10 models active")).toBeInTheDocument();
  });

  it("renders system performance chart", async () => {
    setupStore(mockMetrics);

    await act(async () => {
      render(<MonitoringContent />);
    });

    const chart = screen.getByTestId("performance-chart");
    expect(chart).toBeInTheDocument();
    expect(chart).toHaveAttribute("data-title", "System Performance");
  });

  it("renders GPU metrics card when GPU data is available", async () => {
    setupStore(mockMetrics);

    await act(async () => {
      render(<MonitoringContent />);
    });

    const gpuCard = screen.queryByTestId("gpu-metrics-card");
    expect(gpuCard).toBeInTheDocument();
  });

  it("does not render GPU metrics when GPU data is undefined", async () => {
    const { mockMetricsNoGPU } = await import("./test-utils");
    setupStore(mockMetricsNoGPU);

    await act(async () => {
      render(<MonitoringContent />);
    });

    const gpuCard = screen.queryByTestId("gpu-metrics-card");
    expect(gpuCard).not.toBeInTheDocument();
  });

  it("renders GPU performance chart when GPU data is available", async () => {
    setupStore(mockMetrics);

    await act(async () => {
      render(<MonitoringContent />);
    });

    const charts = screen.getAllByTestId("performance-chart");
    const gpuChart = charts.find(
      (chart: any) =>
        chart.getAttribute("data-title") === "GPU Power & Utilization"
    );
    expect(gpuChart).toBeInTheDocument();
  });

  it("renders system health summary section", async () => {
    setupStore(mockMetrics);

    await act(async () => {
      render(<MonitoringContent />);
    });

    expect(screen.getByText("System Health Summary")).toBeInTheDocument();
  });

  it("renders system uptime", async () => {
    setupStore(mockMetrics);

    await act(async () => {
      render(<MonitoringContent />);
    });

    expect(screen.getByText("System Uptime")).toBeInTheDocument();
    expect(screen.getByText("1d 0h 0m")).toBeInTheDocument();
  });

  it("renders performance status", async () => {
    setupStore(mockMetrics);

    await act(async () => {
      render(<MonitoringContent />);
    });

    expect(screen.getByText("Performance Status")).toBeInTheDocument();
    expect(screen.getByText("150ms avg")).toBeInTheDocument();
    expect(
      screen.getByText("1500 requests processed")
    ).toBeInTheDocument();
  });

  it("renders health indicators section", async () => {
    setupStore(mockMetrics);

    await act(async () => {
      render(<MonitoringContent />);
    });

    expect(screen.getByText("Health Indicators")).toBeInTheDocument();
    expect(screen.getByText("Memory: 60%")).toBeInTheDocument();
    expect(screen.getByText("CPU: 45%")).toBeInTheDocument();
    expect(screen.getByText("Disk: 75%")).toBeInTheDocument();
    expect(screen.getByText("Models: 4 active")).toBeInTheDocument();
  });
});
