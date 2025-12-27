import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('framer-motion', () => ({
  m: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

function renderWithThemeProvider(component: React.ReactElement) {
  return render(<ThemeProvider>{component}</ThemeProvider>);
}

describe('DashboardHeader', () => {
  const mockOnRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    renderWithThemeProvider(
      <DashboardHeader
        isConnected={true}
        metrics={{
          cpuUsage: 50,
          memoryUsage: 60,
          diskUsage: 70,
          activeModels: 2,
        }}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('Llama Runner Pro Dashboard')).toBeInTheDocument();
  });

  it('shows connection status', () => {
    renderWithThemeProvider(
      <DashboardHeader
        isConnected={true}
        metrics={{
          cpuUsage: 50,
          memoryUsage: 60,
          diskUsage: 70,
          activeModels: 2,
        }}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('CONNECTED')).toBeInTheDocument();
  });

  it('displays refresh button', () => {
    renderWithThemeProvider(
      <DashboardHeader
        isConnected={true}
        metrics={{
          cpuUsage: 50,
          memoryUsage: 60,
          diskUsage: 70,
          activeModels: 2,
        }}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByLabelText('Refresh Dashboard')).toBeInTheDocument();
  });

  it('displays metrics when provided', () => {
    renderWithThemeProvider(
      <DashboardHeader
        isConnected={true}
        metrics={{
          cpuUsage: 45,
          memoryUsage: 55,
          diskUsage: 65,
          uptime: 3600,
        }}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText(/Uptime:/i)).toBeInTheDocument();
  });

  it('shows disconnected status when not connected', () => {
    renderWithThemeProvider(
      <DashboardHeader
        isConnected={false}
        metrics={undefined}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('DISCONNECTED')).toBeInTheDocument();
  });

  it('handles undefined metrics', () => {
    renderWithThemeProvider(
      <DashboardHeader
        isConnected={true}
        metrics={undefined}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('Llama Runner Pro Dashboard')).toBeInTheDocument();
  });

  it('displays settings button', () => {
    renderWithThemeProvider(
      <DashboardHeader
        isConnected={true}
        metrics={undefined}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getAllByRole('button').length).toBeGreaterThan(1);
  });
});
