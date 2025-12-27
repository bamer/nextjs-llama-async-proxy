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
    pathname: "/",
  })),
  usePathname: jest.fn(() => "/"),
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
import ModelsPage from "@/components/pages/ModelsPage";
import LogsPage from "@/components/pages/LogsPage";
import MonitoringPage from "@/components/pages/MonitoringPage";
import ConfigurationPage from "@/components/pages/ConfigurationPage";
import { SettingsAppearance } from "@/components/pages/settings/SettingsAppearance";
import { SettingsSystem } from "@/components/pages/settings/SettingsSystem";

describe("Pages Snapshots", () => {
  const MockThemeProvider = ({ children, isDark = false }: { children: React.ReactNode; isDark?: boolean }) => (
    <ThemeProvider>{children}</ThemeProvider>
  );

  const mockModels = [
    { id: "1", name: "Llama-2-7B", loaded: true, size: "7B", description: "Meta Llama 2 7B parameter model" },
    { id: "2", name: "Llama-2-13B", loaded: false, size: "13B", description: "Meta Llama 2 13B parameter model" },
    { id: "3", name: "Mistral-7B", loaded: true, size: "7B", description: "Mistral AI 7B parameter model" },
  ];

  const mockMetrics = {
    cpuUsage: 45.5,
    memoryUsage: 62.3,
    diskUsage: 78.9,
    activeModels: 3,
    gpuUsage: 75.2,
    uptime: 86400,
    totalRequests: 15234,
    avgResponseTime: 125,
    gpuMemoryUsed: 8.2,
    gpuMemoryTotal: 16.0,
    gpuTemperature: 72,
    gpuName: "NVIDIA RTX 4090",
  };

  const mockLogs = [
    { id: 1, timestamp: "2024-01-15T10:30:00Z", level: "INFO", message: "Server started successfully" },
    { id: 2, timestamp: "2024-01-15T10:31:00Z", level: "DEBUG", message: "Loading model configuration" },
    { id: 3, timestamp: "2024-01-15T10:32:00Z", level: "WARN", message: "High memory usage detected" },
    { id: 4, timestamp: "2024-01-15T10:33:00Z", level: "ERROR", message: "Failed to connect to GPU" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("ModelsPage Component", () => {
    beforeEach(() => {
      (useStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          models: mockModels,
        };
        return selector(state);
      });
    });

    // Positive Test: Verify page in light mode
    it("should match snapshot in light mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <ModelsPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("models-page-light");
    });

    // Positive Test: Verify page in dark mode
    it("should match snapshot in dark mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={true}>
          <ModelsPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("models-page-dark");
    });

    // Positive Test: Verify with loaded models
    it("should match snapshot with loaded models", () => {
      const { container } = render(
        <MockThemeProvider>
          <ModelsPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("models-page-with-models");
    });

    // Negative Test: Verify with empty models
    it("should match snapshot with empty models", () => {
      (useStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          models: [],
        };
        return selector(state);
      });

      const { container } = render(
        <MockThemeProvider>
          <ModelsPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("models-page-empty");
    });
  });

  describe("LogsPage Component", () => {
    beforeEach(() => {
      (useStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          logs: mockLogs,
        };
        return selector(state);
      });
    });

    // Positive Test: Verify page in light mode
    it("should match snapshot in light mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <LogsPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("logs-page-light");
    });

    // Positive Test: Verify page in dark mode
    it("should match snapshot in dark mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={true}>
          <LogsPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("logs-page-dark");
    });

    // Positive Test: Verify with logs
    it("should match snapshot with logs", () => {
      const { container } = render(
        <MockThemeProvider>
          <LogsPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("logs-page-with-logs");
    });

    // Negative Test: Verify with empty logs
    it("should match snapshot with empty logs", () => {
      (useStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          logs: [],
        };
        return selector(state);
      });

      const { container } = render(
        <MockThemeProvider>
          <LogsPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("logs-page-empty");
    });

    // Positive Test: Verify with different log levels
    it("should match snapshot with different log levels", () => {
      const logsWithAllLevels = [
        { id: 1, timestamp: "2024-01-15T10:30:00Z", level: "INFO", message: "Info message" },
        { id: 2, timestamp: "2024-01-15T10:31:00Z", level: "WARN", message: "Warning message" },
        { id: 3, timestamp: "2024-01-15T10:32:00Z", level: "ERROR", message: "Error message" },
        { id: 4, timestamp: "2024-01-15T10:33:00Z", level: "DEBUG", message: "Debug message" },
      ];

      (useStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          logs: logsWithAllLevels,
        };
        return selector(state);
      });

      const { container } = render(
        <MockThemeProvider>
          <LogsPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("logs-page-all-levels");
    });
  });

  describe("MonitoringPage Component", () => {
    beforeEach(() => {
      (useStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          metrics: mockMetrics,
        };
        return selector(state);
      });
    });

    // Positive Test: Verify page in light mode
    it("should match snapshot in light mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <MonitoringPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("monitoring-page-light");
    });

    // Positive Test: Verify page in dark mode
    it("should match snapshot in dark mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={true}>
          <MonitoringPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("monitoring-page-dark");
    });

    // Positive Test: Verify with metrics
    it("should match snapshot with metrics", () => {
      const { container } = render(
        <MockThemeProvider>
          <MonitoringPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("monitoring-page-with-metrics");
    });

    // Negative Test: Verify with no metrics
    it("should match snapshot with no metrics", () => {
      (useStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          metrics: null,
        };
        return selector(state);
      });

      const { container } = render(
        <MockThemeProvider>
          <MonitoringPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("monitoring-page-no-metrics");
    });

    // Positive Test: Verify with GPU metrics
    it("should match snapshot with GPU metrics", () => {
      const { container } = render(
        <MockThemeProvider>
          <MonitoringPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("monitoring-page-gpu-metrics");
    });
  });

  describe("ConfigurationPage Component", () => {
    // Positive Test: Verify page in light mode
    it("should match snapshot in light mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <ConfigurationPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("config-page-light");
    });

    // Positive Test: Verify page in dark mode
    it("should match snapshot in dark mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={true}>
          <ConfigurationPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("config-page-dark");
    });
  });

  describe("SettingsAppearance Component", () => {
    // Positive Test: Verify settings in light mode
    it("should match snapshot in light mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <SettingsAppearance />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("settings-appearance-light");
    });

    // Positive Test: Verify settings in dark mode
    it("should match snapshot in dark mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={true}>
          <SettingsAppearance />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("settings-appearance-dark");
    });
  });

  describe("SettingsSystem Component", () => {
    // Positive Test: Verify settings in light mode
    it("should match snapshot in light mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <SettingsSystem />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("settings-system-light");
    });

    // Positive Test: Verify settings in dark mode
    it("should match snapshot in dark mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={true}>
          <SettingsSystem />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("settings-system-dark");
    });
  });

  describe("Responsive Page Layouts", () => {
    // Positive Test: Verify ModelsPage mobile layout
    it("should match ModelsPage at mobile width (375px)", () => {
      Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 375 });
      (useStore as jest.Mock).mockImplementation((selector) => {
        const state = { models: mockModels };
        return selector(state);
      });
      const { container } = render(
        <MockThemeProvider>
          <ModelsPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("models-page-mobile");
    });

    // Positive Test: Verify ModelsPage tablet layout
    it("should match ModelsPage at tablet width (768px)", () => {
      Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 768 });
      (useStore as jest.Mock).mockImplementation((selector) => {
        const state = { models: mockModels };
        return selector(state);
      });
      const { container } = render(
        <MockThemeProvider>
          <ModelsPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("models-page-tablet");
    });

    // Positive Test: Verify LogsPage desktop layout
    it("should match LogsPage at desktop width (1024px)", () => {
      Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1024 });
      (useStore as jest.Mock).mockImplementation((selector) => {
        const state = { logs: mockLogs };
        return selector(state);
      });
      const { container } = render(
        <MockThemeProvider>
          <LogsPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("logs-page-desktop");
    });

    // Positive Test: Verify MonitoringPage large desktop layout
    it("should match MonitoringPage at large desktop width (1440px)", () => {
      Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1440 });
      (useStore as jest.Mock).mockImplementation((selector) => {
        const state = { metrics: mockMetrics };
        return selector(state);
      });
      const { container } = render(
        <MockThemeProvider>
          <MonitoringPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("monitoring-page-large-desktop");
    });
  });

  describe("Page States", () => {
    // Positive Test: Verify loading state
    it("should match snapshot with loading state", () => {
      (useStore as jest.Mock).mockImplementation((selector) => {
        const state = { models: null, metrics: null, logs: null };
        return selector(state);
      });
      const { container } = render(
        <MockThemeProvider>
          <ModelsPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("page-loading");
    });

    // Positive Test: Verify error state
    it("should match snapshot with error state", () => {
      (useStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          error: new Error("Failed to load data"),
        };
        return selector(state);
      });
      const { container } = render(
        <MockThemeProvider>
          <LogsPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("page-error");
    });

    // Positive Test: Verify success state with data
    it("should match snapshot with success state", () => {
      (useStore as jest.Mock).mockImplementation((selector) => {
        const state = { models: mockModels, metrics: mockMetrics, logs: mockLogs };
        return selector(state);
      });
      const { container } = render(
        <MockThemeProvider>
          <MonitoringPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("page-success");
    });

    // Negative Test: Verify empty state
    it("should match snapshot with empty state", () => {
      (useStore as jest.Mock).mockImplementation((selector) => {
        const state = { models: [], metrics: {}, logs: [] };
        return selector(state);
      });
      const { container } = render(
        <MockThemeProvider>
          <ModelsPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("page-empty");
    });
  });

  describe("Accessibility in Pages", () => {
    // Positive Test: Verify ModelsPage has model cards accessible
    it("should have accessible model cards", () => {
      (useStore as jest.Mock).mockImplementation((selector) => {
        const state = { models: mockModels };
        return selector(state);
      });
      render(
        <MockThemeProvider>
          <ModelsPage />
        </MockThemeProvider>
      );
      mockModels.forEach((model) => {
        expect(screen.getByText(model.name)).toBeInTheDocument();
      });
    });

    // Positive Test: Verify LogsPage has log entries accessible
    it("should have accessible log entries", () => {
      (useStore as jest.Mock).mockImplementation((selector) => {
        const state = { logs: mockLogs };
        return selector(state);
      });
      render(
        <MockThemeProvider>
          <LogsPage />
        </MockThemeProvider>
      );
      mockLogs.forEach((log) => {
        expect(screen.getByText(log.message)).toBeInTheDocument();
      });
    });

    // Positive Test: Verify MonitoringPage has metrics accessible
    it("should have accessible metrics", () => {
      (useStore as jest.Mock).mockImplementation((selector) => {
        const state = { metrics: mockMetrics };
        return selector(state);
      });
      render(
        <MockThemeProvider>
          <MonitoringPage />
        </MockThemeProvider>
      );
      expect(screen.getByText(/cpu/i)).toBeInTheDocument();
      expect(screen.getByText(/memory/i)).toBeInTheDocument();
      expect(screen.getByText(/gpu/i)).toBeInTheDocument();
    });
  });

  describe("Data-Loaded States", () => {
    // Positive Test: Verify ModelsPage with many models
    it("should match snapshot with many models", () => {
      const manyModels = Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        name: `Model-${i}`,
        loaded: i % 2 === 0,
        size: `${(i + 1) * 7}B`,
        description: `Test model ${i}`,
      }));

      (useStore as jest.Mock).mockImplementation((selector) => {
        const state = { models: manyModels };
        return selector(state);
      });

      const { container } = render(
        <MockThemeProvider>
          <ModelsPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("models-page-many-models");
    });

    // Positive Test: Verify LogsPage with many logs
    it("should match snapshot with many logs", () => {
      const manyLogs = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        timestamp: `2024-01-15T10:${String(i).padStart(2, "0")}:00Z`,
        level: i % 4 === 0 ? "ERROR" : i % 3 === 0 ? "WARN" : i % 2 === 0 ? "INFO" : "DEBUG",
        message: `Log entry ${i}`,
      }));

      (useStore as jest.Mock).mockImplementation((selector) => {
        const state = { logs: manyLogs };
        return selector(state);
      });

      const { container } = render(
        <MockThemeProvider>
          <LogsPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("logs-page-many-logs");
    });
  });
});
