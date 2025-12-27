import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { MotionLazyContainer } from '@/components/animate/motion-lazy-container';

jest.mock('framer-motion', () => ({
  LazyMotion: ({ children }: any) => <div>{children}</div>,
  m: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('MotionLazyContainer', () => {
  it('renders children correctly', () => {
    render(<MotionLazyContainer><div>Child Component</div></MotionLazyContainer>);
    expect(screen.getByText('Child Component')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <MotionLazyContainer className="custom-class">
        <div>Content</div>
      </MotionLazyContainer>
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('custom-class');
  });

  it('handles multiple children', () => {
    render(
      <MotionLazyContainer>
        <div>First</div>
        <div>Second</div>
        <div>Third</div>
      </MotionLazyContainer>
    );
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText('Third')).toBeInTheDocument();
  });
});
