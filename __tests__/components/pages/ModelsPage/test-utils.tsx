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

// Re-export the mocked websocketServer for test access
const websocketClient = require('@/lib/websocket-client') as typeof import('@/lib/websocket-client');
export const { websocketServer } = websocketClient;

export const mockModels = [
  {
    id: '1',
    name: 'Llama-2-7b',
    description: 'A 7 billion parameter language model',
    status: 'idle' as const,
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
    status: 'running' as const,
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
    status: 'loading' as const,
    version: '1.0.0',
    path: '/models/gemma-2b',
    type: 'gemma',
    size: 2000000000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

export const setupTest = () => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
  console.log = jest.fn();
  console.error = jest.fn();
};

export const cleanupTest = () => {
  jest.restoreAllMocks();
};

export const mockSuccessfulFetch = (data: unknown) => {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => data,
  });
};

export const renderModelsPage = () => {
  return render(<ModelsPage />);
};

export const waitForModelsLoad = async (modelNames: string[] = ['Llama-2-7b']) => {
  await waitFor(() => {
    modelNames.forEach(name => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });
};

export const getSearchInput = () => {
  return screen.getByPlaceholderText('Search models...');
};

export const performSearch = async (searchTerm: string) => {
  const searchInput = getSearchInput();
  fireEvent.change(searchInput, { target: { value: searchTerm } });
  return searchInput;
};

export type ModelStatus = 'idle' | 'running' | 'loading';

export interface TestModel {
  id: string;
  name: string;
  description?: string;
  status: ModelStatus;
  version?: string;
  path?: string;
  type?: string;
  size?: number;
  createdAt?: string;
  updatedAt?: string;
}
