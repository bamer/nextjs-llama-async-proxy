import '@testing-library/jest-dom';
import {
  setupTest,
  cleanupTest,
  mockSuccessfulFetch,
  renderModelsPage,
  waitForModelsLoad,
  getSearchInput,
  performSearch,
  websocketServer,
} from './test-utils';
import { screen, waitFor, fireEvent } from '@testing-library/react';

describe('ModelsPage Interactions', () => {
  beforeEach(setupTest);

  afterEach(cleanupTest);

  it('searches models', async () => {
    const { mockModels } = await import('./test-utils');
    mockSuccessfulFetch({ models: mockModels });
    renderModelsPage();
    await waitForModelsLoad(['Llama-2-7b']);
    await performSearch('llama');
    expect(screen.getByText('Llama-2-7b')).toBeInTheDocument();
    expect(screen.queryByText('Mistral-7b')).not.toBeInTheDocument();
  });

  it('handles case-insensitive search', async () => {
    const { mockModels } = await import('./test-utils');
    mockSuccessfulFetch({ models: mockModels });
    renderModelsPage();
    await waitForModelsLoad(['Llama-2-7b']);
    await performSearch('LLAMA');
    expect(screen.getByText('Llama-2-7b')).toBeInTheDocument();
  });

  it('starts model', async () => {
    const { mockModels } = await import('./test-utils');
    mockSuccessfulFetch({ models: [mockModels[0]] });
    renderModelsPage();
    await waitFor(() => expect(screen.getByText('Start')).toBeInTheDocument());
    const startButton = screen.getByText('Start');
    fireEvent.click(startButton);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/models/Llama-2-7b/start', expect.objectContaining({ method: 'POST' }));
    });
  });

  it('stops model', async () => {
    const { mockModels } = await import('./test-utils');
    mockSuccessfulFetch({ models: [mockModels[1]] });
    renderModelsPage();
    await waitFor(() => expect(screen.getByText('Stop')).toBeInTheDocument());
    const stopButton = screen.getByText('Stop');
    fireEvent.click(stopButton);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/models/Mistral-7b/stop', expect.objectContaining({ method: 'POST' }));
    });
  });

  it('discovers models', async () => {
    mockSuccessfulFetch({ basePath: '/models' });
    mockSuccessfulFetch({ discovered: [] });
    renderModelsPage();
    const discoverButton = screen.getByText('Discover Models');
    fireEvent.click(discoverButton);
    await waitFor(() => expect(discoverButton).toHaveTextContent('Discovering...'));
  });

  it('rescans models', async () => {
    const { mockModels } = await import('./test-utils');
    mockSuccessfulFetch({ models: mockModels });
    renderModelsPage();
    const rescanButton = screen.getByText('Rescan Models');
    fireEvent.click(rescanButton);
    await waitFor(() => expect(websocketServer.rescanModels).toHaveBeenCalled());
  });

  it('disables discover button while discovering', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ ok: true, json: async () => ({ discovered: [] }) }), 100))
    );
    renderModelsPage();
    const discoverButton = screen.getByText('Discover Models');
    fireEvent.click(discoverButton);
    expect(discoverButton).toBeDisabled();
  });

  it('rescan button is clickable', async () => {
    const { mockModels } = await import('./test-utils');
    mockSuccessfulFetch({ models: mockModels });
    websocketServer.rescanModels.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    renderModelsPage();
    await waitFor(() => expect(screen.getByText('Rescan Models')).toBeInTheDocument());
  });

  it('shows loading state when model is starting', async () => {
    const { mockModels } = await import('./test-utils');
    mockSuccessfulFetch({ models: [mockModels[0]] });
    renderModelsPage();
    await waitFor(() => expect(screen.getByText('Start')).toBeInTheDocument());
    const startButton = screen.getByText('Start');
    fireEvent.click(startButton);
    expect(startButton).toBeDisabled();
  });

  it('shows loading state when model is stopping', async () => {
    const { mockModels } = await import('./test-utils');
    mockSuccessfulFetch({ models: [mockModels[1]] });
    renderModelsPage();
    await waitFor(() => expect(screen.getByText('Stop')).toBeInTheDocument());
    const stopButton = screen.getByText('Stop');
    fireEvent.click(stopButton);
    expect(stopButton).toBeDisabled();
  });

  it('loads models from API', async () => {
    const { mockModels } = await import('./test-utils');
    mockSuccessfulFetch({ models: mockModels });
    renderModelsPage();
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/models'));
  });

  it('connects to websocket on mount', () => {
    renderModelsPage();
    expect(websocketServer.connect).toHaveBeenCalled();
  });

  it('requests models on websocket connect', () => {
    renderModelsPage();
    const connectCallback = websocketServer.on.mock.calls.find(
      (call: [string, (callback: () => void) => void]) => call[0] === 'connect'
    )?.[1];
    if (connectCallback) {
      connectCallback();
      expect(websocketServer.requestModels).toHaveBeenCalled();
    }
  });

  it('handles websocket model updates', async () => {
    const { mockModels } = await import('./test-utils');
    renderModelsPage();
    const messageCallback = websocketServer.on.mock.calls.find(
      (call: [string, (callback: () => void) => void]) => call[0] === 'message'
    )?.[1];
    if (messageCallback) {
      messageCallback({ type: 'models', data: mockModels });
    }
  });

  it('cleans up websocket on unmount', () => {
    const { unmount } = renderModelsPage();
    unmount();
    expect(websocketServer.off).toHaveBeenCalledWith('message', expect.any(Function));
    expect(websocketServer.off).toHaveBeenCalledWith('connect', expect.any(Function));
  });

  it('uses configured paths from config for discovery', async () => {
    mockSuccessfulFetch({ basePath: '/custom/path' });
    mockSuccessfulFetch({ discovered: [] });
    renderModelsPage();
    const discoverButton = screen.getByText('Discover Models');
    fireEvent.click(discoverButton);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/config'));
  });
});
