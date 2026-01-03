import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { PerformanceChart } from "@/components/charts/PerformanceChart";


function renderWithTheme(component: React.ReactElement) {
  return render(component);
}

describe("PerformanceChart - Theme and Visual", () => {
  const mockData = [
    { time: "10:00", displayTime: "10:00", value: 45 },
    { time: "10:05", displayTime: "10:05", value: 50 },
    { time: "10:10", displayTime: "10:10", value: 55 },
  ];

  it("switches between dark and light colors", () => {
    const { rerender } = renderWithTheme(
      <PerformanceChart
        title="Theme Switch"
        description="Testing color theme switching"
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

    rerender(
      <PerformanceChart
        title="Theme Switch"
        description="Testing color theme switching"
        datasets={[
          {
            dataKey: "value",
            label: "Value",
            colorDark: "#60a5fa",
            colorLight: "#2563eb",
            data: mockData,
          },
        ]}
        isDark={true}
      />
    );

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();

    rerender(
      <PerformanceChart
        title="Theme Switch"
        description="Testing color theme switching"
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

  it("handles same color for dark and light", () => {
    renderWithTheme(
      <PerformanceChart
        title="Same Color"
        description="Same color for both themes"
        datasets={[
          {
            dataKey: "value",
            label: "Value",
            colorDark: "#2563eb",
            colorLight: "#2563eb",
            data: mockData,
          },
        ]}
        isDark={true}
      />
    );

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("toggles animation on and off", () => {
    const { rerender } = renderWithTheme(
      <PerformanceChart
        title="Animation Toggle"
        description="Testing animation toggle"
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
        showAnimation={true}
      />
    );

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();

    rerender(
      <PerformanceChart
        title="Animation Toggle"
        description="Testing animation toggle"
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
        showAnimation={false}
      />
    );

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });
});
