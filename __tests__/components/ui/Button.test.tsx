import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('displays children text', () => {
    render(<Button>Submit</Button>);
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant prop', () => {
    const { container } = render(<Button variant="outlined">Outlined</Button>);
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });

  it('applies color prop', () => {
    const { container } = render(<Button color="secondary">Secondary</Button>);
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });

  it('can be disabled', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
