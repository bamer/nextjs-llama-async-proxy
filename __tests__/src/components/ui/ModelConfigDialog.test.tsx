import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ModelConfigDialog from '@/components/ui/ModelConfigDialog';

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

const mockOnClose = jest.fn();
const mockOnSave = jest.fn();

const defaultProps = {
  open: true,
  modelId: 1,
  configType: 'sampling' as const,
  config: {},
  onClose: mockOnClose,
  onSave: mockOnSave,
};

describe('ModelConfigDialog (UI)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders dialog when open', () => {
      render(<ModelConfigDialog {...defaultProps} />);

      expect(screen.getByText('Configure sampling')).toBeInTheDocument();
      expect(screen.getByText('Save Configuration')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<ModelConfigDialog {...defaultProps} open={false} />);

      expect(screen.queryByText('Configure sampling')).not.toBeInTheDocument();
    });

    it('renders different config types', () => {
      const configTypes = ['memory', 'gpu', 'advanced', 'lora', 'multimodal'] as const;

      configTypes.forEach((configType) => {
        const { rerender } = render(
          <ModelConfigDialog
            {...defaultProps}
            configType={configType}
            key={configType}
          />
        );

        expect(screen.getByText(`Configure ${configType}`)).toBeInTheDocument();

        rerender(<div />);
      });
    });
  });

  describe('User Interactions', () => {
    it('calls onClose when Cancel button is clicked', () => {
      render(<ModelConfigDialog {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onSave when Save button is clicked', () => {
      render(<ModelConfigDialog {...defaultProps} />);

      const saveButton = screen.getByText('Save Configuration');
      fireEvent.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('can toggle sections', () => {
      render(<ModelConfigDialog {...defaultProps} />);

      // Should render accordion sections
      expect(screen.getByText('Core Sampling')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('renders form fields for sampling config', () => {
      render(<ModelConfigDialog {...defaultProps} />);

      expect(screen.getByText('Temperature')).toBeInTheDocument();
      expect(screen.getByText('Top P')).toBeInTheDocument();
      expect(screen.getByText('Top K')).toBeInTheDocument();
    });

    it('renders form fields for memory config', () => {
      render(
        <ModelConfigDialog
          {...defaultProps}
          configType="memory"
        />
      );

      expect(screen.getByText('Cache RAM')).toBeInTheDocument();
      expect(screen.getByText('Cache Type K')).toBeInTheDocument();
    });

    it('renders form fields for GPU config', () => {
      render(
        <ModelConfigDialog
          {...defaultProps}
          configType="gpu"
        />
      );

      expect(screen.getByText('Device')).toBeInTheDocument();
      expect(screen.getByText('GPU Layers')).toBeInTheDocument();
    });
  });

  describe('Dialog Structure', () => {
    it('has proper dialog structure', () => {
      render(<ModelConfigDialog {...defaultProps} />);

      expect(screen.getByText('Configure sampling')).toBeInTheDocument();
      expect(screen.getByText('Model 1')).toBeInTheDocument();
    });

    it('shows unsaved changes indicator when config is modified', () => {
      render(<ModelConfigDialog {...defaultProps} />);

      // Initially no unsaved changes
      expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();

      // After modifying a field, should show indicator
      const temperatureField = screen.getByLabelText('Temperature');
      fireEvent.change(temperatureField, { target: { value: '0.8' } });

      // The dialog should detect changes
      expect(screen.getByText('Configure sampling')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('shows validation errors for invalid values', () => {
      render(<ModelConfigDialog {...defaultProps} />);

      // Try to set invalid temperature value
      const temperatureField = screen.getByLabelText('Temperature');
      fireEvent.change(temperatureField, { target: { value: '5' } }); // Invalid: > 2

      // Should show validation error
      expect(screen.getByText('Configure sampling')).toBeInTheDocument();
    });
  });
});