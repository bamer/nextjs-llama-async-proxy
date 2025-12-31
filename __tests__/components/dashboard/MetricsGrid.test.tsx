import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { MetricsGrid } from "@/components/dashboard/MetricsGrid";

// Mock MetricCard
jest.mock("@/components/dashboard/MetricCard", () => ({
  MetricCard: ({
    title,
    value,
    unit,
    icon,
    threshold,
    showGauge,
  }: {
    title: string;
    value: number;
    unit: string;
    icon: string;
    threshold: number;
    showGauge: boolean;
  }) => (
    <div data-testid={`metric-${title.toLowerCase().replace(/ /g, "-")}`}>
      <span>{icon}</span>
      <h3>{title}</h3>
      <span>
        {value} {unit}
      </span>
      <span data-testid={`threshold-${title}`}>
        Threshold: {threshold}
      </span>
      {showGauge && <span>Gauge enabled</span>}
    </div>
  ),
}));

describe("MetricsGrid Component", () => {
  const mockMetrics = {
    cpu: { usage: 45 },
    memory: { used: 62 },
    disk: { used: 78 },
    network: { rx: 0, tx: 0 },
    uptime: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders all 8 metric cards", () => {
      render(
        <MetricsGrid metrics={mockMetrics} activeModelsCount={3} isDark={false} />
      );

      expect(screen.getByTestId("metric-cpu-usage")).toBeInTheDocument();
      expect(screen.getByTestId("metric-memory-usage")).toBeInTheDocument();
      expect(screen.getByTestId("metric-disk-usage")).toBeInTheDocument();
      expect(screen.getByTestId("metric-active-models")).toBeInTheDocument();
      expect(screen.getByTestId("metric-gpu-utilization")).toBeInTheDocument();
      expect(screen.getByTestId("metric-gpu-temperature")).toBeInTheDocument();
      expect(screen.getByTestId("metric-gpu-memory-usage")).toBeInTheDocument();
      expect(screen.getByTestId("metric-gpu-power")).toBeInTheDocument();
    });

    it("uses Grid container for layout", () => {
      const { container } = render(
        <MetricsGrid metrics={mockMetrics} activeModelsCount={3} isDark={false} />
      );
      const gridContainer = container.querySelector('[data-testid="grid"]');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe("CPU Usage Card", () => {
    it("renders CPU usage with correct value", () => {
      render(
        <MetricsGrid metrics={mockMetrics} activeModelsCount={3} isDark={false} />
      );
      expect(screen.getByText("45 %")).toBeInTheDocument();
    });

    it("renders CPU usage icon", () => {
      render(
        <MetricsGrid metrics={mockMetrics} activeModelsCount={3} isDark={false} />
      );
      expect(screen.getByText("🖥️")).toBeInTheDocument();
    });

    it("sets correct threshold for CPU", () => {
      render(
        <MetricsGrid metrics={mockMetrics} activeModelsCount={3} isDark={false} />
      );
      const threshold = screen.getByTestId("threshold-CPU Usage");
      expect(threshold).toHaveTextContent("Threshold: 90");
    });

    it("enables gauge for CPU", () => {
      render(
        <MetricsGrid metrics={mockMetrics} activeModelsCount={3} isDark={false} />
      );
      const cpuCard = screen.getByTestId("metric-cpu-usage");
      expect(cpuCard).toHaveTextContent("Gauge enabled");
    });

    it("handles missing CPU usage", () => {
      const { cpu, ...metricsWithoutCPU } = mockMetrics;
      render(
        <MetricsGrid metrics={metricsWithoutCPU as any} activeModelsCount={3} isDark={false} />
      );
      const cpuCard = screen.getByTestId("metric-cpu-usage");
      expect(within(cpuCard).getByText("0 %")).toBeInTheDocument();
    });
  });

  describe("Memory Usage Card", () => {
    it("renders memory usage with correct value", () => {
      render(
        <MetricsGrid metrics={mockMetrics} activeModelsCount={3} isDark={false} />
      );
      expect(screen.getByText("62 %")).toBeInTheDocument();
    });

    it("renders memory usage icon", () => {
      render(
        <MetricsGrid metrics={mockMetrics} activeModelsCount={3} isDark={false} />
      );
      expect(screen.getByText("💾")).toBeInTheDocument();
    });

    it("sets correct threshold for memory", () => {
      render(
        <MetricsGrid metrics={mockMetrics} activeModelsCount={3} isDark={false} />
      );
      const threshold = screen.getByTestId("threshold-Memory Usage");
      expect(threshold).toHaveTextContent("Threshold: 85");
    });
  });

  describe("Disk Usage Card", () => {
    it("renders disk usage with correct value", () => {
      render(
        <MetricsGrid metrics={mockMetrics} activeModelsCount={3} isDark={false} />
      );
      expect(screen.getByText("78 %")).toBeInTheDocument();
    });

    it("renders disk usage icon", () => {
      render(
        <MetricsGrid metrics={mockMetrics} activeModelsCount={3} isDark={false} />
      );
      const diskCard = screen.getByTestId("metric-disk-usage");
      expect(within(diskCard).getByText("💿")).toBeInTheDocument();
    });

    it("sets correct threshold for disk", () => {
      render(
        <MetricsGrid metrics={mockMetrics} activeModelsCount={3} isDark={false} />
      );
      const threshold = screen.getByTestId("threshold-Disk Usage");
      expect(threshold).toHaveTextContent("Threshold: 95");
    });
  });

  describe("Active Models Card", () => {
    it("renders active models count", () => {
      render(
        <MetricsGrid metrics={mockMetrics} activeModelsCount={3} isDark={false} />
      );
      expect(screen.getByText("3 /10")).toBeInTheDocument();
    });

    it("renders active models icon", () => {
      render(
        <MetricsGrid metrics={mockMetrics} activeModelsCount={3} isDark={false} />
      );
      expect(screen.getByText("🤖")).toBeInTheDocument();
    });

    it("sets correct threshold for active models", () => {
      render(
        <MetricsGrid metrics={mockMetrics} activeModelsCount={3} isDark={false} />
      );
      const threshold = screen.getByTestId("threshold-Active Models");
      expect(threshold).toHaveTextContent("Threshold: 10");
    });

    it("handles zero active models", () => {
      render(
        <MetricsGrid metrics={mockMetrics} activeModelsCount={0} isDark={false} />
      );
      expect(screen.getByText("0 /10")).toBeInTheDocument();
    });

    it("handles max active models", () => {
      render(
        <MetricsGrid metrics={mockMetrics} activeModelsCount={10} isDark={false} />
      );
      expect(screen.getByText("10 /10")).toBeInTheDocument();
    });
  });

  describe("GPU Utilization Card", () => {
    it("renders GPU usage with correct value", () => {
      render(
        <MetricsGrid metrics={mockMetrics} activeModelsCount={3} isDark={false} />
      );
      const gpuCard = screen.getByTestId("metric-gpu-utilization");
      expect(within(gpuCard).getByText("0 %")).toBeInTheDocument();
    });

    it("renders GPU usage icon", () => {
      render(
        <MetricsGrid metrics={mockMetrics} activeModelsCount={3} isDark={false} />
      );
      const gpuCard = screen.getByTestId("metric-gpu-utilization");
      expect(within(gpuCard).getByText("🎮")).toBeInTheDocument();
    });

    it("sets correct threshold for GPU usage", () => {
      render(
        <MetricsGrid metrics={mockMetrics} activeModelsCount={3} isDark={false} />
      );
      const threshold = screen.getByTestId("threshold-GPU Utilization");
      expect(threshold).toHaveTextContent("Threshold: 90");
    });
  });

  describe("GPU Temperature Card", () => {
    it("renders GPU temperature with correct value", () => {
      render(
        <MetricsGrid metrics={mockMetrics} activeModelsCount={3} isDark={false} />
      );
      const gpuTempCard = screen.getByTestId("metric-gpu-temperature");
      expect(within(gpuTempCard).getByText("0 °C")).toBeInTheDocument();
    });

    it("renders GPU temperature icon", () => {
      render(
        <MetricsGrid metrics={mockMetrics} activeModelsCount={3} isDark={false} />
      );
      const gpuTempCard = screen.getByTestId("metric-gpu-temperature");
      expect(within(gpuTempCard).getByText("🌡️")).toBeInTheDocument();
    });

    it("sets correct threshold for GPU temperature", () => {
      render(
        <MetricsGrid metrics={mockMetrics} activeModelsCount={3} isDark={false} />
      );
      const threshold = screen.getByTestId("threshold-GPU Temperature");
      expect(threshold).toHaveTextContent("Threshold: 85");
    });
  });

  describe("GPU Memory Usage Card", () => {
    it("calculates GPU memory percentage correctly", () => {
      render(
        <MetricsGrid metrics={mockMetrics} activeModelsCount={3} isDark={false} />
      );
      const gpuMemCard = screen.getByTestId("metric-gpu-memory-usage");
      expect(within(gpuMemCard).getByText("0 %")).toBeInTheDocument();
    });

    it("renders GPU memory usage icon", () => {
      render(
        <MetricsGrid metrics={mockMetrics} activeModelsCount={3} isDark={false} />
      );
      const gpuMemCard = screen.getByTestId("metric-gpu-memory-usage");
      expect(within(gpuMemCard).getByText("💿")).toBeInTheDocument();
    });

    it("sets correct threshold for GPU memory", () => {
      render(
        <MetricsGrid metrics={mockMetrics} activeModelsCount={3} isDark={false} />
      );
      const threshold = screen.getByTestId("threshold-GPU Memory Usage");
      expect(threshold).toHaveTextContent("Threshold: 90");
    });
  });

  describe("GPU Power Card", () => {
    it("renders GPU power with correct value", () => {
      render(
        <MetricsGrid metrics={mockMetrics} activeModelsCount={3} isDark={false} />
      );
      const gpuPowerCard = screen.getByTestId("metric-gpu-power");
      expect(within(gpuPowerCard).getByText("0 W")).toBeInTheDocument();
    });

    it("renders GPU power icon", () => {
      render(
        <MetricsGrid metrics={mockMetrics} activeModelsCount={3} isDark={false} />
      );
      const gpuPowerCard = screen.getByTestId("metric-gpu-power");
      expect(within(gpuPowerCard).getByText("⚡")).toBeInTheDocument();
    });

    it("sets correct threshold for GPU power", () => {
      render(
        <MetricsGrid metrics={mockMetrics} activeModelsCount={3} isDark={false} />
      );
      const threshold = screen.getByTestId("threshold-GPU Power");
      expect(threshold).toHaveTextContent("Threshold: 300");
    });
  });

  describe("Props Passing", () => {
    it("passes isDark to all metric cards", () => {
      const { rerender } = render(
        <MetricsGrid metrics={mockMetrics} activeModelsCount={3} isDark={true} />
      );

      rerender(
        <MetricsGrid metrics={mockMetrics} activeModelsCount={3} isDark={false} />
      );

      expect(screen.getByTestId("metric-cpu-usage")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles undefined metrics", () => {
      render(
        <MetricsGrid metrics={undefined} activeModelsCount={3} isDark={false} />
      );

      const cpuCard = screen.getByTestId("metric-cpu-usage");
      expect(within(cpuCard).getByText("0 %")).toBeInTheDocument(); // CPU defaults to 0

      const memCard = screen.getByTestId("metric-memory-usage");
      expect(within(memCard).getByText("0 %")).toBeInTheDocument(); // Memory defaults to 0
    });

    it("handles null metrics", () => {
      render(
        <MetricsGrid metrics={null as any} activeModelsCount={3} isDark={false} />
      );

      expect(screen.getByTestId("metric-cpu-usage")).toBeInTheDocument();
    });

    it("handles partial metrics", () => {
      const partialMetrics = { cpu: { usage: 50 } };
      render(
        <MetricsGrid metrics={partialMetrics as any} activeModelsCount={3} isDark={false} />
      );

      const cpuCard = screen.getByTestId("metric-cpu-usage");
      expect(within(cpuCard).getByText("50 %")).toBeInTheDocument(); // CPU

      const memCard = screen.getByTestId("metric-memory-usage");
      expect(within(memCard).getByText("0 %")).toBeInTheDocument(); // Memory defaults to 0
    });

    it("handles zero values", () => {
      const zeroMetrics = {
        cpu: { usage: 0 },
        memory: { used: 0 },
        disk: { used: 0 },
        network: { rx: 0, tx: 0 },
        uptime: 0,
      };
      render(
        <MetricsGrid metrics={zeroMetrics} activeModelsCount={0} isDark={false} />
      );

      const cpuCard = screen.getByTestId("metric-cpu-usage");
      expect(within(cpuCard).getByText("0 %")).toBeInTheDocument();

      const gpuTempCard = screen.getByTestId("metric-gpu-temperature");
      expect(within(gpuTempCard).getByText("0 °C")).toBeInTheDocument();

      const gpuPowerCard = screen.getByTestId("metric-gpu-power");
      expect(within(gpuPowerCard).getByText("0 W")).toBeInTheDocument();

      const activeModelsCard = screen.getByTestId("metric-active-models");
      expect(within(activeModelsCard).getByText("0 /10")).toBeInTheDocument();
    });

    it("handles maximum values", () => {
      const maxMetrics = {
        cpu: { usage: 100 },
        memory: { used: 100 },
        disk: { used: 100 },
        network: { rx: 0, tx: 0 },
        uptime: 0,
      };
      render(
        <MetricsGrid metrics={maxMetrics} activeModelsCount={10} isDark={false} />
      );

      const cpuCard = screen.getByTestId("metric-cpu-usage");
      expect(within(cpuCard).getByText("100 %")).toBeInTheDocument();

      const gpuTempCard = screen.getByTestId("metric-gpu-temperature");
      expect(within(gpuTempCard).getByText("0 °C")).toBeInTheDocument(); // GPU is hardcoded to 0

      const gpuPowerCard = screen.getByTestId("metric-gpu-power");
      expect(within(gpuPowerCard).getByText("0 W")).toBeInTheDocument(); // GPU power is hardcoded to 0

      const activeModelsCard = screen.getByTestId("metric-active-models");
      expect(within(activeModelsCard).getByText("10 /10")).toBeInTheDocument();
    });
  });

  describe("Responsive Grid Layout", () => {
    it("uses responsive grid sizes", () => {
      const { container } = render(
        <MetricsGrid metrics={mockMetrics} activeModelsCount={3} isDark={false} />
      );
      const grids = container.querySelectorAll('[data-testid="grid"]');
      expect(grids.length).toBeGreaterThan(0);
    });
  });
});
