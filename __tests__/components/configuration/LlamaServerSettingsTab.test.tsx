import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { LlamaServerSettingsTab } from '@/components/configuration/LlamaServerSettingsTab';

jest.mock('framer-motion', () => ({
  m: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ isDark: false }),
}));

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('LlamaServerSettingsTab', () => {
  const mockOnLlamaServerChange = jest.fn();
  const defaultFormConfig = {
    llamaServer: {
      host: '127.0.0.1',
      port: 8080,
      ctx_size: 4096,
      batch_size: 2048,
      ubatch_size: 512,
      threads: -1,
      gpu_layers: -1,
      main_gpu: 0,
      temperature: 0.8,
      top_k: 40,
      top_p: 0.9,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    renderWithTheme(
      <LlamaServerSettingsTab formConfig={defaultFormConfig} onLlamaServerChange={mockOnLlamaServerChange} />
    );
    expect(screen.getByText('Llama-Server Settings')).toBeInTheDocument();
  });

  it('renders Server Binding section', () => {
    renderWithTheme(
      <LlamaServerSettingsTab formConfig={defaultFormConfig} onLlamaServerChange={mockOnLlamaServerChange} />
    );
    expect(screen.getByText('Server Binding')).toBeInTheDocument();
  });

  it('renders Basic Options section', () => {
    renderWithTheme(
      <LlamaServerSettingsTab formConfig={defaultFormConfig} onLlamaServerChange={mockOnLlamaServerChange} />
    );
    expect(screen.getByText('Basic Options')).toBeInTheDocument();
  });

  it('renders GPU Options section', () => {
    renderWithTheme(
      <LlamaServerSettingsTab formConfig={defaultFormConfig} onLlamaServerChange={mockOnLlamaServerChange} />
    );
    expect(screen.getByText('GPU Options')).toBeInTheDocument();
  });

  it('renders Sampling Parameters section', () => {
    renderWithTheme(
      <LlamaServerSettingsTab formConfig={defaultFormConfig} onLlamaServerChange={mockOnLlamaServerChange} />
    );
    expect(screen.getByText('Sampling Parameters')).toBeInTheDocument();
  });

  it('renders Host input', () => {
    renderWithTheme(
      <LlamaServerSettingsTab formConfig={defaultFormConfig} onLlamaServerChange={mockOnLlamaServerChange} />
    );
    expect(screen.getByLabelText('Host')).toBeInTheDocument();
    expect(screen.getByDisplayValue('127.0.0.1')).toBeInTheDocument();
  });

  it('renders Port input', () => {
    renderWithTheme(
      <LlamaServerSettingsTab formConfig={defaultFormConfig} onLlamaServerChange={mockOnLlamaServerChange} />
    );
    expect(screen.getByLabelText('Port')).toBeInTheDocument();
    expect(screen.getByDisplayValue('8080')).toBeInTheDocument();
  });

  it('renders Context Size input', () => {
    renderWithTheme(
      <LlamaServerSettingsTab formConfig={defaultFormConfig} onLlamaServerChange={mockOnLlamaServerChange} />
    );
    expect(screen.getByLabelText('Context Size')).toBeInTheDocument();
    expect(screen.getByDisplayValue('4096')).toBeInTheDocument();
  });

  it('renders Batch Size input', () => {
    renderWithTheme(
      <LlamaServerSettingsTab formConfig={defaultFormConfig} onLlamaServerChange={mockOnLlamaServerChange} />
    );
    expect(screen.getByLabelText('Batch Size')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2048')).toBeInTheDocument();
  });

  it('renders Micro Batch Size input', () => {
    renderWithTheme(
      <LlamaServerSettingsTab formConfig={defaultFormConfig} onLlamaServerChange={mockOnLlamaServerChange} />
    );
    expect(screen.getByLabelText('Micro Batch Size')).toBeInTheDocument();
    expect(screen.getByDisplayValue('512')).toBeInTheDocument();
  });

  it('renders Threads input', () => {
    renderWithTheme(
      <LlamaServerSettingsTab formConfig={defaultFormConfig} onLlamaServerChange={mockOnLlamaServerChange} />
    );
    expect(screen.getByLabelText('Threads')).toBeInTheDocument();
    const threadsInput = screen.getByRole('spinbutton', { name: /threads/i });
    expect(threadsInput).toHaveValue(-1);
  });

  it('renders GPU Layers input', () => {
    renderWithTheme(
      <LlamaServerSettingsTab formConfig={defaultFormConfig} onLlamaServerChange={mockOnLlamaServerChange} />
    );
    expect(screen.getByLabelText('GPU Layers')).toBeInTheDocument();
    const gpuLayersInput = screen.getByRole('spinbutton', { name: /gpu layers/i });
    expect(gpuLayersInput).toHaveValue(-1);
  });

  it('renders Main GPU input', () => {
    renderWithTheme(
      <LlamaServerSettingsTab formConfig={defaultFormConfig} onLlamaServerChange={mockOnLlamaServerChange} />
    );
    expect(screen.getByLabelText('Main GPU')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0')).toBeInTheDocument();
  });

  it('renders Temperature input', () => {
    renderWithTheme(
      <LlamaServerSettingsTab formConfig={defaultFormConfig} onLlamaServerChange={mockOnLlamaServerChange} />
    );
    expect(screen.getByLabelText('Temperature')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0.8')).toBeInTheDocument();
  });

  it('renders Top-K input', () => {
    renderWithTheme(
      <LlamaServerSettingsTab formConfig={defaultFormConfig} onLlamaServerChange={mockOnLlamaServerChange} />
    );
    expect(screen.getByLabelText('Top-K')).toBeInTheDocument();
    expect(screen.getByDisplayValue('40')).toBeInTheDocument();
  });

  it('renders Top-P input', () => {
    renderWithTheme(
      <LlamaServerSettingsTab formConfig={defaultFormConfig} onLlamaServerChange={mockOnLlamaServerChange} />
    );
    expect(screen.getByLabelText('Top-P')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0.9')).toBeInTheDocument();
  });

  it('calls onLlamaServerChange when Host is changed', () => {
    renderWithTheme(
      <LlamaServerSettingsTab formConfig={defaultFormConfig} onLlamaServerChange={mockOnLlamaServerChange} />
    );
    const input = screen.getByLabelText('Host');
    fireEvent.change(input, { target: { name: 'llamaServer.host', value: 'localhost' } });
    expect(mockOnLlamaServerChange).toHaveBeenCalled();
  });

  it('handles empty formConfig', () => {
    renderWithTheme(
      <LlamaServerSettingsTab formConfig={{}} onLlamaServerChange={mockOnLlamaServerChange} />
    );
    expect(screen.getByText('Llama-Server Settings')).toBeInTheDocument();
  });

  it('displays helper text for inputs', () => {
    renderWithTheme(
      <LlamaServerSettingsTab formConfig={defaultFormConfig} onLlamaServerChange={mockOnLlamaServerChange} />
    );
    expect(screen.getByText('Server hostname or IP address')).toBeInTheDocument();
    expect(screen.getByText('Server port number')).toBeInTheDocument();
    expect(screen.getByText('Maximum context window size')).toBeInTheDocument();
  });
});
