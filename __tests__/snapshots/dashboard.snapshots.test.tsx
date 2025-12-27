import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Mock dependencies
jest.mock("@/lib/store", () => ({
  useStore: jest.fn(),
}));

jest.mock("@/hooks/use-websocket", () => ({
  useWebSocket: jest.fn(() => ({
    isConnected: true,
    sendMessage: jest.fn(),
  })),
}));

jest.mock("@/hooks/useChartHistory", () => ({
  useChartHistory: jest.fn(() => ({
    cpu: [45, 50, 55],
    memory: [60, 62, 58],
    requests: [100, 120, 110],
    gpuUtil: [70, 75, 72],
    power: [150, 155, 148],
  })),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

jest.mock("@mui/material", () => ({
  ...jest.requireActual("@mui/material"),
  useMediaQuery: jest.fn(() => false),
}));

jest.mock("@/styles/theme", () => {
  const lightTheme = {
    palette: { mode: "light" },
    typography: {},
    components: {},
  };
  const darkTheme = {
    palette: { mode: "dark" },
    typography: {},
    components: {},
  };
  return {
    lightTheme,
    darkTheme,
  };
});

jest.mock("next-themes", () => ({
  useTheme: () => ({
    setTheme: jest.fn(),
    theme: "light",
  }),
}));

import { useStore } from "@/lib/store";
import ModernDashboard from "@/components/dashboard/ModernDashboard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ModelsListCard } from "@/components/dashboard/ModelsListCard";
import { QuickActionsCard } from "@/components/dashboard/QuickActionsCard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

describe("Dashboard Snapshots", () => {
  const MockThemeProvider = ({ children, isDark = false }: { children: React.ReactNode; isDark?: boolean }) => (
    <ThemeProvider>{children}</ThemeProvider>
  );

  const mockMetrics = {
    cpuUsage: 45.5,
    memoryUsage: 62.3,
    diskUsage: 78.9,
    activeModels: 3,
    gpuUsage: 75.2,
    uptime: 86400,
    totalRequests: 15234,
    avgResponseTime: 125,
  };

  const mockModels = [
    { id: "1", name: "Llama-2-7B", loaded: true, size: "7B" },
    { id: "2", name: "Llama-2-13B", loaded: false, size: "13B" },
    { id: "3", name: "Mistral-7B", loaded: true, size: "7B" },
  ];

  beforeEach(() => {
    (useStore as jest.Mock).mockImplementation((selector) => {
      const state = {
        models: mockModels,
        metrics: mockMetrics,
      };
      return selector(state);
    });
    jest.clearAllMocks();
  });

  describe("ModernDashboard Component", () => {
    // Positive Test: Verify correct rendering in light mode
    it("should match snapshot in light mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <ModernDashboard />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("dashboard-light");
    });

    // Positive Test: Verify correct rendering in dark mode
    it("should match snapshot in dark mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={true}>
          <ModernDashboard />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("dashboard-dark");
    });

    // Positive Test: Verify rendering with loading state
    it("should match snapshot with loading state", () => {
      (useStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          models: [],
          metrics: null,
        };
        return selector(state);
      });

      const { container } = render(
        <MockThemeProvider>
          <ModernDashboard />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("dashboard-loading");
    });

    // Negative Test: Verify rendering without metrics
    it("should match snapshot with no metrics", () => {
      (useStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          models: [],
          metrics: null,
        };
        return selector(state);
      });

      const { container } = render(
        <MockThemeProvider>
          <ModernDashboard />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("dashboard-no-metrics");
    });
  });

  describe("MetricCard Component", () => {
    // Positive Test: Verify normal status card in light mode
    it("should match snapshot in light mode with normal status", () => {
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <MetricCard title="CPU Usage" value={45} unit="%" icon="🖥️" isDark={false} threshold={80} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("metric-card-normal-light");
    });

    // Positive Test: Verify normal status card in dark mode
    it("should match snapshot in dark mode with normal status", () => {
      const { container } = render(
        <MockThemeProvider isDark={true}>
          <MetricCard title="CPU Usage" value={45} unit="%" icon="🖥️" isDark={true} threshold={80} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("metric-card-normal-dark");
    });

    // Positive Test: Verify warning status card
    it("should match snapshot with warning status", () => {
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <MetricCard title="Memory Usage" value={70} unit="%" icon="💾" isDark={false} threshold={80} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("metric-card-warning");
    });

    // Positive Test: Verify critical status card
    it("should match snapshot with critical status", () => {
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <MetricCard title="Disk Usage" value={95} unit="%" icon="💿" isDark={false} threshold={80} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("metric-card-critical");
    });

    // Positive Test: Verify card with trend
    it("should match snapshot with trend", () => {
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <MetricCard title="Active Models" value={3} unit="/10" icon="🤖" isDark={false} threshold={10} trend={15} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("metric-card-with-trend");
    });

    // Negative Test: Verify card with negative trend
    it("should match snapshot with negative trend", () => {
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <MetricCard title="Requests" value={120} unit="%" icon="📊" isDark={false} threshold={80} trend={-5} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("metric-card-negative-trend");
    });

    // Positive Test: Verify card without icon
    it("should match snapshot without icon", () => {
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <MetricCard title="Custom Metric" value={50} unit="%" isDark={false} threshold={80} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("metric-card-no-icon");
    });
  });

  describe("ModelsListCard Component", () => {
    // Positive Test: Verify card with models loaded
    it("should match snapshot with models", () => {
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <ModelsListCard models={mockModels} isDark={false} onToggleModel={jest.fn()} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("models-list-with-models");
    });

    // Negative Test: Verify empty card
    it("should match snapshot with empty models", () => {
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <ModelsListCard models={[]} isDark={false} onToggleModel={jest.fn()} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("models-list-empty");
    });

    // Positive Test: Verify card in dark mode
    it("should match snapshot in dark mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={true}>
          <ModelsListCard models={mockModels} isDark={true} onToggleModel={jest.fn()} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("models-list-dark");
    });
  });

  describe("QuickActionsCard Component", () => {
    // Positive Test: Verify card in light mode
    it("should match snapshot in light mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <QuickActionsCard
            isDark={false}
            onDownloadLogs={jest.fn()}
            onRestartServer={jest.fn()}
            onStartServer={jest.fn()}
          />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("quick-actions-light");
    });

    // Positive Test: Verify card in dark mode
    it("should match snapshot in dark mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={true}>
          <QuickActionsCard
            isDark={true}
            onDownloadLogs={jest.fn()}
            onRestartServer={jest.fn()}
            onStartServer={jest.fn()}
          />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("quick-actions-dark");
    });
  });

  describe("DashboardHeader Component", () => {
    // Positive Test: Verify header with connection
    it("should match snapshot with connected status", () => {
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <DashboardHeader isConnected={true} metrics={mockMetrics} onRefresh={jest.fn()} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("header-connected");
    });

    // Negative Test: Verify header without connection
    it("should match snapshot with disconnected status", () => {
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <DashboardHeader isConnected={false} metrics={mockMetrics} onRefresh={jest.fn()} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("header-disconnected");
    });

    // Positive Test: Verify header without metrics
    it("should match snapshot without metrics", () => {
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <DashboardHeader isConnected={true} metrics={null} onRefresh={jest.fn()} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("header-no-metrics");
    });

    // Positive Test: Verify header in dark mode
    it("should match snapshot in dark mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={true}>
          <DashboardHeader isConnected={true} metrics={mockMetrics} onRefresh={jest.fn()} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("header-dark");
    });
  });

  describe("Responsive Layouts", () => {
    // Positive Test: Verify mobile layout
    it("should match snapshot at mobile width (375px)", () => {
      Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 375 });
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <ModernDashboard />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("dashboard-mobile");
    });

    // Positive Test: Verify tablet layout
    it("should match snapshot at tablet width (768px)", () => {
      Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 768 });
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <ModernDashboard />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("dashboard-tablet");
    });

    // Positive Test: Verify desktop layout
    it("should match snapshot at desktop width (1024px)", () => {
      Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1024 });
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <ModernDashboard />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("dashboard-desktop");
    });

    // Positive Test: Verify large desktop layout
    it("should match snapshot at large desktop width (1440px)", () => {
      Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1440 });
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <ModernDashboard />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("dashboard-large-desktop");
    });
  });

  describe("Accessibility in Snapshots", () => {
    // Positive Test: Verify MetricCard has proper structure
    it("should have accessible structure in MetricCard", () => {
      render(
        <MockThemeProvider isDark={false}>
          <MetricCard title="CPU Usage" value={45} unit="%" icon="🖥️" isDark={false} threshold={80} />
        </MockThemeProvider>
      );
      expect(screen.getByText("CPU Usage")).toBeInTheDocument();
      expect(screen.getByText("45.0%")).toBeInTheDocument();
    });

    // Positive Test: Verify ModelsListCard has model labels
    it("should have model labels in ModelsListCard", () => {
      render(
        <MockThemeProvider isDark={false}>
          <ModelsListCard models={mockModels} isDark={false} onToggleModel={jest.fn()} />
        </MockThemeProvider>
      );
      mockModels.forEach((model) => {
        expect(screen.getByText(model.name)).toBeInTheDocument();
      });
    });

    // Positive Test: Verify DashboardHeader has refresh button
    it("should have refresh button accessible", () => {
      render(
        <MockThemeProvider isDark={false}>
          <DashboardHeader isConnected={true} metrics={mockMetrics} onRefresh={jest.fn()} />
        </MockThemeProvider>
      );
      const refreshButton = screen.getByRole("button", { name: /refresh/i });
      expect(refreshButton).toBeInTheDocument();
    });
  });
});
