import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import ModelsPage from '@/components/pages/ModelsPage';
import { mockModels } from './ModelsPage.test-helpers';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { websocketServer } = require('@/lib/websocket-client') as {
  websocketServer: {
    connect: jest.Mock;
    on: jest.Mock;
    off: jest.Mock;
    requestModels: jest.Mock;
    rescanModels: jest.Mock;
  };
};

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/lib/websocket-client', () => ({
  websocketServer: {
    connect: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    requestModels: jest.fn(),
    rescanModels: jest.fn(),
  },
}));

describe('ModelsPage - WebSocket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('connects to websocket on mount', () => {
    render(<ModelsPage />);

    expect(websocketServer.connect).toHaveBeenCalled();
  });

  it('requests models on websocket connect', () => {
    render(<ModelsPage />);

    const connectCallback = websocketServer.on.mock.calls.find(
      (call: [string, (data?: unknown) => void]) => call[0] === 'connect'
    )?.[1];

    if (connectCallback) {
      connectCallback();
      expect(websocketServer.requestModels).toHaveBeenCalled();
    }
  });

  it('handles websocket model updates', () => {
    render(<ModelsPage />);

    const messageCallback = websocketServer.on.mock.calls.find(
      (call: [string, (data?: unknown) => void]) => call[0] === 'message'
    )?.[1];

    if (messageCallback) {
      messageCallback({ type: 'models', data: mockModels });
    }
  });

  it('cleans up websocket on unmount', () => {
    const { unmount } = render(<ModelsPage />);

    unmount();

    expect(websocketServer.off).toHaveBeenCalledWith('message', expect.any(Function));
    expect(websocketServer.off).toHaveBeenCalledWith('connect', expect.any(Function));
  });

  it('handles WebSocket connection errors', () => {
    websocketServer.connect.mockImplementation(() => {
      throw new Error('WebSocket connection failed');
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: mockModels }),
    });

    render(<ModelsPage />);

    expect(screen.getByText('Models')).toBeInTheDocument();
  });

  it('handles malformed WebSocket messages', () => {
    render(<ModelsPage />);

    const messageCallback = websocketServer.on.mock.calls.find(
      (call: [string, (data?: unknown) => void]) => call[0] === 'message'
    )?.[1];

    if (messageCallback) {
      messageCallback(null);
      messageCallback(undefined);
      messageCallback({});
      messageCallback({ type: 'invalid' });
    }

    expect(screen.getByText('Models')).toBeInTheDocument();
  });
});
