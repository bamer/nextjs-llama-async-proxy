import '@testing-library/jest-dom';
import {
  setupTest,
  cleanupTest,
  mockSuccessfulFetch,
  renderModelsPage,
  waitForModelsLoad,
  getSearchInput,
} from './test-utils';
import { screen, waitFor } from '@testing-library/react';

describe('ModelsPage Rendering', () => {
  beforeEach(setupTest);

  afterEach(cleanupTest);

  it('renders correctly', () => {
    mockSuccessfulFetch({ models: [] });
    renderModelsPage();
    expect(screen.getByText('Models')).toBeInTheDocument();
  });

  it('displays models', async () => {
    const { mockModels } = await import('./test-utils');
    mockSuccessfulFetch({ models: mockModels });
    renderModelsPage();
    await waitForModelsLoad(['Llama-2-7b']);
  });

  it('displays search input', () => {
    mockSuccessfulFetch({ models: [] });
    renderModelsPage();
    expect(getSearchInput()).toBeInTheDocument();
  });

  it('displays discover models button', () => {
    mockSuccessfulFetch({ models: [] });
    renderModelsPage();
    expect(screen.getByText('Discover Models')).toBeInTheDocument();
  });

  it('displays rescan models button', () => {
    mockSuccessfulFetch({ models: [] });
    renderModelsPage();
    expect(screen.getByText('Rescan Models')).toBeInTheDocument();
  });

  it('displays model descriptions', async () => {
    const { mockModels } = await import('./test-utils');
    mockSuccessfulFetch({ models: mockModels });
    renderModelsPage();
    await waitFor(() => {
      expect(screen.getByText('A 7 billion parameter language model')).toBeInTheDocument();
    });
  });

  it('displays model versions', async () => {
    const { mockModels } = await import('./test-utils');
    mockSuccessfulFetch({ models: mockModels });
    renderModelsPage();
    await waitFor(() => {
      expect(screen.getAllByText('Version: 1.0.0').length).toBeGreaterThan(0);
    });
  });

  it('displays model status badges', async () => {
    const { mockModels } = await import('./test-utils');
    mockSuccessfulFetch({ models: mockModels });
    renderModelsPage();
    await waitFor(() => {
      expect(screen.getByText('idle')).toBeInTheDocument();
      expect(screen.getByText('running')).toBeInTheDocument();
      expect(screen.getByText('loading')).toBeInTheDocument();
    });
  });

  it('displays start button for idle models', async () => {
    const { mockModels } = await import('./test-utils');
    mockSuccessfulFetch({ models: [mockModels[0]] });
    renderModelsPage();
    await waitFor(() => {
      expect(screen.getByText('Start')).toBeInTheDocument();
    });
  });

  it('displays stop button for running models', async () => {
    const { mockModels } = await import('./test-utils');
    mockSuccessfulFetch({ models: [mockModels[1]] });
    renderModelsPage();
    await waitFor(() => {
      expect(screen.getByText('Stop')).toBeInTheDocument();
    });
  });

  it('displays details button', async () => {
    const { mockModels } = await import('./test-utils');
    mockSuccessfulFetch({ models: mockModels });
    renderModelsPage();
    await waitFor(() => {
      const detailsButtons = screen.getAllByText('Details');
      expect(detailsButtons.length).toBeGreaterThan(0);
    });
  });

  it('displays empty state when no models', async () => {
    mockSuccessfulFetch({ models: [] });
    renderModelsPage();
    await waitFor(() => {
      expect(screen.queryByText('Llama-2-7b')).not.toBeInTheDocument();
    });
  });

  it('displays loading state when model status is loading', async () => {
    const { mockModels } = await import('./test-utils');
    mockSuccessfulFetch({ models: [mockModels[2]] });
    renderModelsPage();
    await waitFor(() => {
      expect(screen.getByText('loading')).toBeInTheDocument();
    });
  });
});
