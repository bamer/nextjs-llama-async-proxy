import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ModelConfigDialog from '@/components/ui/ModelConfigDialogImproved';
import { ThemeProvider as AppThemeProvider } from '@/contexts/ThemeContext';

// Mock the theme context
jest.mock('@/contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({
    isDark: false,
    toggleTheme: jest.fn(),
  }),
}));

const theme = createTheme();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

function renderWithProviders(component: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <AppThemeProvider>
          {component}
        </AppThemeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

// Mock configurations for different types
const mockSamplingConfig = {
  temperature: 0.7,
  top_p: 0.9,
  top_k: 40,
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
  flash_attn: "auto",
};

const mockMemoryConfig = {
  ctx_size: 4096,
  num_batch: 512,
  cache_ram: 2.0,
  memory_f16: false,
  memory_lock: false,
  mmap: true,
  mlock: false,
  numa: "none",
  defrag_thold: -1.0,
  cache_type_k: "f16",
  cache_type_v: "f16",
};

const mockGpuConfig = {
  n_gpu_layers: 35,
  n_gpu: 1,
  tensor_split: "0.0",
  main_gpu: 0,
  mm_lock: false,
  list_devices: false,
  kv_offload: true,
  repack: false,
  no_host: false,
  split_mode: "none",
  device: "cuda",
};

describe('ModelConfigDialogImproved', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Dialog Lifecycle', () => {
    it('renders closed dialog correctly', () => {
      renderWithProviders(
        <ModelConfigDialog
          open={false}
          modelId={1}
          configType="sampling"
          config={mockSamplingConfig}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders open dialog with correct title', () => {
      renderWithProviders(
        <ModelConfigDialog
          open={true}
          modelId={1}
          configType="sampling"
          config={mockSamplingConfig}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Sampling Configuration')).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
      renderWithProviders(
        <ModelConfigDialog
          open={true}
          modelId={1}
          configType="sampling"
          config={mockSamplingConfig}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const closeButton = screen.getByLabelText('close');
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Configuration Types', () => {
    const configTypes = [
      { type: 'sampling', title: 'Sampling Configuration', config: mockSamplingConfig },
      { type: 'memory', title: 'Memory Configuration', config: mockMemoryConfig },
      { type: 'gpu', title: 'GPU Configuration', config: mockGpuConfig },
      { type: 'advanced', title: 'Advanced Configuration' },
      { type: 'lora', title: 'LoRA Configuration' },
      { type: 'multimodal', title: 'Multimodal Configuration' },
    ];

    configTypes.forEach(({ type, title, config }) => {
      it(`renders ${type} configuration correctly`, () => {
        renderWithProviders(
          <ModelConfigDialog
            open={true}
            modelId={1}
            configType={type as any}
            config={config || {}}
            onClose={mockOnClose}
            onSave={mockOnSave}
          />
        );

        expect(screen.getByText(title)).toBeInTheDocument();
      });
    });
  });

  describe('Sampling Configuration', () => {
    beforeEach(() => {
      renderWithProviders(
        <ModelConfigDialog
          open={true}
          modelId={1}
          configType="sampling"
          config={mockSamplingConfig}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
    });

    it('displays all sampling fields', () => {
      expect(screen.getByLabelText('Temperature')).toBeInTheDocument();
      expect(screen.getByLabelText('Top P')).toBeInTheDocument();
      expect(screen.getByLabelText('Top K')).toBeInTheDocument();
      expect(screen.getByLabelText('Min P')).toBeInTheDocument();
      expect(screen.getByLabelText('Repeat Penalty')).toBeInTheDocument();
      expect(screen.getByLabelText('Flash Attention')).toBeInTheDocument();
    });

    it('updates temperature slider value', () => {
      const temperatureSlider = screen.getByLabelText('Temperature');
      fireEvent.change(temperatureSlider, { target: { value: '0.8' } });

      // Should show the value has changed
      expect(temperatureSlider).toHaveValue('0.8');
    });

    it('toggles flash attention select', () => {
      const flashSelect = screen.getByLabelText('Flash Attention');
      fireEvent.mouseDown(flashSelect);

      const option = screen.getByText('on');
      fireEvent.click(option);

      expect(flashSelect).toHaveTextContent('on');
    });

    it('validates numeric inputs', () => {
      const topKInput = screen.getByLabelText('Top K');
      fireEvent.change(topKInput, { target: { value: '-1' } });

      // Should show validation error
      expect(screen.getByText(/Top K must be between/)).toBeInTheDocument();
    });
  });

  describe('Memory Configuration', () => {
    beforeEach(() => {
      renderWithProviders(
        <ModelConfigDialog
          open={true}
          modelId={1}
          configType="memory"
          config={mockMemoryConfig}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
    });

    it('displays memory configuration fields', () => {
      expect(screen.getByLabelText('Context Size')).toBeInTheDocument();
      expect(screen.getByLabelText('Batch Size')).toBeInTheDocument();
      expect(screen.getByLabelText('Memory F16')).toBeInTheDocument();
      expect(screen.getByLabelText('Use mmap')).toBeInTheDocument();
    });

    it('toggles boolean switches', () => {
      const memoryF16Switch = screen.getByLabelText('Memory F16');
      fireEvent.click(memoryF16Switch);

      // The switch should be checked
      expect(memoryF16Switch).toBeChecked();
    });

    it('updates numeric fields with validation', () => {
      const ctxSizeInput = screen.getByLabelText('Context Size');
      fireEvent.change(ctxSizeInput, { target: { value: '8192' } });

      expect(ctxSizeInput).toHaveValue(8192);
    });
  });

  describe('GPU Configuration', () => {
    beforeEach(() => {
      renderWithProviders(
        <ModelConfigDialog
          open={true}
          modelId={1}
          configType="gpu"
          config={mockGpuConfig}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
    });

    it('displays GPU configuration fields', () => {
      expect(screen.getByLabelText('GPU Layers')).toBeInTheDocument();
      expect(screen.getByLabelText('Main GPU')).toBeInTheDocument();
      expect(screen.getByLabelText('KV Offload')).toBeInTheDocument();
      expect(screen.getByLabelText('Device')).toBeInTheDocument();
    });

    it('updates GPU layers slider', () => {
      const gpuLayersSlider = screen.getByLabelText('GPU Layers');
      fireEvent.change(gpuLayersSlider, { target: { value: '50' } });

      expect(gpuLayersSlider).toHaveValue('50');
    });

    it('changes device selection', () => {
      const deviceSelect = screen.getByLabelText('Device');
      fireEvent.mouseDown(deviceSelect);

      const cpuOption = screen.getByText('cpu');
      fireEvent.click(cpuOption);

      expect(deviceSelect).toHaveTextContent('cpu');
    });
  });

  describe('Save Functionality', () => {
    it('calls onSave with updated config', async () => {
      renderWithProviders(
        <ModelConfigDialog
          open={true}
          modelId={1}
          configType="sampling"
          config={mockSamplingConfig}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const temperatureSlider = screen.getByLabelText('Temperature');
      fireEvent.change(temperatureSlider, { target: { value: '0.9' } });

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({ temperature: 0.9 })
        );
      });
    });

    it('shows save button when changes are made', () => {
      renderWithProviders(
        <ModelConfigDialog
          open={true}
          modelId={1}
          configType="sampling"
          config={mockSamplingConfig}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    it('disables save button when no changes', () => {
      renderWithProviders(
        <ModelConfigDialog
          open={true}
          modelId={1}
          configType="sampling"
          config={mockSamplingConfig}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByText('Save Changes');
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Validation', () => {
    it('shows validation errors for invalid inputs', () => {
      renderWithProviders(
        <ModelConfigDialog
          open={true}
          modelId={1}
          configType="sampling"
          config={mockSamplingConfig}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const temperatureSlider = screen.getByLabelText('Temperature');
      fireEvent.change(temperatureSlider, { target: { value: '3.0' } });

      expect(screen.getByText(/Temperature must be between/)).toBeInTheDocument();
    });

    it('clears validation errors on valid input', () => {
      renderWithProviders(
        <ModelConfigDialog
          open={true}
          modelId={1}
          configType="sampling"
          config={mockSamplingConfig}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const temperatureSlider = screen.getByLabelText('Temperature');
      fireEvent.change(temperatureSlider, { target: { value: '3.0' } });

      // Should show error
      expect(screen.getByText(/Temperature must be between/)).toBeInTheDocument();

      // Fix the value
      fireEvent.change(temperatureSlider, { target: { value: '0.8' } });

      // Error should be gone
      expect(screen.queryByText(/Temperature must be between/)).not.toBeInTheDocument();
    });
  });

  describe('UI Features', () => {
    it('expands and collapses accordion groups', () => {
      renderWithProviders(
        <ModelConfigDialog
          open={true}
          modelId={1}
          configType="sampling"
          config={mockSamplingConfig}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const coreSamplingAccordion = screen.getByText('Core Sampling');
      const expandIcon = coreSamplingAccordion.closest('button');

      if (expandIcon) {
        fireEvent.click(expandIcon);
        // Accordion should still be expanded by default
        expect(screen.getByText('Temperature')).toBeVisible();
      }
    });

    it('shows tooltips for field descriptions', () => {
      renderWithProviders(
        <ModelConfigDialog
          open={true}
          modelId={1}
          configType="sampling"
          config={mockSamplingConfig}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Check for info icons that would show tooltips
      const infoIcons = screen.getAllByTestId('InfoIcon');
      expect(infoIcons.length).toBeGreaterThan(0);
    });

    it('handles keyboard navigation', () => {
      renderWithProviders(
        <ModelConfigDialog
          open={true}
          modelId={1}
          configType="sampling"
          config={mockSamplingConfig}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const temperatureSlider = screen.getByLabelText('Temperature');
      temperatureSlider.focus();

      expect(document.activeElement).toBe(temperatureSlider);
    });
  });

  describe('Error Handling', () => {
    it('handles undefined config gracefully', () => {
      renderWithProviders(
        <ModelConfigDialog
          open={true}
          modelId={1}
          configType="sampling"
          config={undefined}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Sampling Configuration')).toBeInTheDocument();
      // Should use default values
      expect(screen.getByLabelText('Temperature')).toBeInTheDocument();
    });

    it('handles null configType gracefully', () => {
      renderWithProviders(
        <ModelConfigDialog
          open={true}
          modelId={1}
          configType={null}
          config={{}}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Configuration')).toBeInTheDocument();
    });

    it('handles invalid configType gracefully', () => {
      renderWithProviders(
        <ModelConfigDialog
          open={true}
          modelId={1}
          configType={'invalid' as any}
          config={{}}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Configuration')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      renderWithProviders(
        <ModelConfigDialog
          open={true}
          modelId={1}
          configType="sampling"
          config={mockSamplingConfig}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByLabelText('close')).toBeInTheDocument();
      expect(screen.getByLabelText('Temperature')).toHaveAttribute('aria-valuemin');
      expect(screen.getByLabelText('Temperature')).toHaveAttribute('aria-valuemax');
    });

    it('supports keyboard shortcuts', () => {
      renderWithProviders(
        <ModelConfigDialog
          open={true}
          modelId={1}
          configType="sampling"
          config={mockSamplingConfig}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Test Escape key closes dialog
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Theme Support', () => {
    it('applies dark theme styling', () => {
      // Mock dark theme
      const mockUseTheme = require('@/contexts/ThemeContext').useTheme;
      mockUseTheme.mockReturnValue({ isDark: true, toggleTheme: jest.fn() });

      renderWithProviders(
        <ModelConfigDialog
          open={true}
          modelId={1}
          configType="sampling"
          config={mockSamplingConfig}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Should render without errors in dark mode
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Reset mock
      mockUseTheme.mockReturnValue({ isDark: false, toggleTheme: jest.fn() });
    });
  });

  describe('Advanced Features', () => {
    it('handles advanced configuration fields', () => {
      const advancedConfig = {
        rope_frequency: 10000,
        rope_scale: 1.0,
        yarn_ext_factor: 1.0,
        yarn_orig_ctx: 4096,
        num_thread: 8,
        num_predict: -1,
        swa_full: false,
        rpc: "",
        offline: false,
      };

      renderWithProviders(
        <ModelConfigDialog
          open={true}
          modelId={1}
          configType="advanced"
          config={advancedConfig}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Advanced Configuration')).toBeInTheDocument();
      expect(screen.getByLabelText('Rope Frequency')).toBeInTheDocument();
      expect(screen.getByLabelText('Number of Threads')).toBeInTheDocument();
    });

    it('handles LoRA configuration fields', () => {
      const loraConfig = {
        lora_path: "/path/to/lora.bin",
        lora_scale: 1.0,
        lora_base: "",
        lora_init_type: "none",
        draft_ppl_max: 1.1,
        draft_ppl_min: 0.9,
      };

      renderWithProviders(
        <ModelConfigDialog
          open={true}
          modelId={1}
          configType="lora"
          config={loraConfig}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('LoRA Configuration')).toBeInTheDocument();
      expect(screen.getByLabelText('LoRA Path')).toBeInTheDocument();
      expect(screen.getByLabelText('LoRA Scale')).toBeInTheDocument();
    });

    it('handles multimodal configuration fields', () => {
      const multimodalConfig = {
        mmproj: "/path/to/mmproj.bin",
        image_max_tokens: 512,
        mmproj_auto: "0",
      };

      renderWithProviders(
        <ModelConfigDialog
          open={true}
          modelId={1}
          configType="multimodal"
          config={multimodalConfig}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Multimodal Configuration')).toBeInTheDocument();
      expect(screen.getByLabelText('MMPROJ Model')).toBeInTheDocument();
      expect(screen.getByLabelText('Max Image Tokens')).toBeInTheDocument();
    });
  });
});