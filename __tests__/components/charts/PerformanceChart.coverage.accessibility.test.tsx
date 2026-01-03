import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { PerformanceChart } from "@/components/charts/PerformanceChart";


function renderWithTheme(component: React.ReactElement) {
  return render(component);
}

describe("PerformanceChart - Accessibility", () => {
  const mockData = [
    { time: "10:00", displayTime: "10:00", value: 45 },
    { time: "10:05", displayTime: "10:05", value: 50 },
    { time: "10:10", displayTime: "10:10", value: 55 },
  ];

  it("renders with accessible title structure", () => {
    renderWithTheme(
      <PerformanceChart
        title="Accessible Chart"
        description="This chart shows performance metrics over time"
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

    expect(screen.getByText("Accessible Chart")).toBeInTheDocument();
    expect(screen.getByText("This chart shows performance metrics over time")).toBeInTheDocument();
  });

  it("renders no data message accessibly", () => {
    renderWithTheme(
      <PerformanceChart
        title="No Data"
        description="When no data is available"
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

    expect(screen.getByText("No Data")).toBeInTheDocument();
    expect(screen.getByText("No data available")).toBeInTheDocument();
  });
});
