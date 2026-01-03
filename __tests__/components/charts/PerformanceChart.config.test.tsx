/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { PerformanceChart } from "@/components/charts/PerformanceChart";

// Mock @mui/x-charts v8 components
jest.mock("@mui/x-charts", () => ({
  LineChart: React.forwardRef((props: any, ref: any) =>
    React.createElement("div", { ...props, ref, "data-testid": "line-chart" })
  ),
  ChartsXAxis: React.forwardRef((props: any, ref: any) =>
    React.createElement("div", { ...props, ref, "data-testid": "charts-x-axis" })
  ),
  ChartsYAxis: React.forwardRef((props: any, ref: any) =>
    React.createElement("div", { ...props, ref, "data-testid": "charts-y-axis" })
  ),
  ChartsGrid: React.forwardRef((props: any, ref: any) =>
    React.createElement("div", { ...props, ref, "data-testid": "charts-grid" })
  ),
  ChartsTooltip: React.forwardRef((props: any, ref: any) =>
    React.createElement("div", { ...props, ref, "data-testid": "charts-tooltip" })
  ),
}));

/* eslint-enable @typescript-eslint/no-explicit-any */

describe("PerformanceChart - Configuration", () => {
  const mockData = [
    { time: "10:00", displayTime: "10:00", value: 45 },
    { time: "10:05", displayTime: "10:05", value: 50 },
    { time: "10:10", displayTime: "10:10", value: 55 },
  ];

  const renderChart = (props = {}) =>
    render(
      <PerformanceChart
        title="Test Chart"
        description="Test Description"
        datasets={[
          {
            dataKey: "value",
            label: "Value",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            data: mockData,
          },
        ]}
        isDark={false}
        {...props}
      />
    );

  it("handles animation settings", () => {
    const { rerender } = renderChart({
      title: "Animated",
      description: "With animation",
      showAnimation: true,
    });
    expect(screen.getByText("Animated")).toBeInTheDocument();
    rerender(
      <PerformanceChart
        title="Not Animated"
        description="Without animation"
        datasets={[
          {
            dataKey: "value",
            label: "Value",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            data: mockData,
          },
        ]}
        isDark={false}
        showAnimation={false}
      />
    );
    expect(screen.getByText("Not Animated")).toBeInTheDocument();
  });

  it("handles custom value formatters", () => {
    renderChart({
      title: "Custom Formatter",
      description: "Testing custom formatter",
      datasets: [
        {
          dataKey: "value",
          label: "Value",
          colorDark: "#60a5fa",
          colorLight: "#2563eb",
          valueFormatter: (val: number) => `${val?.toFixed(2)} units`,
          data: mockData,
        },
      ],
    });
    expect(screen.getByText("Custom Formatter")).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("applies custom yAxisLabel", () => {
    renderChart({
      title: "Y-Axis Label",
      description: "Testing Y-axis labels",
      datasets: [
        {
          dataKey: "value",
          label: "Value",
          colorDark: "#60a5fa",
          colorLight: "#2563eb",
          yAxisLabel: "Percentage (%)",
          data: mockData,
        },
      ],
    });
    expect(screen.getByText("Y-Axis Label")).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("renders chart when showAnimation is true", () => {
    renderChart({ title: "Animated Chart", showAnimation: true });
    expect(screen.getByText("Animated Chart")).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("renders chart when showAnimation is false", () => {
    renderChart({ title: "Static Chart", showAnimation: false });
    expect(screen.getByText("Static Chart")).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("handles animation toggle between true and false", () => {
    const { rerender } = renderChart({
      title: "Animation Toggle",
      showAnimation: true,
    });
    expect(screen.getByText("Animation Toggle")).toBeInTheDocument();
    rerender(
      <PerformanceChart
        title="Animation Toggle"
        description="Testing animation toggle"
        datasets={[
          {
            dataKey: "value",
            label: "Value",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            data: mockData,
          },
        ]}
        isDark={false}
        showAnimation={false}
      />
    );
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });
});
