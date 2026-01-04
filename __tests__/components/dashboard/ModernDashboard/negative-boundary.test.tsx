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
  mockState,
} from "./test-utils.tsx";

describe("ModernDashboard Negative Tests - Boundary Conditions", () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    cleanupMocks();
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

    await waitForLoadingToFinish();

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

    await waitForLoadingToFinish();

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

    await waitForLoadingToFinish();

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

    await waitForLoadingToFinish();

    expect(screen.getByText("999999999")).toBeInTheDocument();
  });
});
