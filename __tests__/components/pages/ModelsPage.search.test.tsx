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

describe('ModelsPage - Search Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search models...');
      expect(searchInput).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search models...');
    fireEvent.change(searchInput, { target: { value: 'l' } });
    fireEvent.change(searchInput, { target: { value: 'll' } });
    fireEvent.change(searchInput, { target: { value: 'lla' } });
    fireEvent.change(searchInput, { target: { value: 'llam' } });
    fireEvent.change(searchInput, { target: { value: 'llama' } });

    await waitFor(() => {
      expect(screen.getByText('Llama-2-7b')).toBeInTheDocument();
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
});
