import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { FormSection } from "@/components/ui/FormSection";

describe("FormSection Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders title correctly", () => {
      render(
        <FormSection title="Test Section">
          <div>Content</div>
        </FormSection>
      );
      expect(screen.getByText("Test Section")).toBeInTheDocument();
    });

    it("renders children correctly", () => {
      render(
        <FormSection title="Test Section">
          <div data-testid="child">Child Content</div>
        </FormSection>
      );
      expect(screen.getByTestId("child")).toBeInTheDocument();
      expect(screen.getByText("Child Content")).toBeInTheDocument();
    });

    it("renders with icon", () => {
      render(
        <FormSection title="Settings" icon={<span>⚙️</span>}>
          <div>Content</div>
        </FormSection>
      );
      expect(screen.getByText("⚙️")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    it("renders without icon", () => {
      render(
        <FormSection title="Basic Section">
          <div>Content</div>
        </FormSection>
      );
      const icon = screen.queryByText(/icon/i);
      expect(icon).not.toBeInTheDocument();
    });
  });

  describe("Divider", () => {
    it("renders divider by default", () => {
      const { container } = render(
        <FormSection title="Section">
          <div>Content</div>
        </FormSection>
      );
      const divider = container.querySelector(".MuiDivider-root");
      expect(divider).toBeInTheDocument();
    });

    it("does not render divider when divider is false", () => {
      const { container } = render(
        <FormSection title="Section" divider={false}>
          <div>Content</div>
        </FormSection>
      );
      const divider = container.querySelector(".MuiDivider-root");
      expect(divider).not.toBeInTheDocument();
    });

    it("renders divider explicitly when true", () => {
      const { container } = render(
        <FormSection title="Section" divider={true}>
          <div>Content</div>
        </FormSection>
      );
      const divider = container.querySelector(".MuiDivider-root");
      expect(divider).toBeInTheDocument();
    });
  });

  describe("Spacing", () => {
    it("uses default spacing of 2", () => {
      const { container } = render(
        <FormSection title="Section">
          <div>Content</div>
        </FormSection>
      );
      const gridContainer = container.querySelector(".MuiGrid-container");
      expect(gridContainer).toBeInTheDocument();
    });

    it("applies custom spacing", () => {
      render(
        <FormSection title="Section" spacing={4}>
          <div data-testid="child">Child</div>
        </FormSection>
      );
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("handles spacing of 0", () => {
      render(
        <FormSection title="Section" spacing={0}>
          <div data-testid="child">Child</div>
        </FormSection>
      );
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("handles large spacing values", () => {
      render(
        <FormSection title="Section" spacing={10}>
          <div data-testid="child">Child</div>
        </FormSection>
      );
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
  });

  describe("Content Handling", () => {
    it("renders single child", () => {
      render(
        <FormSection title="Section">
          <div>Single Child</div>
        </FormSection>
      );
      expect(screen.getByText("Single Child")).toBeInTheDocument();
    });

    it("renders multiple children", () => {
      render(
        <FormSection title="Section">
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </FormSection>
      );
      expect(screen.getByText("Child 1")).toBeInTheDocument();
      expect(screen.getByText("Child 2")).toBeInTheDocument();
      expect(screen.getByText("Child 3")).toBeInTheDocument();
    });

    it("renders nested children", () => {
      render(
        <FormSection title="Section">
          <div>
            <span>Nested Content</span>
          </div>
        </FormSection>
      );
      expect(screen.getByText("Nested Content")).toBeInTheDocument();
    });

    it("renders React components as children", () => {
      const TestComponent = () => <div>Component Content</div>;
      render(
        <FormSection title="Section">
          <TestComponent />
        </FormSection>
      );
      expect(screen.getByText("Component Content")).toBeInTheDocument();
    });
  });

  describe("Icon Handling", () => {
    it("renders emoji icon", () => {
      render(
        <FormSection title="Settings" icon="⚙️">
          <div>Content</div>
        </FormSection>
      );
      expect(screen.getByText("⚙️")).toBeInTheDocument();
    });

    it("renders React element icon", () => {
      const IconComponent = () => <span data-testid="custom-icon">🎨</span>;
      render(
        <FormSection title="Design" icon={<IconComponent />}>
          <div>Content</div>
        </FormSection>
      );
      expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    });

    it("renders icon next to title", () => {
      render(
        <FormSection title="Settings" icon={<span>⚙️</span>}>
          <div>Content</div>
        </FormSection>
      );
      expect(screen.getByText("⚙️")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });
  });

  describe("Title Styling", () => {
    it("renders title with subtitle2 variant", () => {
      const { container } = render(
        <FormSection title="Test Title">
          <div>Content</div>
        </FormSection>
      );
      const title = container.querySelector(".MuiTypography-subtitle2");
      expect(title).toBeInTheDocument();
    });

    it("title is bold", () => {
      const { container } = render(
        <FormSection title="Test Title">
          <div>Content</div>
        </FormSection>
      );
      const title = container.querySelector(".MuiTypography-subtitle2");
      expect(title).toHaveStyle({ fontWeight: "bold" });
    });

    it("title has primary color", () => {
      const { container } = render(
        <FormSection title="Test Title">
          <div>Content</div>
        </FormSection>
      );
      const title = container.querySelector(".MuiTypography-subtitle2");
      expect(title).toHaveStyle({ color: "primary.main" });
    });
  });

  describe("Grid Structure", () => {
    it("uses Grid component for layout", () => {
      const { container } = render(
        <FormSection title="Section">
          <div>Content</div>
        </FormSection>
      );
      const grids = container.querySelectorAll(".MuiGrid-container");
      expect(grids.length).toBeGreaterThan(0);
    });

    it("has responsive grid layout", () => {
      render(
        <FormSection title="Section">
          <div>Content</div>
        </FormSection>
      );
      const childGrid = screen.getByText("Content").closest(".MuiGrid-root");
      expect(childGrid).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles empty children", () => {
      render(<FormSection title="Empty Section"></FormSection>);
      expect(screen.getByText("Empty Section")).toBeInTheDocument();
    });

    it("handles null children", () => {
      render(
        <FormSection title="Section">{null}</FormSection>
      );
      expect(screen.getByText("Section")).toBeInTheDocument();
    });

    it("handles undefined children", () => {
      render(
        <FormSection title="Section">{undefined}</FormSection>
      );
      expect(screen.getByText("Section")).toBeInTheDocument();
    });

    it("handles very long title", () => {
      const longTitle = "A".repeat(1000);
      render(
        <FormSection title={longTitle}>
          <div>Content</div>
        </FormSection>
      );
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it("handles title with special characters", () => {
      const specialTitle = "Test & Section <script>";
      render(
        <FormSection title={specialTitle}>
          <div>Content</div>
        </FormSection>
      );
      expect(screen.getByText("Test & Section <script>")).toBeInTheDocument();
    });

    it("handles title with emoji", () => {
      render(
        <FormSection title="🎨 Design Settings">
          <div>Content</div>
        </FormSection>
      );
      expect(screen.getByText("🎨 Design Settings")).toBeInTheDocument();
    });

    it("handles negative spacing", () => {
      render(
        <FormSection title="Section" spacing={-1}>
          <div>Content</div>
        </FormSection>
      );
      expect(screen.getByText("Content")).toBeInTheDocument();
    });
  });

  describe("Complex Content", () => {
    it("renders form fields as children", () => {
      render(
        <FormSection title="Personal Info">
          <input type="text" placeholder="Name" />
          <input type="email" placeholder="Email" />
          <input type="tel" placeholder="Phone" />
        </FormSection>
      );
      expect(screen.getByPlaceholderText("Name")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Phone")).toBeInTheDocument();
    });

    it("renders multiple form sections", () => {
      render(
        <div>
          <FormSection title="Section 1">
            <div>Content 1</div>
          </FormSection>
          <FormSection title="Section 2">
            <div>Content 2</div>
          </FormSection>
          <FormSection title="Section 3">
            <div>Content 3</div>
          </FormSection>
        </div>
      );
      expect(screen.getByText("Section 1")).toBeInTheDocument();
      expect(screen.getByText("Section 2")).toBeInTheDocument();
      expect(screen.getByText("Section 3")).toBeInTheDocument();
    });

    it("renders nested content with different types", () => {
      render(
        <FormSection title="Mixed Content">
          <span>Text</span>
          <div>Div</div>
          <p>Paragraph</p>
          <strong>Strong</strong>
        </FormSection>
      );
      expect(screen.getByText("Text")).toBeInTheDocument();
      expect(screen.getByText("Div")).toBeInTheDocument();
      expect(screen.getByText("Paragraph")).toBeInTheDocument();
      expect(screen.getByText("Strong")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("renders semantic heading", () => {
      render(
        <FormSection title="Accessible Section">
          <div>Content</div>
        </FormSection>
      );
      const title = screen.getByText("Accessible Section");
      expect(title).toBeInTheDocument();
    });
  });

  describe("Divider Positioning", () => {
    it("divider appears after children", () => {
      const { container } = render(
        <FormSection title="Section">
          <div data-testid="first-child">First</div>
          <div data-testid="second-child">Second</div>
        </FormSection>
      );
      expect(screen.getByTestId("first-child")).toBeInTheDocument();
      expect(screen.getByTestId("second-child")).toBeInTheDocument();
      const divider = container.querySelector(".MuiDivider-root");
      expect(divider).toBeInTheDocument();
    });
  });
});
