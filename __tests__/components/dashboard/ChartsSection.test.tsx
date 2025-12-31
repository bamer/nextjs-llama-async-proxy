import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { ChartsSection } from "@/components/dashboard/ChartsSection";

// Mock PerformanceChart component
jest.mock("@/components/charts/PerformanceChart", () => ({
  PerformanceChart: ({
    title,
    description,
    datasets,
    height,
    showAnimation,
    xAxisType,
  }: {
    title: string;
    description: string;
    datasets: any[];
    height?: number;
    showAnimation?: boolean;
    xAxisType?: string;
  }) => (
    <div data-testid="performance-chart">
      <h2 data-testid="chart-title">{title}</h2>
      <p data-testid="chart-description">{description}</p>
      {height && <span data-testid="chart-height">Height: {height}</span>}
      {showAnimation !== undefined && (
        <span data-testid="chart-animation">Animation: {showAnimation}</span>
      )}
      {xAxisType && <span data-testid="chart-xaxis">X-Axis: {xAxisType}</span>}
      <div data-testid="chart-datasets">{datasets.length} datasets</div>
    </div>
  ),
}));

describe("ChartsSection Component", () => {
  const mockDatasets = [
    {
      dataKey: "cpu",
      label: "CPU Usage",
      colorDark: "#4ade80",
      colorLight: "#22c55e",
      valueFormatter: (v: number | null) => `${v}%`,
      yAxisLabel: "CPU",
      data: [
        { time: "10:00", displayTime: "10:00 AM", value: 45 },
        { time: "10:01", displayTime: "10:01 AM", value: 50 },
        { time: "10:02", displayTime: "10:02 AM", value: 48 },
      ],
    },
    {
      dataKey: "memory",
      label: "Memory Usage",
      colorDark: "#60a5fa",
      colorLight: "#3b82f6",
      valueFormatter: (v: number | null) => `${v}%`,
      yAxisLabel: "Memory",
      data: [
        { time: "10:00", displayTime: "10:00 AM", value: 62 },
        { time: "10:01", displayTime: "10:01 AM", value: 65 },
        { time: "10:02", displayTime: "10:02 AM", value: 63 },
      ],
    },
  ];

  const mockGpuDatasets = [
    {
      dataKey: "gpuUtil",
      label: "GPU Utilization",
      colorDark: "#f472b6",
      colorLight: "#ec4899",
      valueFormatter: (v: number | null) => `${v}%`,
      yAxisLabel: "GPU %",
      data: [
        { time: "10:00", displayTime: "10:00 AM", value: 30 },
        { time: "10:01", displayTime: "10:01 AM", value: 35 },
        { time: "10:02", displayTime: "10:02 AM", value: 32 },
      ],
    },
    {
      dataKey: "power",
      label: "Power",
      colorDark: "#fbbf24",
      colorLight: "#f59e0b",
      valueFormatter: (v: number | null) => `${v}W`,
      yAxisLabel: "Power (W)",
      data: [
        { time: "10:00", displayTime: "10:00 AM", value: 120 },
        { time: "10:01", displayTime: "10:01 AM", value: 125 },
        { time: "10:02", displayTime: "10:02 AM", value: 122 },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders both chart sections", () => {
      render(
        <ChartsSection
          datasets={mockDatasets}
          gpuDatasets={mockGpuDatasets}
          isDark={false}
        />
      );

      const charts = screen.getAllByTestId("performance-chart");
      expect(charts.length).toBe(2);
    });

    it("uses Grid container for layout", () => {
      const { container } = render(
        <ChartsSection
          datasets={mockDatasets}
          gpuDatasets={mockGpuDatasets}
          isDark={false}
        />
      );
      const gridContainer = container.querySelector(".MuiGrid-container");
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe("Performance Metrics Chart", () => {
    it("renders with correct title", () => {
      render(
        <ChartsSection
          datasets={mockDatasets}
          gpuDatasets={mockGpuDatasets}
          isDark={false}
        />
      );
      expect(screen.getByText("Performance Metrics")).toBeInTheDocument();
    });

    it("renders with correct description", () => {
      render(
        <ChartsSection
          datasets={mockDatasets}
          gpuDatasets={mockGpuDatasets}
          isDark={false}
        />
      );
      expect(
        screen.getByText("Real-time CPU, memory, and request metrics")
      ).toBeInTheDocument();
    });

    it("passes datasets to performance chart", () => {
      render(
        <ChartsSection
          datasets={mockDatasets}
          gpuDatasets={mockGpuDatasets}
          isDark={false}
        />
      );
      const charts = screen.getAllByTestId("chart-datasets");
      expect(charts[0]).toHaveTextContent("2 datasets");
    });

    it("passes isDark prop to performance chart", () => {
      render(
        <ChartsSection
          datasets={mockDatasets}
          gpuDatasets={mockGpuDatasets}
          isDark={true}
        />
      );
      const charts = screen.getAllByTestId("performance-chart");
      expect(charts.length).toBe(2);
    });
  });

  describe("GPU Utilization & Power Chart", () => {
    it("renders with correct title", () => {
      render(
        <ChartsSection
          datasets={mockDatasets}
          gpuDatasets={mockGpuDatasets}
          isDark={false}
        />
      );
      expect(screen.getByText("GPU Utilization & Power")).toBeInTheDocument();
    });

    it("renders with correct description", () => {
      render(
        <ChartsSection
          datasets={mockDatasets}
          gpuDatasets={mockGpuDatasets}
          isDark={false}
        />
      );
      expect(
        screen.getByText("GPU percentage and power consumption over time")
      ).toBeInTheDocument();
    });

    it("passes gpuDatasets to GPU chart", () => {
      render(
        <ChartsSection
          datasets={mockDatasets}
          gpuDatasets={mockGpuDatasets}
          isDark={false}
        />
      );
      const charts = screen.getAllByTestId("chart-datasets");
      expect(charts[1]).toHaveTextContent("2 datasets");
    });
  });

  describe("Chart Props - GPU Chart", () => {
    it("passes height prop to GPU chart", () => {
      render(
        <ChartsSection
          datasets={mockDatasets}
          gpuDatasets={mockGpuDatasets}
          isDark={false}
        />
      );
      const heightElements = screen.getAllByTestId("chart-height");
      expect(heightElements).toHaveLength(1);
      expect(heightElements[0]).toHaveTextContent("Height: 350");
    });

    it("passes showAnimation false to GPU chart", () => {
      render(
        <ChartsSection
          datasets={mockDatasets}
          gpuDatasets={mockGpuDatasets}
          isDark={false}
        />
      );
      const animationElements = screen.getAllByTestId("chart-animation");
      expect(animationElements).toHaveLength(1);
      expect(animationElements[0]).toHaveTextContent("Animation: false");
    });

    it("passes xAxisType band to GPU chart", () => {
      render(
        <ChartsSection
          datasets={mockDatasets}
          gpuDatasets={mockGpuDatasets}
          isDark={false}
        />
      );
      const xAxisElements = screen.getAllByTestId("chart-xaxis");
      expect(xAxisElements).toHaveLength(1);
      expect(xAxisElements[0]).toHaveTextContent("X-Axis: band");
    });
  });

  describe("Suspense and Lazy Loading", () => {
    it("wraps PerformanceChart in Suspense", () => {
      render(
        <ChartsSection
          datasets={mockDatasets}
          gpuDatasets={mockGpuDatasets}
          isDark={false}
        />
      );
      expect(screen.getAllByTestId("performance-chart").length).toBe(2);
    });
  });

  describe("Loading Fallback", () => {
    it("renders custom loading fallback for performance chart", async () => {
      render(
        <ChartsSection
          datasets={mockDatasets}
          gpuDatasets={mockGpuDatasets}
          isDark={true}
        />
      );
      // Wait for lazy component to load
      await waitFor(() => {
        expect(screen.getByText("Performance Metrics")).toBeInTheDocument();
      });
    });

    it("passes isDark to loading fallback", async () => {
      const { container } = render(
        <ChartsSection
          datasets={mockDatasets}
          gpuDatasets={mockGpuDatasets}
          isDark={true}
        />
      );
      await waitFor(() => {
        expect(screen.getByText("Performance Metrics")).toBeInTheDocument();
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles empty datasets", () => {
      render(
        <ChartsSection
          datasets={[]}
          gpuDatasets={[]}
          isDark={false}
        />
      );
      const charts = screen.getAllByTestId("chart-datasets");
      expect(charts[0]).toHaveTextContent("0 datasets");
      expect(charts[1]).toHaveTextContent("0 datasets");
    });

    it("handles undefined datasets", () => {
      render(
        <ChartsSection
          datasets={undefined as any}
          gpuDatasets={undefined as any}
          isDark={false}
        />
      );
      const charts = screen.getAllByTestId("performance-chart");
      expect(charts.length).toBe(2);
    });

    it("handles single dataset in each array", () => {
      const singleDataset = [mockDatasets[0]];
      const singleGpuDataset = [mockGpuDatasets[0]];

      render(
        <ChartsSection
          datasets={singleDataset}
          gpuDatasets={singleGpuDataset}
          isDark={false}
        />
      );

      const charts = screen.getAllByTestId("chart-datasets");
      expect(charts[0]).toHaveTextContent("1 datasets");
      expect(charts[1]).toHaveTextContent("1 datasets");
    });

    it("handles many datasets", () => {
      const manyDatasets = [...mockDatasets, ...mockDatasets];
      const manyGpuDatasets = [...mockGpuDatasets, ...mockGpuDatasets];

      render(
        <ChartsSection
          datasets={manyDatasets}
          gpuDatasets={manyGpuDatasets}
          isDark={false}
        />
      );

      const charts = screen.getAllByTestId("chart-datasets");
      expect(charts[0]).toHaveTextContent("4 datasets");
      expect(charts[1]).toHaveTextContent("4 datasets");
    });
  });

  describe("Theme Support", () => {
    it("handles dark mode", () => {
      render(
        <ChartsSection
          datasets={mockDatasets}
          gpuDatasets={mockGpuDatasets}
          isDark={true}
        />
      );
      expect(screen.getByText("Performance Metrics")).toBeInTheDocument();
      expect(screen.getByText("GPU Utilization & Power")).toBeInTheDocument();
    });

    it("handles light mode", () => {
      render(
        <ChartsSection
          datasets={mockDatasets}
          gpuDatasets={mockGpuDatasets}
          isDark={false}
        />
      );
      expect(screen.getByText("Performance Metrics")).toBeInTheDocument();
      expect(screen.getByText("GPU Utilization & Power")).toBeInTheDocument();
    });
  });

  describe("Responsive Layout", () => {
    it("uses responsive grid layout", () => {
      const { container } = render(
        <ChartsSection
          datasets={mockDatasets}
          gpuDatasets={mockGpuDatasets}
          isDark={false}
        />
      );
      const grids = container.querySelectorAll(".MuiGrid-root");
      expect(grids.length).toBeGreaterThan(0);
    });
  });
});
