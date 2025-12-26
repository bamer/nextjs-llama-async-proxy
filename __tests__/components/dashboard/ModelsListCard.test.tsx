import { describe, it, expect, vi } from '@jest/globals';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { ModelsListCard } from '@/components/dashboard/ModelsListCard';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';

const mockTheme = createTheme();

function renderWithTheme(component: React.ReactElement) {
  return render(<ThemeProvider theme={mockTheme}>{component}</ThemeProvider>);
}

describe('ModelsListCard', () => {
  const mockModels = [
    {
      id: 'model1',
      name: 'Llama 2 7B',
      status: 'running',
      description: '7B parameter model',
      size: '13GB',
    },
    {
      id: 'model2',
      name: 'Llama 2 13B',
      status: 'idle',
      description: '13B parameter model',
      size: '26GB',
    },
  ] as any;

  const mockOnToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with models', () => {
    renderWithTheme(
      <ModelsListCard
        models={mockModels}
        isDark={false}
        onToggleModel={mockOnToggle}
      />
    );

    expect(document.querySelector('h6')?.textContent).toContain('Models');
  });

  it('displays all models', () => {
    renderWithTheme(
      <ModelsListCard
        models={mockModels}
        isDark={false}
        onToggleModel={mockOnToggle}
      />
    );

    expect(document.textContent).toContain('Llama 2 7B');
    expect(document.textContent).toContain('Llama 2 13B');
  });

  it('calls onToggleModel when toggle button clicked', () => {
    renderWithTheme(
      <ModelsListCard
        models={mockModels}
        isDark={false}
        onToggleModel={mockOnToggle}
      />
    );

    const buttons = document.querySelectorAll('button');
    fireEvent.click(buttons[0]);

    expect(mockOnToggle).toHaveBeenCalledWith('model1');
  });

  it('shows correct status for each model', () => {
    renderWithTheme(
      <ModelsListCard
        models={mockModels}
        isDark={false}
        onToggleModel={mockOnToggle}
      />
    );

    expect(document.textContent).toContain('running');
    expect(document.textContent).toContain('idle');
  });

  it('renders empty state when no models', () => {
    renderWithTheme(
      <ModelsListCard
        models={[]}
        isDark={false}
        onToggleModel={mockOnToggle}
      />
    );

    expect(document.textContent).toContain('No models available');
  });
});
