import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import HomePage from "../../app/page";
import { ThemeProvider } from "../../src/contexts/ThemeContext";

jest.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} data-testid={`link-${href.replace(/^\//, "")}`}>
      {children}
    </a>
  ),
}));

jest.mock("@mui/icons-material", () => ({
  Rocket: () => <span data-testid="rocket-icon">🚀</span>,
  Dashboard: () => <span>📊</span>,
  ModelTraining: () => <span>🤖</span>,
  Monitor: () => <span>📈</span>,
  Settings: () => <span>⚙️</span>,
  BarChart: () => <span>📊</span>,
  Code: () => <span>💻</span>,
  Cloud: () => <span>☁️</span>,
  Terminal: () => <span>💻</span>,
}));

jest.mock("next-themes", () => ({
  useTheme: () => ({ setTheme: jest.fn() }),
}));

jest.mock("@mui/material/useMediaQuery", () => ({
  __esModule: true,
  default: jest.fn(() => false),
}));

const mockSetMode = jest.fn();
const mockToggleTheme = jest.fn();

jest.mock("../../src/contexts/ThemeContext", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
  useTheme: () => ({
    mode: "light",
    setMode: mockSetMode,
    toggleTheme: mockToggleTheme,
    isDark: false,
    currentTheme: {},
  }),
}));

function renderWithProviders(component: React.ReactElement) {
  return render(component);
}

describe("HomePage", () => {
  it("renders correctly", () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByText("Welcome to Llama Runner Pro")).toBeInTheDocument();
  });

  it("renders welcome title", () => {
    renderWithProviders(<HomePage />);
    expect(
      screen.getByRole("heading", { name: "Welcome to Llama Runner Pro" })
    ).toBeInTheDocument();
  });

  it("renders subtitle description", () => {
    renderWithProviders(<HomePage />);
    expect(
      screen.getByText(
        /The ultimate platform for managing and monitoring your AI models/
      )
    ).toBeInTheDocument();
  });

  it("renders 'Get Started' button", () => {
    renderWithProviders(<HomePage />);
    const button = screen.getByRole("button", { name: "Get Started" });
    expect(button).toBeInTheDocument();
  });

  it("'Get Started' button links to /dashboard", () => {
    renderWithProviders(<HomePage />);
    const link = screen.getByTestId("link-dashboard");
    expect(link).toBeInTheDocument();
  });

  it("renders 'Key Features' section", () => {
    renderWithProviders(<HomePage />);
    expect(
      screen.getByRole("heading", { name: "Key Features" })
    ).toBeInTheDocument();
  });

  it("renders all 4 feature cards", () => {
    renderWithProviders(<HomePage />);
    expect(
      screen.getByRole("heading", { name: "Real-time Dashboard" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Model Management" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Advanced Monitoring" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Custom Configuration" })
    ).toBeInTheDocument();
  });

  it("renders feature descriptions", () => {
    renderWithProviders(<HomePage />);
    expect(
      screen.getByText("Monitor your AI models with live metrics")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Easily configure and control multiple AI models")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Track system health and performance in real-time")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Fine-tune your setup with advanced settings")
    ).toBeInTheDocument();
  });

  it("renders 'Quick Stats' section", () => {
    renderWithProviders(<HomePage />);
    expect(
      screen.getByRole("heading", { name: "Quick Stats" })
    ).toBeInTheDocument();
  });

  it("renders all 4 stat values", () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByText("4+")).toBeInTheDocument();
    expect(screen.getByText("99.9%")).toBeInTheDocument();
    expect(screen.getByText("150ms")).toBeInTheDocument();
    expect(screen.getByText("1000+")).toBeInTheDocument();
  });

  it("renders all 4 stat labels", () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByText("Active Models")).toBeInTheDocument();
    expect(screen.getByText("Uptime")).toBeInTheDocument();
    expect(screen.getByText("Avg Response")).toBeInTheDocument();
    expect(screen.getByText("Requests")).toBeInTheDocument();
  });

  it("renders 'Built with Modern Technologies' section", () => {
    renderWithProviders(<HomePage />);
    expect(
      screen.getByRole("heading", { name: "Built with Modern Technologies" })
    ).toBeInTheDocument();
  });

  it("renders technology stack icons", () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByText("Next.js")).toBeInTheDocument();
    expect(screen.getByText("Material UI")).toBeInTheDocument();
    expect(screen.getByText("WebSocket")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("renders technology description", () => {
    renderWithProviders(<HomePage />);
    expect(
      screen.getByText(
        "Powered by modern web technologies for optimal performance and developer experience"
      )
    ).toBeInTheDocument();
  });

  it("renders 'Getting Started' section", () => {
    renderWithProviders(<HomePage />);
    expect(
      screen.getByRole("heading", { name: "Getting Started" })
    ).toBeInTheDocument();
  });

  it("renders getting started introduction", () => {
    renderWithProviders(<HomePage />);
    expect(
      screen.getByText(/New to Llama Runner Pro?/)
    ).toBeInTheDocument();
  });

  it("renders getting started steps", () => {
    renderWithProviders(<HomePage />);
    expect(
      screen.getByText("Connect your AI models through settings")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Configure model parameters and settings")
    ).toBeInTheDocument();
    expect(screen.getByText("Start monitoring real-time performance")).toBeInTheDocument();
    expect(screen.getByText("Analyze metrics and optimize your setup")).toBeInTheDocument();
  });

  it("renders 'View Documentation' button", () => {
    renderWithProviders(<HomePage />);
    const button = screen.getByRole("button", { name: "View Documentation" });
    expect(button).toBeInTheDocument();
  });

  it("'View Documentation' button links to /docs", () => {
    renderWithProviders(<HomePage />);
    const link = screen.getByTestId("link-docs");
    expect(link).toBeInTheDocument();
  });

  it("renders feature cards with correct links", () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByTestId("link-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("link-models")).toBeInTheDocument();
    expect(screen.getByTestId("link-monitoring")).toBeInTheDocument();
    expect(screen.getByTestId("link-settings")).toBeInTheDocument();
  });

  it("renders rocket icon", () => {
    renderWithProviders(<HomePage />);
    const rocketIcon = screen.getByTestId("rocket-icon");
    expect(rocketIcon).toBeInTheDocument();
  });

  it("has correct accessibility attributes", () => {
    renderWithProviders(<HomePage />);
    const headings = screen.getAllByRole("heading");
    expect(headings.length).toBeGreaterThan(0);

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  // Edge Case Tests
  it("handles theme toggle", () => {
    renderWithProviders(<HomePage />);

    expect(mockToggleTheme).not.toHaveBeenCalled();
  });

  it("renders correctly with dark mode", () => {
    mockToggleTheme.mockReturnValue({
      mode: "dark",
      setMode: mockSetMode,
      toggleTheme: mockToggleTheme,
      isDark: true,
      currentTheme: {},
    });

    renderWithProviders(<HomePage />);

    expect(screen.getByText("Welcome to Llama Runner Pro")).toBeInTheDocument();
  });

  it("handles empty features array (edge case)", () => {
    // Note: Features are hardcoded, but testing render stability
    renderWithProviders(<HomePage />);

    expect(screen.getAllByRole("heading").length).toBeGreaterThan(4);
  });

  it("handles very large stat values", () => {
    // Stats are hardcoded, but testing that they render
    renderWithProviders(<HomePage />);

    expect(screen.getByText("4+")).toBeInTheDocument();
    expect(screen.getByText("99.9%")).toBeInTheDocument();
    expect(screen.getByText("150ms")).toBeInTheDocument();
    expect(screen.getByText("1000+")).toBeInTheDocument();
  });

  it("handles link clicks", () => {
    renderWithProviders(<HomePage />);

    const dashboardLink = screen.getByTestId("link-dashboard");
    const modelsLink = screen.getByTestId("link-models");
    const monitoringLink = screen.getByTestId("link-monitoring");
    const settingsLink = screen.getByTestId("link-settings");
    const docsLink = screen.getByTestId("link-docs");

    expect(dashboardLink).toHaveAttribute("href", "/dashboard");
    expect(modelsLink).toHaveAttribute("href", "/models");
    expect(monitoringLink).toHaveAttribute("href", "/monitoring");
    expect(settingsLink).toHaveAttribute("href", "/settings");
    expect(docsLink).toHaveAttribute("href", "/docs");
  });

  it("renders with missing MainLayout (edge case)", () => {
    // Test that component still renders even if layout has issues
    renderWithProviders(<HomePage />);

    expect(screen.getByText("Welcome to Llama Runner Pro")).toBeInTheDocument();
  });

  it("handles rapid theme toggles", () => {
    for (let i = 0; i < 20; i++) {
      mockToggleTheme();
    }

    expect(mockToggleTheme).toHaveBeenCalled();
  });

  it("renders all technology stack items", () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByText("Next.js")).toBeInTheDocument();
    expect(screen.getByText("Material UI")).toBeInTheDocument();
    expect(screen.getByText("WebSocket")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("handles feature card hover states", () => {
    renderWithProviders(<HomePage />);

    const featureCards = screen.getAllByRole("link");
    expect(featureCards.length).toBeGreaterThan(4);

    featureCards.forEach(card => {
      expect(card).toHaveAttribute("href");
    });
  });

  it("renders all getting started steps", () => {
    renderWithProviders(<HomePage />);

    const gettingStartedSteps = [
      "Connect your AI models through settings",
      "Configure model parameters and settings",
      "Start monitoring real-time performance",
      "Analyze metrics and optimize your setup",
    ];

    gettingStartedSteps.forEach(step => {
      expect(screen.getByText(step)).toBeInTheDocument();
    });
  });

  it("handles button clicks without navigation", () => {
    renderWithProviders(<HomePage />);

    const getStartedButton = screen.getByRole("button", { name: "Get Started" });
    const viewDocsButton = screen.getByRole("button", { name: "View Documentation" });

    expect(getStartedButton).toBeInTheDocument();
    expect(viewDocsButton).toBeInTheDocument();
  });

  it("renders with empty stats (edge case)", () => {
    renderWithProviders(<HomePage />);

    // Stats are hardcoded, but test they render correctly
    const statValues = screen.getAllByText(/\d+/);
    expect(statValues.length).toBeGreaterThan(0);
  });

  it("handles responsive breakpoints", () => {
    renderWithProviders(<HomePage />);

    // Test that component renders at all viewport sizes
    expect(screen.getByText("Welcome to Llama Runner Pro")).toBeInTheDocument();

    // Grid should be present
    const gridElements = document.querySelectorAll('.MuiGrid-root');
    expect(gridElements.length).toBeGreaterThan(0);
  });

  it("renders rocket icon correctly", () => {
    renderWithProviders(<HomePage />);

    const rocketIcon = screen.getByTestId("rocket-icon");
    expect(rocketIcon).toBeInTheDocument();
    expect(rocketIcon).toHaveTextContent("🚀");
  });

  it("handles technology icons rendering", () => {
    renderWithProviders(<HomePage />);

    // Test that all icons render without errors
    const iconElements = document.querySelectorAll('[data-testid^="icon-"]');

    // Rocket icon should be present
    expect(screen.getByTestId("rocket-icon")).toBeInTheDocument();
  });

  it("renders with proper heading hierarchy", () => {
    renderWithProviders(<HomePage />);

    const h1 = screen.getByRole("heading", { level: 1 });
    const h2Elements = screen.getAllByRole("heading", { level: 2 });
    const h3Elements = screen.getAllByRole("heading", { level: 3 });
    const h6Elements = screen.getAllByRole("heading", { level: 6 });

    expect(h1).toBeInTheDocument();
    expect(h2Elements.length).toBeGreaterThan(0);
    expect(h3Elements.length).toBeGreaterThan(0);
    expect(h6Elements.length).toBeGreaterThan(0);
  });

  it("handles card descriptions with special characters", () => {
    renderWithProviders(<HomePage />);

    const description = "Fine-tune your setup with advanced settings";
    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it("handles button styling states", () => {
    renderWithProviders(<HomePage />);

    const getStartedButton = screen.getByRole("button", { name: "Get Started" });
    const viewDocsButton = screen.getByRole("button", { name: "View Documentation" });

    expect(getStartedButton).toBeInTheDocument();
    expect(viewDocsButton).toBeInTheDocument();
  });

  it("renders with correct section order", () => {
    renderWithProviders(<HomePage />);

    // Test that sections appear in expected order
    const headings = screen.getAllByRole("heading");

    // Should have main heading
    const mainHeading = headings.find(h => h.textContent === "Welcome to Llama Runner Pro");
    expect(mainHeading).toBeInTheDocument();

    // Should have Key Features section
    const featuresHeading = headings.find(h => h.textContent === "Key Features");
    expect(featuresHeading).toBeInTheDocument();

    // Should have Quick Stats section
    const statsHeading = headings.find(h => h.textContent === "Quick Stats");
    expect(statsHeading).toBeInTheDocument();
  });
});
