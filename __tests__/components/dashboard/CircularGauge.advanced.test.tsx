import { createTheme, ThemeProvider } from "@mui/material/styles";
import React from "react";
import { renderWithTheme, screen, CircularGauge } from "./CircularGauge.test.helpers";

const theme = createTheme();

describe("CircularGauge - Re-render Behavior", () => {
  it("re-renders when value changes", () => {
    const { rerender } = renderWithTheme(
      <CircularGauge value={50} isDark={false} />
    );

    rerender(
      <ThemeProvider theme={theme}>
        <CircularGauge value={75} isDark={false} />
      </ThemeProvider>
    );

    expect(screen.getByText("75")).toBeInTheDocument();
    expect(screen.queryByText("50")).not.toBeInTheDocument();
  });

  it("re-renders when unit changes", () => {
    const { rerender } = renderWithTheme(
      <CircularGauge value={50} unit="%" isDark={false} />
    );

    rerender(
      <ThemeProvider theme={theme}>
        <CircularGauge value={50} unit="W" isDark={false} />
      </ThemeProvider>
    );

    expect(screen.getByText("W")).toBeInTheDocument();
    expect(screen.queryByText("%")).not.toBeInTheDocument();
  });

  it("re-renders when label changes", () => {
    const { rerender } = renderWithTheme(
      <CircularGauge value={50} label="CPU" isDark={false} />
    );

    rerender(
      <ThemeProvider theme={theme}>
        <CircularGauge value={50} label="GPU" isDark={false} />
      </ThemeProvider>
    );

    expect(screen.getByText("GPU")).toBeInTheDocument();
    expect(screen.queryByText("CPU")).not.toBeInTheDocument();
  });

  it("re-renders when threshold changes", () => {
    const { rerender } = renderWithTheme(
      <CircularGauge value={85} threshold={80} isDark={false} />
    );

    rerender(
      <ThemeProvider theme={theme}>
        <CircularGauge value={85} threshold={90} isDark={false} />
      </ThemeProvider>
    );

    expect(screen.getByText("85")).toBeInTheDocument();
  });

  it("re-renders when isDark changes", () => {
    const { rerender } = renderWithTheme(
      <CircularGauge value={50} isDark={false} />
    );

    rerender(
      <ThemeProvider theme={theme}>
        <CircularGauge value={50} isDark={true} />
      </ThemeProvider>
    );

    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("re-renders when min changes", () => {
    const { rerender } = renderWithTheme(
      <CircularGauge value={50} min={0} max={100} isDark={false} />
    );

    rerender(
      <ThemeProvider theme={theme}>
        <CircularGauge value={50} min={25} max={100} isDark={false} />
      </ThemeProvider>
    );

    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("re-renders when max changes", () => {
    const { rerender } = renderWithTheme(
      <CircularGauge value={50} min={0} max={100} isDark={false} />
    );

    rerender(
      <ThemeProvider theme={theme}>
        <CircularGauge value={50} min={0} max={200} isDark={false} />
      </ThemeProvider>
    );

    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("re-renders when size changes", () => {
    const { rerender } = renderWithTheme(
      <CircularGauge value={50} size={150} isDark={false} />
    );

    rerender(
      <ThemeProvider theme={theme}>
        <CircularGauge value={50} size={200} isDark={false} />
      </ThemeProvider>
    );

    const container = renderWithTheme(
      <CircularGauge value={50} size={200} isDark={false} />
    ).container;
    const gaugeContainer = container.querySelector("svg");
    expect(gaugeContainer).toBeInTheDocument();
  });
});

describe("CircularGauge - Decimal Precision", () => {
  it("rounds to 1 decimal place for values with many decimals", () => {
    renderWithTheme(
      <CircularGauge value={45.67890123456} isDark={false} />
    );

    expect(screen.getByText("45.7")).toBeInTheDocument();
  });

  it("shows single decimal when value has .5", () => {
    renderWithTheme(<CircularGauge value={50.5} isDark={false} />);

    expect(screen.getByText("50.5")).toBeInTheDocument();
  });

  it("shows no decimal for whole numbers", () => {
    renderWithTheme(<CircularGauge value={50.0} isDark={false} />);

    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("handles negative decimals", () => {
    renderWithTheme(<CircularGauge value={-10.5} isDark={false} />);

    expect(screen.getByText("-10.5")).toBeInTheDocument();
  });
});
