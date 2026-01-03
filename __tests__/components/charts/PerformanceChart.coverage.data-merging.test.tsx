import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { PerformanceChart } from "@/components/charts/PerformanceChart";


function renderWithTheme(component: React.ReactElement) {
  return render(component);
}

describe("PerformanceChart - Data Merging", () => {
  const mockData = [
    { time: "10:00", displayTime: "10:00", value: 45 },
    { time: "10:05", displayTime: "10:05", value: 50 },
    { time: "10:10", displayTime: "10:10", value: 55 },
  ];

  it("handles datasets with different lengths - missing values", () => {
    const longDataset = [
      { time: "10:00", displayTime: "10:00", value: 45 },
      { time: "10:05", displayTime: "10:05", value: 50 },
      { time: "10:10", displayTime: "10:10", value: 55 },
      { time: "10:15", displayTime: "10:15", value: 60 },
    ];

    const shortDataset = [
      { time: "10:00", displayTime: "10:00", value: 30 },
      { time: "10:05", displayTime: "10:05", value: 35 },
    ];

    renderWithTheme(
      <PerformanceChart
        title="Different Lengths"
        description="Handling missing values in shorter dataset"
        datasets={[
          {
            dataKey: "value1",
            label: "Long Dataset",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            data: longDataset,
          },
          {
            dataKey: "value2",
            label: "Short Dataset",
            colorDark: "#4ade80",
            colorLight: "#16a34a",
            data: shortDataset,
          },
        ]}
        isDark={false}
      />
    );

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("handles all datasets except one empty", () => {
    renderWithTheme(
      <PerformanceChart
        title="One Populated"
        description="One dataset with data, others empty"
        datasets={[
          {
            dataKey: "value1",
            label: "Populated",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            data: mockData,
          },
          {
            dataKey: "value2",
            label: "Empty 1",
            colorDark: "#4ade80",
            colorLight: "#16a34a",
            data: [],
          },
          {
            dataKey: "value3",
            label: "Empty 2",
            colorDark: "#f472b6",
            colorLight: "#db2777",
            data: [],
          },
        ]}
        isDark={false}
      />
    );

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("handles sparse data across datasets", () => {
    const sparse1 = [
      { time: "10:00", displayTime: "10:00", value: 45 },
      { time: "10:10", displayTime: "10:10", value: 55 },
    ];

    const sparse2 = [
      { time: "10:00", displayTime: "10:00", value: 30 },
      { time: "10:10", displayTime: "10:10", value: 40 },
    ];

    renderWithTheme(
      <PerformanceChart
        title="Sparse Data"
        description="Sparse data across datasets"
        datasets={[
          {
            dataKey: "value1",
            label: "Dataset 1",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            data: sparse1,
          },
          {
            dataKey: "value2",
            label: "Dataset 2",
            colorDark: "#4ade80",
            colorLight: "#16a34a",
            data: sparse2,
          },
        ]}
        isDark={false}
      />
    );

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });
});
