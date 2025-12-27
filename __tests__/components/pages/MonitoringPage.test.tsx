import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import MonitoringPage from '@/components/pages/MonitoringPage';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/hooks/use-websocket', () => ({
  useWebSocket: () => ({
    isConnected: true,
  }),
}));

const mockMetrics = {
  timestamp: '2024-01-01T10:00:00Z',
  system: {
    cpu: {
      usage: 45.5,
      cores: 8,
    },
    memory: {
      used: 8.2,
      total: 16,
      percentage: 51.25,
    },
    disk: {
      used: 120.5,
      total: 500,
      percentage: 24.1,
    },
    network: {
      rx: 5000000,
      tx: 2000000,
    },
    uptime: 3600,
  },
  models: [
    {
      id: '1',
      name: 'Llama-2-7b',
      status: 'running',
      memory: 4.5,
      requests: 100,
      uptime: 1800,
    },
    {
      id: '2',
      name: 'Mistral-7b',
      status: 'idle',
      memory: 0,
      requests: 0,
      uptime: 0,
    },
  ],
};

describe('MonitoringPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('renders correctly with loading state', () => {
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(() => {})
    );
    
    render(<MonitoringPage />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders correctly with metrics', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockMetrics,
    });
    
    render(<MonitoringPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Real‑time Monitoring')).toBeInTheDocument();
    });
  });

  it('displays system metrics card', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockMetrics,
    });
    
    render(<MonitoringPage />);
    
    await waitFor(() => {
      expect(screen.getByText('System Metrics')).toBeInTheDocument();
    });
  });

  it('displays model performance card', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockMetrics,
    });
    
    render(<MonitoringPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Model Performance')).toBeInTheDocument();
    });
  });

  it('displays connection status card', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockMetrics,
    });
    
    render(<MonitoringPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Connection Status')).toBeInTheDocument();
    });
  });

  it('displays live logs card', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockMetrics,
    });
    
    render(<MonitoringPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Live Logs')).toBeInTheDocument();
    });
  });

  it('displays CPU usage', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockMetrics,
    });
    
    render(<MonitoringPage />);
    
    await waitFor(() => {
      expect(screen.getByText('CPU Usage')).toBeInTheDocument();
      expect(screen.getByText('45.5%')).toBeInTheDocument();
    });
  });

  it('displays memory usage', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockMetrics,
    });
    
    render(<MonitoringPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Memory Used')).toBeInTheDocument();
      expect(screen.getByText('8.2 GB')).toBeInTheDocument();
    });
  });

  it('displays disk usage', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockMetrics,
    });
    
    render(<MonitoringPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Disk Usage')).toBeInTheDocument();
      expect(screen.getByText('120.5 GB')).toBeInTheDocument();
    });
  });

  it('displays network RX', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockMetrics,
    });
    
    render(<MonitoringPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Network RX')).toBeInTheDocument();
      expect(screen.getByText('5.00 MB')).toBeInTheDocument();
    });
  });

  it('displays network TX', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockMetrics,
    });
    
    render(<MonitoringPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Network TX')).toBeInTheDocument();
      expect(screen.getByText('2.00 MB')).toBeInTheDocument();
    });
  });

  it('displays uptime', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockMetrics,
    });
    
    render(<MonitoringPage />);
    
    await waitFor(() => {
      const uptimeElements = screen.getAllByText('1h 0m');
      expect(uptimeElements.length).toBeGreaterThan(0);
    });
  });

  it('displays available models count', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockMetrics,
    });
    
    render(<MonitoringPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Available Models')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('displays total memory used by models', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockMetrics,
    });
    
    render(<MonitoringPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Total Memory')).toBeInTheDocument();
      expect(screen.getByText('4.5 GB')).toBeInTheDocument();
    });
  });

  it('displays total requests', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockMetrics,
    });
    
    render(<MonitoringPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Total Requests')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  it('displays connection status as connected', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockMetrics,
    });
    
    render(<MonitoringPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });

  it('displays last update time', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockMetrics,
    });
    
    render(<MonitoringPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Last update:/i)).toBeInTheDocument();
    });
  });

  it('displays no logs message when logs are empty', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockMetrics,
    });
    
    render(<MonitoringPage />);
    
    await waitFor(() => {
      expect(screen.getByText('No logs available...')).toBeInTheDocument();
    });
  });

  it('shows loading spinner while fetching', () => {
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(() => {})
    );
    
    render(<MonitoringPage />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error state on fetch failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    render(<MonitoringPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('shows no data message when metrics is null', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => null,
    });
    
    render(<MonitoringPage />);
    
    await waitFor(() => {
      expect(screen.getByText('No monitoring data available')).toBeInTheDocument();
    });
  });

  it('fetches monitoring data on mount', () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockMetrics,
    });
    
    render(<MonitoringPage />);
    
    expect(global.fetch).toHaveBeenCalledWith('/api/monitoring/latest');
  });

  it('refreshes monitoring data every 30 seconds', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockMetrics,
    });
    
    render(<MonitoringPage />);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    
    jest.advanceTimersByTime(30000);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('handles HTTP error responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });
    
    render(<MonitoringPage />);
    
    await waitFor(() => {
      expect(screen.getByText('HTTP 500: Internal Server Error')).toBeInTheDocument();
    });
  });

  it('handles invalid JSON responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });
    
    render(<MonitoringPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Error/i)).toBeInTheDocument();
    });
  });

  it('clears interval on unmount', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockMetrics,
    });
    
    const { unmount } = render(<MonitoringPage />);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    
    unmount();
    
    jest.advanceTimersByTime(30000);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  it('calculates uptime in hours and minutes correctly', async () => {
    const metricsWithLongUptime = {
      ...mockMetrics,
      system: {
        ...mockMetrics.system,
        uptime: 7265,
      },
    };
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => metricsWithLongUptime,
    });
    
    render(<MonitoringPage />);
    
    await waitFor(() => {
      expect(screen.getByText('2h 1m')).toBeInTheDocument();
    });
  });

  it('displays connection status as disconnected', async () => {
    const { useWebSocket } = require('@/hooks/use-websocket');
    useWebSocket.mockReturnValue({
      isConnected: false,
    });
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockMetrics,
    });
    
    const { rerender } = render(<MonitoringPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });
  });
});
