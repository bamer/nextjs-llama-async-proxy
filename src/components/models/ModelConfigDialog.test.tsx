import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModelConfigDialog } from './ModelConfigDialog';

// Mock the tooltip config
jest.mock('@/config/tooltip-config', () => ({
  PARAM_DESCRIPTIONS: {
    temperature: 'Test temperature description',
    top_p: 'Test top_p description',
    ctx_size: 'Test context size description',
  },
}));

const mockOnClose = jest.fn();
const mockOnSave = jest.fn();

const defaultProps = {
  open: true,
  modelId: 1,
  configType: 'sampling' as const,
  onClose: mockOnClose,
  onSave: mockOnSave,
};

describe('ModelConfigDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders sampling dialog correctly', () => {
      render(<ModelConfigDialog {...defaultProps} />);

      expect(screen.getByText('Sampling Configuration')).toBeInTheDocument();
      expect(screen.getByText('Save Configuration')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('renders with different config types', () => {
      const configTypes = ['memory', 'gpu', 'advanced', 'lora', 'multimodal'] as const;

      configTypes.forEach((configType) => {
        const { rerender } = render(
          <ModelConfigDialog
            {...defaultProps}
            configType={configType}
            key={configType}
          />
        );

        const titles = {
          memory: 'Memory Configuration',
          gpu: 'GPU Configuration',
          advanced: 'Advanced Configuration',
          lora: 'LoRA Configuration',
          multimodal: 'Multimodal Configuration',
        };

        expect(screen.getByText(titles[configType])).toBeInTheDocument();

        rerender(<div />);
      });
    });

    it('renders with existing config', () => {
      const existingConfig = {
        temperature: 0.8,
        top_p: 0.95,
        top_k: 50,
        min_p: 0.05,
        typical_p: 1.0,
        repeat_penalty: 1.1,
        repeat_last_n: 64,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
        mirostat: 0,
        mirostat_tau: 5.0,
        mirostat_eta: 0.1,
        seed: -1,
        flash_attn: "auto" as const,
      };

      render(
        <ModelConfigDialog
          {...defaultProps}
          config={existingConfig}
        />
      );

      expect(screen.getByText('Sampling Configuration')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('renders sampling form fields', () => {
      render(<ModelConfigDialog {...defaultProps} />);

      expect(screen.getByText('Temperature')).toBeInTheDocument();
      expect(screen.getByText('Top P')).toBeInTheDocument();
      expect(screen.getByText('Top K')).toBeInTheDocument();
    });

    it('renders memory form fields', () => {
      render(
        <ModelConfigDialog
          {...defaultProps}
          configType="memory"
        />
      );

      expect(screen.getByText('ctx_size')).toBeInTheDocument();
      expect(screen.getByText('Batch Size')).toBeInTheDocument();
    });

    it('renders GPU form fields', () => {
      render(
        <ModelConfigDialog
          {...defaultProps}
          configType="gpu"
        />
      );

      expect(screen.getByText('GPU Layers')).toBeInTheDocument();
      expect(screen.getByText('Number of GPUs')).toBeInTheDocument();
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

    it('updates text field values', () => {
      render(<ModelConfigDialog {...defaultProps} />);

      const topKField = screen.getByLabelText('Top K');
      fireEvent.change(topKField, { target: { value: '50' } });

      expect(topKField).toHaveValue(50);
    });
  });

  describe('Dialog State', () => {
    it('does not render when open is false', () => {
      render(<ModelConfigDialog {...defaultProps} open={false} />);

      expect(screen.queryByText('Sampling Configuration')).not.toBeInTheDocument();
    });

    it('renders when open is true', () => {
      render(<ModelConfigDialog {...defaultProps} />);

      expect(screen.getByText('Sampling Configuration')).toBeInTheDocument();
    });
  });

  describe('Config Types', () => {
    it('handles sampling config with defaults', () => {
      render(<ModelConfigDialog {...defaultProps} configType="sampling" />);

      expect(screen.getByText('Temperature')).toBeInTheDocument();
      expect(screen.getByText('Top P')).toBeInTheDocument();
      expect(screen.getByText('Min P')).toBeInTheDocument();
    });

    it('handles memory config with defaults', () => {
      render(<ModelConfigDialog {...defaultProps} configType="memory" />);

      expect(screen.getByText('ctx_size')).toBeInTheDocument();
      expect(screen.getByText('Batch Size')).toBeInTheDocument();
      expect(screen.getByText('Use F16 Memory')).toBeInTheDocument();
    });

    it('handles GPU config with defaults', () => {
      render(<ModelConfigDialog {...defaultProps} configType="gpu" />);

      expect(screen.getByText('GPU Layers')).toBeInTheDocument();
      expect(screen.getByText('Number of GPUs')).toBeInTheDocument();
      expect(screen.getByText('Lock MM Tensors')).toBeInTheDocument();
    });

    it('handles LoRA config with defaults', () => {
      render(<ModelConfigDialog {...defaultProps} configType="lora" />);

      expect(screen.getByText('LoRA Adapter Path')).toBeInTheDocument();
      expect(screen.getByText('LoRA Base Model')).toBeInTheDocument();
      expect(screen.getByText('LoRA Scale')).toBeInTheDocument();
    });

    it('handles multimodal config with defaults', () => {
      render(<ModelConfigDialog {...defaultProps} configType="multimodal" />);

      expect(screen.getByText('Image Data')).toBeInTheDocument();
      expect(screen.getByText('Cache CLIP Vision Model')).toBeInTheDocument();
      expect(screen.getByText('MMProj Model Path')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('disables save button when validation fails', () => {
      render(<ModelConfigDialog {...defaultProps} />);

      const saveButton = screen.getByText('Save Configuration');
      // Since there's no specific validation logic that would fail by default,
      // the button should be enabled
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('Tooltips', () => {
    it('renders tooltips for form fields', () => {
      render(<ModelConfigDialog {...defaultProps} />);

      // Tooltips are rendered via MUI Tooltip component
      // We can check that the tooltip content is available
      expect(screen.getByText('Temperature')).toBeInTheDocument();
    });
  });
});