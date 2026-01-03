import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import ModelsPage from '@/components/pages/ModelsPage';

export const mockModels = [
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

export const setupMocks = () => {
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
};

export const mockFetchWithModels = (models = mockModels) => {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({ models }),
  });
};

export const renderModelsPage = () => {
  return render(<ModelsPage />);
};

export const getSearchInput = () => {
  return screen.getByPlaceholderText('Search models...');
};

export const waitForModelDisplay = async (modelName: string) => {
  return waitFor(() => {
    expect(screen.getByText(modelName)).toBeInTheDocument();
  });
};

export const expectConsoleError = async (
  callback: () => void,
  errorMessage: string
) => {
  console.error = jest.fn();
  callback();
  await waitFor(() => {
    expect(console.error).toHaveBeenCalledWith(errorMessage, expect.any(Error));
  });
};
