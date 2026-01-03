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

describe("PerformanceChart - Multiple Datasets", () => {
  const mockData = [
    { time: "10:00", displayTime: "10:00", value: 45 },
    { time: "10:05", displayTime: "10:05", value: 50 },
    { time: "10:10", displayTime: "10:10", value: 55 },
  ];

  it("handles multiple datasets", () => {
    render(
      <PerformanceChart
        title="Multi Dataset"
        description="Multiple metrics"
        datasets={[
          {
            dataKey: "value1",
            label: "Value 1",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            data: mockData,
          },
          {
            dataKey: "value2",
            label: "Value 2",
            colorDark: "#4ade80",
            colorLight: "#16a34a",
            data: mockData,
          },
        ]}
        isDark={true}
        height={400}
      />
    );
    expect(screen.getByText("Multi Dataset")).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("handles datasets with different data lengths", () => {
    const longData = [
      { time: "10:00", displayTime: "10:00", value: 45 },
      { time: "10:05", displayTime: "10:05", value: 50 },
      { time: "10:10", displayTime: "10:10", value: 55 },
      { time: "10:15", displayTime: "10:15", value: 60 },
    ];
    const shortData = [
      { time: "10:00", displayTime: "10:00", value: 30 },
      { time: "10:05", displayTime: "10:05", value: 35 },
    ];
    render(
      <PerformanceChart
        title="Mixed Lengths"
        description="Different dataset lengths"
        datasets={[
          { dataKey: "value1", label: "Long Dataset", colorDark: "#60a5fa", colorLight: "#2563eb", data: longData },
          { dataKey: "value2", label: "Short Dataset", colorDark: "#4ade80", colorLight: "#16a34a", data: shortData },
        ]}
        isDark={false}
      />
    );
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("handles multiple datasets with different configurations", () => {
    render(
      <PerformanceChart
        title="Complex Configuration"
        description="Multiple datasets with different configs"
        datasets={[
          {
            dataKey: "cpu",
            label: "CPU Usage",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            valueFormatter: (val) => `${val}%`,
            yAxisLabel: "CPU %",
            data: mockData,
          },
          {
            dataKey: "memory",
            label: "Memory Usage",
            colorDark: "#4ade80",
            colorLight: "#16a34a",
            valueFormatter: (val) => `${val}GB`,
            yAxisLabel: "Memory (GB)",
            data: mockData,
          },
        ]}
        isDark={true}
        height={500}
        xAxisType="point"
        showAnimation={true}
      />
    );
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("handles datasets with 3 data points", () => {
    render(
      <PerformanceChart
        title="Three Points"
        description="Exactly 3 points"
        datasets={[
          {
            dataKey: "value",
            label: "Value",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            data: [
              { time: "10:00", displayTime: "10:00", value: 45 },
              { time: "10:05", displayTime: "10:05", value: 50 },
              { time: "10:10", displayTime: "10:10", value: 55 },
            ],
          },
        ]}
        isDark={false}
      />
    );
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("handles single dataset with exact 2 data points", () => {
    render(
      <PerformanceChart
        title="Two Points"
        description="Exactly 2 points"
        datasets={[
          {
            dataKey: "value",
            label: "Value",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            data: [
              { time: "10:00", displayTime: "10:00", value: 45 },
              { time: "10:05", displayTime: "10:05", value: 50 },
            ],
          },
        ]}
        isDark={false}
      />
    );
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("memoizes chart properly with same datasets", () => {
    const datasets = [
      {
        dataKey: "value",
        label: "Value",
        colorDark: "#60a5fa",
        colorLight: "#2563eb",
        data: mockData,
      },
    ];
    const { rerender } = render(
      <PerformanceChart
        title="Memo Test"
        description="Testing memoization"
        datasets={datasets}
        isDark={false}
      />
    );
    expect(screen.getByText("Memo Test")).toBeInTheDocument();
    rerender(
      <PerformanceChart
        title="Memo Test"
        description="Testing memoization"
        datasets={datasets}
        isDark={false}
      />
    );
    expect(screen.getByText("Memo Test")).toBeInTheDocument();
  });
});
