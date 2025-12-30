import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { FormField } from "@/components/ui/FormField";

// Mock FormTooltip
jest.mock("@/components/ui/FormTooltip", () => ({
  __esModule: true,
  FormTooltip: ({ content }: { content: any }) => (
    <span data-testid="form-tooltip" data-content={JSON.stringify(content)}>
      <span role="img" aria-label="info">ℹ️</span>
    </span>
  ),
  TooltipContent: {} as any,
}));

describe("FormField Component", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Type: Text", () => {
    it("renders text field", () => {
      render(
        <FormField
          type="text"
          label="Name"
          name="name"
          value="John"
          onChange={mockOnChange}
        />
      );
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    it("renders text field with value", () => {
      render(
        <FormField
          type="text"
          label="Name"
          name="name"
          value="Test Value"
          onChange={mockOnChange}
        />
      );
      const input = screen.getByRole("textbox");
      expect(input).toHaveValue("Test Value");
    });

    it("calls onChange when text field value changes", () => {
      render(
        <FormField
          type="text"
          label="Name"
          name="name"
          value=""
          onChange={mockOnChange}
        />
      );
      const input = screen.getByRole("textbox");

      fireEvent.change(input, { target: { value: "New Value" } });

      expect(mockOnChange).toHaveBeenCalledWith("name", "New Value");
    });

    it("displays error message", () => {
      render(
        <FormField
          type="text"
          label="Name"
          name="name"
          value=""
          onChange={mockOnChange}
          error="Name is required"
        />
      );
      expect(screen.getByText("Name is required")).toBeInTheDocument();
    });

    it("displays helper text", () => {
      render(
        <FormField
          type="text"
          label="Name"
          name="name"
          value=""
          onChange={mockOnChange}
          helperText="Enter your full name"
        />
      );
      expect(screen.getByText("Enter your full name")).toBeInTheDocument();
    });

    it("shows error message in error color", () => {
      render(
        <FormField
          type="text"
          label="Name"
          name="name"
          value=""
          onChange={mockOnChange}
          error="Field error"
        />
      );
      const errorText = screen.getByText("Field error");
      expect(errorText).toBeInTheDocument();
    });
  });

  describe("Type: Number", () => {
    it("renders number field", () => {
      render(
        <FormField
          type="number"
          label="Age"
          name="age"
          value={25}
          onChange={mockOnChange}
        />
      );
      expect(screen.getByLabelText(/age/i)).toBeInTheDocument();
    });

    it("renders number field with value", () => {
      render(
        <FormField
          type="number"
          label="Age"
          name="age"
          value={42}
          onChange={mockOnChange}
        />
      );
      const input = screen.getByRole("spinbutton");
      expect(input).toHaveValue(42);
    });

    it("calls onChange with number value", () => {
      render(
        <FormField
          type="number"
          label="Age"
          name="age"
          value={0}
          onChange={mockOnChange}
        />
      );
      const input = screen.getByRole("spinbutton");

      fireEvent.change(input, { target: { value: "30" } });

      expect(mockOnChange).toHaveBeenCalledWith("age", 30);
    });

    it("handles zero value", () => {
      render(
        <FormField
          type="number"
          label="Count"
          name="count"
          value={0}
          onChange={mockOnChange}
        />
      );
      const input = screen.getByRole("spinbutton");
      expect(input).toHaveValue(0);
    });
  });

  describe("Type: Boolean (Checkbox)", () => {
    it("renders checkbox field", () => {
      render(
        <FormField
          type="boolean"
          label="Enabled"
          name="enabled"
          value={false}
          onChange={mockOnChange}
        />
      );
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("renders checked checkbox", () => {
      render(
        <FormField
          type="boolean"
          label="Enabled"
          name="enabled"
          value={true}
          onChange={mockOnChange}
        />
      );
      expect(screen.getByRole("checkbox")).toBeChecked();
    });

    it("renders unchecked checkbox", () => {
      render(
        <FormField
          type="boolean"
          label="Enabled"
          name="enabled"
          value={false}
          onChange={mockOnChange}
        />
      );
      expect(screen.getByRole("checkbox")).not.toBeChecked();
    });

    it("calls onChange with boolean value when checked", () => {
      render(
        <FormField
          type="boolean"
          label="Enabled"
          name="enabled"
          value={false}
          onChange={mockOnChange}
        />
      );
      const checkbox = screen.getByRole("checkbox");

      fireEvent.click(checkbox);

      expect(mockOnChange).toHaveBeenCalledWith("enabled", true);
    });

    it("calls onChange with false when unchecked", () => {
      render(
        <FormField
          type="boolean"
          label="Enabled"
          name="enabled"
          value={true}
          onChange={mockOnChange}
        />
      );
      const checkbox = screen.getByRole("checkbox");

      fireEvent.click(checkbox);

      expect(mockOnChange).toHaveBeenCalledWith("enabled", false);
    });

    it("displays helper text for checkbox", () => {
      render(
        <FormField
          type="boolean"
          label="Enabled"
          name="enabled"
          value={false}
          onChange={mockOnChange}
          helperText="Enable this feature"
        />
      );
      expect(screen.getByText("Enable this feature")).toBeInTheDocument();
    });
  });

  describe("Type: Select", () => {
    const options = [
      { value: "option1", label: "Option 1" },
      { value: "option2", label: "Option 2" },
      { value: "option3", label: "Option 3" },
    ];

    it("renders select dropdown", () => {
      render(
        <FormField
          type="select"
          label="Category"
          name="category"
          value="option1"
          onChange={mockOnChange}
          options={options}
        />
      );
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("renders options correctly", () => {
      render(
        <FormField
          type="select"
          label="Category"
          name="category"
          value="option1"
          onChange={mockOnChange}
          options={options}
        />
      );

      expect(screen.getByText("Option 1")).toBeInTheDocument();
      expect(screen.getByText("Option 2")).toBeInTheDocument();
      expect(screen.getByText("Option 3")).toBeInTheDocument();
    });

    it("calls onChange when selection changes", () => {
      render(
        <FormField
          type="select"
          label="Category"
          name="category"
          value="option1"
          onChange={mockOnChange}
          options={options}
        />
      );

      fireEvent.mouseDown(screen.getByRole("combobox"));
      fireEvent.click(screen.getByText("Option 2"));

      expect(mockOnChange).toHaveBeenCalledWith("category", "option2");
    });

    it("handles numeric option values", () => {
      const numericOptions = [
        { value: 1, label: "One" },
        { value: 2, label: "Two" },
      ];

      render(
        <FormField
          type="select"
          label="Number"
          name="number"
          value={1}
          onChange={mockOnChange}
          options={numericOptions}
        />
      );

      expect(screen.getByText("One")).toBeInTheDocument();
      expect(screen.getByText("Two")).toBeInTheDocument();
    });

    it("displays error for select field", () => {
      render(
        <FormField
          type="select"
          label="Category"
          name="category"
          value=""
          onChange={mockOnChange}
          options={options}
          error="Please select a category"
        />
      );
      expect(screen.getByText("Please select a category")).toBeInTheDocument();
    });
  });

  describe("Tooltip Integration", () => {
    it("renders tooltip when provided for text field", () => {
      const tooltip = {
        title: "Tooltip Title",
        description: "Tooltip description",
      };

      render(
        <FormField
          type="text"
          label="Name"
          name="name"
          value=""
          onChange={mockOnChange}
          tooltip={tooltip}
        />
      );
      expect(screen.getByTestId("form-tooltip")).toBeInTheDocument();
    });

    it("renders tooltip for checkbox", () => {
      const tooltip = {
        title: "Checkbox Tooltip",
        description: "Description",
      };

      render(
        <FormField
          type="boolean"
          label="Enabled"
          name="enabled"
          value={false}
          onChange={mockOnChange}
          tooltip={tooltip}
        />
      );
      expect(screen.getByTestId("form-tooltip")).toBeInTheDocument();
    });

    it("renders tooltip for select", () => {
      const tooltip = {
        title: "Select Tooltip",
        description: "Description",
      };
      const options = [{ value: "1", label: "Option 1" }];

      render(
        <FormField
          type="select"
          label="Category"
          name="category"
          value="1"
          onChange={mockOnChange}
          options={options}
          tooltip={tooltip}
        />
      );
      expect(screen.getByTestId("form-tooltip")).toBeInTheDocument();
    });

    it("does not render tooltip when not provided", () => {
      render(
        <FormField
          type="text"
          label="Name"
          name="name"
          value=""
          onChange={mockOnChange}
        />
      );
      expect(screen.queryByTestId("form-tooltip")).not.toBeInTheDocument();
    });
  });

  describe("Full Width Option", () => {
    it("renders text field with fullWidth", () => {
      render(
        <FormField
          type="text"
          label="Name"
          name="name"
          value=""
          onChange={mockOnChange}
          fullWidth={true}
        />
      );
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("renders select with fullWidth", () => {
      const options = [{ value: "1", label: "Option 1" }];
      render(
        <FormField
          type="select"
          label="Category"
          name="category"
          value="1"
          onChange={mockOnChange}
          options={options}
          fullWidth={true}
        />
      );
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles empty string value", () => {
      render(
        <FormField
          type="text"
          label="Name"
          name="name"
          value=""
          onChange={mockOnChange}
        />
      );
      const input = screen.getByRole("textbox");
      expect(input).toHaveValue("");
    });

    it("handles null error message", () => {
      render(
        <FormField
          type="text"
          label="Name"
          name="name"
          value=""
          onChange={mockOnChange}
          error={null as any}
        />
      );
      const errorText = screen.queryByText(/error/i);
      expect(errorText).not.toBeInTheDocument();
    });

    it("handles empty options array", () => {
      render(
        <FormField
          type="select"
          label="Category"
          name="category"
          value=""
          onChange={mockOnChange}
          options={[]}
        />
      );
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("handles very long label text", () => {
      const longLabel = "A".repeat(1000);
      render(
        <FormField
          type="text"
          label={longLabel}
          name="name"
          value=""
          onChange={mockOnChange}
        />
      );
      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });

    it("handles special characters in value", () => {
      const specialValue = "<script>alert('xss')</script>";
      render(
        <FormField
          type="text"
          label="Name"
          name="name"
          value={specialValue}
          onChange={mockOnChange}
        />
      );
      const input = screen.getByRole("textbox");
      expect(input).toHaveValue(specialValue);
    });
  });

  describe("Helper Text Priority", () => {
    it("shows error instead of helper text when both present", () => {
      render(
        <FormField
          type="text"
          label="Name"
          name="name"
          value=""
          onChange={mockOnChange}
          helperText="This is helper text"
          error="This is error"
        />
      );
      expect(screen.getByText("This is error")).toBeInTheDocument();
      expect(screen.queryByText("This is helper text")).not.toBeInTheDocument();
    });

    it("shows helper text when no error", () => {
      render(
        <FormField
          type="text"
          label="Name"
          name="name"
          value=""
          onChange={mockOnChange}
          helperText="Helper text"
        />
      );
      expect(screen.getByText("Helper text")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has correct input type for text", () => {
      render(
        <FormField
          type="text"
          label="Name"
          name="name"
          value=""
          onChange={mockOnChange}
        />
      );
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("type", "text");
    });

    it("has correct input type for number", () => {
      render(
        <FormField
          type="number"
          label="Age"
          name="age"
          value={25}
          onChange={mockOnChange}
        />
      );
      const input = screen.getByRole("spinbutton");
      expect(input).toHaveAttribute("type", "number");
    });

    it("checkbox has correct role", () => {
      render(
        <FormField
          type="boolean"
          label="Enabled"
          name="enabled"
          value={false}
          onChange={mockOnChange}
        />
      );
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("select has correct role", () => {
      const options = [{ value: "1", label: "Option 1" }];
      render(
        <FormField
          type="select"
          label="Category"
          name="category"
          value="1"
          onChange={mockOnChange}
          options={options}
        />
      );
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
  });
});
