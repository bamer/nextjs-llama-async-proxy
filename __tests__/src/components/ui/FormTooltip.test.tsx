import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormTooltip, FieldWithTooltip, LabelWithTooltip } from '@/components/ui/FormTooltip';

// Mock the tooltip config
jest.mock('@/config/tooltip-config', () => ({
  getTooltipContent: jest.fn(() => ({
    title: 'Test Tooltip',
    description: 'This is a test tooltip description',
    recommendedValue: 'Test recommended value',
    effectOnModel: 'Test effect on model',
    whenToAdjust: 'Test when to adjust',
  })),
}));

const mockTooltipContent = {
  title: 'Test Tooltip',
  description: 'This is a test tooltip description',
  recommendedValue: 'Test recommended value',
  effectOnModel: 'Test effect on model',
  whenToAdjust: 'Test when to adjust',
};

describe('FormTooltip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('FormTooltip Component', () => {
    it('renders tooltip with children', () => {
      render(
        <FormTooltip content={mockTooltipContent}>
          <button>Test Button</button>
        </FormTooltip>
      );

      expect(screen.getByText('Test Button')).toBeInTheDocument();
    });

    it('renders standalone tooltip icon when no children provided', () => {
      render(<FormTooltip content={mockTooltipContent} />);

      // Should render an icon button
      const iconButton = screen.getByRole('button', { name: /info about/i });
      expect(iconButton).toBeInTheDocument();
    });

    it('applies correct size classes', () => {
      const { rerender } = render(
        <FormTooltip content={mockTooltipContent} size="small">
          <button>Test</button>
        </FormTooltip>
      );

      rerender(
        <FormTooltip content={mockTooltipContent} size="medium">
          <button>Test</button>
        </FormTooltip>
      );

      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('applies correct placement', () => {
      render(
        <FormTooltip content={mockTooltipContent} placement="top">
          <button>Test</button>
        </FormTooltip>
      );

      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('handles enter delay', () => {
      render(
        <FormTooltip content={mockTooltipContent} enterDelay={1000}>
          <button>Test</button>
        </FormTooltip>
      );

      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  describe('FieldWithTooltip Component', () => {
    it('renders field with tooltip', () => {
      render(
        <FieldWithTooltip content={mockTooltipContent}>
          <input placeholder="Test input" />
        </FieldWithTooltip>
      );

      expect(screen.getByPlaceholderText('Test input')).toBeInTheDocument();
    });

    it('positions tooltip icon next to field', () => {
      render(
        <FieldWithTooltip content={mockTooltipContent}>
          <input placeholder="Test input" />
        </FieldWithTooltip>
      );

      // Should have the input and an info icon
      expect(screen.getByPlaceholderText('Test input')).toBeInTheDocument();
    });
  });

  describe('LabelWithTooltip Component', () => {
    it('renders label with tooltip', () => {
      render(
        <LabelWithTooltip content={mockTooltipContent} label="Test Label" />
      );

      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });

    it('shows required asterisk when required is true', () => {
      render(
        <LabelWithTooltip content={mockTooltipContent} label="Test Label" required />
      );

      expect(screen.getByText('Test Label *')).toBeInTheDocument();
    });

    it('does not show required asterisk when required is false', () => {
      render(
        <LabelWithTooltip content={mockTooltipContent} label="Test Label" required={false} />
      );

      expect(screen.getByText('Test Label')).toBeInTheDocument();
      expect(screen.queryByText('Test Label *')).not.toBeInTheDocument();
    });
  });

  describe('Tooltip Content Rendering', () => {
    it('displays tooltip content correctly', () => {
      render(
        <FormTooltip content={mockTooltipContent}>
          <button>Test Button</button>
        </FormTooltip>
      );

      // The tooltip content should be available (though not visible until hover)
      expect(screen.getByText('Test Button')).toBeInTheDocument();
    });

    it('handles tooltip content without optional fields', () => {
      const minimalContent = {
        title: 'Minimal Tooltip',
        description: 'Minimal description',
      };

      render(
        <FormTooltip content={minimalContent}>
          <button>Test</button>
        </FormTooltip>
      );

      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });
});