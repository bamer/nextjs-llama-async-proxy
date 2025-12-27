import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ErrorBoundary } from '@/components/ui/error-boundary';

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

class ThrowError extends React.Component {
  render() {
    throw new Error('Test error');
  }
}

class ThrowAsyncError extends React.Component {
  componentDidMount() {
    throw new Error('Async error');
  }

  render() {
    return <div>No error</div>;
  }
}

describe('ErrorBoundary', () => {
  const originalError = console.error;

  beforeEach(() => {
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('renders children when there is no error', () => {
    renderWithTheme(
      <ErrorBoundary>
        <div>Child component</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Child component')).toBeInTheDocument();
  });

  it('catches render errors and displays fallback UI', () => {
    renderWithTheme(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/We apologize for the inconvenience/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
  });

  it('catches async errors in componentDidMount', () => {
    act(() => {
      renderWithTheme(
        <ErrorBoundary>
          <ThrowAsyncError />
        </ErrorBoundary>
      );
    });

    expect(screen.getByText(/We apologize for the inconvenience/i)).toBeInTheDocument();
  });

  it('displays custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    renderWithTheme(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText(/We apologize for the inconvenience/i)).not.toBeInTheDocument();
  });

  it('displays default error UI without custom fallback', () => {
    renderWithTheme(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/We apologize for the inconvenience/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
  });

  it('has a reset button that clears the error state', () => {
    const { rerender } = renderWithTheme(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const resetButton = screen.getByRole('button', { name: /Try Again/i });
    expect(resetButton).toBeInTheDocument();

    act(() => {
      resetButton.click();
    });

    rerender(
      <ErrorBoundary>
        <div>New content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('New content')).toBeInTheDocument();
  });

  it('resets error state and re-renders children', () => {
    let shouldThrow = true;

    const ConditionalThrow = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>Success</div>;
    };

    const { rerender } = renderWithTheme(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText(/We apologize for the inconvenience/i)).toBeInTheDocument();

    const resetButton = screen.getByRole('button', { name: /Try Again/i });
    expect(resetButton).toBeInTheDocument();

    act(() => {
      shouldThrow = false;
      resetButton.click();
    });

    rerender(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('logs error to console', () => {
    renderWithTheme(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(console.error).toHaveBeenCalled();
  });

  it('renders error UI with correct elements', () => {
    renderWithTheme(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/We apologize for the inconvenience/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('displays refresh icon in button', () => {
    renderWithTheme(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const button = screen.getByRole('button', { name: /Try Again/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('handles error with error info', () => {
    renderWithTheme(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/We apologize for the inconvenience/i)).toBeInTheDocument();
  });

  it('resets error state after successful recovery', () => {
    let shouldThrow = true;

    const ConditionalComponent = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>Recovered</div>;
    };

    const { rerender } = renderWithTheme(
      <ErrorBoundary>
        <ConditionalComponent />
      </ErrorBoundary>
    );

    const resetButton = screen.getByRole('button', { name: /Try Again/i });

    act(() => {
      shouldThrow = false;
      resetButton.click();
    });

    rerender(
      <ErrorBoundary>
        <ConditionalComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Recovered')).toBeInTheDocument();
    expect(screen.queryByText(/We apologize for the inconvenience/i)).not.toBeInTheDocument();
  });

  it('displays contact support message', () => {
    renderWithTheme(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/contact support/i)).toBeInTheDocument();
  });

  it('wraps multiple children without error', () => {
    renderWithTheme(
      <ErrorBoundary>
        <div>First child</div>
        <div>Second child</div>
        <div>Third child</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('First child')).toBeInTheDocument();
    expect(screen.getByText('Second child')).toBeInTheDocument();
    expect(screen.getByText('Third child')).toBeInTheDocument();
  });

  it('catches error from nested children', () => {
    renderWithTheme(
      <ErrorBoundary>
        <div>
          <ThrowError />
        </div>
      </ErrorBoundary>
    );

    expect(screen.getByText(/We apologize for the inconvenience/i)).toBeInTheDocument();
  });

  it('handles null children', () => {
    renderWithTheme(
      <ErrorBoundary>
        {null}
      </ErrorBoundary>
    );

    const errorBox = document.querySelector('div[style*="height: 100vh"]');
    expect(errorBox).not.toBeInTheDocument();
  });

  it('initializes with no error state', () => {
    renderWithTheme(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
    expect(screen.queryByText(/We apologize for the inconvenience/i)).not.toBeInTheDocument();
  });

  it('updates state to hasError when error occurs', () => {
    renderWithTheme(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/We apologize for the inconvenience/i)).toBeInTheDocument();
  });

  it('resets error to null when reset is called', () => {
    const TestComponent = () => {
      return <div>No error</div>;
    };

    const { rerender } = renderWithTheme(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const resetButton = screen.getByRole('button', { name: /Try Again/i });

    act(() => {
      resetButton.click();
    });

    rerender(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('provides error context to componentDidCatch', () => {
    renderWithTheme(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(console.error).toHaveBeenCalledWith(
      'ErrorBoundary caught an error:',
      expect.any(Error),
      expect.any(Object)
    );
  });
});
