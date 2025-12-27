import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Button } from '@/components/ui/Button';

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('Button', () => {
  it('renders correctly with default props', () => {
    renderWithTheme(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('renders with default variant', () => {
    const { container } = renderWithTheme(<Button>Default Button</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-primary-500');
  });

  it('renders with outline variant', () => {
    const { container } = renderWithTheme(<Button variant="outline">Outline</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('border', 'border-slate-300');
  });

  it('renders with ghost variant', () => {
    const { container } = renderWithTheme(<Button variant="ghost">Ghost</Button>);
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });

  it('renders with primary variant', () => {
    const { container } = renderWithTheme(<Button variant="primary">Primary</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-gradient-to-r');
  });

  it('renders with secondary variant', () => {
    const { container } = renderWithTheme(<Button variant="secondary">Secondary</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('from-secondary-500');
  });

  it('handles onClick events', () => {
    const handleClick = jest.fn();
    renderWithTheme(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    renderWithTheme(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
  });

  it('does not call onClick when disabled', () => {
    const handleClick = jest.fn();
    renderWithTheme(<Button onClick={handleClick} disabled>Disabled</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders children correctly', () => {
    renderWithTheme(<Button><span>Icon</span> Text</Button>);
    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = renderWithTheme(<Button className="custom-class">Custom</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('custom-class');
  });

  it('sets aria-label when provided', () => {
    renderWithTheme(<Button ariaLabel="Close">X</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Close');
  });

  it('renders with empty children', () => {
    const { container } = renderWithTheme(<Button></Button>);
    expect(container.querySelector('button')).toBeInTheDocument();
  });

  it('has focus ring classes', () => {
    const { container } = renderWithTheme(<Button>Focus</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('focus:ring-2', 'focus:ring-primary-500');
  });

  it('has transition classes', () => {
    const { container } = renderWithTheme(<Button>Transition</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('transition-all', 'duration-200');
  });

  it('has rounded corners', () => {
    const { container } = renderWithTheme(<Button>Rounded</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('rounded-xl');
  });
});
