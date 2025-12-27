import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { MotionLazyContainer } from '@/components/animate/motion-lazy-container';

jest.mock('framer-motion', () => ({
  LazyMotion: ({ children, strict }: any) => (
    <div data-testid="lazy-motion" data-strict={strict}>
      {children}
    </div>
  ),
  m: {
    div: ({ children, initial, animate, exit, ...props }: any) => (
      <div data-testid="motion-div" data-initial={initial} data-animate={animate} data-exit={exit} {...props}>
        {children}
      </div>
    ),
  },
  domAnimation: true,
}));

describe('MotionLazyContainer', () => {
  it('renders children correctly', () => {
    render(<MotionLazyContainer><div>Child Component</div></MotionLazyContainer>);
    expect(screen.getByText('Child Component')).toBeInTheDocument();
  });

  it('renders LazyMotion wrapper', () => {
    render(<MotionLazyContainer><div>Content</div></MotionLazyContainer>);
    expect(screen.getByTestId('lazy-motion')).toBeInTheDocument();
  });

  it('renders motion div wrapper', () => {
    render(<MotionLazyContainer><div>Content</div></MotionLazyContainer>);
    expect(screen.getByTestId('motion-div')).toBeInTheDocument();
  });

  it('applies strict prop to LazyMotion', () => {
    render(<MotionLazyContainer><div>Content</div></MotionLazyContainer>);
    const lazyMotion = screen.getByTestId('lazy-motion');
    expect(lazyMotion).toHaveAttribute('data-strict', 'true');
  });

  it('applies animation variants to motion div', () => {
    render(<MotionLazyContainer><div>Content</div></MotionLazyContainer>);
    const motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toHaveAttribute('data-initial', 'initial');
    expect(motionDiv).toHaveAttribute('data-animate', 'animate');
    expect(motionDiv).toHaveAttribute('data-exit', 'exit');
  });

  it('applies full height style to motion div', () => {
    render(<MotionLazyContainer><div>Content</div></MotionLazyContainer>);
    const motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toHaveStyle({ height: '100%' });
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

  it('handles nested children components', () => {
    const ChildComponent = () => <div>Nested Child</div>;
    render(
      <MotionLazyContainer>
        <ChildComponent />
      </MotionLazyContainer>
    );
    expect(screen.getByText('Nested Child')).toBeInTheDocument();
  });

  it('renders with React fragments', () => {
    render(
      <MotionLazyContainer>
        <>
          <div>Fragment 1</div>
          <div>Fragment 2</div>
        </>
      </MotionLazyContainer>
    );
    expect(screen.getByText('Fragment 1')).toBeInTheDocument();
    expect(screen.getByText('Fragment 2')).toBeInTheDocument();
  });

  it('handles empty children', () => {
    const { container } = render(<MotionLazyContainer>{null}</MotionLazyContainer>);
    expect(container.querySelector('[data-testid="motion-div"]')).toBeInTheDocument();
  });

  it('preserves child props and attributes', () => {
    render(
      <MotionLazyContainer>
        <div id="test-id" data-testid="test-child" aria-label="Test content">
          Test Content
        </div>
      </MotionLazyContainer>
    );
    const child = screen.getByTestId('test-child');
    expect(child).toHaveAttribute('id', 'test-id');
    expect(child).toHaveAttribute('aria-label', 'Test content');
  });

  it('handles array of children', () => {
    const children = [
      <div key="1">Array Child 1</div>,
      <div key="2">Array Child 2</div>,
    ];
    render(<MotionLazyContainer>{children}</MotionLazyContainer>);
    expect(screen.getByText('Array Child 1')).toBeInTheDocument();
    expect(screen.getByText('Array Child 2')).toBeInTheDocument();
  });

  it('handles string children', () => {
    render(<MotionLazyContainer>String Content</MotionLazyContainer>);
    expect(screen.getByText('String Content')).toBeInTheDocument();
  });

  it('handles number children', () => {
    render(<MotionLazyContainer>{42}</MotionLazyContainer>);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('wraps content in proper component hierarchy', () => {
    const { container } = render(
      <MotionLazyContainer>
        <div>Content</div>
      </MotionLazyContainer>
    );
    const lazyMotion = container.querySelector('[data-testid="lazy-motion"]');
    const motionDiv = container.querySelector('[data-testid="motion-div"]');
    const content = screen.getByText('Content');

    expect(lazyMotion).toBeInTheDocument();
    expect(motionDiv).toBeInTheDocument();
    expect(content).toBeInTheDocument();
    expect(motionDiv?.parentElement).toBe(lazyMotion);
    expect(content.parentElement).toBe(motionDiv);
  });
});
