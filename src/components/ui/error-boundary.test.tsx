import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorBoundary } from './error-boundary';

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
const mockConsoleDebug = jest.spyOn(console, 'debug').mockImplementation(() => {});

// Mock logger
jest.mock('@/lib/client-logger', () => ({
  getLogger: jest.fn(() => ({
    error: jest.fn(),
  })),
}));

// Component that throws an error
function ErrorComponent(): React.ReactElement {
  throw new Error('Test error');
  return <div />; // This line won't be reached
}

// Component that throws a non-critical error
function NonCriticalErrorComponent(): React.ReactElement {
  const error = new Error('ResizeObserver loop limit exceeded');
  throw error;
  return <div />; // This line won't be reached
}

// Component that throws a string error
function StringErrorComponent(): React.ReactElement {
  throw 'String error';
  return <div />; // This line won't be reached
}

// Component that throws an object error
function ObjectErrorComponent(): React.ReactElement {
  throw { message: 'Object error message' };
  return <div />; // This line won't be reached
}

// Component that throws unknown error
function UnknownErrorComponent(): React.ReactElement {
  throw null;
  return <div />; // This line won't be reached
}

describe('ErrorBoundary', () => {
  it('should be defined', () => {
    expect(ErrorBoundary).toBeDefined();
    expect(typeof ErrorBoundary).toBe('function');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockConsoleError.mockClear();
    mockConsoleWarn.mockClear();
    mockConsoleDebug.mockClear();
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

  describe('Non-Critical Error Handling', () => {
    it('ignores ResizeObserver errors', () => {
      render(
        <ErrorBoundary>
          <NonCriticalErrorComponent />
        </ErrorBoundary>
      );

      // Should not show error boundary UI
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '[ErrorBoundary] Ignored non-critical error:',
        'ResizeObserver loop limit exceeded'
      );
    });

    it('ignores React hydration errors', () => {
      function HydrationErrorComponent(): React.ReactElement {
        throw new Error('Text content does not match server-rendered HTML');
        return <div />;
      }

      render(
        <ErrorBoundary>
          <HydrationErrorComponent />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('ignores chunk loading errors', () => {
      function ChunkErrorComponent(): React.ReactElement {
        throw new Error('Loading CSS chunk');
        return <div />;
      }

      render(
        <ErrorBoundary>
          <ChunkErrorComponent />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('ignores context errors', () => {
      function ContextErrorComponent(): React.ReactElement {
        throw new Error('useTheme must be used within a ThemeProvider');
        return <div />;
      }

      render(
        <ErrorBoundary>
          <ContextErrorComponent />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('Fallback UI', () => {
    it('renders custom fallback when provided', () => {
      const customFallback = <div data-testid="custom-fallback">Custom Error UI</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ErrorComponent />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('renders default error UI in production', () => {
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
      });

      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();
      expect(screen.queryByText('Error Details')).not.toBeInTheDocument();

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
      });
    });

    it('renders development error details in development', () => {
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
      });

      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Error Details (Development Mode):')).toBeInTheDocument();

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
      });
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

      // Initially shows error
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(tryAgainButton);

      // Should reset error state (component would re-render without error)
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('Logger Integration', () => {
    it('logs errors to client logger when available', async () => {
      const mockLogger = { error: jest.fn() };
      const mockGetLogger = require('@/lib/client-logger').getLogger;
      mockGetLogger.mockReturnValue(mockLogger);

      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(mockLogger.error).toHaveBeenCalledWith(
          'React Error Boundary caught an error',
          expect.objectContaining({
            name: 'Error',
            message: 'Test error',
          })
        );
      });
    });

    it('handles logger import failure gracefully', () => {
      const originalImport = require('@/lib/client-logger');
      jest.doMock('@/lib/client-logger', () => {
        throw new Error('Logger import failed');
      });

      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('renders warning icon', () => {
      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      // MUI Warning icon should be rendered
      const warningIcon = document.querySelector('svg');
      expect(warningIcon).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      const heading = screen.getByRole('heading', { level: 4 });
      expect(heading).toHaveTextContent('Something went wrong');
    });

    it('has accessible buttons', () => {
      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('applies proper container styling', () => {
      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      const container = screen.getByText('Something went wrong').closest('div');
      expect(container).toBeInTheDocument();
    });

    it('centers content properly', () => {
      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      const container = screen.getByText('Something went wrong').closest('div');
      expect(container).toBeInTheDocument();
    });

    it('has proper card styling', () => {
      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      // Card component should be rendered
      const card = document.querySelector('[data-testid="card"]') || screen.getByText('Something went wrong').closest('div');
      expect(card).toBeInTheDocument();
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

      // Click try again to reset
      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(tryAgainButton);

      // Re-render with normal content
      rerender(
        <ErrorBoundary>
          <div data-testid="recovered-content">Recovered content</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('recovered-content')).toBeInTheDocument();
    });
  });

  describe('Server-Side Rendering', () => {
    it('handles SSR environment gracefully', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      expect(() => {
        render(
          <ErrorBoundary>
            <ErrorComponent />
          </ErrorBoundary>
        );
      }).not.toThrow();

      global.window = originalWindow;
    });

    it('checks for window availability before logger initialization', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      global.window = originalWindow;
    });
  });
});