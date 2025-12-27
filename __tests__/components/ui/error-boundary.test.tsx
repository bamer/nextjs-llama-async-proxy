import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

function ThrowError({ fallback }: { fallback?: React.ReactNode } = {}) {
  throw new Error('Test error');
}

function renderWithBoundary(component: React.ReactElement) {
  return render(<ErrorBoundary>{component}</ErrorBoundary>);
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    renderWithBoundary(<div>Normal content</div>);
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('catches errors in child components', () => {
    renderWithBoundary(<ThrowError />);
    expect(screen.getByText(/We apologize/i)).toBeInTheDocument();
  });

  it('displays default fallback UI', () => {
    renderWithBoundary(<ThrowError />);
    expect(screen.getByText(/We apologize/i)).toBeInTheDocument();
  });

  it('displays "Try Again" button', () => {
    renderWithBoundary(<ThrowError />);
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
  });

  it('resets error state when Try Again button is clicked', () => {
    const { container, rerender } = renderWithBoundary(<ThrowError />);
    expect(screen.getByText(/We apologize/i)).toBeInTheDocument();

    const tryAgainButton = screen.getByRole('button', { name: 'Try Again' });
    act(() => {
      tryAgainButton.click();
    });

    rerender(<ErrorBoundary><div>Recovered content</div></ErrorBoundary>);
    expect(screen.getByText('Recovered content')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    const CustomError = () => {
      throw new Error('Test error');
    };
    
    const { container } = render(
      <ErrorBoundary fallback={<div>Custom error message</div>}>
        <CustomError />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('hides children when error occurs', () => {
    renderWithBoundary(<ThrowError><div>Hidden content</div></ThrowError>);
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
  });

  it('logs error to console', () => {
    renderWithBoundary(<ThrowError />);
    expect(console.error).toHaveBeenCalled();
  });

  it('catchs synchronous errors', () => {
    renderWithBoundary(<ThrowError />);
    expect(screen.getByText(/We apologize/i)).toBeInTheDocument();
  });

  it('catchs errors in nested components', () => {
    const NestedComponent = () => <ThrowError />;
    renderWithBoundary(<NestedComponent />);
    expect(screen.getByText(/We apologize/i)).toBeInTheDocument();
  });

  it('catchs errors during render', () => {
    const RenderError = () => {
      throw new Error('Render error');
    };
    renderWithBoundary(<RenderError />);
    expect(screen.getByText(/We apologize/i)).toBeInTheDocument();
  });

  it('catchs errors from multiple children', () => {
    renderWithBoundary(
      <div>
        <ThrowError />
        <div>Another child</div>
      </div>
    );
    expect(screen.getByText(/We apologize/i)).toBeInTheDocument();
    expect(screen.queryByText('Another child')).not.toBeInTheDocument();
  });

  it('handles error state correctly', () => {
    const { container, rerender } = renderWithBoundary(<ThrowError />);
    expect(screen.getByText(/We apologize/i)).toBeInTheDocument();

    const tryAgainButton = screen.getByRole('button', { name: 'Try Again' });
    act(() => {
      tryAgainButton.click();
    });

    rerender(<ErrorBoundary><div>No error</div></ErrorBoundary>);
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('handles multiple consecutive errors', () => {
    const { container, rerender } = renderWithBoundary(<ThrowError />);
    expect(screen.getByText(/We apologize/i)).toBeInTheDocument();

    const tryAgainButton = screen.getByRole('button', { name: 'Try Again' });
    act(() => {
      tryAgainButton.click();
    });

    rerender(<ErrorBoundary><ThrowError /></ErrorBoundary>);
    expect(screen.getByText(/We apologize/i)).toBeInTheDocument();
  });
});
