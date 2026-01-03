import { render, screen, waitFor } from '@testing-library/react';
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

describe('ModelsPage - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

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

});
