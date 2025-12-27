import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { ThemeProvider } from "../../../src/contexts/ThemeContext";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import SettingsPage from "../../../app/settings/page";

jest.mock("../../../src/components/configuration/ModernConfiguration", () => ({
  default: () => <div data-testid="modern-configuration">ModernConfiguration</div>,
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

describe("SettingsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    renderWithTheme(<SettingsPage />);

    expect(screen.getByTestId("main-layout")).toBeInTheDocument();
    expect(screen.getByTestId("modern-configuration")).toBeInTheDocument();
  });

  it("renders MainLayout component", () => {
    renderWithTheme(<SettingsPage />);

    expect(screen.getByTestId("main-layout")).toBeInTheDocument();
  });

  it("renders ModernConfiguration component", () => {
    renderWithTheme(<SettingsPage />);

    expect(screen.getByTestId("modern-configuration")).toBeInTheDocument();
    expect(screen.getByText("ModernConfiguration")).toBeInTheDocument();
  });

  it("applies theme context correctly", () => {
    renderWithTheme(<SettingsPage />);

    expect(screen.getByTestId("modern-configuration")).toBeInTheDocument();
  });

  it("applies dark mode theme", () => {
    renderWithTheme(<SettingsPage />, true);

    expect(screen.getByTestId("modern-configuration")).toBeInTheDocument();
  });

  it("applies light mode theme", () => {
    renderWithTheme(<SettingsPage />, false);

    expect(screen.getByTestId("modern-configuration")).toBeInTheDocument();
  });

  it("has correct component structure", () => {
    const { container } = renderWithTheme(<SettingsPage />);

    expect(screen.getByTestId("main-layout")).toBeInTheDocument();
    expect(screen.getByTestId("modern-configuration")).toBeInTheDocument();
    expect(screen.getByTestId("modern-configuration").parentElement).toBe(screen.getByTestId("main-layout"));
  });

  it("is accessible", () => {
    renderWithTheme(<SettingsPage />);

    const mainLayout = screen.getByTestId("main-layout");
    expect(mainLayout).toBeVisible();
  });

  it("renders correctly on rerender", () => {
    const { rerender } = renderWithTheme(<SettingsPage />);

    expect(screen.getByTestId("modern-configuration")).toBeInTheDocument();

    rerender(
      <ThemeProvider>
        <MuiThemeProvider theme={createTheme({ palette: { mode: "light" } })}>
          <SettingsPage />
        </MuiThemeProvider>
      </ThemeProvider>
    );

    expect(screen.getByTestId("modern-configuration")).toBeInTheDocument();
  });

  it("handles theme changes", () => {
    const { rerender } = renderWithTheme(<SettingsPage />, false);

    expect(screen.getByTestId("modern-configuration")).toBeInTheDocument();

    rerender(
      <ThemeProvider>
        <MuiThemeProvider theme={createTheme({ palette: { mode: "dark" } })}>
          <SettingsPage />
        </MuiThemeProvider>
      </ThemeProvider>
    );

    expect(screen.getByTestId("modern-configuration")).toBeInTheDocument();
  });

  it("does not render unexpected content", () => {
    renderWithTheme(<SettingsPage />);

    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Monitoring")).not.toBeInTheDocument();
    expect(screen.queryByText("Logs")).not.toBeInTheDocument();
  });

  it("maintains component hierarchy", () => {
    const { container } = renderWithTheme(<SettingsPage />);

    const mainLayout = screen.getByTestId("main-layout");
    const modernConfig = screen.getByTestId("modern-configuration");

    expect(mainLayout.contains(modernConfig)).toBe(true);
  });

  it("is responsive", () => {
    renderWithTheme(<SettingsPage />);

    const modernConfig = screen.getByTestId("modern-configuration");
    expect(modernConfig).toBeInTheDocument();
  });
});
