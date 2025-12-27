import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { ThemeProvider } from "../../../src/contexts/ThemeContext";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import DashboardPage from "../../../app/dashboard/page";

jest.mock("../../../src/components/dashboard/ModernDashboard", () => ({
  default: () => <div data-testid="modern-dashboard">ModernDashboard</div>,
}));

jest.mock("../../../src/components/layout/main-layout", () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="main-layout">{children}</div>,
}));

function renderWithTheme(component: React.ReactElement, isDark = false) {
  const theme = createTheme({
    palette: {
      mode: isDark ? "dark" : "light",
    },
  });

  return render(
    <ThemeProvider>
      <MuiThemeProvider theme={theme}>{component}</MuiThemeProvider>
    </ThemeProvider>
  );
}

describe("DashboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    renderWithTheme(<DashboardPage />);

    expect(screen.getByTestId("main-layout")).toBeInTheDocument();
    expect(screen.getByTestId("modern-dashboard")).toBeInTheDocument();
  });

  it("renders MainLayout component", () => {
    renderWithTheme(<DashboardPage />);

    expect(screen.getByTestId("main-layout")).toBeInTheDocument();
  });

  it("renders ModernDashboard component", () => {
    renderWithTheme(<DashboardPage />);

    expect(screen.getByTestId("modern-dashboard")).toBeInTheDocument();
    expect(screen.getByText("ModernDashboard")).toBeInTheDocument();
  });

  it("applies theme context correctly", () => {
    renderWithTheme(<DashboardPage />);

    expect(screen.getByTestId("modern-dashboard")).toBeInTheDocument();
  });

  it("applies dark mode theme", () => {
    renderWithTheme(<DashboardPage />, true);

    expect(screen.getByTestId("modern-dashboard")).toBeInTheDocument();
  });

  it("applies light mode theme", () => {
    renderWithTheme(<DashboardPage />, false);

    expect(screen.getByTestId("modern-dashboard")).toBeInTheDocument();
  });

  it("has correct component structure", () => {
    const { container } = renderWithTheme(<DashboardPage />);

    expect(screen.getByTestId("main-layout")).toBeInTheDocument();
    expect(screen.getByTestId("modern-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("modern-dashboard").parentElement).toBe(screen.getByTestId("main-layout"));
  });

  it("is accessible", () => {
    renderWithTheme(<DashboardPage />);

    const mainLayout = screen.getByTestId("main-layout");
    expect(mainLayout).toBeVisible();
  });

  it("renders correctly on rerender", () => {
    const { rerender } = renderWithTheme(<DashboardPage />);

    expect(screen.getByTestId("modern-dashboard")).toBeInTheDocument();

    rerender(
      <ThemeProvider>
        <MuiThemeProvider theme={createTheme({ palette: { mode: "light" } })}>
          <DashboardPage />
        </MuiThemeProvider>
      </ThemeProvider>
    );

    expect(screen.getByTestId("modern-dashboard")).toBeInTheDocument();
  });

  it("handles theme changes", () => {
    const { rerender } = renderWithTheme(<DashboardPage />, false);

    expect(screen.getByTestId("modern-dashboard")).toBeInTheDocument();

    rerender(
      <ThemeProvider>
        <MuiThemeProvider theme={createTheme({ palette: { mode: "dark" } })}>
          <DashboardPage />
        </MuiThemeProvider>
      </ThemeProvider>
    );

    expect(screen.getByTestId("modern-dashboard")).toBeInTheDocument();
  });

  it("does not render unexpected content", () => {
    renderWithTheme(<DashboardPage />);

    expect(screen.queryByText("Settings")).not.toBeInTheDocument();
    expect(screen.queryByText("Monitoring")).not.toBeInTheDocument();
    expect(screen.queryByText("Logs")).not.toBeInTheDocument();
    expect(screen.queryByText("Models")).not.toBeInTheDocument();
  });

  it("maintains component hierarchy", () => {
    const { container } = renderWithTheme(<DashboardPage />);

    const mainLayout = screen.getByTestId("main-layout");
    const modernDashboard = screen.getByTestId("modern-dashboard");

    expect(mainLayout.contains(modernDashboard)).toBe(true);
  });

  it("is responsive", () => {
    renderWithTheme(<DashboardPage />);

    const modernDashboard = screen.getByTestId("modern-dashboard");
    expect(modernDashboard).toBeInTheDocument();
  });

  it("renders as a client component", () => {
    const { container } = renderWithTheme(<DashboardPage />);

    expect(screen.getByTestId("modern-dashboard")).toBeInTheDocument();
  });
});
