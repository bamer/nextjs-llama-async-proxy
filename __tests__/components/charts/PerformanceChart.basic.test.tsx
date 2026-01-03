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

describe("PerformanceChart - Basic Rendering", () => {
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
            valueFormatter: (val) => `${val}`,
            data: mockData,
          },
        ]}
        isDark={false}
        {...props}
      />
    );

  it("renders correctly with basic props", () => {
    renderChart({ height: 300 });
    expect(screen.getByText("Test Chart")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  it("renders chart component when data is valid", () => {
    renderChart({ height: 350, title: "Performance" });
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("renders with default props", () => {
    renderChart({ title: "Default Props" });
    expect(screen.getByText("Default Props")).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("handles very long titles and descriptions", () => {
    const longTitle =
      "This is a very long title that might cause wrapping issues in the component layout";
    const longDescription =
      "This is also a very long description that might cause wrapping issues";
    renderChart({ title: longTitle, description: longDescription });
    expect(screen.getByText(longTitle)).toBeInTheDocument();
    expect(screen.getByText(longDescription)).toBeInTheDocument();
  });

  it("updates when props change", () => {
    const { rerender } = renderChart({
      title: "Original Title",
      description: "Original Description",
    });
    expect(screen.getByText("Original Title")).toBeInTheDocument();
    rerender(
      <PerformanceChart
        title="Updated Title"
        description="Updated Description"
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
      />
    );
    expect(screen.getByText("Updated Title")).toBeInTheDocument();
    expect(screen.queryByText("Original Title")).not.toBeInTheDocument();
  });

  it("applies different xAxis types", () => {
    const { rerender } = renderChart({ title: "Band Axis", xAxisType: "band" });
    expect(screen.getByText("Band Axis")).toBeInTheDocument();
    rerender(
      <PerformanceChart
        title="Point Axis"
        description="Point axis type"
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
        xAxisType="point"
      />
    );
    expect(screen.getByText("Point Axis")).toBeInTheDocument();
  });
});
