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

describe("PerformanceChart - Edge Cases", () => {
  const mockData = [
    { time: "10:00", displayTime: "10:00", value: 45 },
    { time: "10:05", displayTime: "10:05", value: 50 },
    { time: "10:10", displayTime: "10:10", value: 55 },
  ];

  it("handles null values in data", () => {
    render(
      <PerformanceChart
        title="Null Values"
        description="Testing null values"
        datasets={[
          {
            dataKey: "value",
            label: "Value",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            valueFormatter: (val) => (val !== null ? `${val}%` : "N/A"),
            data: [
              { time: "10:00", displayTime: "10:00", value: 45 },
              { time: "10:05", displayTime: "10:05", value: null as any },
              { time: "10:10", displayTime: "10:10", value: 55 },
            ],
          },
        ]}
        isDark={false}
      />
    );
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("handles datasets with NaN values mixed with valid values", () => {
    render(
      <PerformanceChart
        title="Mixed NaN"
        description="Testing NaN values"
        datasets={[
          {
            dataKey: "value",
            label: "Value",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            valueFormatter: (val) => (isNaN(Number(val)) ? "N/A" : `${val}%`),
            data: [
              { time: "10:00", displayTime: "10:00", value: 45 },
              { time: "10:05", displayTime: "10:05", value: NaN },
              { time: "10:10", displayTime: "10:10", value: 55 },
            ],
          },
        ]}
        isDark={false}
      />
    );
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("handles first dataset empty but second dataset has data", () => {
    render(
      <PerformanceChart
        title="First Empty"
        description="First dataset empty, second has data"
        datasets={[
          {
            dataKey: "value1",
            label: "Value 1",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            data: [],
          },
          {
            dataKey: "value2",
            label: "Value 2",
            colorDark: "#4ade80",
            colorLight: "#16a34a",
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

  it("handles datasets with only one data point in first dataset", () => {
    render(
      <PerformanceChart
        title="Single Point"
        description="First dataset has one point"
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

  it("handles all empty datasets", () => {
    render(
      <PerformanceChart
        title="All Empty"
        description="All datasets have no data"
        datasets={[
          {
            dataKey: "value1",
            label: "Value 1",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            data: [],
          },
          {
            dataKey: "value2",
            label: "Value 2",
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
});
