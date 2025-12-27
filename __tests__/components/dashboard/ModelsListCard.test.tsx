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
});
