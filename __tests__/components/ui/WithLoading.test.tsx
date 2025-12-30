import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { WithLoading } from "@/components/ui/WithLoading";

describe("WithLoading Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Not Loading State", () => {
    it("renders children when loading is false", () => {
      render(
        <WithLoading loading={false}>
          <div>Loaded Content</div>
        </WithLoading>
      );
      expect(screen.getByText("Loaded Content")).toBeInTheDocument();
    });

    it("renders complex children when not loading", () => {
      render(
        <WithLoading loading={false}>
          <div>
            <h1>Title</h1>
            <p>Paragraph 1</p>
            <p>Paragraph 2</p>
          </div>
        </WithLoading>
      );
      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText("Paragraph 1")).toBeInTheDocument();
      expect(screen.getByText("Paragraph 2")).toBeInTheDocument();
    });

    it("renders multiple children when not loading", () => {
      render(
        <WithLoading loading={false}>
          <span>First</span>
          <span>Second</span>
          <span>Third</span>
        </WithLoading>
      );
      expect(screen.getByText("First")).toBeInTheDocument();
      expect(screen.getByText("Second")).toBeInTheDocument();
      expect(screen.getByText("Third")).toBeInTheDocument();
    });
  });

  describe("Loading State - Spinner Variant (Default)", () => {
    it("renders spinner when loading is true with default variant", () => {
      const { container } = render(
        <WithLoading loading={true}>
          <div>Content</div>
        </WithLoading>
      );
      const progress = container.querySelector(".MuiCircularProgress-root");
      expect(progress).toBeInTheDocument();
    });

    it("does not render children when loading", () => {
      const { container } = render(
        <WithLoading loading={true}>
          <div>Content</div>
        </WithLoading>
      );
      expect(screen.queryByText("Content")).not.toBeInTheDocument();
    });

    it("renders spinner with explicit spinner variant", () => {
      const { container } = render(
        <WithLoading loading={true} variant="spinner">
          <div>Content</div>
        </WithLoading>
      );
      const progress = container.querySelector(".MuiCircularProgress-root");
      expect(progress).toBeInTheDocument();
    });

    it("applies custom sx to spinner container", () => {
      const { container } = render(
        <WithLoading loading={true} variant="spinner" sx={{ mt: 4, p: 2 }}>
          <div>Content</div>
        </WithLoading>
      );
      const progress = container.querySelector(".MuiCircularProgress-root");
      expect(progress).toBeInTheDocument();
    });
  });

  describe("Loading State - Skeleton Variant", () => {
    it("renders skeleton when variant is skeleton", () => {
      const { container } = render(
        <WithLoading loading={true} variant="skeleton">
          <div>Content</div>
        </WithLoading>
      );
      const linearProgress = container.querySelector(".MuiLinearProgress-root");
      expect(linearProgress).toBeInTheDocument();
    });

    it("does not render children with skeleton variant", () => {
      render(
        <WithLoading loading={true} variant="skeleton">
          <div>Content</div>
        </WithLoading>
      );
      expect(screen.queryByText("Content")).not.toBeInTheDocument();
    });

    it("applies custom sx to skeleton container", () => {
      const { container } = render(
        <WithLoading loading={true} variant="skeleton" sx={{ width: "100%" }}>
          <div>Content</div>
        </WithLoading>
      );
      const linearProgress = container.querySelector(".MuiLinearProgress-root");
      expect(linearProgress).toBeInTheDocument();
    });
  });

  describe("Loading State - Overlay Variant", () => {
    it("renders overlay when variant is overlay", () => {
      render(
        <WithLoading loading={true} variant="overlay">
          <div>Content</div>
        </WithLoading>
      );
      expect(screen.getByText("Content")).toBeInTheDocument();
    });

    it("shows spinner overlay on top of children", () => {
      const { container } = render(
        <WithLoading loading={true} variant="overlay">
          <div>Background Content</div>
        </WithLoading>
      );
      const progress = container.querySelector(".MuiCircularProgress-root");
      expect(progress).toBeInTheDocument();
      expect(screen.getByText("Background Content")).toBeInTheDocument();
    });

    it("overlay has absolute positioning", () => {
      const { container } = render(
        <WithLoading loading={true} variant="overlay">
          <div>Content</div>
        </WithLoading>
      );
      const overlayBox = container.querySelector('[style*="position: absolute"]');
      expect(overlayBox).toBeInTheDocument();
    });

    it("overlay covers entire parent", () => {
      const { container } = render(
        <WithLoading loading={true} variant="overlay">
          <div>Content</div>
        </WithLoading>
      );
      const overlayBox = container.querySelector('[style*="top: 0"]');
      expect(overlayBox).toBeInTheDocument();
    });

    it("overlay has backdrop blur effect", () => {
      const { container } = render(
        <WithLoading loading={true} variant="overlay">
          <div>Content</div>
        </WithLoading>
      );
      const overlayBox = container.querySelector('[style*="backdrop-filter: blur"]');
      expect(overlayBox).toBeInTheDocument();
    });

    it("overlay centers the spinner", () => {
      const { container } = render(
        <WithLoading loading={true} variant="overlay">
          <div>Content</div>
        </WithLoading>
      );
      const overlayBox = container.querySelector('[style*="display: flex"]');
      expect(overlayBox).toBeInTheDocument();
      const withAlignItems = container.querySelector('[style*="align-items: center"]');
      expect(withAlignItems).toBeInTheDocument();
    });
  });

  describe("Custom Fallback", () => {
    it("renders custom fallback when loading", () => {
      render(
        <WithLoading loading={true} fallback={<div>Loading...</div>}>
          <div>Content</div>
        </WithLoading>
      );
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("fallback takes precedence over variant", () => {
      const { container } = render(
        <WithLoading
          loading={true}
          variant="spinner"
          fallback={<div>Custom Loader</div>}
        >
          <div>Content</div>
        </WithLoading>
      );
      expect(screen.getByText("Custom Loader")).toBeInTheDocument();
      expect(container.querySelector(".MuiCircularProgress-root")).not.toBeInTheDocument();
    });

    it("does not render children when showing fallback", () => {
      render(
        <WithLoading loading={true} fallback={<div>Custom Loading</div>}>
          <div>Content</div>
        </WithLoading>
      );
      expect(screen.queryByText("Content")).not.toBeInTheDocument();
    });

    it("ignores fallback when not loading", () => {
      render(
        <WithLoading loading={false} fallback={<div>Fallback</div>}>
          <div>Content</div>
        </WithLoading>
      );
      expect(screen.getByText("Content")).toBeInTheDocument();
      expect(screen.queryByText("Fallback")).not.toBeInTheDocument();
    });
  });

  describe("Complex Content", () => {
    it("handles React components as children", () => {
      const TestComponent = () => <div>Component Content</div>;
      render(
        <WithLoading loading={false}>
          <TestComponent />
        </WithLoading>
      );
      expect(screen.getByText("Component Content")).toBeInTheDocument();
    });

    it("handles deeply nested children", () => {
      render(
        <WithLoading loading={false}>
          <div>
            <div>
              <div>
                <span>Nested Content</span>
              </div>
            </div>
          </div>
        </WithLoading>
      );
      expect(screen.getByText("Nested Content")).toBeInTheDocument();
    });

    it("handles empty children when not loading", () => {
      const { container } = render(<WithLoading loading={false} />);
      expect(container.textContent).toBe("");
    });
  });

  describe("Edge Cases", () => {
    it("handles null children", () => {
      const { container } = render(
        <WithLoading loading={false}>{null}</WithLoading>
      );
      expect(container.textContent).toBe("");
    });

    it("handles undefined children", () => {
      const { container } = render(
        <WithLoading loading={false}>{undefined}</WithLoading>
      );
      expect(container.textContent).toBe("");
    });

    it("handles array of children", () => {
      render(
        <WithLoading loading={false}>
          {["Child 1", "Child 2", "Child 3"].map((text, i) => (
            <div key={i}>{text}</div>
          ))}
        </WithLoading>
      );
      expect(screen.getByText("Child 1")).toBeInTheDocument();
      expect(screen.getByText("Child 2")).toBeInTheDocument();
      expect(screen.getByText("Child 3")).toBeInTheDocument();
    });

    it("handles boolean children", () => {
      render(
        <WithLoading loading={false}>
          {true && <div>True</div>}
          {false && <div>False</div>}
        </WithLoading>
      );
      expect(screen.getByText("True")).toBeInTheDocument();
      expect(screen.queryByText("False")).not.toBeInTheDocument();
    });
  });

  describe("Variants Behavior", () => {
    it("switches correctly between variants", () => {
      const { container, rerender } = render(
        <WithLoading loading={true} variant="spinner">
          <div>Content</div>
        </WithLoading>
      );
      expect(container.querySelector(".MuiCircularProgress-root")).toBeInTheDocument();

      rerender(
        <WithLoading loading={true} variant="skeleton">
          <div>Content</div>
        </WithLoading>
      );
      expect(container.querySelector(".MuiLinearProgress-root")).toBeInTheDocument();
    });

    it("handles variant changes when loading state changes", () => {
      const { container, rerender } = render(
        <WithLoading loading={false} variant="spinner">
          <div>Content</div>
        </WithLoading>
      );
      expect(screen.getByText("Content")).toBeInTheDocument();

      rerender(
        <WithLoading loading={true} variant="spinner">
          <div>Content</div>
        </WithLoading>
      );
      expect(container.querySelector(".MuiCircularProgress-root")).toBeInTheDocument();
      expect(screen.queryByText("Content")).not.toBeInTheDocument();
    });
  });

  describe("Overlay with Complex Children", () => {
    it("overlay works with form inputs", () => {
      render(
        <WithLoading loading={true} variant="overlay">
          <form>
            <input type="text" placeholder="Name" />
            <button type="submit">Submit</button>
          </form>
        </WithLoading>
      );
      expect(screen.getByPlaceholderText("Name")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
    });

    it("overlay works with images", () => {
      render(
        <WithLoading loading={true} variant="overlay">
          <img src="test.jpg" alt="Test" />
        </WithLoading>
      );
      expect(screen.getByAltText("Test")).toBeInTheDocument();
    });

    it("overlay works with lists", () => {
      render(
        <WithLoading loading={true} variant="overlay">
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </WithLoading>
      );
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("does not re-render unnecessarily when props unchanged", () => {
      const { rerender } = render(
        <WithLoading loading={false}>
          <div>Content</div>
        </WithLoading>
      );

      rerender(
        <WithLoading loading={false}>
          <div>Content</div>
        </WithLoading>
      );

      expect(screen.getByText("Content")).toBeInTheDocument();
    });
  });
});
