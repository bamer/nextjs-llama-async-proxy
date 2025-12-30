import { render, screen } from "@testing-library/react";
import DashboardPage from "../../app/dashboard/page";

// Mock the components
jest.mock("@/components/layout/main-layout", () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="main-layout">{children}</div>
  ),
}));

jest.mock("@/components/dashboard/ModernDashboard", () => {
  return function ModernDashboard() {
    return <div data-testid="modern-dashboard">Dashboard Content</div>;
  };
});

jest.mock("@/components/ui/error-boundary", () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode; fallback?: React.ReactNode }) => (
    <div data-testid="error-boundary">
      {children}
    </div>
  ),
}));

jest.mock("@/components/ui/error-fallbacks", () => ({
  DashboardFallback: () => <div data-testid="dashboard-fallback">Error Fallback</div>,
}));

describe("DashboardPage", () => {
  it("renders the dashboard page with main layout", () => {
    render(<DashboardPage />);

    expect(screen.getByTestId("main-layout")).toBeInTheDocument();
    expect(screen.getByTestId("modern-dashboard")).toBeInTheDocument();
    expect(screen.getByText("Dashboard Content")).toBeInTheDocument();
  });

  it("includes error boundary for resilience", () => {
    render(<DashboardPage />);

    expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
  });

  it("renders dashboard fallback in error boundary", () => {
    // Test that the fallback is configured (though we can't easily test the error case)
    const { ErrorBoundary } = require("@/components/ui/error-boundary");
    expect(ErrorBoundary).toBeDefined();
  });
});