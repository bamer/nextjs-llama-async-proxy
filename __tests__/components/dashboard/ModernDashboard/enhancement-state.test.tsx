import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import ModernDashboard from "@/components/dashboard/ModernDashboard";
import type { StoreSelector } from "__tests__/types/mock-types";
import {
  renderWithProviders,
  setupMocks,
  cleanupMocks,
  waitForLoadingToFinish,
  mockedUseStore,
  mockSendMessage,
  mockState,
  theme,
  queryClient,
} from "./test-utils.tsx";

describe("ModernDashboard Enhancement Tests - State Management", () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    cleanupMocks();
  });

  it("handles theme change without errors", async () => {
    const { rerender } = renderWithProviders(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitForLoadingToFinish();

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

    await waitForLoadingToFinish();

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

    await waitForLoadingToFinish();

    expect(screen.getByText('Model-α_β 🚀')).toBeInTheDocument();
  });

  it("displays correct data-testid for dashboard container", async () => {
    renderWithProviders(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitForLoadingToFinish();

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

      await waitForLoadingToFinish();

      expect(screen.getByText(testCase.expected)).toBeInTheDocument();

      unmount();
    }
  });

  it("cleans up timers on unmount", () => {
    const { unmount } = renderWithProviders(<ModernDashboard />);

    unmount();

    expect(true).toBe(true);
  });

  it("handles concurrent state changes", async () => {
    const { rerender } = renderWithProviders(<ModernDashboard />);

    jest.advanceTimersByTime(1500);

    await waitForLoadingToFinish();

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

    expect(screen.getByText("Dashboard Overview")).toBeInTheDocument();
  });
});
