import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";

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
    it("should match snapshot in light mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <ModelsPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("models-page-light");
    });

    it("should match snapshot in dark mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={true}>
          <ModelsPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("models-page-dark");
    });

    it("should match snapshot with loaded models", () => {
      const { container } = render(
        <MockThemeProvider>
          <ModelsPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("models-page-with-models");
    });

    it("should match snapshot with empty models", () => {
      const { container } = render(
        <MockThemeProvider>
          <ModelsPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("models-page-empty");
    });
  });

  describe("LogsPage Component", () => {
    it("should match snapshot in light mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <LogsPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("logs-page-light");
    });

    it("should match snapshot in dark mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={true}>
          <LogsPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("logs-page-dark");
    });

    it("should match snapshot with logs", () => {
      const { container } = render(
        <MockThemeProvider>
          <LogsPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("logs-page-with-logs");
    });

    it("should match snapshot with empty logs", () => {
      const { container } = render(
        <MockThemeProvider>
          <LogsPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("logs-page-empty");
    });

    it("should match snapshot with different log levels", () => {
      const logsWithAllLevels = [
        { id: 1, timestamp: "2024-01-15T10:30:00Z", level: "INFO", message: "Info message" },
        { id: 2, timestamp: "2024-01-15T10:31:00Z", level: "WARN", message: "Warning message" },
        { id: 3, timestamp: "2024-01-15T10:32:00Z", level: "ERROR", message: "Error message" },
        { id: 4, timestamp: "2024-01-15T10:33:00Z", level: "DEBUG", message: "Debug message" },
      ];

      const { container } = render(
        <MockThemeProvider>
          <LogsPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("logs-page-all-levels");
    });
  });

  describe("MonitoringPage Component", () => {
    it("should match snapshot in light mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <MonitoringPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("monitoring-page-light");
    });

    it("should match snapshot in dark mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={true}>
          <MonitoringPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("monitoring-page-dark");
    });

    it("should match snapshot with metrics", () => {
      const { container } = render(
        <MockThemeProvider>
          <MonitoringPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("monitoring-page-with-metrics");
    });

    it("should match snapshot with no metrics", () => {
      const { container } = render(
        <MockThemeProvider>
          <MonitoringPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("monitoring-page-no-metrics");
    });

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
    it("should match snapshot in light mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <ConfigurationPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("config-page-light");
    });

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
    it("should match snapshot in light mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <SettingsAppearance settings={{}} onThemeChange={jest.fn()} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("settings-appearance-light");
    });

    it("should match snapshot in dark mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={true}>
          <SettingsAppearance settings={{}} onThemeChange={jest.fn()} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("settings-appearance-dark");
    });
  });

  describe("SettingsSystem Component", () => {
    it("should match snapshot in light mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={false}>
          <SettingsSystem settings={{}} onSliderChange={jest.fn()} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("settings-system-light");
    });

    it("should match snapshot in dark mode", () => {
      const { container } = render(
        <MockThemeProvider isDark={true}>
          <SettingsSystem settings={{}} onSliderChange={jest.fn()} />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("settings-system-dark");
    });
  });

  describe("Responsive Page Layouts", () => {
    it("should match ModelsPage at mobile width (375px)", () => {
      Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 375 });

      const { container } = render(
        <MockThemeProvider>
          <ModelsPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("models-page-mobile");
    });

    it("should match ModelsPage at tablet width (768px)", () => {
      Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 768 });

      const { container } = render(
        <MockThemeProvider>
          <ModelsPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("models-page-tablet");
    });

    it("should match LogsPage at desktop width (1024px)", () => {
      Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1024 });

      const { container } = render(
        <MockThemeProvider>
          <LogsPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("logs-page-desktop");
    });

    it("should match MonitoringPage at large desktop width (1440px)", () => {
      Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1440 });

      const { container } = render(
        <MockThemeProvider>
          <MonitoringPage />
        </MockThemeProvider>
      );
      expect(container.firstChild).toMatchSnapshot("monitoring-page-large-desktop");
    });
  });

  describe("Accessibility in Pages", () => {
    it("should have accessible model cards", () => {
      render(
        <MockThemeProvider>
          <ModelsPage />
        </MockThemeProvider>
      );

      mockModels.forEach((model) => {
        expect(screen.getByText(model.name)).toBeInTheDocument();
      });
    });

    it("should have accessible log entries", () => {
      render(
        <MockThemeProvider>
          <LogsPage />
        </MockThemeProvider>
      );

      mockLogs.forEach((log) => {
        expect(screen.getByText(log.message)).toBeInTheDocument();
      });
    });

    it("should have accessible metrics", () => {
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
});
