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

describe('MonitoringPage - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('handles metrics with zero values', async () => {
    const zeroMetrics = {
      ...mockMetrics,
      system: {
        cpu: { usage: 0, cores: 8 },
        memory: { used: 0, total: 16, percentage: 0 },
        disk: { used: 0, total: 500, percentage: 0 },
        network: { rx: 0, tx: 0 },
        uptime: 0,
      },
      models: [{ id: '1', name: 'ZeroModel', status: 'idle', memory: 0, requests: 0, uptime: 0 }],
    };
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => zeroMetrics });
    render(<MonitoringPage />);
    await waitFor(() => {
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('0 GB')).toBeInTheDocument();
    });
  });

  it('handles metrics with extreme values', async () => {
    const extremeMetrics = {
      ...mockMetrics,
      system: {
        cpu: { usage: 100, cores: 128 },
        memory: { used: 999.9, total: 1024, percentage: 97.6 },
        disk: { used: 9999.9, total: 10000, percentage: 99.9 },
        network: { rx: 9999999999, tx: 9999999999 },
        uptime: 999999999,
      },
      models: [],
    };
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => extremeMetrics });
    render(<MonitoringPage />);
    await waitFor(() => {
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('999.9 GB')).toBeInTheDocument();
    });
  });

  it('handles metrics with very large uptime', async () => {
    const longUptimeMetrics = {
      ...mockMetrics,
      system: { ...mockMetrics.system, uptime: 86400 * 365 },
    };
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => longUptimeMetrics });
    render(<MonitoringPage />);
    await waitFor(() => expect(screen.getByText(/\d+h \d+m/)).toBeInTheDocument(), { timeout: 5000 });
  });

  it('handles metrics with negative values (edge case)', async () => {
    const negativeMetrics = {
      ...mockMetrics,
      system: {
        cpu: { usage: -1, cores: 8 },
        memory: { used: -1, total: 16, percentage: -1 },
        disk: { used: -1, total: 500, percentage: -1 },
        network: { rx: -1, tx: -1 },
        uptime: -1,
      },
      models: [],
    };
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => negativeMetrics });
    render(<MonitoringPage />);
    await waitFor(() => expect(screen.getByText('System Metrics')).toBeInTheDocument());
  });

  it('handles missing system metrics', async () => {
    const noSystemMetrics = { timestamp: '2024-01-01T10:00:00Z', system: null as any, models: [] };
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => noSystemMetrics });
    render(<MonitoringPage />);
    await waitFor(() => expect(screen.getByText('Real-time Monitoring')).toBeInTheDocument());
  });

  it('handles missing models array', async () => {
    const noModelsMetrics = { timestamp: '2024-01-01T10:00:00Z', system: mockMetrics.system, models: null as any };
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => noModelsMetrics });
    render(<MonitoringPage />);
    await waitFor(() => expect(screen.getByText('Model Performance')).toBeInTheDocument());
  });

  it('handles network RX/TX values in bytes', async () => {
    const byteMetrics = { ...mockMetrics, system: { ...mockMetrics.system, network: { rx: 1000, tx: 500 } } };
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => byteMetrics });
    render(<MonitoringPage />);
    await waitFor(() => expect(screen.getByText('0.00 MB')).toBeInTheDocument());
  });

  it('handles metrics with fractional CPU cores', async () => {
    const fractionalCoresMetrics = {
      ...mockMetrics,
      system: { ...mockMetrics.system, cpu: { usage: 50.5, cores: 4.5 } },
    };
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => fractionalCoresMetrics });
    render(<MonitoringPage />);
    await waitFor(() => expect(screen.getByText('50.5%')).toBeInTheDocument());
  });

  it('handles WebSocket errors', async () => {
    const { useWebSocket } = require('@/hooks/use-websocket');
    useWebSocket.mockImplementation(() => { throw new Error('WebSocket error'); });
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockMetrics });
    render(<MonitoringPage />);
    await waitFor(() => expect(screen.getByText('Real-time Monitoring')).toBeInTheDocument());
  });
});
