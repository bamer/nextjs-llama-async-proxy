import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { Button, MetricCard, ActivityMetricCard } from '@/components/ui/Button';

describe('Button', () => {
  it('renders correctly with default props', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('renders with default variant', () => {
    const { container } = render(<Button>Default Button</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-primary-500');
  });

  it('renders with outline variant', () => {
    const { container } = render(<Button variant="outline">Outline</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('border', 'border-slate-300');
  });

  it('renders with ghost variant', () => {
    const { container } = render(<Button variant="ghost">Ghost</Button>);
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });

  it('renders with primary variant', () => {
    const { container } = render(<Button variant="primary">Primary</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-gradient-to-r');
  });

  it('renders with secondary variant', () => {
    const { container } = render(<Button variant="secondary">Secondary</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('from-secondary-500');
  });

  it('handles onClick events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    screen.getByRole('button').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
  });

  it('does not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} disabled>Disabled</Button>);
    screen.getByRole('button').click();
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders children correctly', () => {
    render(<Button><span>Icon</span> Text</Button>);
    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Button className="custom-class">Custom</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('custom-class');
  });

  it('sets aria-label when provided', () => {
    render(<Button ariaLabel="Close">X</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Close');
  });

  it('renders with empty children', () => {
    const { container } = render(<Button></Button>);
    expect(container.querySelector('button')).toBeInTheDocument();
  });

  it('has focus ring classes', () => {
    const { container } = render(<Button>Focus</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('focus:ring-2', 'focus:ring-primary-500');
  });

  it('has transition classes', () => {
    const { container } = render(<Button>Transition</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('transition-all', 'duration-200');
  });

  it('has rounded corners', () => {
    const { container } = render(<Button>Rounded</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('rounded-xl');
  });
});

describe('MetricCard (from Button.tsx)', () => {
  it('renders correctly with required props', () => {
    render(<MetricCard title="Test Title" value="100" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders with unit', () => {
    render(<MetricCard title="Test" value="100" unit="MB" />);
    expect(screen.getByText('MB')).toBeInTheDocument();
  });

  it('renders with icon', () => {
    render(<MetricCard title="Test" value="100" icon="📊" />);
    expect(screen.getByText('📊')).toBeInTheDocument();
  });

  it('renders with positive trend', () => {
    render(<MetricCard title="Test" value="100" trend={15} />);
    expect(screen.getByText('↑ 15%')).toBeInTheDocument();
  });

  it('renders with negative trend', () => {
    render(<MetricCard title="Test" value="100" trend={-15} />);
    expect(screen.getByText('↓ 15%')).toBeInTheDocument();
  });

  it('does not render trend when undefined', () => {
    render(<MetricCard title="Test" value="100" />);
    expect(screen.queryByText('%')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<MetricCard title="Test" value="100" className="custom" />);
    const card = container.querySelector('div');
    expect(card).toHaveClass('custom');
  });

  it('displays number value', () => {
    render(<MetricCard title="Test" value={123} />);
    expect(screen.getByText('123')).toBeInTheDocument();
  });

  it('displays string value', () => {
    render(<MetricCard title="Test" value="custom" />);
    expect(screen.getByText('custom')).toBeInTheDocument();
  });

  it('handles zero trend', () => {
    render(<MetricCard title="Test" value="100" trend={0} />);
    expect(screen.getByText('↓ 0%')).toBeInTheDocument();
  });

  it('has correct styling classes', () => {
    const { container } = render(<MetricCard title="Test" value="100" />);
    const card = container.querySelector('div');
    expect(card).toHaveClass('bg-white/80', 'rounded-xl', 'shadow-lg');
  });

  it('displays icon and title in row', () => {
    render(<MetricCard title="Test Title" value="100" icon="📊" />);
    const title = screen.getByText('Test Title');
    expect(title).toHaveClass('font-semibold');
  });
});

describe('ActivityMetricCard', () => {
  it('renders correctly with required props', () => {
    render(<ActivityMetricCard title="Test Title" value="100" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders with unit', () => {
    render(<ActivityMetricCard title="Test" value="100" unit="MB" />);
    expect(screen.getByText('MB')).toBeInTheDocument();
  });

  it('renders with icon', () => {
    render(<ActivityMetricCard title="Test" value="100" icon="📊" />);
    expect(screen.getByText('📊')).toBeInTheDocument();
  });

  it('renders with positive trend', () => {
    render(<ActivityMetricCard title="Test" value="100" trend={15} />);
    expect(screen.getByText('↑ 15%')).toBeInTheDocument();
  });

  it('renders with negative trend', () => {
    render(<ActivityMetricCard title="Test" value="100" trend={-15} />);
    expect(screen.getByText('↓ 15%')).toBeInTheDocument();
  });

  it('renders with isActive false', () => {
    const { container } = render(<ActivityMetricCard title="Test" value="100" isActive={false} />);
    const card = container.querySelector('div');
    expect(card).toHaveClass('opacity-60');
  });

  it('renders with isActive true', () => {
    const { container } = render(<ActivityMetricCard title="Test" value="100" isActive={true} />);
    const card = container.querySelector('div');
    expect(card).not.toHaveClass('opacity-60');
  });

  it('defaults isActive to true', () => {
    const { container } = render(<ActivityMetricCard title="Test" value="100" />);
    const card = container.querySelector('div');
    expect(card).not.toHaveClass('opacity-60');
  });

  it('does not render trend when undefined', () => {
    render(<ActivityMetricCard title="Test" value="100" />);
    expect(screen.queryByText('%')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<ActivityMetricCard title="Test" value="100" className="custom" />);
    const card = container.querySelector('div');
    expect(card).toHaveClass('custom');
  });

  it('displays number value', () => {
    render(<ActivityMetricCard title="Test" value={123} />);
    expect(screen.getByText('123')).toBeInTheDocument();
  });

  it('displays string value', () => {
    render(<ActivityMetricCard title="Test" value="custom" />);
    expect(screen.getByText('custom')).toBeInTheDocument();
  });

  it('has correct styling classes', () => {
    const { container } = render(<ActivityMetricCard title="Test" value="100" />);
    const card = container.querySelector('div');
    expect(card).toHaveClass('bg-white/80', 'rounded-xl', 'shadow-lg');
  });
});
