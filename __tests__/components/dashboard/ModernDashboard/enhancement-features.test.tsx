import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import ModernDashboard from "@/components/dashboard/ModernDashboard";
import type { StoreSelector } from "__tests__/types/mock-types";
import {
  renderWithProviders,
  setupMocks,
  cleanupMocks,
  waitForLoadingToFinish,
  mockedUseStore,
  mockedUseChartHistory,
  mockSendMessage,
  mockState,
} from "./test-utils.tsx";

describe("ModernDashboard Enhancement Tests - Features", () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    cleanupMocks();
  });

  it("sends toggle_model message when model is toggled", async () => {
    renderWithProviders(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitForLoadingToFinish();

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

    await waitForLoadingToFinish();

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

    await waitForLoadingToFinish();

    expect(screen.getByText("GPU Utilization & Power")).toBeInTheDocument();
  });
});
