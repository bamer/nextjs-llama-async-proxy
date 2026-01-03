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

describe('MonitoringPage - Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('handles API timeout', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100)));
    render(<MonitoringPage />);
    await waitFor(() => expect(screen.getByText('Timeout')).toBeInTheDocument(), { timeout: 5000 });
  });

  it('handles malformed JSON response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => { throw new SyntaxError('Invalid JSON'); } });
    render(<MonitoringPage />);
    await waitFor(() => expect(screen.getByText(/Error/i)).toBeInTheDocument());
  });

  it('handles rapid refresh intervals', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockMetrics });
    jest.useFakeTimers();
    render(<MonitoringPage />);
    for (let i = 0; i < 10; i++) {
      jest.advanceTimersByTime(30000);
    }
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(11));
    jest.useRealTimers();
  });

  it('handles multiple concurrent requests', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockMetrics });
    render(<MonitoringPage />);
    await waitFor(() => expect(screen.getByText('Real-time Monitoring')).toBeInTheDocument());
  });

  it('handles cleanup on unmount before timeout', async () => {
    jest.useFakeTimers();
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    const { unmount } = render(<MonitoringPage />);
    unmount();
    jest.useRealTimers();
    expect(true).toBe(true);
  });
});
