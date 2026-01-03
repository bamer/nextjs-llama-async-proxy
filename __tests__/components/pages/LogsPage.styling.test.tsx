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

describe('LogsPage - Styling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState.logs = [...mockLogs];
  });

  it('shows correct styling for error logs', () => {
    render(<LogsPage />);

    const errorEntry = screen
      .getByText('Connection failed')
      .closest('.bg-red-50, .dark\\:bg-red-950');
    expect(errorEntry).toBeInTheDocument();
  });

  it('shows correct styling for warning logs', () => {
    render(<LogsPage />);

    const warnEntry = screen
      .getByText('Memory usage high')
      .closest('.bg-yellow-50, .dark\\:bg-yellow-950');
    expect(warnEntry).toBeInTheDocument();
  });

  it('shows correct styling for info logs', () => {
    render(<LogsPage />);

    const infoEntry = screen
      .getByText('Application started')
      .closest('.bg-blue-50, .dark\\:bg-blue-950');
    expect(infoEntry).toBeInTheDocument();
  });

  it('shows correct styling for debug logs', () => {
    render(<LogsPage />);

    const debugEntry = screen
      .getByText('Debug information')
      .closest('.bg-gray-50, .dark\\:bg-gray-800');
    expect(debugEntry).toBeInTheDocument();
  });
});
