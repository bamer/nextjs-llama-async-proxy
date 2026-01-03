import { createTheme, ThemeProvider } from "@mui/material/styles";
import React from "react";
import { renderWithTheme, screen, CircularGauge } from "./CircularGauge.test.helpers";

const theme = createTheme();

describe("CircularGauge - Memoization Comparison", () => {
  it("memoizes correctly - no re-render when props unchanged", () => {
    const { rerender } = renderWithTheme(
      <CircularGauge value={50} unit="%" label="Test" isDark={false} />
    );

    // Re-render with identical props - memo comparison should return true
    rerender(
      <ThemeProvider theme={theme}>
        <CircularGauge value={50} unit="%" label="Test" isDark={false} />
      </ThemeProvider>
    );

    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("%")).toBeInTheDocument();
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("memo comparison returns false when only value changes", () => {
    const { rerender } = renderWithTheme(
      <CircularGauge value={50} unit="%" label="Test" isDark={false} />
    );

    // Only change value - first comparison in memo should return false
    rerender(
      <ThemeProvider theme={theme}>
        <CircularGauge value={75} unit="%" label="Test" isDark={false} />
      </ThemeProvider>
    );

    expect(screen.getByText("75")).toBeInTheDocument();
    expect(screen.queryByText("50")).not.toBeInTheDocument();
  });

  it("memo comparison returns false when only unit changes", () => {
    const { rerender } = renderWithTheme(
      <CircularGauge value={50} unit="%" label="Test" isDark={false} />
    );

    // Only change unit - first comparison passes, second fails
    rerender(
      <ThemeProvider theme={theme}>
        <CircularGauge value={50} unit="W" label="Test" isDark={false} />
      </ThemeProvider>
    );

    expect(screen.getByText("W")).toBeInTheDocument();
    expect(screen.queryByText("%")).not.toBeInTheDocument();
  });

  it("memo comparison returns false when only label changes", () => {
    const { rerender } = renderWithTheme(
      <CircularGauge value={50} unit="%" label="Test" isDark={false} />
    );

    // Only change label - first two comparisons pass, third fails
    rerender(
      <ThemeProvider theme={theme}>
        <CircularGauge value={50} unit="%" label="Updated" isDark={false} />
      </ThemeProvider>
    );

    expect(screen.getByText("Updated")).toBeInTheDocument();
    expect(screen.queryByText("Test")).not.toBeInTheDocument();
  });

  it("memo comparison returns false when only threshold changes", () => {
    const { rerender } = renderWithTheme(
      <CircularGauge value={50} threshold={80} isDark={false} />
    );

    // Change threshold - tests memo comparison's threshold check
    rerender(
      <ThemeProvider theme={theme}>
        <CircularGauge value={50} threshold={90} isDark={false} />
      </ThemeProvider>
    );

    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("memo comparison returns false when only isDark changes", () => {
    const { rerender } = renderWithTheme(
      <CircularGauge value={50} isDark={false} />
    );

    // Only change isDark - tests the last comparison
    rerender(
      <ThemeProvider theme={theme}>
        <CircularGauge value={50} isDark={true} />
      </ThemeProvider>
    );

    expect(screen.getByText("50")).toBeInTheDocument();
  });
});
