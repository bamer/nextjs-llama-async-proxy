import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import ModelsPage from '@/components/pages/ModelsPage';

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

const mockModels = [
  {
    id: '1',
    name: 'Llama-2-7b',
    description: 'A 7 billion parameter language model',
    status: 'idle',
    version: '1.0.0',
    path: '/models/llama-2-7b',
    type: 'llama',
    size: 7000000000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Mistral-7b',
    description: 'A 7 billion parameter mistral model',
    status: 'running',
    version: '1.0.0',
    path: '/models/mistral-7b',
    type: 'mistral',
    size: 7000000000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Gemma-2b',
    description: 'A 2 billion parameter model',
    status: 'loading',
    version: '1.0.0',
    path: '/models/gemma-2b',
    type: 'gemma',
    size: 2000000000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

describe('ModelsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders correctly', () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: mockModels }),
    });
    
    render(<ModelsPage />);
    
    expect(screen.getByText('Models')).toBeInTheDocument();
  });

  it('displays models', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: mockModels }),
    });
    
    render(<ModelsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Llama-2-7b')).toBeInTheDocument();
    });
  });

  it('displays search input', () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: mockModels }),
    });
    
    render(<ModelsPage />);
    
    expect(screen.getByPlaceholderText('Search models...')).toBeInTheDocument();
  });

  it('displays discover models button', () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: mockModels }),
    });
    
    render(<ModelsPage />);
    
    expect(screen.getByText('Discover Models')).toBeInTheDocument();
  });

  it('displays rescan models button', () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: mockModels }),
    });
    
    render(<ModelsPage />);
    
    expect(screen.getByText('Rescan Models')).toBeInTheDocument();
  });

  it('searches models', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: mockModels }),
    });
    
    render(<ModelsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Llama-2-7b')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText('Search models...');
    fireEvent.change(searchInput, { target: { value: 'llama' } });
    
    expect(screen.getByText('Llama-2-7b')).toBeInTheDocument();
    expect(screen.queryByText('Mistral-7b')).not.toBeInTheDocument();
  });

  it('handles case-insensitive search', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: mockModels }),
    });
    
    render(<ModelsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Llama-2-7b')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText('Search models...');
    fireEvent.change(searchInput, { target: { value: 'LLAMA' } });
    
    expect(screen.getByText('Llama-2-7b')).toBeInTheDocument();
  });

  it('displays model descriptions', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: mockModels }),
    });
    
    render(<ModelsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('A 7 billion parameter language model')).toBeInTheDocument();
    });
  });

  it('displays model versions', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: mockModels }),
    });

    render(<ModelsPage />);

    await waitFor(() => {
      // Check that at least one version is displayed
      expect(screen.getAllByText('Version: 1.0.0').length).toBeGreaterThan(0);
    });
  });

  it('displays model status badges', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: mockModels }),
    });
    
    render(<ModelsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('idle')).toBeInTheDocument();
      expect(screen.getByText('running')).toBeInTheDocument();
      expect(screen.getByText('loading')).toBeInTheDocument();
    });
  });

  it('displays start button for idle models', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: [mockModels[0]] }),
    });
    
    render(<ModelsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Start')).toBeInTheDocument();
    });
  });

  it('displays stop button for running models', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: [mockModels[1]] }),
    });
    
    render(<ModelsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Stop')).toBeInTheDocument();
    });
  });

  it('displays details button', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: mockModels }),
    });
    
    render(<ModelsPage />);
    
    await waitFor(() => {
      const detailsButtons = screen.getAllByText('Details');
      expect(detailsButtons.length).toBeGreaterThan(0);
    });
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
    const { websocketServer } = require('@/lib/websocket-client');
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

  it('disables rescan button while rescanning', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: mockModels }),
    });
    
    render(<ModelsPage />);
    
    const rescanButton = screen.getByText('Rescan Models');
    fireEvent.click(rescanButton);
    
    expect(rescanButton).toBeDisabled();
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

  it('loads models from API', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: mockModels }),
    });
    
    render(<ModelsPage />);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/models');
    });
  });

  it('handles load models error', async () => {
    console.error = jest.fn();
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    render(<ModelsPage />);
    
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to load models:', expect.any(Error));
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

  it('updates model status to running after start', async () => {
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
      expect(screen.getByText('running')).toBeInTheDocument();
    });
  });

  it('updates model status to idle after stop', async () => {
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
      expect(screen.getByText('idle')).toBeInTheDocument();
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

  it('displays empty state when no models', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: [] }),
    });
    
    render(<ModelsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Llama-2-7b')).not.toBeInTheDocument();
    });
  });

  it('connects to websocket on mount', () => {
    const { websocketServer } = require('@/lib/websocket-client');
    
    render(<ModelsPage />);
    
    expect(websocketServer.connect).toHaveBeenCalled();
  });

  it('requests models on websocket connect', () => {
    const { websocketServer } = require('@/lib/websocket-client');
    
    render(<ModelsPage />);
    
    const connectCallback = websocketServer.on.mock.calls.find(
      call => call[0] === 'connect'
    )?.[1];
    
    if (connectCallback) {
      connectCallback();
      expect(websocketServer.requestModels).toHaveBeenCalled();
    }
  });

  it('handles websocket model updates', () => {
    const { websocketServer } = require('@/lib/websocket-client');
    
    render(<ModelsPage />);
    
    const messageCallback = websocketServer.on.mock.calls.find(
      call => call[0] === 'message'
    )?.[1];
    
    if (messageCallback) {
      messageCallback({ type: 'models', data: mockModels });
    }
  });

  it('cleans up websocket on unmount', () => {
    const { websocketServer } = require('@/lib/websocket-client');
    const { unmount } = render(<ModelsPage />);
    
    unmount();
    
    expect(websocketServer.off).toHaveBeenCalledWith('message', expect.any(Function));
    expect(websocketServer.off).toHaveBeenCalledWith('connect', expect.any(Function));
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
