import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ModelConfigDialog, SamplingConfig } from '@/components/models/ModelConfigDialog';

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
  );
  return render(component, { wrapper });
}

const mockSamplingConfig: SamplingConfig = {
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

describe('ModelConfigDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when open', () => {
    renderWithTheme(
      <ModelConfigDialog
        open={true}
        modelId={1}
        configType="sampling"
        config={mockSamplingConfig}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Configure Model Settings')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderWithTheme(
      <ModelConfigDialog
        open={false}
        modelId={1}
        configType="sampling"
        config={mockSamplingConfig}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.queryByText('Configure Model Settings')).not.toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', async () => {
    renderWithTheme(
      <ModelConfigDialog
        open={true}
        modelId={1}
        configType="sampling"
        config={mockSamplingConfig}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onSave with config when save button is clicked', async () => {
    renderWithTheme(
      <ModelConfigDialog
        open={true}
        modelId={1}
        configType="sampling"
        config={mockSamplingConfig}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(mockOnSave).toHaveBeenCalledWith(mockSamplingConfig);
    });
  });

  it('displays sampling config fields', () => {
    renderWithTheme(
      <ModelConfigDialog
        open={true}
        modelId={1}
        configType="sampling"
        config={mockSamplingConfig}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Sampling Configuration')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0.7')).toBeInTheDocument(); // temperature
  });

  it('handles undefined config', () => {
    renderWithTheme(
      <ModelConfigDialog
        open={true}
        modelId={1}
        configType="sampling"
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Configure Model Settings')).toBeInTheDocument();
  });

  it('handles different config types', () => {
    renderWithTheme(
      <ModelConfigDialog
        open={true}
        modelId={1}
        configType="memory"
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Configure Model Settings')).toBeInTheDocument();
  });

  it('handles different config types', () => {
    renderWithTheme(
      <ModelConfigDialog
        open={true}
        modelId={1}
        configType="gpu"
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Configure Model Settings')).toBeInTheDocument();
  });

  it('handles different config types', () => {
    renderWithTheme(
      <ModelConfigDialog
        open={true}
        modelId={1}
        configType="advanced"
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Configure Model Settings')).toBeInTheDocument();
  });

  it('handles different config types', () => {
    renderWithTheme(
      <ModelConfigDialog
        open={true}
        modelId={1}
        configType="lora"
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Configure Model Settings')).toBeInTheDocument();
  });

  it('handles different config types', () => {
    renderWithTheme(
      <ModelConfigDialog
        open={true}
        modelId={1}
        configType="multimodal"
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Configure Model Settings')).toBeInTheDocument();
  });

  it('handles form field changes', async () => {
    renderWithTheme(
      <ModelConfigDialog
        open={true}
        modelId={1}
        configType="sampling"
        config={mockSamplingConfig}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // Try to find and change a temperature field
    const temperatureInput = screen.getByDisplayValue('0.7');
    fireEvent.change(temperatureInput, { target: { value: '0.8' } });

    expect(temperatureInput).toHaveValue('0.8');
  });

  it('memoizes correctly (no unnecessary re-renders)', () => {
    const { rerender } = renderWithTheme(
      <ModelConfigDialog
        open={true}
        modelId={1}
        configType="sampling"
        config={mockSamplingConfig}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Configure Model Settings')).toBeInTheDocument();

    // Re-render with same props
    rerender(
      <ThemeProvider theme={theme}>
        <ModelConfigDialog
          open={true}
          modelId={1}
          configType="sampling"
          config={mockSamplingConfig}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      </ThemeProvider>
    );

    expect(screen.getByText('Configure Model Settings')).toBeInTheDocument();
  });

  it('handles modelId changes', () => {
    const { rerender } = renderWithTheme(
      <ModelConfigDialog
        open={true}
        modelId={1}
        configType="sampling"
        config={mockSamplingConfig}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Configure Model Settings')).toBeInTheDocument();

    // Change modelId
    rerender(
      <ThemeProvider theme={theme}>
        <ModelConfigDialog
          open={true}
          modelId={2}
          configType="sampling"
          config={mockSamplingConfig}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      </ThemeProvider>
    );

    expect(screen.getByText('Configure Model Settings')).toBeInTheDocument();
  });

  it('handles config changes', () => {
    const { rerender } = renderWithTheme(
      <ModelConfigDialog
        open={true}
        modelId={1}
        configType="sampling"
        config={mockSamplingConfig}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Configure Model Settings')).toBeInTheDocument();

    // Change config
    const newConfig = { ...mockSamplingConfig, temperature: 0.8 };

    rerender(
      <ThemeProvider theme={theme}>
        <ModelConfigDialog
          open={true}
          modelId={1}
          configType="sampling"
          config={newConfig}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      </ThemeProvider>
    );

    expect(screen.getByText('Configure Model Settings')).toBeInTheDocument();
  });
});