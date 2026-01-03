import { renderWithTheme, screen, CircularGauge } from "./CircularGauge.test.helpers";

describe("CircularGauge - Color Thresholds", () => {
  it("shows success color when value is below 70% of threshold", () => {
    renderWithTheme(
      <CircularGauge value={40} threshold={80} isDark={false} />
    );

    expect(screen.getByText("40")).toBeInTheDocument();
  });

  it("shows warning color when value exceeds 70% of threshold", () => {
    renderWithTheme(
      <CircularGauge value={60} threshold={80} isDark={false} />
    );

    expect(screen.getByText("60")).toBeInTheDocument();
  });

  it("shows error color when value exceeds threshold", () => {
    renderWithTheme(
      <CircularGauge value={85} threshold={80} isDark={false} />
    );

    expect(screen.getByText("85")).toBeInTheDocument();
  });

  it("shows warning color when value at exactly 70% of threshold", () => {
    renderWithTheme(
      <CircularGauge value={56} threshold={80} isDark={false} />
    );

    expect(screen.getByText("56")).toBeInTheDocument();
  });

  it("shows error color when value at exactly threshold", () => {
    renderWithTheme(
      <CircularGauge value={80} threshold={80} isDark={false} />
    );

    expect(screen.getByText("80")).toBeInTheDocument();
  });

  it("handles custom threshold values", () => {
    renderWithTheme(
      <CircularGauge value={95} threshold={90} isDark={false} />
    );

    expect(screen.getByText("95")).toBeInTheDocument();
  });
});

describe("CircularGauge - Percentage Calculation", () => {
  it("calculates percentage correctly for mid-range value", () => {
    renderWithTheme(
      <CircularGauge value={50} min={0} max={100} isDark={false} />
    );

    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("calculates percentage for negative range", () => {
    renderWithTheme(
      <CircularGauge value={0} min={-100} max={100} isDark={false} />
    );

    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("calculates percentage for custom range", () => {
    renderWithTheme(
      <CircularGauge value={75} min={50} max={150} isDark={false} />
    );

    expect(screen.getByText("75")).toBeInTheDocument();
  });

  it("handles value at exact min", () => {
    renderWithTheme(
      <CircularGauge value={0} min={0} max={100} isDark={false} />
    );

    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("handles value at exact max", () => {
    renderWithTheme(
      <CircularGauge value={100} min={0} max={100} isDark={false} />
    );

    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("handles value below min (Math.max branch)", () => {
    renderWithTheme(
      <CircularGauge value={-10} min={0} max={100} isDark={false} />
    );

    expect(screen.getByText("-10")).toBeInTheDocument();
  });

  it("handles value above max (Math.min branch)", () => {
    renderWithTheme(
      <CircularGauge value={150} min={0} max={100} isDark={false} />
    );

    expect(screen.getByText("150")).toBeInTheDocument();
  });

  it("handles symmetric range around zero", () => {
    renderWithTheme(
      <CircularGauge value={0} min={-50} max={50} isDark={false} />
    );

    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
