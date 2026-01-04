import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

// Mock logger
jest.mock('@/lib/client-logger', () => ({
  getLogger: jest.fn(() => ({
    error: jest.fn(),
  })),
}));

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

// Component that throws an error
function ErrorComponent(): React.ReactElement {
  throw new Error('Test error');
  return <div />;
}

// Component that throws a string error
function StringErrorComponent(): React.ReactElement {
  throw 'String error';
  return <div />;
}

// Component that throws an object error
function ObjectErrorComponent(): React.ReactElement {
  throw { message: 'Object error message' };
  return <div />;
}

// Component that throws unknown error
function UnknownErrorComponent(): React.ReactElement {
  throw null;
  return <div />;
}

describe('ErrorBoundary - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockConsoleError.mockClear();
  });

  describe('Error Catching', () => {
    it('catches and displays error when child component throws', () => {
      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('logs error to console with full context', () => {
      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      expect(mockConsoleError).toHaveBeenCalledWith(
        '[ErrorBoundary] Caught an error:',
        expect.objectContaining({
          name: 'Error',
          message: 'Test error',
        })
      );
    });

    it('calls custom onError handler when provided', () => {
      const mockOnError = jest.fn();

      render(
        <ErrorBoundary onError={mockOnError}>
          <ErrorComponent />
        </ErrorBoundary>
      );

      expect(mockOnError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(Object)
      );
    });
  });

  describe('Error Normalization', () => {
    it('normalizes string errors to Error objects', () => {
      render(
        <ErrorBoundary>
          <StringErrorComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('String error')).toBeInTheDocument();
    });

    it('normalizes object errors with message property', () => {
      render(
        <ErrorBoundary>
          <ObjectErrorComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Object error message')).toBeInTheDocument();
    });

    it('handles unknown error types gracefully', () => {
      render(
        <ErrorBoundary>
          <UnknownErrorComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Unknown error: null')).toBeInTheDocument();
    });
  });

  describe('Recovery Actions', () => {
    it('renders reload button when error occurs', () => {
      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByRole('button', { name: /reload page/i });
      expect(reloadButton).toBeInTheDocument();
    });

    it('resets error state when try again button is clicked', () => {
      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(tryAgainButton);

      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('Normal Operation', () => {
    it('renders children normally when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div data-testid="normal-content">Normal content</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('normal-content')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('preserves functionality after error recovery', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(tryAgainButton);

      rerender(
        <ErrorBoundary>
          <div data-testid="recovered-content">Recovered content</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('recovered-content')).toBeInTheDocument();
    });
  });
});
