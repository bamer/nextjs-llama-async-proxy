import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ModelsListCard } from '@/components/dashboard/ModelsListCard';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const theme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
}

describe('ModelsListCard', () => {
  const mockModels = [
    {
      id: 'model1',
      name: 'Llama 2 7B',
      status: 'running',
      type: 'llama',
    },
    {
      id: 'model2',
      name: 'Llama 2 13B',
      status: 'idle',
      type: 'llama',
    },
  ] as any;

  const mockOnToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response)
    ) as any;
  });

  it('renders correctly with models', () => {
    renderWithTheme(
      <ModelsListCard
        models={mockModels}
        isDark={false}
        onToggleModel={mockOnToggle}
      />
    );

    expect(screen.getByText('Available Models')).toBeInTheDocument();
  });

  it('displays all models', () => {
    renderWithTheme(
      <ModelsListCard
        models={mockModels}
        isDark={false}
        onToggleModel={mockOnToggle}
      />
    );

    expect(screen.getByText('Llama 2 7B')).toBeInTheDocument();
    expect(screen.getByText('Llama 2 13B')).toBeInTheDocument();
  });

  it('shows model count', () => {
    renderWithTheme(
      <ModelsListCard
        models={mockModels}
        isDark={false}
        onToggleModel={mockOnToggle}
      />
    );

    expect(screen.getByText('2 models')).toBeInTheDocument();
  });

  it('displays correct status labels', () => {
    renderWithTheme(
      <ModelsListCard
        models={mockModels}
        isDark={false}
        onToggleModel={mockOnToggle}
      />
    );

    expect(screen.getByText('RUNNING')).toBeInTheDocument();
    expect(screen.getByText('STOPPED')).toBeInTheDocument();
  });

  it('renders empty state when no models', () => {
    renderWithTheme(
      <ModelsListCard
        models={[]}
        isDark={false}
        onToggleModel={mockOnToggle}
      />
    );

    expect(screen.getByText('0 models')).toBeInTheDocument();
  });

  it('applies dark mode styling', () => {
    const { container } = renderWithTheme(
      <ModelsListCard
        models={mockModels}
        isDark={true}
        onToggleModel={mockOnToggle}
      />
    );

    const card = container.querySelector('.MuiCard-root');
    expect(card).toBeInTheDocument();
  });

  // Edge Case Tests
  it('handles null models', () => {
    renderWithTheme(
      <ModelsListCard
        models={null as any}
        isDark={false}
        onToggleModel={mockOnToggle}
      />
    );

    expect(screen.getByText('Available Models')).toBeInTheDocument();
  });

  it('handles undefined models', () => {
    renderWithTheme(
      <ModelsListCard
        models={undefined as any}
        isDark={false}
        onToggleModel={mockOnToggle}
      />
    );

    expect(screen.getByText('Available Models')).toBeInTheDocument();
  });

  it('handles very large number of models', () => {
    const manyModels = Array.from({ length: 100 }, (_, i) => ({
      id: `model${i}`,
      name: `Model ${i}`,
      status: i % 2 === 0 ? 'running' : 'idle',
      type: 'llama',
    }));

    renderWithTheme(
      <ModelsListCard
        models={manyModels}
        isDark={false}
        onToggleModel={mockOnToggle}
      />
    );

    expect(screen.getByText('100 models')).toBeInTheDocument();
  });

  it('handles model with loading status', () => {
    const loadingModels = [
      {
        id: 'model1',
        name: 'Loading Model',
        status: 'loading',
        type: 'llama',
        progress: 45,
      },
    ] as any;

    renderWithTheme(
      <ModelsListCard
        models={loadingModels}
        isDark={false}
        onToggleModel={mockOnToggle}
      />
    );

    expect(screen.getByText('LOADING')).toBeInTheDocument();
    expect(screen.getByText('Loading... 45%')).toBeInTheDocument();
  });

  it('handles model with error status', () => {
    const errorModels = [
      {
        id: 'model1',
        name: 'Error Model',
        status: 'error',
        type: 'llama',
      },
    ] as any;

    renderWithTheme(
      <ModelsListCard
        models={errorModels}
        isDark={false}
        onToggleModel={mockOnToggle}
      />
    );

    expect(screen.getByText('ERROR')).toBeInTheDocument();
  });

  it('handles all possible model statuses', () => {
    const allStatusModels = [
      {
        id: 'model1',
        name: 'Running Model',
        status: 'running',
        type: 'llama',
      },
      {
        id: 'model2',
        name: 'Idle Model',
        status: 'idle',
        type: 'llama',
      },
      {
        id: 'model3',
        name: 'Loading Model',
        status: 'loading',
        type: 'mistral',
        progress: 50,
      },
      {
        id: 'model4',
        name: 'Error Model',
        status: 'error',
        type: 'other',
      },
    ] as any;

    renderWithTheme(
      <ModelsListCard
        models={allStatusModels}
        isDark={false}
        onToggleModel={mockOnToggle}
      />
    );

    expect(screen.getByText('RUNNING')).toBeInTheDocument();
    expect(screen.getByText('STOPPED')).toBeInTheDocument();
    expect(screen.getByText('LOADING')).toBeInTheDocument();
    expect(screen.getByText('ERROR')).toBeInTheDocument();
  });

  it('handles special characters in model names', () => {
    const specialCharModels = [
      {
        id: 'model1',
        name: 'Model-α_β 🚀 & test',
        status: 'running',
        type: 'llama',
      },
      {
        id: 'model2',
        name: 'Model with "quotes" and \'apostrophes\'',
        status: 'idle',
        type: 'mistral',
      },
    ] as any;

    renderWithTheme(
      <ModelsListCard
        models={specialCharModels}
        isDark={false}
        onToggleModel={mockOnToggle}
      />
    );

    expect(screen.getByText('Model-α_β 🚀 & test')).toBeInTheDocument();
    expect(screen.getByText('Model with "quotes" and \'apostrophes\'')).toBeInTheDocument();
  });

  it('handles very long model names', () => {
    const longNameModels = [
      {
        id: 'model1',
        name: 'This is a very long model name that might overflow the container if not handled properly by the component styling',
        status: 'running',
        type: 'llama',
      },
    ] as any;

    renderWithTheme(
      <ModelsListCard
        models={longNameModels}
        isDark={false}
        onToggleModel={mockOnToggle}
      />
    );

    expect(screen.getByText('This is a very long model name that might overflow the container if not handled properly by the component styling')).toBeInTheDocument();
  });

  it('handles all different model types', () => {
    const allTypeModels = [
      {
        id: 'model1',
        name: 'Llama Model',
        status: 'running',
        type: 'llama',
      },
      {
        id: 'model2',
        name: 'Mistral Model',
        status: 'idle',
        type: 'mistral',
      },
      {
        id: 'model3',
        name: 'Other Model',
        status: 'idle',
        type: 'other',
      },
    ] as any;

    renderWithTheme(
      <ModelsListCard
        models={allTypeModels}
        isDark={false}
        onToggleModel={mockOnToggle}
      />
    );

    expect(screen.getByText('llama')).toBeInTheDocument();
    expect(screen.getByText('mistral')).toBeInTheDocument();
    expect(screen.getByText('other')).toBeInTheDocument();
  });

  it('handles toggle on running model', async () => {
    const runningModels = [
      {
        id: 'model1',
        name: 'Running Model',
        status: 'running',
        type: 'llama',
      },
    ] as any;

    renderWithTheme(
      <ModelsListCard
        models={runningModels}
        isDark={false}
        onToggleModel={mockOnToggle}
      />
    );

    const stopButton = screen.getByText('Stop');
    fireEvent.click(stopButton);

    // Mock the fetch call
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it('handles theme change', () => {
    const { rerender } = renderWithTheme(
      <ModelsListCard
        models={mockModels}
        isDark={false}
        onToggleModel={mockOnToggle}
      />
    );

    expect(screen.getByText('Available Models')).toBeInTheDocument();

    rerender(
      <ThemeProvider theme={theme}>
        <ModelsListCard
          models={mockModels}
          isDark={true}
          onToggleModel={mockOnToggle}
        />
      </ThemeProvider>
    );

    expect(screen.getByText('Available Models')).toBeInTheDocument();
  });

  it('handles progress values at boundaries', () => {
    const boundaryModels = [
      {
        id: 'model1',
        name: '0% Progress',
        status: 'loading',
        type: 'llama',
        progress: 0,
      },
      {
        id: 'model2',
        name: '100% Progress',
        status: 'loading',
        type: 'mistral',
        progress: 100,
      },
    ] as any;

    renderWithTheme(
      <ModelsListCard
        models={boundaryModels}
        isDark={false}
        onToggleModel={mockOnToggle}
      />
    );

    expect(screen.getByText('Loading... 0%')).toBeInTheDocument();
    expect(screen.getByText('Loading... 100%')).toBeInTheDocument();
  });

  it('handles rapid model toggles', async () => {
    const modelToToggle = {
      id: 'model1',
      name: 'Toggle Test',
      status: 'idle',
      type: 'llama',
    } as any;

    renderWithTheme(
      <ModelsListCard
        models={[modelToToggle]}
        isDark={false}
        onToggleModel={mockOnToggle}
      />
    );

    const startButton = screen.getByText('Start');

    // Click multiple times rapidly
    for (let i = 0; i < 5; i++) {
      fireEvent.click(startButton);
    }

    await new Promise(resolve => setTimeout(resolve, 0));
  });

  it('handles loading state during toggle', async () => {
    const loadingModel = {
      id: 'model1',
      name: 'Loading Toggle Test',
      status: 'loading',
      type: 'llama',
      progress: 50,
    } as any;

    renderWithTheme(
      <ModelsListCard
        models={[loadingModel]}
        isDark={false}
        onToggleModel={mockOnToggle}
      />
    );

    const startStopButton = screen.getByRole('button', { name: /Start/i });

    // Button should be disabled during loading
    expect(startStopButton).toBeDisabled();
  });

  it('handles null onToggleModel', () => {
    renderWithTheme(
      <ModelsListCard
        models={mockModels}
        isDark={false}
        onToggleModel={null as any}
      />
    );

    expect(screen.getByText('Available Models')).toBeInTheDocument();
  });

  it('handles models with same names but different IDs', () => {
    const duplicateNameModels = [
      {
        id: 'model1',
        name: 'Same Name',
        status: 'running',
        type: 'llama',
      },
      {
        id: 'model2',
        name: 'Same Name',
        status: 'idle',
        type: 'mistral',
      },
    ] as any;

    renderWithTheme(
      <ModelsListCard
        models={duplicateNameModels}
        isDark={false}
        onToggleModel={mockOnToggle}
      />
    );

    const allSameNameText = screen.getAllByText('Same Name');
    expect(allSameNameText.length).toBe(2);
  });

  it('handles empty string model name', () => {
    const emptyNameModels = [
      {
        id: 'model1',
        name: '',
        status: 'running',
        type: 'llama',
      },
    ] as any;

    renderWithTheme(
      <ModelsListCard
        models={emptyNameModels}
        isDark={false}
        onToggleModel={mockOnToggle}
      />
    );

    expect(screen.getByText('Available Models')).toBeInTheDocument();
  });

  it('handles loading without progress', () => {
    const noProgressModels = [
      {
        id: 'model1',
        name: 'No Progress Model',
        status: 'loading',
        type: 'llama',
      },
    ] as any;

    renderWithTheme(
      <ModelsListCard
        models={noProgressModels}
        isDark={false}
        onToggleModel={mockOnToggle}
      />
    );

    expect(screen.getByText('LOADING')).toBeInTheDocument();
  });

  it('handles more button rendering', () => {
    renderWithTheme(
      <ModelsListCard
        models={mockModels}
        isDark={false}
        onToggleModel={mockOnToggle}
      />
    );

    const moreButtons = screen.getAllByRole('button').filter(
      btn => !btn.textContent?.includes('Start') && !btn.textContent?.includes('Stop')
    );

    expect(moreButtons.length).toBeGreaterThan(0);
  });
});
