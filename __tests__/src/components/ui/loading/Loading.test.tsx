import React from 'react';
import { render, screen } from '@testing-library/react';
import { Loading } from '@/components/ui/loading/Loading';

describe('Loading Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Default props', () => {
    it('renders with default props', () => {
      render(<Loading />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByTestId('circular-progress')).toBeInTheDocument();
    });

    it('renders with custom message', () => {
      render(<Loading message="Please wait..." />);

      expect(screen.getByText('Please wait...')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('renders circular variant (default)', () => {
      render(<Loading variant="circular" />);

      expect(screen.getByTestId('circular-progress')).toBeInTheDocument();
      expect(screen.queryByTestId('linear-progress')).not.toBeInTheDocument();
    });

    it('renders linear variant', () => {
      render(<Loading variant="linear" />);

      expect(screen.getByTestId('linear-progress')).toBeInTheDocument();
      expect(screen.queryByTestId('circular-progress')).not.toBeInTheDocument();
    });

    it('renders skeleton variant', () => {
      render(<Loading variant="skeleton" />);

      expect(screen.queryByTestId('circular-progress')).not.toBeInTheDocument();
      expect(screen.queryByTestId('linear-progress')).not.toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Full page layout', () => {
    it('renders full page layout', () => {
      render(<Loading fullPage />);

      const container = screen.getByText('Loading...').parentElement?.parentElement;
      expect(container).toBeInTheDocument();
    });

    it('renders full page with circular progress', () => {
      render(<Loading fullPage variant="circular" />);

      expect(screen.getByTestId('circular-progress')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders full page with linear progress', () => {
      render(<Loading fullPage variant="linear" />);

      expect(screen.getByTestId('linear-progress')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Regular layout', () => {
    it('renders regular layout (default)', () => {
      render(<Loading fullPage={false} />);

      const container = screen.getByText('Loading...').parentElement;
      expect(container).toBeInTheDocument();
    });

    it('renders regular layout with circular progress', () => {
      render(<Loading fullPage={false} variant="circular" />);

      expect(screen.getByTestId('circular-progress')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders regular layout with linear progress', () => {
      render(<Loading fullPage={false} variant="linear" />);

      expect(screen.getByTestId('linear-progress')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });
});