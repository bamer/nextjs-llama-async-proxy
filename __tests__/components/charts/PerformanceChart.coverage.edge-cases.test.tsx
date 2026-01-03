import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { PerformanceChart } from "@/components/charts/PerformanceChart";


function renderWithTheme(component: React.ReactElement) {
  return render(component);
}

describe("PerformanceChart - Data Structure Edge Cases", () => {
  const mockData = [
    { time: "10:00", displayTime: "10:00", value: 45 },
    { time: "10:05", displayTime: "10:05", value: 50 },
    { time: "10:10", displayTime: "10:10", value: 55 },
  ];

  it("handles single data point", () => {
    const singleData = [{ time: "10:00", displayTime: "10:00", value: 45 }];

    renderWithTheme(
      <PerformanceChart
        title="Single Point"
        description="Single data point"
        datasets={[
          {
            dataKey: "value",
            label: "Value",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            data: singleData,
          },
        ]}
        isDark={false}
      />
    );

    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  it("handles two data points", () => {
    const twoPoints = [
      { time: "10:00", displayTime: "10:00", value: 45 },
      { time: "10:05", displayTime: "10:05", value: 50 },
    ];

    renderWithTheme(
      <PerformanceChart
        title="Two Points"
        description="Two data points"
        datasets={[
          {
            dataKey: "value",
            label: "Value",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            data: twoPoints,
          },
        ]}
        isDark={false}
      />
    );

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("handles undefined displayTime", () => {
    const dataWithUndefined = [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Testing edge case with undefined displayTime
      { time: "10:00", displayTime: undefined as any, value: 45 },
      { time: "10:05", displayTime: "10:05", value: 50 },
    ];

    renderWithTheme(
      <PerformanceChart
        title="Undefined DisplayTime"
        description="Missing displayTime"
        datasets={[
          {
            dataKey: "value",
            label: "Value",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            data: dataWithUndefined,
          },
        ]}
        isDark={false}
      />
    );

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("handles special characters in dataKey", () => {
    renderWithTheme(
      <PerformanceChart
        title="Special DataKey"
        description="Special characters in dataKey"
        datasets={[
          {
            dataKey: "cpu_usage-2024",
            label: "CPU Usage",
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

  it("handles unicode in labels", () => {
    renderWithTheme(
      <PerformanceChart
        title="Unicode Labels"
        description="Unicode characters in labels"
        datasets={[
          {
            dataKey: "value",
            label: "温度 (°C) 🌡️",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            data: mockData,
          },
        ]}
        isDark={false}
      />
    );

    expect(screen.getByText("Unicode Labels")).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });
});
