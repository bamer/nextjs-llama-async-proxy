import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '@/components/ui/error-boundary';
import React from 'react';

describe('ErrorBoundary', () => {
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

  beforeEach(() => {
    consoleErrorSpy.mockClear();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  const ThrowError = ({ shouldThrow }: any) => {
    if (shouldThrow) {
      throw new Error('Test error');
    }
    return <div>Test content</div>;
  };

  it('should render children when no error', () => {
    render(
      <ErrorBoundary fallback={<div>Error fallback</div>}>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Test content')).toBeDefined();
  });

  it('should render fallback when error is thrown', () => {
    render(
      <ErrorBoundary fallback={<div>Error fallback</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Error fallback')).toBeDefined();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should call onError callback when provided', () => {
    const onError = jest.fn();
    
    render(
      <ErrorBoundary onError={onError} fallback={<div>Error</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(Object)
    );
  });

  it('should call onReset callback when reset button is clicked', () => {
    const onReset = jest.fn();
    
    render(
      <ErrorBoundary
        onReset={onReset}
        fallback={<div>Error <button onClick={onReset}>Reset</button></div>}
      >
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    const resetButton = screen.getByText('Reset');
    expect(resetButton).toBeDefined();
  });

  it('should provide error details in fallback', () => {
    const errorInfo = { componentStack: 'Test stack', errorBoundary: 'Test boundary' };
    const FallbackComponent = ({ error }: any) => (
      <div>Error: {error.message}</div>
    );
    
    render(
      <ErrorBoundary
        FallbackComponent={FallbackComponent}
        fallbackProps={errorInfo}
      >
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText(/Error:/)).toBeDefined();
  });
});
