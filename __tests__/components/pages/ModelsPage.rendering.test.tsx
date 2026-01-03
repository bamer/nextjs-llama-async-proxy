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

describe('ModelsPage - Rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
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
});
