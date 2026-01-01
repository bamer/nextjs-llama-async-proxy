import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ErrorBoundary } from './error-boundary';

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock logger
jest.mock('@/lib/client-logger', () => ({
  getLogger: jest.fn(() => ({
    error: jest.fn(),
  })),
}));

// Component that throws an error
function ErrorComponent(): React.ReactElement {
  throw new Error('Test error');
  return <div />;
}

describe('ErrorBoundary - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockConsoleError.mockClear();
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
      expect(
        screen.getByText('Error Details (Development Mode):')
      ).toBeInTheDocument();

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
      });
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
});
