import '@testing-library/jest-dom';
import React from 'react';
import {
  setupTest,
  cleanupTest,
  mockSuccessfulFetch,
  renderModelsPage,
  waitForModelsLoad,
  performSearch,
  websocketServer,
} from './test-utils';
import { screen, waitFor, fireEvent } from '@testing-library/react';

describe('ModelsPage Error Handling', () => {
  beforeEach(setupTest);

  afterEach(cleanupTest);

  it('handles load models error', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    renderModelsPage();
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to load models:', expect.any(Error));
    });
  });

  it('handles discover models error', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Discovery failed'));
    renderModelsPage();
    const discoverButton = screen.getByText('Discover Models');
    fireEvent.click(discoverButton);
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to discover models:', expect.any(Error));
    });
  });

  it('handles start model error', async () => {
    const { mockModels } = await import('./test-utils');
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ models: [mockModels[0]] }) })
      .mockRejectedValueOnce(new Error('Start failed'));
    renderModelsPage();
    await waitFor(() => expect(screen.getByText('Start')).toBeInTheDocument());
    const startButton = screen.getByText('Start');
    fireEvent.click(startButton);
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to start model:', expect.any(Error));
    });
  });

  it('handles stop model error', async () => {
    const { mockModels } = await import('./test-utils');
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ models: [mockModels[1]] }) })
      .mockRejectedValueOnce(new Error('Stop failed'));
    renderModelsPage();
    await waitFor(() => expect(screen.getByText('Stop')).toBeInTheDocument());
    const stopButton = screen.getByText('Stop');
    fireEvent.click(stopButton);
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to stop model:', expect.any(Error));
    });
  });

  it('handles empty model name gracefully', async () => {
    const emptyNameModel = { id: '4', name: '', description: 'Empty name model', status: 'idle' as const, version: '1.0.0' };
    mockSuccessfulFetch({ models: [emptyNameModel] });
    renderModelsPage();
    await waitFor(() => expect(screen.getByText('Empty name model')).toBeInTheDocument());
  });

  it('handles very long model names', async () => {
    const longNameModel = { id: '4', name: 'A'.repeat(500), description: 'Very long name model', status: 'idle' as const, version: '1.0.0' };
    mockSuccessfulFetch({ models: [longNameModel] });
    renderModelsPage();
    await waitFor(() => expect(screen.getByText('A'.repeat(500))).toBeInTheDocument());
  });

  it('handles special characters in model names', async () => {
    const specialCharsModel = { id: '4', name: 'Model-Test_123@#$%^&*()', description: 'Special characters model', status: 'idle' as const, version: '1.0.0' };
    mockSuccessfulFetch({ models: [specialCharsModel] });
    renderModelsPage();
    await waitFor(() => expect(screen.getByText('Model-Test_123@#$%^&*()')).toBeInTheDocument());
  });

  it('handles model with missing description', async () => {
    const noDescModel = { id: '4', name: 'NoDescriptionModel', status: 'idle' as const, version: '1.0.0' };
    mockSuccessfulFetch({ models: [noDescModel] });
    renderModelsPage();
    await waitFor(() => expect(screen.getByText('NoDescriptionModel')).toBeInTheDocument());
  });

  it('handles WebSocket connection errors', () => {
    websocketServer.connect.mockImplementation(() => { throw new Error('WebSocket connection failed'); });
    mockSuccessfulFetch({ models: [] });
    renderModelsPage();
    expect(screen.getByText('Models')).toBeInTheDocument();
  });

  it('handles malformed WebSocket messages', () => {
    renderModelsPage();
    const messageCallback = websocketServer.on.mock.calls.find(
      (call: [string, (callback: () => void) => void]) => call[0] === 'message'
    )?.[1];
    if (messageCallback) {
      messageCallback(null);
      messageCallback(undefined);
      messageCallback({});
      messageCallback({ type: 'invalid' });
    }
    expect(screen.getByText('Models')).toBeInTheDocument();
  });

  it('handles API response with missing models array', async () => {
    mockSuccessfulFetch({ data: 'something else' });
    renderModelsPage();
    await waitFor(() => {
      expect(screen.getByText('Models')).toBeInTheDocument();
    });
  });

  it('handles API response with null data', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => null });
    renderModelsPage();
    await waitFor(() => {
      expect(screen.getByText('Models')).toBeInTheDocument();
    });
  });

  it('handles search with unicode characters', async () => {
    const unicodeModel = { id: '4', name: '模型', description: 'Unicode model', status: 'idle' as const, version: '1.0.0' };
    mockSuccessfulFetch({ models: [unicodeModel] });
    renderModelsPage();
    await waitFor(() => expect(screen.getByText('模型')).toBeInTheDocument());
    await performSearch('模型');
    expect(screen.getByText('模型')).toBeInTheDocument();
  });

  it('handles search with empty results', async () => {
    const { mockModels } = await import('./test-utils');
    mockSuccessfulFetch({ models: mockModels });
    renderModelsPage();
    await waitForModelsLoad(['Llama-2-7b']);
    await performSearch('nonexistent');
    expect(screen.queryByText('Llama-2-7b')).not.toBeInTheDocument();
  });
});
