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

  // Edge Case Tests
  it('handles null metrics', () => {
    renderWithThemeProvider(
      <DashboardHeader
        isConnected={true}
        metrics={undefined}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('Llama Runner Pro Dashboard')).toBeInTheDocument();
    expect(screen.queryByText(/Uptime:/i)).not.toBeInTheDocument();
  });

  it('handles very large uptime values', () => {
    renderWithThemeProvider(
      <DashboardHeader
        isConnected={true}
        metrics={{
          cpuUsage: 50,
          memoryUsage: 60,
          uptime: 864000, // 10 days
        }}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('Uptime: 10d 0h 0m')).toBeInTheDocument();
  });

  it('handles zero uptime', () => {
    renderWithThemeProvider(
      <DashboardHeader
        isConnected={true}
        metrics={{
          cpuUsage: 50,
          memoryUsage: 60,
          uptime: 0,
        }}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('Uptime: N/A')).toBeInTheDocument();
  });

  it('handles undefined uptime', () => {
    renderWithThemeProvider(
      <DashboardHeader
        isConnected={true}
        metrics={{
          cpuUsage: 50,
          memoryUsage: 60,
        }}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('Uptime: N/A')).toBeInTheDocument();
  });

  it('handles negative uptime gracefully', () => {
    renderWithThemeProvider(
      <DashboardHeader
        isConnected={true}
        metrics={{
          cpuUsage: 50,
          memoryUsage: 60,
          uptime: -3600,
        }}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('Uptime: N/A')).toBeInTheDocument();
  });

  it('calls onRefresh when refresh button is clicked', () => {
    renderWithThemeProvider(
      <DashboardHeader
        isConnected={true}
        metrics={undefined}
        onRefresh={mockOnRefresh}
      />
    );

    const refreshButton = screen.getByLabelText('Refresh Dashboard');
    refreshButton.click();
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it('handles connected to disconnected transition', () => {
    const { rerender } = renderWithThemeProvider(
      <DashboardHeader
        isConnected={true}
        metrics={undefined}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('CONNECTED')).toBeInTheDocument();

    rerender(
      <ThemeProvider>
        <DashboardHeader
          isConnected={false}
          metrics={undefined}
          onRefresh={mockOnRefresh}
        />
      </ThemeProvider>
    );

    expect(screen.getByText('DISCONNECTED')).toBeInTheDocument();
  });

  it('handles extremely large uptime values', () => {
    renderWithThemeProvider(
      <DashboardHeader
        isConnected={true}
        metrics={{
          cpuUsage: 50,
          memoryUsage: 60,
          uptime: 31536000, // 365 days
        }}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('Uptime: 365d 0h 0m')).toBeInTheDocument();
  });

  it('handles partial metrics (only uptime)', () => {
    renderWithThemeProvider(
      <DashboardHeader
        isConnected={true}
        metrics={{
          uptime: 3600,
        }}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('Uptime: 0d 1h 0m')).toBeInTheDocument();
  });

  it('handles empty metrics object', () => {
    renderWithThemeProvider(
      <DashboardHeader
        isConnected={true}
        metrics={{}}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('Llama Runner Pro Dashboard')).toBeInTheDocument();
  });

  it('handles metrics with serverStatus property', () => {
    renderWithThemeProvider(
      <DashboardHeader
        isConnected={true}
        metrics={{
          serverStatus: 'running',
          cpuUsage: 50,
          memoryUsage: 60,
          uptime: 3600,
        }}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('Llama Runner Pro Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Uptime: 0d 1h 0m')).toBeInTheDocument();
  });

  it('handles connection state change with metrics', () => {
    const { rerender } = renderWithThemeProvider(
      <DashboardHeader
        isConnected={true}
        metrics={{
          cpuUsage: 50,
          memoryUsage: 60,
          uptime: 3600,
        }}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('CONNECTED')).toBeInTheDocument();

    rerender(
      <ThemeProvider>
        <DashboardHeader
          isConnected={false}
          metrics={{
            cpuUsage: 50,
            memoryUsage: 60,
            uptime: 3600,
          }}
          onRefresh={mockOnRefresh}
        />
      </ThemeProvider>
    );

    expect(screen.getByText('DISCONNECTED')).toBeInTheDocument();
  });

  it('handles multiple rapid state changes', () => {
    const { rerender } = renderWithThemeProvider(
      <DashboardHeader
        isConnected={true}
        metrics={undefined}
        onRefresh={mockOnRefresh}
      />
    );

    // Simulate rapid state changes
    for (let i = 0; i < 10; i++) {
      const isConnected = i % 2 === 0;
      rerender(
        <ThemeProvider>
          <DashboardHeader
            isConnected={isConnected}
            metrics={undefined}
            onRefresh={mockOnRefresh}
          />
        </ThemeProvider>
      );
    }

    expect(screen.getByText('DISCONNECTED')).toBeInTheDocument();
  });

  it('handles uptime with minutes only', () => {
    renderWithThemeProvider(
      <DashboardHeader
        isConnected={true}
        metrics={{
          cpuUsage: 50,
          memoryUsage: 60,
          uptime: 45, // 45 seconds, should round to 0d 0h 0m
        }}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('Uptime: 0d 0h 0m')).toBeInTheDocument();
  });

  it('handles uptime with hours and minutes', () => {
    renderWithThemeProvider(
      <DashboardHeader
        isConnected={true}
        metrics={{
          cpuUsage: 50,
          memoryUsage: 60,
          uptime: 3661, // 1h 1m 1s
        }}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('Uptime: 0d 1h 1m')).toBeInTheDocument();
  });

  it('handles NaN uptime gracefully', () => {
    renderWithThemeProvider(
      <DashboardHeader
        isConnected={true}
        metrics={{
          cpuUsage: 50,
          memoryUsage: 60,
          uptime: NaN,
        }}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('Uptime: N/A')).toBeInTheDocument();
  });

  it('handles Infinity uptime gracefully', () => {
    renderWithThemeProvider(
      <DashboardHeader
        isConnected={true}
        metrics={{
          cpuUsage: 50,
          memoryUsage: 60,
          uptime: Infinity,
        }}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('Uptime: N/A')).toBeInTheDocument();
  });
});
