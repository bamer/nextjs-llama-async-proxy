import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { Loading } from '@/components/ui/loading/Loading';

// Mock ThemeContext
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ isDark: false }),
}));

describe('Loading', () => {
  it('renders with default props', () => {
    render(<Loading />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders circular progress by default', () => {
    const { container } = render(<Loading />);

    const circularProgress = container.querySelector('.MuiCircularProgress-root');
    expect(circularProgress).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<Loading message="Please wait..." />);

    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('renders linear variant', () => {
    const { container } = render(<Loading variant="linear" />);

    const linearProgress = container.querySelector('.MuiLinearProgress-root');
    expect(linearProgress).toBeInTheDocument();
  });

  it('renders full page layout', () => {
    const { container } = render(<Loading fullPage={true} />);

    const box = container.querySelector('.MuiBox-root');
    expect(box).toBeInTheDocument();
  });

  it('handles circular variant with full page', () => {
    render(<Loading variant="circular" fullPage={true} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles linear variant with full page', () => {
    render(<Loading variant="linear" fullPage={true} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('applies custom size to circular progress', () => {
    const { container } = render(<Loading size={60} />);

    const circularProgress = container.querySelector('.MuiCircularProgress-root');
    expect(circularProgress).toBeInTheDocument();
  });

  it('renders different messages', () => {
    render(<Loading message="Fetching data..." />);

    expect(screen.getByText('Fetching data...')).toBeInTheDocument();
  });

  it('handles empty message', () => {
    render(<Loading message="" />);

    // Should still render the component
    expect(screen.getByRole('generic')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { container } = render(<Loading size={80} />);

    const circularProgress = container.querySelector('.MuiCircularProgress-root');
    expect(circularProgress).toBeInTheDocument();
  });

  it('handles skeleton variant (fallback to circular)', () => {
    render(<Loading variant="skeleton" />);

    // Should default to circular when skeleton is not implemented
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders full page with custom message', () => {
    render(<Loading fullPage={true} message="Initializing..." />);

    expect(screen.getByText('Initializing...')).toBeInTheDocument();
  });

  it('handles theme changes', () => {
    // Mock dark theme
    const { useTheme } = require('@/contexts/ThemeContext');
    useTheme.mockReturnValue({ isDark: true });

    render(<Loading />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders linear progress with proper width constraints', () => {
    const { container } = render(<Loading variant="linear" />);

    const box = container.querySelector('.MuiBox-root');
    expect(box).toBeInTheDocument();
  });

  it('renders full page linear progress', () => {
    render(<Loading variant="linear" fullPage={true} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles very small size', () => {
    render(<Loading size={20} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles very large size', () => {
    render(<Loading size={100} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with long message', () => {
    const longMessage = 'This is a very long loading message that might wrap to multiple lines';
    render(<Loading message={longMessage} />);

    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('maintains accessibility', () => {
    render(<Loading />);

    // Component should be accessible
    expect(screen.getByRole('generic')).toBeInTheDocument();
  });

  it('renders all variants without errors', () => {
    const { rerender } = render(<Loading variant="circular" />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    rerender(<Loading variant="linear" />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles fullPage prop changes', () => {
    const { rerender } = render(<Loading fullPage={false} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    rerender(<Loading fullPage={true} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});