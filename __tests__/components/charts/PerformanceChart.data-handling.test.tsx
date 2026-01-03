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

describe("PerformanceChart - Data Handling", () => {
  const mockData = [
    { time: "10:00", displayTime: "10:00", value: 45 },
    { time: "10:05", displayTime: "10:05", value: 50 },
    { time: "10:10", displayTime: "10:10", value: 55 },
  ];

  it("handles large datasets", () => {
    const largeData = Array.from({ length: 100 }, (_, i) => ({
      time: `${String(Math.floor(i / 12)).padStart(2, "0")}:${String(
        (i % 12) * 5
      ).padStart(2, "0")}`,
      displayTime: `${String(Math.floor(i / 12)).padStart(2, "0")}:${String(
        (i % 12) * 5
      ).padStart(2, "0")}`,
      value: Math.random() * 100,
    }));
    render(
      <PerformanceChart
        title="Large Dataset"
        description="100 data points"
        datasets={[
          {
            dataKey: "value",
            label: "Value",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            data: largeData,
          },
        ]}
        isDark={false}
      />
    );
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("handles zero and negative values", () => {
    render(
      <PerformanceChart
        title="Mixed Values"
        description="Negative and zero values"
        datasets={[
          {
            dataKey: "value",
            label: "Value",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            data: [
              { time: "10:00", displayTime: "10:00", value: -10 },
              { time: "10:05", displayTime: "10:05", value: 0 },
              { time: "10:10", displayTime: "10:10", value: 10 },
            ],
          },
        ]}
        isDark={false}
      />
    );
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("handles decimal values", () => {
    render(
      <PerformanceChart
        title="Decimal Values"
        description="Testing decimal values"
        datasets={[
          {
            dataKey: "value",
            label: "Value",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            data: [
              { time: "10:00", displayTime: "10:00", value: 45.67 },
              { time: "10:05", displayTime: "10:05", value: 50.25 },
              { time: "10:10", displayTime: "10:10", value: 55.89 },
            ],
          },
        ]}
        isDark={false}
      />
    );
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });
});
