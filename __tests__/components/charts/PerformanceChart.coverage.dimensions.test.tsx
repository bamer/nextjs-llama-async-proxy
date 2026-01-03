import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { PerformanceChart } from "@/components/charts/PerformanceChart";


function renderWithTheme(component: React.ReactElement) {
  return render(component);
}

describe("PerformanceChart - Dimensions and No Data", () => {
  const mockData = [
    { time: "10:00", displayTime: "10:00", value: 45 },
    { time: "10:05", displayTime: "10:05", value: 50 },
    { time: "10:10", displayTime: "10:10", value: 55 },
  ];

  it("renders with different heights", () => {
    const heights = [100, 200, 300];

    heights.forEach((height) => {
      const { unmount } = renderWithTheme(
        <PerformanceChart
          title={`Height ${height}`}
          description={`Testing height ${height}`}
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
          height={height}
        />
      );

      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
      unmount();
    });
  });

  it("uses default height when not specified", () => {
    renderWithTheme(
      <PerformanceChart
        title="Default Height"
        description="Testing default height"
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

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("shows no data for empty dataset", () => {
    renderWithTheme(
      <PerformanceChart
        title="Empty No Formatter"
        description="Empty dataset without valueFormatter"
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

    expect(screen.getByText("Empty No Formatter")).toBeInTheDocument();
    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  it("shows no data in dark mode", () => {
    renderWithTheme(
      <PerformanceChart
        title="Dark No Data"
        description="No data in dark mode"
        datasets={[
          {
            dataKey: "value",
            label: "Value",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            data: [],
          },
        ]}
        isDark={true}
      />
    );

    expect(screen.getByText("Dark No Data")).toBeInTheDocument();
    expect(screen.getByText("No data available")).toBeInTheDocument();
  });
});
