import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { Input } from '@/components/ui/Input';

describe('Input', () => {
  it('renders correctly', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('applies placeholder', () => {
    render(<Input placeholder="Type here" />);
    expect(screen.getByPlaceholderText('Type here')).toBeInTheDocument();
  });

  it('handles value changes', () => {
    const handleChange = jest.fn();
    render(<Input value="initial" onChange={handleChange} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'new value' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('displays initial value', () => {
    render(<Input value="test value" />);
    expect(screen.getByDisplayValue('test value')).toBeInTheDocument();
  });

  it('can be disabled', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('applies label', () => {
    render(<Input label="Field Label" />);
    expect(screen.getByText('Field Label')).toBeInTheDocument();
  });

  it('handles focus event', () => {
    const handleFocus = jest.fn();
    render(<Input onFocus={handleFocus} />);
    fireEvent.focus(screen.getByRole('textbox'));
    expect(handleFocus).toHaveBeenCalled();
  });

  it('handles blur event', () => {
    const handleBlur = jest.fn();
    render(<Input onBlur={handleBlur} />);
    fireEvent.blur(screen.getByRole('textbox'));
    expect(handleBlur).toHaveBeenCalled();
  });
});
