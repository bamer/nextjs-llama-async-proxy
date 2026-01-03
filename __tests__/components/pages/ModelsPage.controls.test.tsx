import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import ModelsPage from '@/components/pages/ModelsPage';
import { mockModels } from './ModelsPage.test-helpers';

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

describe('ModelsPage - Model Controls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts model', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: [mockModels[0]] }),
    });

    render(<ModelsPage />);

    await waitFor(() => {
      expect(screen.getByText('Start')).toBeInTheDocument();
    });

    const startButton = screen.getByText('Start');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/models/Llama-2-7b/start', expect.objectContaining({
        method: 'POST',
      }));
    });
  });

  it('stops model', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: [mockModels[1]] }),
    });

    render(<ModelsPage />);

    await waitFor(() => {
      expect(screen.getByText('Stop')).toBeInTheDocument();
    });

    const stopButton = screen.getByText('Stop');
    fireEvent.click(stopButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/models/Mistral-7b/stop', expect.objectContaining({
        method: 'POST',
      }));
    });
  });

  it('shows loading state when model is starting', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: [mockModels[0]] }),
    });

    render(<ModelsPage />);

    await waitFor(() => {
      expect(screen.getByText('Start')).toBeInTheDocument();
    });

    const startButton = screen.getByText('Start');
    fireEvent.click(startButton);

    expect(startButton).toBeDisabled();
  });

  it('shows loading state when model is stopping', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: [mockModels[1]] }),
    });

    render(<ModelsPage />);

    await waitFor(() => {
      expect(screen.getByText('Stop')).toBeInTheDocument();
    });

    const stopButton = screen.getByText('Stop');
    fireEvent.click(stopButton);

    expect(stopButton).toBeDisabled();
  });

  it('handles start model error', async () => {
    console.error = jest.fn();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [mockModels[0]] }),
      })
      .mockRejectedValueOnce(new Error('Start failed'));

    render(<ModelsPage />);

    await waitFor(() => {
      expect(screen.getByText('Start')).toBeInTheDocument();
    });

    const startButton = screen.getByText('Start');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to start model:', expect.any(Error));
    });
  });

  it('handles stop model error', async () => {
    console.error = jest.fn();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [mockModels[1]] }),
      })
      .mockRejectedValueOnce(new Error('Stop failed'));

    render(<ModelsPage />);

    await waitFor(() => {
      expect(screen.getByText('Stop')).toBeInTheDocument();
    });

    const stopButton = screen.getByText('Stop');
    fireEvent.click(stopButton);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to stop model:', expect.any(Error));
    });
  });

  it('handles concurrent start/stop requests', async () => {
    const mockModel = {
      id: '4',
      name: 'ConcurrentModel',
      description: 'Concurrent model',
      status: 'idle' as const,
      version: '1.0.0',
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: [mockModel] }),
    });

    render(<ModelsPage />);

    await waitFor(() => {
      expect(screen.getByText('Start')).toBeInTheDocument();
    });

    const startButton = screen.getByText('Start');
    fireEvent.click(startButton);
    fireEvent.click(startButton);

    expect(startButton).toBeDisabled();
  });

  it('displays loading state when model status is loading', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: [mockModels[2]] }),
    });

    render(<ModelsPage />);

    await waitFor(() => {
      expect(screen.getByText('loading')).toBeInTheDocument();
    });
  });
});
