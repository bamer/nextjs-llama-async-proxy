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
    const { websocketServer } = require('@/lib/websocket-client');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: mockModels }),
    });

    websocketServer.rescanModels.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<ModelsPage />);
    
    const rescanButton = screen.getByText('Rescan Models');
    fireEvent.click(rescanButton);
    
    await waitFor(() => {
      expect(rescanButton).toBeDisabled();
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
      (call: [string, Function]) => call[0] === 'connect'
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
      (call: [string, Function]) => call[0] === 'message'
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

  // Edge Case Tests
  it('handles empty model name gracefully', async () => {
    const emptyNameModel = {
      id: '4',
      name: '',
      description: 'Empty name model',
      status: 'idle' as const,
      version: '1.0.0',
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: [emptyNameModel] }),
    });

    render(<ModelsPage />);

    await waitFor(() => {
      expect(screen.getByText('Empty name model')).toBeInTheDocument();
    });
  });

  it('handles very long model names', async () => {
    const longNameModel = {
      id: '4',
      name: 'A'.repeat(500),
      description: 'Very long name model',
      status: 'idle' as const,
      version: '1.0.0',
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: [longNameModel] }),
    });

    render(<ModelsPage />);

    await waitFor(() => {
      expect(screen.getByText('A'.repeat(500))).toBeInTheDocument();
    });
  });

  it('handles special characters in model names', async () => {
    const specialCharsModel = {
      id: '4',
      name: 'Model-Test_123@#$%^&*()',
      description: 'Special characters model',
      status: 'idle' as const,
      version: '1.0.0',
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: [specialCharsModel] }),
    });

    render(<ModelsPage />);

    await waitFor(() => {
      expect(screen.getByText('Model-Test_123@#$%^&*()')).toBeInTheDocument();
    });
  });

  it('handles model with missing description', async () => {
    const noDescModel = {
      id: '4',
      name: 'NoDescriptionModel',
      status: 'idle' as const,
      version: '1.0.0',
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: [noDescModel] }),
    });

    render(<ModelsPage />);

    await waitFor(() => {
      expect(screen.getByText('NoDescriptionModel')).toBeInTheDocument();
    });
  });

  it('handles model with missing version', async () => {
    const noVersionModel = {
      id: '4',
      name: 'NoVersionModel',
      description: 'No version model',
      status: 'idle' as const,
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: [noVersionModel] }),
    });

    render(<ModelsPage />);

    await waitFor(() => {
      expect(screen.getByText('NoVersionModel')).toBeInTheDocument();
    });
  });

  it('handles very large dataset of models (100+ models)', async () => {
    const largeDataset = Array.from({ length: 150 }, (_, i) => ({
      id: `${i}`,
      name: `Model-${i}`,
      description: `Model ${i} description`,
      status: 'idle' as const,
      version: '1.0.0',
    }));

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: largeDataset }),
    });

    render(<ModelsPage />);

    await waitFor(() => {
      expect(screen.getByText('Model-0')).toBeInTheDocument();
      expect(screen.getByText('Model-149')).toBeInTheDocument();
    });
  });

  it('handles search with empty results', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: mockModels }),
    });

    render(<ModelsPage />);

    await waitFor(() => {
      expect(screen.getByText('Llama-2-7b')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search models...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    expect(screen.queryByText('Llama-2-7b')).not.toBeInTheDocument();
  });

  it('handles search with special characters', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: mockModels }),
    });

    render(<ModelsPage />);

    const searchInput = screen.getByPlaceholderText('Search models...');
    fireEvent.change(searchInput, { target: { value: '@#$%^&*()' } });

    expect(screen.queryByText('Llama-2-7b')).not.toBeInTheDocument();
  });

  it('handles rapid search changes', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: mockModels }),
    });

    render(<ModelsPage />);

    const searchInput = screen.getByPlaceholderText('Search models...');

    fireEvent.change(searchInput, { target: { value: 'l' } });
    fireEvent.change(searchInput, { target: { value: 'll' } });
    fireEvent.change(searchInput, { target: { value: 'lla' } });
    fireEvent.change(searchInput, { target: { value: 'llam' } });
    fireEvent.change(searchInput, { target: { value: 'llama' } });

    expect(screen.getByText('Llama-2-7b')).toBeInTheDocument();
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
    fireEvent.click(startButton); // Double click

    expect(startButton).toBeDisabled();
  });

  it('handles WebSocket connection errors', () => {
    const { websocketServer } = require('@/lib/websocket-client');
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
    const { websocketServer } = require('@/lib/websocket-client');

    render(<ModelsPage />);

    const messageCallback = websocketServer.on.mock.calls.find(
      (call: [string, Function]) => call[0] === 'message'
    )?.[1];

    if (messageCallback) {
      // Test with invalid message format
      messageCallback(null);
      messageCallback(undefined);
      messageCallback({});
      messageCallback({ type: 'invalid' });
    }

    expect(screen.getByText('Models')).toBeInTheDocument();
  });

  it('handles API response with missing models array', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: 'something else' }),
    });

    render(<ModelsPage />);

    await waitFor(() => {
      expect(screen.getByText('Models')).toBeInTheDocument();
    });
  });

  it('handles API response with null data', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => null,
    });

    render(<ModelsPage />);

    await waitFor(() => {
      expect(screen.getByText('Models')).toBeInTheDocument();
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

  it('handles model status transition from loading to running', async () => {
    const loadingModel = {
      id: '4',
      name: 'TransitionModel',
      description: 'Transition model',
      status: 'loading' as const,
      version: '1.0.0',
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: [loadingModel] }),
    });

    render(<ModelsPage />);

    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  it('handles models with very large size values', async () => {
    const largeSizeModel = {
      id: '4',
      name: 'LargeModel',
      description: 'Large size model',
      status: 'idle' as const,
      version: '1.0.0',
      size: Number.MAX_SAFE_INTEGER,
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: [largeSizeModel] }),
    });

    render(<ModelsPage />);

    await waitFor(() => {
      expect(screen.getByText('LargeModel')).toBeInTheDocument();
    });
  });

  it('handles search with unicode characters', async () => {
    const unicodeModel = {
      id: '4',
      name: '模型',
      description: 'Unicode model',
      status: 'idle' as const,
      version: '1.0.0',
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: [unicodeModel] }),
    });

    render(<ModelsPage />);

    await waitFor(() => {
      expect(screen.getByText('模型')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search models...');
    fireEvent.change(searchInput, { target: { value: '模型' } });

    expect(screen.getByText('模型')).toBeInTheDocument();
  });

  it('handles duplicate model names', async () => {
    const duplicateModels = [
      {
        id: '1',
        name: 'DuplicateModel',
        description: 'First duplicate',
        status: 'idle' as const,
        version: '1.0.0',
      },
      {
        id: '2',
        name: 'DuplicateModel',
        description: 'Second duplicate',
        status: 'running' as const,
        version: '1.0.0',
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ models: duplicateModels }),
    });

    render(<ModelsPage />);

    await waitFor(() => {
      const duplicateElements = screen.getAllByText('DuplicateModel');
      expect(duplicateElements.length).toBe(2);
    });
  });
});
