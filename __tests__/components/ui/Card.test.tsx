import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { Card } from '@/components/ui/Card';

describe('Card', () => {
  it('renders children correctly', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles onClick prop', () => {
    const handleClick = jest.fn();
    const { container } = render(<Card onClick={handleClick}>Clickable</Card>);
    fireEvent.click(container.firstChild as HTMLElement);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders empty card', () => {
    const { container } = render(<Card></Card>);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies sx prop for styling', () => {
    render(<Card sx={{ padding: 2 }}>Styled</Card>);
    expect(screen.getByText('Styled')).toBeInTheDocument();
  });
});
