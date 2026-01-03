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

describe('LogsPage - Message Formatting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState.logs = [...mockLogs];
  });

  it('handles logs with special characters', () => {
    const specialCharLogs = [
      {
        level: 'info' as const,
        message: 'Special: @#$%^&*()_+-={}[]|\\:;"\'<>,.?/~`',
        timestamp: '2024-01-01T10:00:00Z',
        source: 'application',
      },
    ];
    mockState.logs = specialCharLogs;

    render(<LogsPage />);

    expect(screen.getByText(/Special: @/)).toBeInTheDocument();
  });

  it('handles logs with unicode characters', () => {
    const unicodeLogs = [
      {
        level: 'info' as const,
        message: 'Unicode: 你好世界 🌍 مرحبا 😊',
        timestamp: '2024-01-01T10:00:00Z',
        source: 'application',
      },
    ];
    mockState.logs = unicodeLogs;

    render(<LogsPage />);

    expect(screen.getByText(/Unicode: 你好世界/)).toBeInTheDocument();
  });

  it('handles logs with HTML in message', () => {
    const htmlLogs = [
      {
        level: 'info' as const,
        message: 'HTML: <script>alert("xss")</script>',
        timestamp: '2024-01-01T10:00:00Z',
        source: 'application',
      },
    ];
    mockState.logs = htmlLogs;

    render(<LogsPage />);

    expect(screen.getByText(/HTML: <script>/)).toBeInTheDocument();
  });

  it('handles logs with newlines in message', () => {
    const newlineLogs = [
      {
        level: 'info' as const,
        message: 'Line 1\nLine 2\nLine 3',
        timestamp: '2024-01-01T10:00:00Z',
        source: 'application',
      },
    ];
    mockState.logs = newlineLogs;

    render(<LogsPage />);

    expect(screen.getByText(/Line 1/)).toBeInTheDocument();
  });

  it('handles logs with tabs in message', () => {
    const tabLogs = [
      {
        level: 'info' as const,
        message: 'Column1\tColumn2\tColumn3',
        timestamp: '2024-01-01T10:00:00Z',
        source: 'application',
      },
    ];
    mockState.logs = tabLogs;

    render(<LogsPage />);

    expect(screen.getByText(/Column1/)).toBeInTheDocument();
  });

  it('handles logs with emoji in message', () => {
    const emojiLogs = [
      {
        level: 'info' as const,
        message: 'Log with emoji 🚀✨🎉🔥💡',
        timestamp: '2024-01-01T10:00:00Z',
        source: 'application',
      },
    ];
    mockState.logs = emojiLogs;

    render(<LogsPage />);

    expect(screen.getByText(/Log with emoji/)).toBeInTheDocument();
  });
});
