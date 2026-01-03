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

describe("PerformanceChart - Empty States", () => {
  it("shows empty state when no data provided", () => {
    render(
      <PerformanceChart
        title="Empty Chart"
        description="No data"
        datasets={[
          {
            dataKey: "value",
            label: "Value",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            data: [],
          },
        ]}
        isDark={false}
      />
    );
    expect(screen.getByText("Empty Chart")).toBeInTheDocument();
    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  it("shows empty state for insufficient data points", () => {
    render(
      <PerformanceChart
        title="Insufficient Data"
        description="Only one data point"
        datasets={[
          {
            dataKey: "value",
            label: "Value",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            data: [{ time: "10:00", displayTime: "10:00", value: 45 }],
          },
        ]}
        isDark={false}
      />
    );
    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  it("handles empty datasets array", () => {
    render(
      <PerformanceChart title="Empty Array" description="Empty datasets" datasets={[]} isDark={false} />
    );
    expect(screen.getByText("Empty Array")).toBeInTheDocument();
    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  it("handles all datasets with empty data arrays", () => {
    render(
      <PerformanceChart
        title="All Empty"
        description="All datasets empty"
        datasets={[
          {
            dataKey: "value1",
            label: "Empty 1",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            data: [],
          },
          {
            dataKey: "value2",
            label: "Empty 2",
            colorDark: "#4ade80",
            colorLight: "#16a34a",
            data: [],
          },
        ]}
        isDark={false}
      />
    );
    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  it("shows empty state when all datasets have invalid values", () => {
    render(
      <PerformanceChart
        title="Invalid Data"
        description="Testing invalid values"
        datasets={[
          {
            dataKey: "value",
            label: "Value",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            data: [
              { time: "10:00", displayTime: "10:00", value: NaN },
              { time: "10:05", displayTime: "10:05", value: null as any },
            ],
          },
        ]}
        isDark={false}
      />
    );
    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  it("shows empty state when merged data has less than 2 points", () => {
    render(
      <PerformanceChart
        title="Short Data"
        description="Less than 2 points"
        datasets={[
          {
            dataKey: "value",
            label: "Value",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            data: [{ time: "10:00", displayTime: "10:00", value: 45 }],
          },
        ]}
        isDark={false}
      />
    );
    expect(screen.getByText("No data available")).toBeInTheDocument();
  });
});
