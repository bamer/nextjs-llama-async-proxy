import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import {
  SkeletonCard,
  SkeletonMetricCard,
  SkeletonTableRow,
  SkeletonLogEntry,
  SkeletonSettingsForm
} from '@/components/ui/loading/SkeletonLoader';

// Mock ThemeContext
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ isDark: false }),
}));

describe('SkeletonLoader Components', () => {
  describe('SkeletonCard', () => {
    it('renders with default props', () => {
      expect(() => render(<SkeletonCard />)).not.toThrow();
    });

    it('renders multiple cards with count prop', () => {
      expect(() => render(<SkeletonCard count={3} />)).not.toThrow();
    });

    it('applies custom height', () => {
      expect(() => render(<SkeletonCard height={300} />)).not.toThrow();
    });
  });

  describe('SkeletonMetricCard', () => {
    it('renders without icon', () => {
      expect(() => render(<SkeletonMetricCard />)).not.toThrow();
    });

    it('renders with icon', () => {
      render(<SkeletonMetricCard icon="🚀" />);
      expect(screen.getByText('🚀')).toBeInTheDocument();
    });
  });

  describe('SkeletonTableRow', () => {
    it('renders with default props', () => {
      expect(() => render(<SkeletonTableRow />)).not.toThrow();
    });

    it('renders custom number of rows', () => {
      expect(() => render(<SkeletonTableRow rows={5} />)).not.toThrow();
    });
  });

  describe('SkeletonLogEntry', () => {
    it('renders with default props', () => {
      expect(() => render(<SkeletonLogEntry />)).not.toThrow();
    });

    it('renders custom count', () => {
      expect(() => render(<SkeletonLogEntry count={10} />)).not.toThrow();
    });
  });

  describe('SkeletonSettingsForm', () => {
    it('renders with default props', () => {
      expect(() => render(<SkeletonSettingsForm />)).not.toThrow();
    });

    it('renders custom number of fields', () => {
      expect(() => render(<SkeletonSettingsForm fields={8} />)).not.toThrow();
    });
  });

  it('all skeleton components render without errors', () => {
    expect(() => {
      render(
        <div>
          <SkeletonCard />
          <SkeletonMetricCard />
          <SkeletonTableRow />
          <SkeletonLogEntry />
          <SkeletonSettingsForm />
        </div>
      );
    }).not.toThrow();
  });
});