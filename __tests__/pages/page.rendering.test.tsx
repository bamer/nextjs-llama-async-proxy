import { screen } from "@testing-library/react";
import { renderHomePage, expectedFeatures, expectedTechStack, featureIcons, techStackIcons } from "./test-utils";

describe("HomePage - Rendering", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Light Mode", () => {
    it("renders in light mode", () => {
      renderHomePage("light");
      expect(screen.getByText("Welcome to Llama Runner Pro")).toBeInTheDocument();
    });

    it("renders hero section in light mode", () => {
      renderHomePage("light");
      expect(screen.getByText(/ultimate platform for managing/)).toBeInTheDocument();
    });

    it("renders get started button in light mode", () => {
      renderHomePage("light");
      const button = screen.getByRole("button", { name: /get started/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("href", "/dashboard");
    });

    it("renders features section in light mode", () => {
      renderHomePage("light");
      expect(screen.getByText("Key Features")).toBeInTheDocument();
      expectedFeatures.forEach(feature => {
        expect(screen.getByText(feature)).toBeInTheDocument();
      });
    });

    it("renders stats section in light mode", () => {
      renderHomePage("light");
      expect(screen.getByText("Quick Stats")).toBeInTheDocument();
      expect(screen.getByText("4+")).toBeInTheDocument();
      expect(screen.getByText("99.9%")).toBeInTheDocument();
      expect(screen.getByText("150ms")).toBeInTheDocument();
      expect(screen.getByText("1000+")).toBeInTheDocument();
    });

    it("renders tech stack in light mode", () => {
      renderHomePage("light");
      expect(screen.getByText("Built with Modern Technologies")).toBeInTheDocument();
      expectedTechStack.forEach(tech => {
        expect(screen.getByText(tech)).toBeInTheDocument();
      });
    });

    it("renders getting started in light mode", () => {
      renderHomePage("light");
      expect(screen.getByText("Getting Started")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /view documentation/i })).toBeInTheDocument();
    });
  });

  describe("Dark Mode", () => {
    it("renders in dark mode", () => {
      renderHomePage("dark");
      expect(screen.getByText("Welcome to Llama Runner Pro")).toBeInTheDocument();
    });

    it("renders hero section in dark mode", () => {
      renderHomePage("dark");
      expect(screen.getByText(/ultimate platform for managing/)).toBeInTheDocument();
    });

    it("renders get started button in dark mode", () => {
      renderHomePage("dark");
      const button = screen.getByRole("button", { name: /get started/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("href", "/dashboard");
    });

    it("renders features section in dark mode", () => {
      renderHomePage("dark");
      expect(screen.getByText("Key Features")).toBeInTheDocument();
      expectedFeatures.forEach(feature => {
        expect(screen.getByText(feature)).toBeInTheDocument();
      });
    });

    it("renders stats section in dark mode", () => {
      renderHomePage("dark");
      expect(screen.getByText("Quick Stats")).toBeInTheDocument();
      expect(screen.getByText("4+")).toBeInTheDocument();
      expect(screen.getByText("99.9%")).toBeInTheDocument();
      expect(screen.getByText("150ms")).toBeInTheDocument();
      expect(screen.getByText("1000+")).toBeInTheDocument();
    });

    it("renders tech stack in dark mode", () => {
      renderHomePage("dark");
      expect(screen.getByText("Built with Modern Technologies")).toBeInTheDocument();
      expectedTechStack.forEach(tech => {
        expect(screen.getByText(tech)).toBeInTheDocument();
      });
    });

    it("renders getting started in dark mode", () => {
      renderHomePage("dark");
      expect(screen.getByText("Getting Started")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /view documentation/i })).toBeInTheDocument();
    });
  });

  describe("Layout Sections", () => {
    it("renders hero section", () => {
      renderHomePage();
      expect(screen.getByText("Welcome to Llama Runner Pro")).toBeInTheDocument();
    });

    it("renders features section", () => {
      renderHomePage();
      expect(screen.getByText("Key Features")).toBeInTheDocument();
    });

    it("renders stats section", () => {
      renderHomePage();
      expect(screen.getByText("Quick Stats")).toBeInTheDocument();
    });

    it("renders tech stack section", () => {
      renderHomePage();
      expect(screen.getByText("Built with Modern Technologies")).toBeInTheDocument();
    });

    it("renders getting started section", () => {
      renderHomePage();
      expect(screen.getByText("Getting Started")).toBeInTheDocument();
    });
  });

  describe("Icons", () => {
    it("renders rocket icon", () => {
      const { container } = renderHomePage();
      const rocket = container.querySelector('[data-icon="Rocket"]');
      expect(rocket).toBeInTheDocument();
    });

    it("renders all feature icons", () => {
      const { container } = renderHomePage();
      featureIcons.forEach(icon => {
        const element = container.querySelector(`[data-icon="${icon}"]`);
        expect(element).toBeInTheDocument();
      });
    });

    it("renders all tech stack icons", () => {
      const { container } = renderHomePage();
      techStackIcons.forEach(icon => {
        const element = container.querySelector(`[data-icon="${icon}"]`);
        expect(element).toBeInTheDocument();
      });
    });
  });
});
