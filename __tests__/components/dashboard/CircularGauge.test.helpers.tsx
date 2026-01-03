import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { CircularGauge } from "@/components/dashboard/CircularGauge";

// Mock MUI x-charts Gauge components
jest.mock("@mui/x-charts/Gauge", () => ({
  GaugeContainer: ({
    children,
    width,
    height,
  }: {
    children: React.ReactNode;
    width: number;
    height: number;
  }) =>
    React.createElement("svg", {
      width,
      height,
      "data-testid": "gauge-container",
      viewBox: `0 0 ${width} ${height}`,
    }, children),
  GaugeReferenceArc: () =>
    React.createElement("circle", {
      "data-testid": "gauge-reference-arc",
      cx: 50,
      cy: 50,
      r: 40,
    }),
  GaugeValueArc: () =>
    React.createElement("circle", {
      "data-testid": "gauge-value-arc",
      cx: 50,
      cy: 50,
      r: 30,
    }),
  GaugeValueText: ({ text }: { text: () => string }) =>
    React.createElement(
      "text",
      {
        "data-testid": "gauge-value-text",
        x: 50,
        y: 55,
        textAnchor: "middle",
      },
      text()
    ),
  gaugeClasses: {
    valueText: "value-text",
    valueArc: "value-arc",
    referenceArc: "reference-arc",
  },
}));

// Mock useTheme to provide breakpoints for isMobile
jest.mock("@/contexts/ThemeContext", () => ({
  ThemeProvider: ({ children }: any) =>
    React.createElement("div", { "data-theme-provider": "true" }, children),
  useTheme: jest.fn(() => ({
    isDark: false,
    mode: "light",
    setMode: jest.fn(),
    toggleTheme: jest.fn(),
    palette: {
      error: { main: "#d32f2f" },
      warning: { main: "#ed6c02" },
      success: { main: "#2e7d32" },
    },
    breakpoints: {
      down: jest.fn(() => "@media (max-width: 599px)"),
      up: jest.fn(() => "@media (min-width: 600px)"),
      values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
    },
  })),
}));

const theme = createTheme();

export function renderWithTheme(component: React.ReactElement) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
  );
  return render(component, { wrapper });
}

export { CircularGauge, screen };
