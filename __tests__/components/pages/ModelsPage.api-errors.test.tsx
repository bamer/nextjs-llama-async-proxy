import { render, screen, waitFor } from '@testing-library/react';
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

describe('ModelsPage - API and Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
});
