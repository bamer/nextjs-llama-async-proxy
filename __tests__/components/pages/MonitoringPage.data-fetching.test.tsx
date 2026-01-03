import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { beforeEach, afterEach, describe, it, expect } from '@jest/globals';
import MonitoringPage from '@/components/pages/MonitoringPage';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/hooks/use-websocket', () => ({
  useWebSocket: () => ({ isConnected: true }),
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

describe('MonitoringPage - Data Fetching', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('fetches monitoring data on mount', () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockMetrics });
    render(<MonitoringPage />);
    expect(global.fetch).toHaveBeenCalledWith('/api/monitoring/latest');
  });

  it('refreshes monitoring data every 30 seconds', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockMetrics });
    render(<MonitoringPage />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    jest.advanceTimersByTime(30000);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
  });

  it('shows error state on fetch failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    render(<MonitoringPage />);
    await waitFor(() => expect(screen.getByText('Network error')).toBeInTheDocument());
  });

  it('shows no data message when metrics is null', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => null });
    render(<MonitoringPage />);
    await waitFor(() => expect(screen.getByText('No monitoring data available')).toBeInTheDocument());
  });

  it('handles HTTP error responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' });
    render(<MonitoringPage />);
    await waitFor(() => expect(screen.getByText('HTTP 500: Internal Server Error')).toBeInTheDocument());
  });

  it('handles invalid JSON responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => { throw new Error('Invalid JSON'); } });
    render(<MonitoringPage />);
    await waitFor(() => expect(screen.getByText(/Error/i)).toBeInTheDocument());
  });

  it('clears interval on unmount', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockMetrics });
    const { unmount } = render(<MonitoringPage />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    unmount();
    jest.advanceTimersByTime(30000);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  });
});
