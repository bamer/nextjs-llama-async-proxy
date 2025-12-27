import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { Loading } from '@/components/ui/loading';

describe('Loading', () => {
  it('renders correctly', () => {
    render(<Loading />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays loading text', () => {
    render(<Loading />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('applies custom color', () => {
    const { container } = render(<Loading color="secondary" />);
    const progress = container.querySelector('[role="progressbar"]');
    expect(progress).toBeInTheDocument();
  });
});
