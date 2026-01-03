import { renderWithTheme, screen, CircularGauge } from "./CircularGauge.test.helpers";

describe("CircularGauge - Edge Cases", () => {
  it("handles negative value - component displays actual value", () => {
    renderWithTheme(
      <CircularGauge value={-50} min={0} max={100} isDark={false} />
    );

    // Component displays actual value, not clamped
    expect(screen.getByText("-50")).toBeInTheDocument();
  });

  it("handles value exceeding max - component displays actual value", () => {
    renderWithTheme(
      <CircularGauge value={150} min={0} max={100} isDark={false} />
    );

    // Component displays actual value, not clamped
    expect(screen.getByText("150")).toBeInTheDocument();
  });

  it("handles decimal value", () => {
    renderWithTheme(<CircularGauge value={45.6789} isDark={false} />);

    expect(screen.getByText("45.7")).toBeInTheDocument();
  });

  it("handles integer value without decimal", () => {
    renderWithTheme(<CircularGauge value={75} isDark={false} />);

    expect(screen.getByText("75")).toBeInTheDocument();
  });

  it("handles NaN value gracefully", () => {
    renderWithTheme(<CircularGauge value={NaN} isDark={false} />);

    expect(screen.getByText("NaN")).toBeInTheDocument();
  });

  it("handles Infinity value", () => {
    renderWithTheme(<CircularGauge value={Infinity} isDark={false} />);

    expect(screen.getByText("Infinity")).toBeInTheDocument();
  });

  it("handles negative Infinity value", () => {
    renderWithTheme(<CircularGauge value={-Infinity} isDark={false} />);

    expect(screen.getByText("-Infinity")).toBeInTheDocument();
  });

  it("handles very large value", () => {
    renderWithTheme(<CircularGauge value={999999} isDark={false} />);

    expect(screen.getByText("999999")).toBeInTheDocument();
  });

  it("handles custom min/max range", () => {
    renderWithTheme(
      <CircularGauge value={50} min={-100} max={100} isDark={false} />
    );

    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("handles very small size", () => {
    const { container } = renderWithTheme(
      <CircularGauge value={50} size={50} isDark={false} />
    );

    const gaugeContainer = container.querySelector("svg");
    expect(gaugeContainer).toBeInTheDocument();
  });

  it("handles very large size", () => {
    const { container } = renderWithTheme(
      <CircularGauge value={50} size={500} isDark={false} />
    );

    const gaugeContainer = container.querySelector("svg");
    expect(gaugeContainer).toBeInTheDocument();
  });

  it("renders with both unit and label", () => {
    renderWithTheme(
      <CircularGauge
        value={75}
        unit="%"
        label="Usage"
        isDark={false}
      />
    );

    expect(screen.getByText("%")).toBeInTheDocument();
    expect(screen.getByText("Usage")).toBeInTheDocument();
    expect(screen.getByText("75")).toBeInTheDocument();
  });

  it("handles long unit text", () => {
    const longUnit = "degrees Celsius";
    renderWithTheme(<CircularGauge value={25} unit={longUnit} isDark={false} />);

    expect(screen.getByText(longUnit)).toBeInTheDocument();
  });

  it("handles long label text", () => {
    const longLabel = "Central Processing Unit";
    renderWithTheme(<CircularGauge value={25} label={longLabel} isDark={false} />);

    expect(screen.getByText(longLabel)).toBeInTheDocument();
  });
});

describe("CircularGauge - Conditional Rendering", () => {
  it("handles undefined unit", () => {
    renderWithTheme(<CircularGauge value={50} isDark={false} />);

    expect(screen.queryByText("%")).not.toBeInTheDocument();
  });

  it("handles empty string unit", () => {
    renderWithTheme(<CircularGauge value={50} unit="" isDark={false} />);

    expect(screen.queryByText("%")).not.toBeInTheDocument();
  });

  it("handles empty string label", () => {
    renderWithTheme(<CircularGauge value={50} label="" isDark={false} />);

    expect(screen.queryByText("CPU")).not.toBeInTheDocument();
  });

  it("handles special characters in unit", () => {
    renderWithTheme(<CircularGauge value={50} unit="°C" isDark={false} />);

    expect(screen.getByText("°C")).toBeInTheDocument();
  });

  it("handles special characters in label", () => {
    renderWithTheme(<CircularGauge value={50} label="CPU 🚀" isDark={false} />);

    expect(screen.getByText("CPU 🚀")).toBeInTheDocument();
  });

  it("handles undefined threshold (uses default)", () => {
    renderWithTheme(<CircularGauge value={50} isDark={false} />);

    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("handles threshold at zero", () => {
    renderWithTheme(<CircularGauge value={10} threshold={0} isDark={false} />);

    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("handles very small positive value", () => {
    renderWithTheme(<CircularGauge value={0.001} isDark={false} />);

    expect(screen.getByText("0.0")).toBeInTheDocument();
  });
});
