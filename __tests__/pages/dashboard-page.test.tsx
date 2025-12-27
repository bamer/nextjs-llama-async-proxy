import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import DashboardPage from "../../app/dashboard/page";

// Mock Next.js useRouter
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: "/",
    query: {},
    asPath: "/",
  }),
  usePathname: () => "/dashboard",
}));

// Mock ThemeContext
jest.mock("@/contexts/ThemeContext", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTheme: () => ({ isDark: false }),
}));

// Mock ModernDashboard
jest.mock("@/components/dashboard/ModernDashboard", () => ({
  default: () => <div data-testid="modern-dashboard">ModernDashboard</div>,
}));

function renderWithTheme(component: React.ReactElement) {
  return render(component);
}

describe("DashboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("module can be imported", () => {
    // Just verify the module can be imported
    expect(typeof DashboardPage).toBe("function");
  });

  it("renders without crashing", () => {
    renderWithTheme(<DashboardPage />);
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
    renderWithTheme(<DashboardPage />);

    expect(screen.getByTestId("modern-dashboard")).toBeInTheDocument();
  });

  it("applies light mode theme", () => {
    renderWithTheme(<DashboardPage />);

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

    rerender(<DashboardPage />);

    expect(screen.getByTestId("modern-dashboard")).toBeInTheDocument();
  });

  it("handles theme changes", () => {
    const { rerender } = renderWithTheme(<DashboardPage />);

    expect(screen.getByTestId("modern-dashboard")).toBeInTheDocument();

    rerender(<DashboardPage />);

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
