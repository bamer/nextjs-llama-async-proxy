import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  SkeletonCard,
  SkeletonMetricCard,
  SkeletonTableRow,
  SkeletonLogEntry,
  SkeletonSettingsForm,
} from '@/components/ui/loading/SkeletonLoader';

describe('SkeletonLoader Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SkeletonCard', () => {
    it('renders single card with default props', () => {
      render(<SkeletonCard />);

      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders multiple cards when count > 1', () => {
      render(<SkeletonCard count={3} />);

      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(3);
    });
  });

  describe('SkeletonMetricCard', () => {
    it('renders without icon', () => {
      render(<SkeletonMetricCard />);

      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders with icon', () => {
      render(<SkeletonMetricCard icon="📊" />);

      expect(screen.getByText('📊')).toBeInTheDocument();
      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('SkeletonTableRow', () => {
    it('renders default table rows', () => {
      render(<SkeletonTableRow />);

      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders custom number of rows and columns', () => {
      render(<SkeletonTableRow rows={2} columns={3} />);

      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('SkeletonLogEntry', () => {
    it('renders default log entries', () => {
      render(<SkeletonLogEntry />);

      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders custom number of entries', () => {
      render(<SkeletonLogEntry count={3} />);

      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('SkeletonSettingsForm', () => {
    it('renders default form fields', () => {
      render(<SkeletonSettingsForm />);

      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders custom number of fields', () => {
      render(<SkeletonSettingsForm fields={3} />);

      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });
});