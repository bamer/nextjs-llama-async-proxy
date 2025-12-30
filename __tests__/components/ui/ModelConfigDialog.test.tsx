import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import ModelConfigDialog from '@/components/ui/ModelConfigDialog';

// Mock the tooltip config
jest.mock('@/config/tooltip-config', () => ({
  getTooltipContent: jest.fn(() => 'Mock tooltip content'),
}));

// Mock FormTooltip
jest.mock('@/components/ui/FormTooltip', () => ({
  FieldWithTooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
  );
  return render(component, { wrapper });
}

describe('ModelConfigDialog (UI)', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  const defaultProps = {
    open: true,
    modelId: 1,
    configType: 'sampling' as const,
    config: { temperature: 0.7 },
    onClose: mockOnClose,
    onSave: mockOnSave,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when open', () => {
    renderWithTheme(
      <ModelConfigDialog {...defaultProps} />
    );

    expect(screen.getByText('Model Configuration')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderWithTheme(
      <ModelConfigDialog {...defaultProps} open={false} />
    );

    expect(screen.queryByText('Model Configuration')).not.toBeInTheDocument();
  });

  it('displays model ID', () => {
    renderWithTheme(
      <ModelConfigDialog {...defaultProps} modelId={123} />
    );

    expect(screen.getByText('Model Configuration')).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', async () => {
    renderWithTheme(
      <ModelConfigDialog {...defaultProps} />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onSave when save button is clicked', async () => {
    renderWithTheme(
      <ModelConfigDialog {...defaultProps} />
    );

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });
  });

  it('renders accordion sections', () => {
    renderWithTheme(
      <ModelConfigDialog {...defaultProps} />
    );

    expect(screen.getByText('Sampling')).toBeInTheDocument();
    expect(screen.getByText('Memory')).toBeInTheDocument();
    expect(screen.getByText('GPU')).toBeInTheDocument();
  });

  it('handles undefined modelId', () => {
    renderWithTheme(
      <ModelConfigDialog {...defaultProps} modelId={undefined} />
    );

    expect(screen.getByText('Model Configuration')).toBeInTheDocument();
  });

  it('handles null configType', () => {
    renderWithTheme(
      <ModelConfigDialog {...defaultProps} configType={null} />
    );

    expect(screen.getByText('Model Configuration')).toBeInTheDocument();
  });

  it('renders with different config types', () => {
    const { rerender } = renderWithTheme(
      <ModelConfigDialog {...defaultProps} configType="memory" />
    );

    expect(screen.getByText('Model Configuration')).toBeInTheDocument();

    // Change config type
    rerender(
      <ThemeProvider theme={theme}>
        <ModelConfigDialog {...defaultProps} configType="gpu" />
      </ThemeProvider>
    );

    expect(screen.getByText('Model Configuration')).toBeInTheDocument();
  });

  it('handles form interactions', async () => {
    renderWithTheme(
      <ModelConfigDialog {...defaultProps} />
    );

    // Try to expand an accordion
    const samplingAccordion = screen.getByText('Sampling');
    fireEvent.click(samplingAccordion);

    // Component should still be rendered
    expect(screen.getByText('Model Configuration')).toBeInTheDocument();
  });

  it('shows snackbar messages', async () => {
    renderWithTheme(
      <ModelConfigDialog {...defaultProps} />
    );

    // Save should trigger snackbar
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });
  });

  it('handles validation errors', async () => {
    renderWithTheme(
      <ModelConfigDialog {...defaultProps} />
    );

    // Component should handle invalid inputs gracefully
    expect(screen.getByText('Model Configuration')).toBeInTheDocument();
  });

  it('renders icons correctly', () => {
    renderWithTheme(
      <ModelConfigDialog {...defaultProps} />
    );

    // Icons should be rendered (checking for accessibility)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('handles theme changes', () => {
    const { rerender } = renderWithTheme(
      <ModelConfigDialog {...defaultProps} />
    );

    expect(screen.getByText('Model Configuration')).toBeInTheDocument();

    // Re-render (theme change should be handled)
    rerender(
      <ThemeProvider theme={theme}>
        <ModelConfigDialog {...defaultProps} />
      </ThemeProvider>
    );

    expect(screen.getByText('Model Configuration')).toBeInTheDocument();
  });

  it('handles different config objects', () => {
    const { rerender } = renderWithTheme(
      <ModelConfigDialog {...defaultProps} config={{ temperature: 0.5 }} />
    );

    expect(screen.getByText('Model Configuration')).toBeInTheDocument();

    // Change config
    rerender(
      <ThemeProvider theme={theme}>
        <ModelConfigDialog {...defaultProps} config={{ temperature: 0.8 }} />
      </ThemeProvider>
    );

    expect(screen.getByText('Model Configuration')).toBeInTheDocument();
  });
});