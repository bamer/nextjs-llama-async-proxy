import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { PerformanceChart } from "@/components/charts/PerformanceChart";


function renderWithTheme(component: React.ReactElement) {
  return render(component);
}

describe("PerformanceChart - Complex Scenarios", () => {
  const mockData = [
    { time: "10:00", displayTime: "10:00", value: 45 },
    { time: "10:05", displayTime: "10:05", value: 50 },
    { time: "10:10", displayTime: "10:10", value: 55 },
  ];

  it("handles many datasets with missing valueFormatter", () => {
    renderWithTheme(
      <PerformanceChart
        title="Many Datasets"
        description="Five datasets with default formatter"
        datasets={[
          {
            dataKey: "cpu",
            label: "CPU",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            data: mockData,
          },
          {
            dataKey: "memory",
            label: "Memory",
            colorDark: "#4ade80",
            colorLight: "#16a34a",
            data: mockData,
          },
          {
            dataKey: "disk",
            label: "Disk",
            colorDark: "#f472b6",
            colorLight: "#db2777",
            data: mockData,
          },
          {
            dataKey: "network",
            label: "Network",
            colorDark: "#fbbf24",
            colorLight: "#d97706",
            data: mockData,
          },
          {
            dataKey: "gpu",
            label: "GPU",
            colorDark: "#a78bfa",
            colorLight: "#7c3aed",
            data: mockData,
          },
        ]}
        isDark={false}
      />
    );

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("handles alternating data availability", () => {
    const alternating1 = [
      { time: "10:00", displayTime: "10:00", value: 45 },
      { time: "10:05", displayTime: "10:05", value: 0 },
      { time: "10:10", displayTime: "10:10", value: 55 },
      { time: "10:15", displayTime: "10:15", value: 0 },
    ];

    const alternating2 = [
      { time: "10:00", displayTime: "10:00", value: 0 },
      { time: "10:05", displayTime: "10:05", value: 50 },
      { time: "10:10", displayTime: "10:10", value: 0 },
      { time: "10:15", displayTime: "10:15", value: 60 },
    ];

    renderWithTheme(
      <PerformanceChart
        title="Alternating Data"
        description="Alternating data availability"
        datasets={[
          {
            dataKey: "value1",
            label: "Dataset 1",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            data: alternating1,
          },
          {
            dataKey: "value2",
            label: "Dataset 2",
            colorDark: "#4ade80",
            colorLight: "#16a34a",
            data: alternating2,
          },
        ]}
        isDark={false}
      />
    );

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("handles three datasets with varying lengths", () => {
    const dataset1 = [
      { time: "10:00", displayTime: "10:00", value: 45 },
      { time: "10:05", displayTime: "10:05", value: 50 },
      { time: "10:10", displayTime: "10:10", value: 55 },
    ];

    const dataset2 = [
      { time: "10:00", displayTime: "10:00", value: 30 },
      { time: "10:05", displayTime: "10:05", value: 35 },
    ];

    const dataset3 = [{ time: "10:00", displayTime: "10:00", value: 20 }];

    renderWithTheme(
      <PerformanceChart
        title="Three Variable Lengths"
        description="Three datasets with different lengths"
        datasets={[
          {
            dataKey: "value1",
            label: "Dataset 1 (longest)",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            data: dataset1,
          },
          {
            dataKey: "value2",
            label: "Dataset 2 (medium)",
            colorDark: "#4ade80",
            colorLight: "#16a34a",
            data: dataset2,
          },
          {
            dataKey: "value3",
            label: "Dataset 3 (shortest)",
            colorDark: "#f472b6",
            colorLight: "#db2777",
            data: dataset3,
          },
        ]}
        isDark={false}
      />
    );

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });
});
