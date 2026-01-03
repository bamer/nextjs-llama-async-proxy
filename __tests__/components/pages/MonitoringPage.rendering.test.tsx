import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { beforeEach, afterEach, describe, it, expect } from '@jest/globals';
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
    cpu: { usage: 45.5, cores: 8 },
    memory: { used: 8.2, total: 16, percentage: 51.25 },
    disk: { used: 120.5, total: 500, percentage: 24.1 },
    network: { rx: 5000000, tx: 2000000 },
    uptime: 3600,
  },
  models: [
    { id: '1', name: 'Llama-2-7b', status: 'running', memory: 4.5, requests: 100, uptime: 1800 },
    { id: '2', name: 'Mistral-7b', status: 'idle', memory: 0, requests: 0, uptime: 0 },
  ],
};

describe('MonitoringPage - Rendering', () => {
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
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<MonitoringPage />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders correctly with metrics', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockMetrics });
    render(<MonitoringPage />);
    await waitFor(() => expect(screen.getByText('Real‑time Monitoring')).toBeInTheDocument());
  });

  it('displays system metrics card', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockMetrics });
    render(<MonitoringPage />);
    await waitFor(() => expect(screen.getByText('System Metrics')).toBeInTheDocument());
  });

  it('displays model performance card', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockMetrics });
    render(<MonitoringPage />);
    await waitFor(() => expect(screen.getByText('Model Performance')).toBeInTheDocument());
  });

  it('displays connection status card', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockMetrics });
    render(<MonitoringPage />);
    await waitFor(() => expect(screen.getByText('Connection Status')).toBeInTheDocument());
  });

  it('displays live logs card', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockMetrics });
    render(<MonitoringPage />);
    await waitFor(() => expect(screen.getByText('Live Logs')).toBeInTheDocument());
  });

  it('shows loading spinner while fetching', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<MonitoringPage />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows no data message when metrics is null', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => null });
    render(<MonitoringPage />);
    await waitFor(() => expect(screen.getByText('No monitoring data available')).toBeInTheDocument());
  });

  it('displays no logs message when logs are empty', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockMetrics });
    render(<MonitoringPage />);
    await waitFor(() => expect(screen.getByText('No logs available...')).toBeInTheDocument());
  });

  it('displays connection status as connected', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockMetrics });
    render(<MonitoringPage />);
    await waitFor(() => expect(screen.getByText('Connected')).toBeInTheDocument());
  });

  it('displays last update time', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockMetrics });
    render(<MonitoringPage />);
    await waitFor(() => expect(screen.getByText(/Last update:/i)).toBeInTheDocument());
  });

  it('displays connection status as disconnected', async () => {
    const { useWebSocket } = require('@/hooks/use-websocket');
    useWebSocket.mockReturnValue({ isConnected: false });
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockMetrics });
    render(<MonitoringPage />);
    await waitFor(() => expect(screen.getByText('Disconnected')).toBeInTheDocument());
  });
});
