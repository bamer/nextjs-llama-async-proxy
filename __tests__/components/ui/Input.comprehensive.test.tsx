import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

import { Input, TextArea, Select, Label } from '@/components/ui/Input';
import type { MotionComponentProps } from '__tests__/types/mock-types';

jest.mock('framer-motion', () => ({
  m: {
    div: ({ children, ...props }: MotionComponentProps) => <div {...props}>{children}</div>,
  },
}));

describe('Input Component', () => {
  // Positive tests - verify correct functionality (success case)

  /**
   * Test: Renders input element with default props
   * Objective: Verify Input component renders without errors
   */
  it('renders input element with default props', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('bg-input', 'border', 'border-border', 'rounded-md', 'p-2');
  });

  /**
   * Test: Applies custom className
   * Objective: Verify custom className is appended to default classes
   */
  it('applies custom className', () => {
    render(<Input className="custom-class" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-class');
  });

  /**
   * Test: Passes through all HTML input attributes
   * Objective: Verify component accepts and forwards standard input props
   */
  it('passes through all HTML input attributes', () => {
    render(
      <Input
        type="email"
        placeholder="Enter email"
        id="email-input"
        name="email"
        value="test@example.com"
        onChange={() => {}}
        required
        disabled
      />
    );
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('placeholder', 'Enter email');
    expect(input).toHaveAttribute('id', 'email-input');
    expect(input).toHaveAttribute('name', 'email');
    expect(input).toHaveAttribute('value', 'test@example.com');
    expect(input).toHaveAttribute('required');
    expect(input).toBeDisabled();
  });

  /**
   * Test: Handles password type
   * Objective: Verify input works with password type
   */
  it('handles password type', () => {
    render(<Input type="password" />);
    const input = screen.getByDisplayValue('');
    expect(input).toHaveAttribute('type', 'password');
  });

  /**
   * Test: Handles number type
   * Objective: Verify input works with number type
   */
  it('handles number type', () => {
    const handleChange = jest.fn();
    render(<Input type="number" value="42" onChange={handleChange} />);
    const input = screen.getByDisplayValue('42');
    expect(input).toHaveAttribute('type', 'number');
  });

  /**
   * Test: Handles textarea through TextArea component
   * Objective: Verify TextArea component renders correctly
   */
  it('renders textarea with TextArea component', () => {
    render(<TextArea placeholder="Enter text" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea.tagName.toLowerCase()).toBe('textarea');
    expect(textarea).toHaveAttribute('placeholder', 'Enter text');
  });

  /**
   * Test: TextArea applies custom className
   * Objective: Verify TextArea accepts and applies custom className
   */
  it('TextArea applies custom className', () => {
    render(<TextArea className="custom-textarea" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('custom-textarea');
  });

  /**
   * Test: TextArea passes through attributes
   * Objective: Verify TextArea forwards all standard textarea attributes
   */
  it('TextArea passes through attributes', () => {
    const handleChange = jest.fn();
    render(
      <TextArea
        rows={5}
        cols={40}
        maxLength={500}
        value="Test value"
        onChange={handleChange}
      />
    );
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('rows', '5');
    expect(textarea).toHaveAttribute('cols', '40');
    expect(textarea).toHaveAttribute('maxLength', '500');
    expect(textarea).toHaveValue('Test value');
  });

  /**
   * Test: Select renders with children options
   * Objective: Verify Select component renders with child options
   */
  it('renders select with children options', () => {
    render(
      <Select>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
        <option value="option3">Option 3</option>
      </Select>
    );
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  /**
   * Test: Select applies custom className
   * Objective: Verify Select accepts and applies custom className
   */
  it('Select applies custom className', () => {
    render(
      <Select className="custom-select">
        <option>Option</option>
      </Select>
    );
    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('custom-select');
  });

  /**
   * Test: Select passes through attributes
   * Objective: Verify Select forwards all standard select attributes
   */
  it('Select passes through attributes', () => {
    render(
      <Select id="my-select" name="select-field" defaultValue="option1">
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
      </Select>
    );
    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('id', 'my-select');
    expect(select).toHaveAttribute('name', 'select-field');
    expect(select).toHaveValue('option1');
  });

  /**
   * Test: Label renders with children
   * Objective: Verify Label component renders label element with children
   */
  it('renders label with children', () => {
    render(<Label>Email Address</Label>);
    const label = screen.getByText('Email Address');
    expect(label.tagName.toLowerCase()).toBe('label');
    expect(label).toHaveClass('text-foreground');
  });

  /**
   * Test: Label applies custom className
   * Objective: Verify Label accepts and applies custom className
   */
  it('Label applies custom className', () => {
    render(<Label className="custom-label">Name</Label>);
    const label = screen.getByText('Name');
    expect(label).toHaveClass('custom-label');
  });

  /**
   * Test: Label passes through attributes
   * Objective: Verify Label forwards all standard label attributes
   */
  it('Label passes through attributes', () => {
    render(
      <Label htmlFor="input-field" id="label-id">
        Field Label
      </Label>
    );
    const label = screen.getByText('Field Label');
    expect(label).toHaveAttribute('for', 'input-field');
    expect(label).toHaveAttribute('id', 'label-id');
  });

  /**
   * Test: All components have focus ring styles
   * Objective: Verify components have proper focus accessibility
   */
  it('Input has focus ring styles', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('focus:ring-2', 'focus:ring-primary');
  });

  /**
   * Test: Components have responsive padding
   * Objective: Verify components use responsive padding classes
   */
  it('Input has responsive padding', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('p-2', 'md:p-3');
  });

  /**
   * Test: Input handles controlled state
   * Objective: Verify input works in controlled component pattern
   */
  it('Input handles controlled state', () => {
    const handleChange = jest.fn();
    render(<Input value="initial" onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('initial');
  });

  // Negative tests - verify failure or improper input is handled (failure/breakage case)

  /**
   * Test: Handles missing className prop
   * Objective: Verify component works when className is not provided
   */
  it('handles missing className prop', () => {
    const { container } = render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  /**
   * Test: Select handles empty children
   * Objective: Verify Select doesn't crash with empty children
   */
  it('Select handles empty children', () => {
    const { container } = render(<Select>{null}</Select>);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  /**
   * Test: Handles null children for Label
   * Objective: Verify Label doesn't crash with null children
   */
  it('Label handles null children', () => {
    const { container } = render(<Label>{null}</Label>);
    const label = container.querySelector('label');
    expect(label).toBeInTheDocument();
  });

  /**
   * Test: Handles undefined value for controlled input
   * Objective: Verify controlled input doesn't crash with undefined value
   */
  it('Input handles undefined controlled value', () => {
    const handleChange = jest.fn();
    const { container } = render(<Input value={undefined} onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('');
  });

  /**
   * Test: Handles disabled state
   * Objective: Verify component properly disables interaction
   */
  it('Input handles disabled state', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  /**
   * Test: TextArea handles disabled state
   * Objective: Verify TextArea properly disables interaction
   */
  it('TextArea handles disabled state', () => {
    render(<TextArea disabled />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
  });

  /**
   * Test: Select handles disabled state
   * Objective: Verify Select properly disables interaction
   */
  it('Select handles disabled state', () => {
    render(
      <Select disabled>
        <option>Option 1</option>
        <option>Option 2</option>
      </Select>
    );
    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });

  /**
   * Test: Handles required attribute
   * Objective: Verify component properly marks fields as required
   */
  it('Input handles required attribute', () => {
    render(<Input required />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('required');
  });

  /**
   * Test: Handles readOnly attribute
   * Objective: Verify component properly marks fields as read-only
   */
  it('Input handles readOnly attribute', () => {
    render(<Input readOnly />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('readonly');
  });

  /**
   * Test: Handles maxLength constraint
   * Objective: Verify component enforces maximum character limit
   */
  it('Input handles maxLength constraint', () => {
    render(<Input maxLength={100} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('maxLength', '100');
  });

  /**
   * Test: Handles minLength constraint
   * Objective: Verify component enforces minimum character limit
   */
  it('Input handles minLength constraint', () => {
    render(<Input minLength={5} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('minLength', '5');
  });

  /**
   * Test: Handles pattern attribute for validation
   * Objective: Verify component accepts regex pattern for validation
   */
  it('Input handles pattern attribute', () => {
    render(<Input pattern="[a-zA-Z]+" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('pattern', '[a-zA-Z]+');
  });

  /**
   * Test: Handles min and max for number type
   * Objective: Verify component validates number input ranges
   */
  it('Input handles min and max for number type', () => {
    render(<Input type="number" min={0} max={100} />);
    const input = screen.getByDisplayValue('');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '100');
  });

  /**
   * Test: Handles step attribute for number type
   * Objective: Verify component accepts step increment for number input
   */
  it('Input handles step attribute for number type', () => {
    render(<Input type="number" step={0.1} />);
    const input = screen.getByDisplayValue('');
    expect(input).toHaveAttribute('step', '0.1');
  });

  /**
   * Test: Handles auto attributes
   * Objective: Verify component supports browser autocomplete
   */
  it('Input handles autocomplete attribute', () => {
    render(<Input autoComplete="email" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('autoComplete', 'email');
  });

  /**
   * Test: Handles placeholder text
   * Objective: Verify component displays placeholder text
   */
  it('Input handles placeholder text', () => {
    render(<Input placeholder="Enter your name" />);
    const input = screen.getByPlaceholderText('Enter your name');
    expect(input).toBeInTheDocument();
  });

  /**
   * Test: TextArea handles placeholder text
   * Objective: Verify TextArea displays placeholder text
   */
  it('TextArea handles placeholder text', () => {
    render(<TextArea placeholder="Enter your message" />);
    const textarea = screen.getByPlaceholderText('Enter your message');
    expect(textarea).toBeInTheDocument();
  });

  /**
   * Test: Handles aria attributes for accessibility
   * Objective: Verify component supports ARIA attributes
   */
  it('Input handles aria attributes', () => {
    render(
      <Input
        aria-label="Email input"
        aria-describedby="email-help"
        aria-invalid="false"
      />
    );
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-label', 'Email input');
    expect(input).toHaveAttribute('aria-describedby', 'email-help');
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  /**
   * Test: Handles data attributes
   * Objective: Verify component supports custom data attributes
   */
  it('Input handles data attributes', () => {
    render(<Input data-test-id="email-input" data-value="test" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('data-test-id', 'email-input');
    expect(input).toHaveAttribute('data-value', 'test');
  });

  /**
   * Test: Multiple inputs can be rendered
   * Objective: Verify multiple instances can coexist without conflicts
   */
  it('multiple inputs can be rendered', () => {
    render(
      <div>
        <Input id="input1" name="field1" />
        <Input id="input2" name="field2" />
        <Input id="input3" name="field3" />
      </div>
    );
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(3);
  });

  /**
   * Test: Components can be nested with labels
   * Objective: Verify components work properly with label wrapping
   */
  it('components can be nested with labels', () => {
    render(
      <Label htmlFor="email">
        Email
        <Input id="email" type="email" />
      </Label>
    );
    const label = screen.getByText('Email');
    const input = screen.getByRole('textbox');
    expect(label.tagName.toLowerCase()).toBe('label');
    expect(input).toBeInTheDocument();
  });

  /**
   * Test: Handles invalid HTML5 types gracefully
   * Objective: Verify component doesn't crash with invalid type
   */
  it('handles invalid HTML5 type gracefully', () => {
    render(<Input type="invalid" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'invalid');
  });
});
