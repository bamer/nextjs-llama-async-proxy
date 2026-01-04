import React from "react";
import { render, act, screen } from "@testing-library/react";
import { MonitoringContent } from "@/app/monitoring/page";
import { setupStore, mockMetrics, mockMetricsNoGPU } from "./test-utils";

describe("MonitoringContent - Error Handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("handles zero values for metrics", async () => {
    const zeroMetrics = {
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      activeModels: 0,
      uptime: 0,
      avgResponseTime: 0,
      totalRequests: 0,
      timestamp: "2024-01-01T00:00:00Z",
    };
    setupStore(zeroMetrics);

    await act(async () => {
      render(<MonitoringContent />);
    });

    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("0d 0h 0m")).toBeInTheDocument();
    expect(screen.getByText("0ms avg")).toBeInTheDocument();
  });

  it("handles partial GPU metrics (only gpuUsage)", async () => {
    const partialGPUMetrics = {
      ...mockMetricsNoGPU,
      gpuUsage: 70,
    };
    setupStore(partialGPUMetrics);

    await act(async () => {
      render(<MonitoringContent />);
    });

    const gpuCard = screen.queryByTestId("gpu-metrics-card");
    expect(gpuCard).toBeInTheDocument();
  });

  it("handles partial GPU metrics (only gpuPowerUsage)", async () => {
    const partialGPUMetrics = {
      ...mockMetricsNoGPU,
      gpuPowerUsage: 200,
    };
    setupStore(partialGPUMetrics);

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

  it("handles large uptime values", async () => {
    const largeUptimeMetrics = {
      ...mockMetrics,
      uptime: 9000000, // 104 days
    };
    setupStore(largeUptimeMetrics);

    await act(async () => {
      render(<MonitoringContent />);
    });

    expect(screen.getByText("104d 4h 0m")).toBeInTheDocument();
  });

  it("renders without console errors", async () => {
    setupStore(mockMetrics);
    const consoleError = jest.spyOn(console, "error");

    await act(async () => {
      render(<MonitoringContent />);
    });

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("handles re-renders gracefully", async () => {
    setupStore(mockMetrics);

    const { rerender } = await act(async () => {
      return render(<MonitoringContent />);
    });

    expect(screen.getByText("System Monitoring")).toBeInTheDocument();

    await act(async () => {
      rerender(<MonitoringContent />);
    });

    expect(screen.getByText("System Monitoring")).toBeInTheDocument();
  });

  it("has proper component structure", async () => {
    setupStore(mockMetrics);

    await act(async () => {
      render(<MonitoringContent />);
    });

    expect(screen.getByTestId("main-layout")).toBeInTheDocument();
    expect(screen.getByText("System Monitoring")).toBeInTheDocument();
    expect(screen.getByText("System Health Summary")).toBeInTheDocument();
  });
});
