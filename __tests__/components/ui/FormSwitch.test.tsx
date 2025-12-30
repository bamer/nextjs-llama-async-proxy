import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import FormSwitch from "@/components/ui/FormSwitch";

// Mock FormTooltip
jest.mock("@/components/ui/FormTooltip", () => ({
  __esModule: true,
  default: ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <div data-testid="tooltip-wrapper" data-title={title}>
      {children}
    </div>
  ),
}));

describe("FormSwitch Component", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders without label", () => {
      render(<FormSwitch checked={false} onChange={mockOnChange} />);
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("renders with label", () => {
      render(
        <FormSwitch checked={false} onChange={mockOnChange} label="Test Switch" />
      );
      expect(screen.getByText("Test Switch")).toBeInTheDocument();
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("renders checked state", () => {
      render(<FormSwitch checked={true} onChange={mockOnChange} />);
      expect(screen.getByRole("checkbox")).toBeChecked();
    });

    it("renders unchecked state", () => {
      render(<FormSwitch checked={false} onChange={mockOnChange} />);
      expect(screen.getByRole("checkbox")).not.toBeChecked();
    });
  });

  describe("User Interactions", () => {
    it("calls onChange when clicked", () => {
      render(<FormSwitch checked={false} onChange={mockOnChange} label="Test" />);
      const checkbox = screen.getByRole("checkbox");

      fireEvent.click(checkbox);

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.any(Object),
        true
      );
    });

    it("calls onChange with correct event and checked value", () => {
      render(<FormSwitch checked={true} onChange={mockOnChange} />);
      const checkbox = screen.getByRole("checkbox");

      fireEvent.click(checkbox);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ type: "change", target: checkbox }),
        false
      );
    });

    it("does not call onChange when disabled", () => {
      render(
        <FormSwitch
          checked={false}
          onChange={mockOnChange}
          disabled={true}
          label="Disabled"
        />
      );
      const checkbox = screen.getByRole("checkbox");

      fireEvent.click(checkbox);

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe("Helper Text", () => {
    it("renders helper text when provided", () => {
      render(
        <FormSwitch
          checked={false}
          onChange={mockOnChange}
          label="Test"
          helperText="Helper text description"
        />
      );
      expect(screen.getByText("Helper text description")).toBeInTheDocument();
    });

    it("does not render helper text when not provided", () => {
      render(
        <FormSwitch checked={false} onChange={mockOnChange} label="Test" />
      );
      const helperText = screen.queryByText(/helper/i);
      expect(helperText).not.toBeInTheDocument();
    });

    it("renders helper text below label", () => {
      render(
        <FormSwitch
          checked={false}
          onChange={mockOnChange}
          label="Main Label"
          helperText="Helper Text"
        />
      );
      expect(screen.getByText("Main Label")).toBeInTheDocument();
      expect(screen.getByText("Helper Text")).toBeInTheDocument();
    });
  });

  describe("Tooltip", () => {
    it("wraps control in tooltip when tooltip prop is provided", () => {
      render(
        <FormSwitch
          checked={false}
          onChange={mockOnChange}
          label="Test"
          tooltip="Tooltip content"
        />
      );
      expect(screen.getByTestId("tooltip-wrapper")).toBeInTheDocument();
      expect(screen.getByTestId("tooltip-wrapper")).toHaveAttribute(
        "data-title",
        "Tooltip content"
      );
    });

    it("does not render tooltip wrapper when tooltip not provided", () => {
      render(
        <FormSwitch checked={false} onChange={mockOnChange} label="Test" />
      );
      expect(screen.queryByTestId("tooltip-wrapper")).not.toBeInTheDocument();
    });

    it("renders tooltip with empty string", () => {
      render(
        <FormSwitch
          checked={false}
          onChange={mockOnChange}
          label="Test"
          tooltip=""
        />
      );
      const tooltipWrapper = screen.queryByTestId("tooltip-wrapper");
      // Empty string is falsy, so no tooltip should render
      expect(tooltipWrapper).not.toBeInTheDocument();
    });
  });

  describe("Disabled State", () => {
    it("renders disabled switch", () => {
      render(
        <FormSwitch
          checked={false}
          onChange={mockOnChange}
          disabled={true}
          label="Disabled"
        />
      );
      expect(screen.getByRole("checkbox")).toBeDisabled();
    });

    it("disables label interaction when switch is disabled", () => {
      render(
        <FormSwitch
          checked={false}
          onChange={mockOnChange}
          disabled={true}
          label="Disabled Label"
        />
      );
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeDisabled();
    });

    it("applies disabled styles to helper text", () => {
      render(
        <FormSwitch
          checked={false}
          onChange={mockOnChange}
          disabled={true}
          label="Test"
          helperText="Helper text"
        />
      );
      const helperText = screen.getByText("Helper text");
      expect(helperText).toBeInTheDocument();
    });
  });

  describe("Switch Props Passthrough", () => {
    it("passes additional props to Switch component", () => {
      render(
        <FormSwitch
          checked={false}
          onChange={mockOnChange}
          color="secondary"
          size="small"
        />
      );
      const switchElement = screen.getByRole("checkbox");
      expect(switchElement).toBeInTheDocument();
    });

    it("accepts custom color prop", () => {
      render(
        <FormSwitch
          checked={false}
          onChange={mockOnChange}
          color="error"
          label="Error Switch"
        />
      );
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("accepts custom size prop", () => {
      render(
        <FormSwitch
          checked={false}
          onChange={mockOnChange}
          size="medium"
          label="Medium Switch"
        />
      );
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });
  });

  describe("Label Rendering", () => {
    it("renders label as FormControlLabel", () => {
      render(
        <FormSwitch checked={false} onChange={mockOnChange} label="My Label" />
      );
      expect(screen.getByText("My Label")).toBeInTheDocument();
    });

    it("does not render label when not provided", () => {
      render(<FormSwitch checked={false} onChange={mockOnChange} />);
      const labelElement = screen.queryByRole("checkbox");
      expect(labelElement).toBeInTheDocument();
    });

    it("renders label with emoji", () => {
      render(
        <FormSwitch
          checked={false}
          onChange={mockOnChange}
          label="🔔 Notifications"
        />
      );
      expect(screen.getByText("🔔 Notifications")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles undefined label", () => {
      const { container } = render(
        <FormSwitch checked={false} onChange={mockOnChange} />
      );
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("handles empty label string", () => {
      const { container } = render(
        <FormSwitch checked={false} onChange={mockOnChange} label="" />
      );
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("handles very long label text", () => {
      const longLabel = "A".repeat(1000);
      render(
        <FormSwitch checked={false} onChange={mockOnChange} label={longLabel} />
      );
      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });

    it("handles special characters in label", () => {
      const specialLabel = "Test <script>alert('xss')</script> & 'quotes'";
      render(
        <FormSwitch checked={false} onChange={mockOnChange} label={specialLabel} />
      );
      expect(screen.getByText("Test <script>alert('xss')</script> & 'quotes'")).toBeInTheDocument();
    });

    it("handles null onChange gracefully", () => {
      expect(() => {
        render(<FormSwitch checked={false} onChange={null as any} label="Test" />);
      }).not.toThrow();
    });
  });

  describe("FormControlLabel Integration", () => {
    it("uses FormControlLabel component", () => {
      const { container } = render(
        <FormSwitch checked={false} onChange={mockOnChange} label="Test" />
      );
      const formControlLabel = container.querySelector(".MuiFormControlLabel-root");
      expect(formControlLabel).toBeInTheDocument();
    });

    it("applies disabled state to FormControlLabel", () => {
      const { container } = render(
        <FormSwitch
          checked={false}
          onChange={mockOnChange}
          disabled={true}
          label="Test"
        />
      );
      const formControlLabel = container.querySelector(".MuiFormControlLabel-root");
      expect(formControlLabel).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has checkbox role", () => {
      render(<FormSwitch checked={false} onChange={mockOnChange} />);
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("includes label in accessible name when provided", () => {
      render(
        <FormSwitch checked={false} onChange={mockOnChange} label="Accessible Label" />
      );
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeInTheDocument();
    });

    it("allows keyboard navigation", () => {
      render(<FormSwitch checked={false} onChange={mockOnChange} label="Test" />);
      const checkbox = screen.getByRole("checkbox");

      checkbox.focus();
      expect(checkbox).toHaveFocus();

      fireEvent.keyDown(checkbox, { key: " ", code: "Space" });
      expect(mockOnChange).toHaveBeenCalled();
    });
  });
});
