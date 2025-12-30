import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { ThemedCard } from "@/components/ui/ThemedCard";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Mock ThemeContext
jest.mock("@/contexts/ThemeContext", () => ({
  ...jest.requireActual("@/contexts/ThemeContext"),
  useTheme: jest.fn(),
}));

const { useTheme } = require("@/contexts/ThemeContext");

const renderWithTheme = (component: React.ReactNode, isDark: boolean = false) => {
  useTheme.mockReturnValue({ isDark, toggleTheme: jest.fn() });
  return render(component);
};

describe("ThemedCard Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders children correctly", () => {
      renderWithTheme(<ThemedCard>Test Content</ThemedCard>);
      expect(screen.getByText("Test Content")).toBeInTheDocument();
    });

    it("renders with default variant", () => {
      renderWithTheme(
        <ThemedCard data-testid="card">Content</ThemedCard>
      );
      expect(screen.getByTestId("card")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      renderWithTheme(
        <ThemedCard className="custom-class" data-testid="card">
          Content
        </ThemedCard>
      );
      expect(screen.getByTestId("card")).toHaveClass("custom-class");
    });

    it("applies custom sx prop", () => {
      const { container } = renderWithTheme(
        <ThemedCard sx={{ mt: 2, p: 4 }}>Content</ThemedCard>
      );
      const card = container.querySelector(".MuiPaper-root");
      expect(card).toBeInTheDocument();
    });
  });

  describe("Variant - Default", () => {
    it("renders with default variant explicitly", () => {
      renderWithTheme(
        <ThemedCard variant="default" data-testid="card">
          Content
        </ThemedCard>
      );
      expect(screen.getByTestId("card")).toBeInTheDocument();
    });

    it("renders default variant in light mode", () => {
      renderWithTheme(
        <ThemedCard variant="default">Light Mode Card</ThemedCard>,
        false
      );
      expect(screen.getByText("Light Mode Card")).toBeInTheDocument();
    });

    it("renders default variant in dark mode", () => {
      renderWithTheme(
        <ThemedCard variant="default">Dark Mode Card</ThemedCard>,
        true
      );
      expect(screen.getByText("Dark Mode Card")).toBeInTheDocument();
    });
  });

  describe("Variant - Gradient", () => {
    it("renders with gradient variant", () => {
      renderWithTheme(
        <ThemedCard variant="gradient" data-testid="card">
          Gradient Card
        </ThemedCard>
      );
      expect(screen.getByTestId("card")).toBeInTheDocument();
      expect(screen.getByText("Gradient Card")).toBeInTheDocument();
    });

    it("renders gradient variant in light mode", () => {
      renderWithTheme(
        <ThemedCard variant="gradient">Light Gradient</ThemedCard>,
        false
      );
      expect(screen.getByText("Light Gradient")).toBeInTheDocument();
    });

    it("renders gradient variant in dark mode", () => {
      renderWithTheme(
        <ThemedCard variant="gradient">Dark Gradient</ThemedCard>,
        true
      );
      expect(screen.getByText("Dark Gradient")).toBeInTheDocument();
    });
  });

  describe("Variant - Glass", () => {
    it("renders with glass variant", () => {
      renderWithTheme(
        <ThemedCard variant="glass" data-testid="card">
          Glass Card
        </ThemedCard>
      );
      expect(screen.getByTestId("card")).toBeInTheDocument();
      expect(screen.getByText("Glass Card")).toBeInTheDocument();
    });

    it("renders glass variant in light mode", () => {
      renderWithTheme(
        <ThemedCard variant="glass">Light Glass</ThemedCard>,
        false
      );
      expect(screen.getByText("Light Glass")).toBeInTheDocument();
    });

    it("renders glass variant in dark mode", () => {
      renderWithTheme(
        <ThemedCard variant="glass">Dark Glass</ThemedCard>,
        true
      );
      expect(screen.getByText("Dark Glass")).toBeInTheDocument();
    });
  });

  describe("Content Handling", () => {
    it("renders with simple text", () => {
      renderWithTheme(<ThemedCard>Simple Text</ThemedCard>);
      expect(screen.getByText("Simple Text")).toBeInTheDocument();
    });

    it("renders with nested elements", () => {
      renderWithTheme(
        <ThemedCard>
          <div>
            <h1>Title</h1>
            <p>Paragraph</p>
          </div>
        </ThemedCard>
      );
      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText("Paragraph")).toBeInTheDocument();
    });

    it("renders with multiple children", () => {
      renderWithTheme(
        <ThemedCard>
          <span>First</span>
          <span>Second</span>
          <span>Third</span>
        </ThemedCard>
      );
      expect(screen.getByText("First")).toBeInTheDocument();
      expect(screen.getByText("Second")).toBeInTheDocument();
      expect(screen.getByText("Third")).toBeInTheDocument();
    });

    it("renders with React components as children", () => {
      const TestComponent = () => <div>Test Component</div>;
      renderWithTheme(
        <ThemedCard>
          <TestComponent />
        </ThemedCard>
      );
      expect(screen.getByText("Test Component")).toBeInTheDocument();
    });
  });

  describe("Style Propagation", () => {
    it("merges custom sx with variant styles", () => {
      renderWithTheme(
        <ThemedCard variant="gradient" sx={{ mt: 3 }} data-testid="card">
          Content
        </ThemedCard>
      );
      expect(screen.getByTestId("card")).toBeInTheDocument();
    });

    it("preserves base styles with custom className", () => {
      renderWithTheme(
        <ThemedCard className="test-class custom" data-testid="card">
          Content
        </ThemedCard>
      );
      const card = screen.getByTestId("card");
      expect(card).toHaveClass("test-class");
      expect(card).toHaveClass("custom");
    });
  });

  describe("Theme Context Integration", () => {
    it("receives isDark from ThemeContext", () => {
      renderWithTheme(<ThemedCard>Test</ThemedCard>, true);
      expect(useTheme).toHaveBeenCalled();
    });

    it("responds to theme changes", () => {
      const { rerender } = renderWithTheme(
        <ThemedCard>Content</ThemedCard>,
        false
      );

      useTheme.mockReturnValue({ isDark: true, toggleTheme: jest.fn() });
      rerender(<ThemedCard>Content</ThemedCard>);

      expect(screen.getByText("Content")).toBeInTheDocument();
    });
  });

  describe("Box Container", () => {
    it("wraps children in Box with padding", () => {
      renderWithTheme(<ThemedCard>Content</ThemedCard>);
      const box = screen.getByText("Content").parentElement;
      expect(box).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles empty children", () => {
      const { container } = renderWithTheme(<ThemedCard></ThemedCard>);
      expect(container.querySelector(".MuiCard-root")).toBeInTheDocument();
    });

    it("handles null children", () => {
      const { container } = renderWithTheme(<ThemedCard>{null}</ThemedCard>);
      expect(container.querySelector(".MuiCard-root")).toBeInTheDocument();
    });

    it("handles undefined children", () => {
      const { container } = renderWithTheme(<ThemedCard>{undefined}</ThemedCard>);
      expect(container.querySelector(".MuiCard-root")).toBeInTheDocument();
    });

    it("handles very long content", () => {
      const longText = "A".repeat(1000);
      renderWithTheme(<ThemedCard>{longText}</ThemedCard>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("renders semantic Card element", () => {
      const { container } = renderWithTheme(
        <ThemedCard>Content</ThemedCard>
      );
      const card = container.querySelector('[role="presentation"]');
      expect(card).toBeInTheDocument();
    });
  });
});
