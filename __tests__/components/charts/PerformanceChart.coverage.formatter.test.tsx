import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { PerformanceChart } from "@/components/charts/PerformanceChart";


function renderWithTheme(component: React.ReactElement) {
  return render(component);
}

describe("PerformanceChart - Default Value Formatter", () => {
  const mockData = [
    { time: "10:00", displayTime: "10:00", value: 45 },
    { time: "10:05", displayTime: "10:05", value: 50 },
    { time: "10:10", displayTime: "10:10", value: 55 },
  ];

  it("uses default valueFormatter when not provided - positive case", () => {
    renderWithTheme(
      <PerformanceChart
        title="Default Formatter Test"
        description="Testing default valueFormatter"
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

    expect(screen.getByText("Default Formatter Test")).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("default formatter handles non-null values", () => {
    renderWithTheme(
      <PerformanceChart
        title="Non-null Values"
        description="Default formatter with non-null"
        datasets={[
          {
            dataKey: "value",
            label: "Value",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            data: [
              { time: "10:00", displayTime: "10:00", value: 45.567 },
              { time: "10:05", displayTime: "10:05", value: 50.123 },
            ],
          },
        ]}
        isDark={false}
      />
    );

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("default formatter handles null values - negative case", () => {
    renderWithTheme(
      <PerformanceChart
        title="Null Values with Default Formatter"
        description="Default formatter with null values"
        datasets={[
          {
            dataKey: "value",
            label: "Value",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            data: [
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Testing edge case with null value
              { time: "10:00", displayTime: "10:00", value: null as any },
              { time: "10:05", displayTime: "10:05", value: 50 },
            ],
          },
        ]}
        isDark={false}
      />
    );

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("multiple datasets without valueFormatter", () => {
    renderWithTheme(
      <PerformanceChart
        title="Multiple Defaults"
        description="Multiple datasets with default formatter"
        datasets={[
          {
            dataKey: "value1",
            label: "Dataset 1",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            data: mockData,
          },
          {
            dataKey: "value2",
            label: "Dataset 2",
            colorDark: "#4ade80",
            colorLight: "#16a34a",
            data: mockData,
          },
        ]}
        isDark={false}
      />
    );

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });
});
