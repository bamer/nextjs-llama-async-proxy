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

describe('MonitoringPage - Data Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('handles empty logs array', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockMetrics });
    render(<MonitoringPage />);
    await waitFor(() => expect(screen.getByText('No logs available...')).toBeInTheDocument());
  });

  it('handles large number of logs', async () => {
    const largeLogs = Array.from({ length: 1000 }, (_, i) => ({
      level: 'info',
      message: `Log message ${i}`,
      timestamp: '2024-01-01T10:00:00Z',
    }));
    const metricsWithLargeLogs = { ...mockMetrics, logs: largeLogs };
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => metricsWithLargeLogs });
    render(<MonitoringPage />);
    await waitFor(() => expect(screen.getByText('Live Logs')).toBeInTheDocument());
  });

  it('handles API returning undefined metrics', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => undefined });
    render(<MonitoringPage />);
    await waitFor(() => expect(screen.getByText('No monitoring data available')).toBeInTheDocument());
  });

  it('handles metrics with null timestamp', async () => {
    const nullTimestampMetrics = { timestamp: null as any, system: mockMetrics.system, models: [] };
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => nullTimestampMetrics });
    render(<MonitoringPage />);
    await waitFor(() => expect(screen.getByText('Real-time Monitoring')).toBeInTheDocument());
  });

  it('handles metrics with invalid data types', async () => {
    const invalidMetrics = {
      timestamp: '2024-01-01T10:00:00Z',
      system: {
        cpu: { usage: 'invalid' as any, cores: '8' as any },
        memory: { used: 'invalid' as any, total: '16' as any, percentage: 'invalid' as any },
        disk: { used: null as any, total: null as any, percentage: null as any },
        network: { rx: null as any, tx: null as any },
        uptime: 'invalid' as any,
      },
      models: [],
    };
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => invalidMetrics });
    render(<MonitoringPage />);
    await waitFor(() => expect(screen.getByText('Real-time Monitoring')).toBeInTheDocument());
  });
});
