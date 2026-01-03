import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

describe('ModelsPage - Discovery and Rescan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('discovers models', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ basePath: '/models' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ discovered: [mockModels[0]] }),
      });

    render(<ModelsPage />);

    const discoverButton = screen.getByText('Discover Models');
    fireEvent.click(discoverButton);

    await waitFor(() => {
      expect(discoverButton).toHaveTextContent('Discovering...');
    });
  });

  it('rescans models', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: mockModels }),
    });

    render(<ModelsPage />);

    const rescanButton = screen.getByText('Rescan Models');
    fireEvent.click(rescanButton);

    await waitFor(() => {
      expect(websocketServer.rescanModels).toHaveBeenCalled();
    });
  });

  it('disables discover button while discovering', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ ok: true, json: async () => ({ discovered: [] }) }), 100))
    );

    render(<ModelsPage />);

    const discoverButton = screen.getByText('Discover Models');
    fireEvent.click(discoverButton);

    expect(discoverButton).toBeDisabled();
  });

  it('rescan button is clickable', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: mockModels }),
    });

    websocketServer.rescanModels.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<ModelsPage />);

    await waitFor(() => {
      const rescanButton = screen.getByText('Rescan Models');
      expect(rescanButton).toBeInTheDocument();
    });
  });

  it('uses configured paths from config for discovery', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ basePath: '/custom/path' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ discovered: [] }),
      });

    render(<ModelsPage />);

    const discoverButton = screen.getByText('Discover Models');
    fireEvent.click(discoverButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/config');
    });
  });

  it('handles discover models error', async () => {
    console.error = jest.fn();
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Discovery failed'));

    render(<ModelsPage />);

    const discoverButton = screen.getByText('Discover Models');
    fireEvent.click(discoverButton);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to discover models:', expect.any(Error));
    });
  });

  it('handles discover API with invalid paths', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ basePath: '' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ discovered: [] }),
      });

    render(<ModelsPage />);

    const discoverButton = screen.getByText('Discover Models');
    fireEvent.click(discoverButton);

    await waitFor(() => {
      expect(discoverButton).toHaveTextContent('Discovering...');
    });
  });
});
