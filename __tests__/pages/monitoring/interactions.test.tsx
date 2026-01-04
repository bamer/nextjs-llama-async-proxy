import React from "react";
import { render, act, screen, fireEvent } from "@testing-library/react";
import { MonitoringContent } from "@/app/monitoring/page";
import { setupStore, mockMetrics } from "./test-utils";

describe("MonitoringContent - Interactions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("shows Normal memory status when below 70%", async () => {
    const lowMemoryMetrics = { ...mockMetrics, memoryUsage: 50 };
    setupStore(lowMemoryMetrics);

    await act(async () => {
      render(<MonitoringContent />);
    });

    expect(screen.getByText("Normal")).toBeInTheDocument();
  });

  it("shows Medium memory status when between 70% and 85%", async () => {
    const mediumMemoryMetrics = { ...mockMetrics, memoryUsage: 78 };
    setupStore(mediumMemoryMetrics);

    await act(async () => {
      render(<MonitoringContent />);
    });

    expect(screen.getByText("Medium")).toBeInTheDocument();
  });

  it("shows High memory status when above 85%", async () => {
    const highMemoryMetrics = { ...mockMetrics, memoryUsage: 90 };
    setupStore(highMemoryMetrics);

    await act(async () => {
      render(<MonitoringContent />);
    });

    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("shows Normal CPU status when below 60%", async () => {
    const lowCPUMetrics = { ...mockMetrics, cpuUsage: 45 };
    setupStore(lowCPUMetrics);

    await act(async () => {
      render(<MonitoringContent />);
    });

    expect(screen.getByText("Normal")).toBeInTheDocument();
  });

  it("shows Medium CPU status when between 60% and 90%", async () => {
    const mediumCPUMetrics = { ...mockMetrics, cpuUsage: 75 };
    setupStore(mediumCPUMetrics);

    await act(async () => {
      render(<MonitoringContent />);
    });

    expect(screen.getByText("Medium")).toBeInTheDocument();
  });

  it("shows High CPU status when above 90%", async () => {
    const highCPUMetrics = { ...mockMetrics, cpuUsage: 95 };
    setupStore(highCPUMetrics);

    await act(async () => {
      render(<MonitoringContent />);
    });

    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("shows Normal disk status when below 80%", async () => {
    const lowDiskMetrics = { ...mockMetrics, diskUsage: 60 };
    setupStore(lowDiskMetrics);

    await act(async () => {
      render(<MonitoringContent />);
    });

    expect(screen.getByText("Normal")).toBeInTheDocument();
  });

  it("shows High disk status when between 80% and 95%", async () => {
    const highDiskMetrics = { ...mockMetrics, diskUsage: 88 };
    setupStore(highDiskMetrics);

    await act(async () => {
      render(<MonitoringContent />);
    });

    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("shows Critical disk status when above 95%", async () => {
    const criticalDiskMetrics = { ...mockMetrics, diskUsage: 97 };
    setupStore(criticalDiskMetrics);

    await act(async () => {
      render(<MonitoringContent />);
    });

    expect(screen.getByText("Critical")).toBeInTheDocument();
  });

  it("renders refresh button", async () => {
    setupStore(mockMetrics);

    await act(async () => {
      render(<MonitoringContent />);
    });

    const refreshButton = screen.queryByTitle(/refresh metrics/i);
    expect(refreshButton).toBeInTheDocument();
  });

  it("handles refresh button click", async () => {
    const setMetricsMock = jest.fn();
    const useStore = require("@/lib/store").useStore;
    useStore.mockImplementation((selector: any) =>
      selector({
        metrics: mockMetrics,
        setMetrics: setMetricsMock,
        chartHistory: {
          cpu: [],
          memory: [],
          requests: [],
          gpuUtil: [],
          power: [],
        },
      })
    );

    await act(async () => {
      render(<MonitoringContent />);
    });

    const refreshButton = screen.getByTitle(/refresh metrics/i);
    await act(async () => {
      fireEvent.click(refreshButton);
    });

    jest.advanceTimersByTime(1000);

    expect(setMetricsMock).toHaveBeenCalled();
  });
});
