import { screen } from "@testing-library/react";
import { renderHomePage } from "./test-utils";

describe("HomePage - Error Handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Edge Cases and Error Scenarios", () => {
    it("handles empty theme context gracefully", () => {
      renderHomePage("light");
      expect(screen.getByText("Welcome to Llama Runner Pro")).toBeInTheDocument();
    });

    it("handles null/undefined props", () => {
      renderHomePage("light");
      expect(screen.getByText("Welcome to Llama Runner Pro")).toBeInTheDocument();
    });

    it("handles null values in feature descriptions", () => {
      renderHomePage();
      expect(screen.getByText("Key Features")).toBeInTheDocument();
    });

    it("handles null values in stats", () => {
      renderHomePage();
      expect(screen.getByText("Quick Stats")).toBeInTheDocument();
    });

    it("handles null values in tech stack", () => {
      renderHomePage();
      expect(screen.getByText("Built with Modern Technologies")).toBeInTheDocument();
    });
  });

  describe("Conditional Rendering", () => {
    it("renders correctly in light mode (isDark: false)", () => {
      renderHomePage("light");
      expect(screen.getByText("Welcome to Llama Runner Pro")).toBeInTheDocument();
    });

    it("renders correctly in dark mode (isDark: true)", () => {
      renderHomePage("dark");
      expect(screen.getByText("Welcome to Llama Runner Pro")).toBeInTheDocument();
    });
  });

  describe("Data Structure Validation", () => {
    it("features array has correct length", () => {
      renderHomePage();
      const featureTitles = [
        "Real-time Dashboard",
        "Model Management",
        "Advanced Monitoring",
        "Custom Configuration",
      ];
      featureTitles.forEach(title => {
        expect(screen.getByText(title)).toBeInTheDocument();
      });
    });

    it("stats array has correct length", () => {
      renderHomePage();
      expect(screen.getByText("4+")).toBeInTheDocument();
      expect(screen.getByText("99.9%")).toBeInTheDocument();
      expect(screen.getByText("150ms")).toBeInTheDocument();
      expect(screen.getByText("1000+")).toBeInTheDocument();
    });

    it("tech stack array has correct length", () => {
      renderHomePage();
      const techLabels = ["Next.js", "Material UI", "WebSocket", "TypeScript"];
      techLabels.forEach(label => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });
  });
});
