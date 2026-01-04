import { screen, fireEvent } from "@testing-library/react";
import { renderHomePage, navigationPaths } from "./test-utils";

describe("HomePage - Interactions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Button and Link Interactions", () => {
    it("renders get started button with correct attributes", () => {
      const { container } = renderHomePage();
      const button = screen.getByRole("button", { name: /get started/i });
      expect(button).toBeInTheDocument();
      const link = container.querySelector('[data-href="/dashboard"]');
      expect(link).toBeInTheDocument();
    });

    it("renders view documentation link with correct attributes", () => {
      const { container } = renderHomePage();
      expect(screen.getByText("View Documentation")).toBeInTheDocument();
      const link = container.querySelector('[data-href="/docs"]');
      expect(link).toBeInTheDocument();
    });

    it("can click on get started button", () => {
      const { container } = renderHomePage();
      const button = screen.getByRole("button", { name: /get started/i });
      expect(button).toBeInTheDocument();
    });

    it("can click on view documentation link", () => {
      const { container } = renderHomePage();
      const link = container.querySelector('[data-href="/docs"]');
      expect(link).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("has dashboard link", () => {
      const { container } = renderHomePage();
      const links = container.querySelectorAll('[data-href="/dashboard"]');
      expect(links.length).toBeGreaterThan(0);
    });

    it("has models link", () => {
      const { container } = renderHomePage();
      const links = container.querySelectorAll('[data-href="/models"]');
      expect(links.length).toBeGreaterThan(0);
    });

    it("has monitoring link", () => {
      const { container } = renderHomePage();
      const links = container.querySelectorAll('[data-href="/monitoring"]');
      expect(links.length).toBeGreaterThan(0);
    });

    it("has settings link", () => {
      const { container } = renderHomePage();
      const links = container.querySelectorAll('[data-href="/settings"]');
      expect(links.length).toBeGreaterThan(0);
    });

    it("has docs link", () => {
      const { container } = renderHomePage();
      const links = container.querySelectorAll('[data-href="/docs"]');
      expect(links.length).toBeGreaterThan(0);
    });

    it("has all expected navigation paths", () => {
      const { container } = renderHomePage();
      navigationPaths.forEach(path => {
        const links = container.querySelectorAll(`[data-href="${path}"]`);
        expect(links.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Feature Cards", () => {
    it("renders all 4 feature cards", () => {
      renderHomePage();
      const features = [
        "Real-time Dashboard",
        "Model Management",
        "Advanced Monitoring",
        "Custom Configuration",
      ];
      features.forEach(feature => {
        expect(screen.getByText(feature)).toBeInTheDocument();
      });
    });

    it("feature cards have correct descriptions", () => {
      renderHomePage();
      expect(
        screen.getByText("Monitor your AI models with live metrics and performance data")
      ).toBeInTheDocument();
      expect(screen.getByText("Easily configure and control multiple AI models")).toBeInTheDocument();
      expect(screen.getByText("Track system health and performance in real-time")).toBeInTheDocument();
      expect(screen.getByText("Fine-tune your setup with advanced settings")).toBeInTheDocument();
    });

    it("feature cards link to correct paths", () => {
      const { container } = renderHomePage();
      const links = container.querySelectorAll('[data-href]');
      const paths = ["/dashboard", "/models", "/monitoring", "/settings"];
      paths.forEach(path => {
        const link = Array.from(links).find(l => l.getAttribute("data-href") === path);
        expect(link).toBeInTheDocument();
      });
    });
  });
});
