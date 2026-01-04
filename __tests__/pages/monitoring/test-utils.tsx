import React from "react";
import { render, act, screen } from "@testing-library/react";
import { MonitoringContent } from "@/app/monitoring/page";

jest.mock("@/components/layout/main-layout", () => ({
  MainLayout: ({ children }: any) =>
    React.createElement("div", { "data-testid": "main-layout" }, children),
}));

jest.mock("@/contexts/ThemeContext", () => ({
  useTheme: jest.fn(() => ({
    isDark: false,
    mode: "light" as const,
    setMode: jest.fn(),
    toggleTheme: jest.fn(),
  })),
}));

jest.mock("@/hooks/useChartHistory", () => ({
  useChartHistory: jest.fn(() => ({
    cpu: [],
    memory: [],
    requests: [],
    gpuUtil: [],
    power: [],
  })),
}));

jest.mock("@/components/charts/PerformanceChart", () => {
  return function MockPerformanceChart({ title, datasets, isDark }: any) {
    return React.createElement(
      "div",
      { "data-testid": "performance-chart", "data-title": title },
      `PerformanceChart: ${title}`,
      `Datasets: ${datasets?.length || 0}`,
      `isDark: ${isDark}`
    );
  };
});

jest.mock("@/components/charts/GPUUMetricsCard", () => {
  return function MockGPUUMetricsCard({ metrics: _metrics, isDark }: any) {
    return React.createElement(
      "div",
      { "data-testid": "gpu-metrics-card" },
      "GPUUMetricsCard Component",
      `isDark: ${isDark}`
    );
  };
});

jest.mock("@/hooks/use-effect-event", () => ({
  useEffectEvent: (fn: any) => fn,
}));

jest.mock("@mui/material", () => ({
  Typography: ({ children, variant, ...props }: any) =>
    React.createElement(
      variant === "h3" || variant === "h6" || variant === "h5" || variant === "h4"
        ? "h1"
        : "span",
      props,
      children
    ),
  Box: ({ children, ...props }: any) =>
    React.createElement("div", props, children),
  Card: ({ children, ...props }: any) =>
    React.createElement("div", props, children),
  CardContent: ({ children }: any) =>
    React.createElement("div", { children }),
  Grid: ({ children, ...props }: any) =>
    React.createElement("div", props, children),
  IconButton: ({ children, onClick, disabled, title, ...props }: any) =>
    React.createElement("button", { ...props, onClick, disabled, title }, children),
  Tooltip: ({ children, ...props }: any) =>
    React.createElement("div", props, children),
  Divider: ({ ...props }: any) => React.createElement("hr", props),
  CircularProgress: ({ ...props }: any) =>
    React.createElement("span", props, "Loading..."),
  LinearProgress: ({ ...props }: any) =>
    React.createElement("div", props, "Progress"),
}));

jest.mock("@mui/icons-material", () => ({
  Refresh: (props: any) =>
    React.createElement("svg", {
      ...props,
      "data-icon": "Refresh",
      width: 24,
      height: 24,
    }),
  Warning: (props: any) =>
    React.createElement("svg", {
      ...props,
      "data-icon": "Warning",
      width: 24,
      height: 24,
    }),
  CheckCircle: (props: any) =>
    React.createElement("svg", {
      ...props,
      "data-icon": "CheckCircle",
      width: 24,
      height: 24,
    }),
  Info: (props: any) =>
    React.createElement("svg", {
      ...props,
      "data-icon": "Info",
      width: 24,
      height: 24,
    }),
  Memory: (props: any) =>
    React.createElement("svg", {
      ...props,
      "data-icon": "Memory",
      width: 24,
      height: 24,
    }),
  Storage: (props: any) =>
    React.createElement("svg", {
      ...props,
      "data-icon": "Storage",
      width: 24,
      height: 24,
    }),
  Timer: (props: any) =>
    React.createElement("svg", {
      ...props,
      "data-icon": "Timer",
      width: 24,
      height: 24,
    }),
  NetworkCheck: (props: any) =>
    React.createElement("svg", {
      ...props,
      "data-icon": "NetworkCheck",
      width: 24,
      height: 24,
    }),
  Computer: (props: any) =>
    React.createElement("svg", {
      ...props,
      "data-icon": "Computer",
      width: 24,
      height: 24,
    }),
}));

jest.mock("@/lib/store", () => ({
  useStore: jest.fn((selector: any) => {
    const state = {
      metrics: null,
      setMetrics: jest.fn(),
      chartHistory: {
        cpu: [],
        memory: [],
        requests: [],
        gpuUtil: [],
        power: [],
      },
    };
    return selector(state);
  }),
}));

export const mockMetrics = {
  cpuUsage: 45,
  memoryUsage: 60,
  diskUsage: 75,
  activeModels: 4,
  uptime: 86400,
  avgResponseTime: 150,
  totalRequests: 1500,
  gpuUsage: 55,
  gpuPowerUsage: 200,
  gpuMemoryUsage: 60,
  timestamp: "2024-01-01T00:00:00Z",
};

export const mockMetricsHighUsage = {
  cpuUsage: 95,
  memoryUsage: 90,
  diskUsage: 98,
  activeModels: 8,
  uptime: 172800,
  avgResponseTime: 200,
  totalRequests: 5000,
  gpuUsage: 95,
  gpuPowerUsage: 350,
  gpuMemoryUsage: 95,
  timestamp: "2024-01-01T00:00:00Z",
};

export const mockMetricsNoGPU = {
  cpuUsage: 45,
  memoryUsage: 60,
  diskUsage: 75,
  activeModels: 4,
  uptime: 86400,
  avgResponseTime: 150,
  totalRequests: 1500,
  timestamp: "2024-01-01T00:00:00Z",
};

export function setupStore(metrics: any) {
  const useStore = require("@/lib/store").useStore;
  useStore.mockImplementation((selector: any) =>
    selector({
      metrics,
      setMetrics: jest.fn(),
      chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] },
    })
  );
}

export const mockStore = require("@/lib/store").useStore as jest.Mock;
