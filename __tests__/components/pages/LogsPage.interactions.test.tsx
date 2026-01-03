import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import LogsPage from '@/components/pages/LogsPage';
import { mockLogs, mockState, mockClearLogs } from './LogsPage.test.helper';

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

describe('LogsPage - Interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState.logs = [...mockLogs];
  });

  it('handles rapid filter changes', () => {
    render(<LogsPage />);

    const filterInput = screen.getByPlaceholderText('Filter logs...');

    for (let i = 0; i < 20; i++) {
      fireEvent.change(filterInput, { target: { value: `search${i}` } });
    }

    expect(filterInput).toHaveValue('search19');
  });

  it('handles rapid level changes', () => {
    render(<LogsPage />);

    const levelSelect = screen.getByRole('combobox');

    fireEvent.change(levelSelect, { target: { value: 'error' } });
    fireEvent.change(levelSelect, { target: { value: 'warn' } });
    fireEvent.change(levelSelect, { target: { value: 'info' } });
    fireEvent.change(levelSelect, { target: { value: 'debug' } });
    fireEvent.change(levelSelect, { target: { value: 'all' } });

    expect(levelSelect).toHaveValue('all');
  });

  it('handles rapid max lines changes', () => {
    render(<LogsPage />);

    const button50 = screen.getByText('50');
    const button100 = screen.getByText('100');
    const button200 = screen.getByText('200');

    for (let i = 0; i < 10; i++) {
      fireEvent.click(button50);
      fireEvent.click(button100);
      fireEvent.click(button200);
    }

    expect(button200).toHaveClass('bg-primary');
  });

  it('handles clearing logs multiple times', () => {
    render(<LogsPage />);

    const clearButton = screen.getByText('Clear Logs');

    for (let i = 0; i < 5; i++) {
      fireEvent.click(clearButton);
    }

    expect(mockClearLogs).toHaveBeenCalledTimes(5);
  });

  it('handles setting max lines to current number of logs', () => {
    const exactLogs = Array.from({ length: 100 }, (_, i) => ({
      level: 'info' as const,
      message: `Log ${i}`,
      timestamp: '2024-01-01T10:00:00Z',
      source: 'application',
    }));
    mockState.logs = exactLogs;

    render(<LogsPage />);

    const button100 = screen.getByText('100');
    fireEvent.click(button100);

    expect(screen.getAllByText(/Log \d+/).length).toBe(100);
  });
});
