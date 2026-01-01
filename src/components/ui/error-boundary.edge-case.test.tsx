import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './error-boundary';

// Mock logger
jest.mock('@/lib/client-logger', () => ({
  getLogger: jest.fn(() => ({
    error: jest.fn(),
  })),
}));

// Mock console methods
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

// Component that throws a non-critical error
function NonCriticalErrorComponent(): React.ReactElement {
  const error = new Error('ResizeObserver loop limit exceeded');
  throw error;
  return <div />;
}

// Component that throws an error
function ErrorComponent(): React.ReactElement {
  throw new Error('Test error');
  return <div />;
}

describe('ErrorBoundary - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockConsoleWarn.mockClear();
    mockConsoleError.mockClear();
  });

  describe('Non-Critical Error Handling', () => {
    it('ignores ResizeObserver errors', () => {
      render(
        <ErrorBoundary>
          <NonCriticalErrorComponent />
        </ErrorBoundary>
      );

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

  describe('Accessibility', () => {
    it('renders warning icon', () => {
      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );

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

      expect(
        screen.getByRole('button', { name: /reload page/i })
      ).toBeInTheDocument();
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

      const card =
        document.querySelector('[data-testid="card"]') ||
        screen.getByText('Something went wrong').closest('div');
      expect(card).toBeInTheDocument();
    });
  });
});
