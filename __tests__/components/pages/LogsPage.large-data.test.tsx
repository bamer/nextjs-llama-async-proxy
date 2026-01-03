import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import LogsPage from '@/components/pages/LogsPage';
import { mockLogs, mockState } from './LogsPage.test.helper';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/hooks/use-websocket', () => ({
  useWebSocket: () => ({
    requestLogs: jest.fn(),
    isConnected: true,
  }),
}));

jest.mock('@/lib/store');

describe('LogsPage - Large Data Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState.logs = [...mockLogs];
  });

  it('handles very large number of logs (1000+)', () => {
    const manyLogs = Array.from({ length: 1500 }, (_, i) => ({
      level: ['info', 'warn', 'error', 'debug'][i % 4] as
        | 'info'
        | 'warn'
        | 'error'
        | 'debug',
      message: `Log message ${i}`.repeat(10),
      timestamp: '2024-01-01T10:00:00Z',
      source: `source-${i % 10}`,
    }));
    mockState.logs = manyLogs;

    render(<LogsPage />);

    const logEntries = screen.getAllByText(/Log message/);
    expect(logEntries.length).toBeLessThanOrEqual(50);
  });

  it('handles logs with extremely long messages', () => {
    const longMessageLogs = [
      {
        level: 'info' as const,
        message: 'A'.repeat(10000),
        timestamp: '2024-01-01T10:00:00Z',
        source: 'application',
      },
    ];
    mockState.logs = longMessageLogs;

    render(<LogsPage />);

    expect(screen.getByText('A'.repeat(10000))).toBeInTheDocument();
  });

  it('handles logs with invalid timestamps', () => {
    const invalidTimestampLogs = [
      {
        level: 'info' as const,
        message: 'Invalid timestamp log',
        timestamp: 'invalid-date',
        source: 'application',
      },
    ];
    mockState.logs = invalidTimestampLogs;

    render(<LogsPage />);

    expect(screen.getByText('Invalid timestamp log')).toBeInTheDocument();
  });

  it('handles logs with missing source', () => {
    const noSourceLogs = [
      {
        level: 'info' as const,
        message: 'No source log',
        timestamp: '2024-01-01T10:00:00Z',
      },
    ];
    mockState.logs = noSourceLogs;

    render(<LogsPage />);

    expect(screen.getByText('No source log')).toBeInTheDocument();
    expect(screen.getByText('application')).toBeInTheDocument();
  });

  it('handles logs with null values in message', () => {
    const nullMessageLogs = [
      {
        level: 'info' as const,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        message: null as any,
        timestamp: '2024-01-01T10:00:00Z',
        source: 'application',
      },
    ];
    mockState.logs = nullMessageLogs;

    render(<LogsPage />);

    expect(screen.getByText('null')).toBeInTheDocument();
  });

  it('handles logs with undefined level', () => {
     const undefinedLevelLogs = [
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        level: undefined as any,
        message: 'Undefined level log',
        timestamp: '2024-01-01T10:00:00Z',
        source: 'application',
      },
    ];
    mockState.logs = undefinedLevelLogs;

    render(<LogsPage />);

    expect(screen.getByText('Undefined level log')).toBeInTheDocument();
  });

  it('handles very short log messages', () => {
    const shortMessageLogs = [
      {
        level: 'info' as const,
        message: 'X',
        timestamp: '2024-01-01T10:00:00Z',
        source: 'application',
      },
    ];
    mockState.logs = shortMessageLogs;

    render(<LogsPage />);

    expect(screen.getByText('X')).toBeInTheDocument();
  });

  it('handles logs with very long source names', () => {
    const longSourceLogs = [
      {
        level: 'info' as const,
        message: 'Long source log',
        timestamp: '2024-01-01T10:00:00Z',
        source: 'A'.repeat(500),
      },
    ];
    mockState.logs = longSourceLogs;

    render(<LogsPage />);

    expect(screen.getByText('Long source log')).toBeInTheDocument();
  });
});
