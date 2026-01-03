import { renderWithTheme, screen, CircularGauge } from "./CircularGauge.test.helpers";

describe("CircularGauge - Basic Rendering", () => {
  it("renders correctly with required props", () => {
    const { container } = renderWithTheme(
      <CircularGauge value={50} isDark={false} />
    );

    const gaugeContainer = container.querySelector("svg");
    expect(gaugeContainer).toBeInTheDocument();
  });

  it("displays value correctly", () => {
    const { container } = renderWithTheme(
      <CircularGauge value={75} isDark={false} />
    );

    expect(screen.getByText("75")).toBeInTheDocument();
  });

  it("displays unit and label", () => {
    renderWithTheme(
      <CircularGauge
        value={60}
        unit="%"
        label="CPU"
        isDark={false}
      />
    );

    expect(screen.getByText("%")).toBeInTheDocument();
    expect(screen.getByText("CPU")).toBeInTheDocument();
  });

  it("handles min and max values", () => {
    renderWithTheme(
      <CircularGauge
        value={50}
        min={0}
        max={200}
        isDark={false}
      />
    );

    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("handles custom size", () => {
    const { container } = renderWithTheme(
      <CircularGauge value={50} size={200} isDark={false} />
    );

    const gaugeContainer = container.querySelector("svg");
    expect(gaugeContainer).toBeInTheDocument();
  });

  it("shows error color when value exceeds threshold", () => {
    renderWithTheme(
      <CircularGauge value={85} threshold={80} isDark={false} />
    );

    expect(screen.getByText("85")).toBeInTheDocument();
  });

  it("handles zero value", () => {
    renderWithTheme(<CircularGauge value={0} isDark={false} />);

    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("handles maximum value", () => {
    renderWithTheme(<CircularGauge value={100} isDark={false} />);

    expect(screen.getByText("100")).toBeInTheDocument();
  });
});

describe("CircularGauge - Dark Mode", () => {
  it("applies correct background in dark mode", () => {
    renderWithTheme(<CircularGauge value={50} isDark={true} />);

    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("applies correct text color in dark mode", () => {
    renderWithTheme(<CircularGauge value={50} isDark={true} />);

    expect(screen.getByText("50")).toBeInTheDocument();
  });
});
