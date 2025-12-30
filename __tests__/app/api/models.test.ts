import { GET } from '@/app/api/models/route';

// Mock dependencies
jest.mock('@/server/services/LlamaService', () => ({
  LlamaService: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  getLogger: jest.fn(() => ({
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  })),
}));

describe('/api/models GET', () => {
  const mockLlamaService = {
    getState: jest.fn(),
  };

  const mockLogger = {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the global registry
    (global as any).registry = {
      get: jest.fn(),
    };

    const mockGetLogger = require('@/lib/logger').getLogger;
    mockGetLogger.mockReturnValue(mockLogger);
  });

  afterEach(() => {
    delete (global as any).registry;
  });

  describe('Successful Requests', () => {
    it('returns models when service is available', async () => {
      const mockModels = [
        {
          id: 'model1',
          name: 'Llama 2 7B',
          type: 'llama',
          size: 4000000000,
          modified_at: 1704067200, // 2024-01-01
        },
        {
          id: 'model2',
          name: 'Mistral 7B',
          type: 'mistral',
          size: 3000000000,
          modified_at: 1704153600, // 2024-01-02
        },
      ];

      const mockState = { models: mockModels };
      mockLlamaService.getState.mockReturnValue(mockState);

      (global as any).registry.get.mockReturnValue(mockLlamaService);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.models).toHaveLength(2);
      expect(data.models[0]).toEqual({
        id: 'model1',
        name: 'Llama 2 7B',
        type: 'llama',
        available: true,
        size: 4000000000,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });

      expect(data.models[1]).toEqual({
        id: 'model2',
        name: 'Mistral 7B',
        type: 'mistral',
        available: true,
        size: 3000000000,
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      });
    });

    it('generates IDs from names when missing', async () => {
      const mockModels = [
        {
          name: 'Model Without ID',
          type: 'unknown',
          size: 1000000000,
        },
      ];

      const mockState = { models: mockModels };
      mockLlamaService.getState.mockReturnValue(mockState);

      (global as any).registry.get.mockReturnValue(mockLlamaService);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.models[0].id).toBe('Model Without ID');
      expect(data.models[0].available).toBe(true);
    });

    it('handles empty models array', async () => {
      const mockState = { models: [] };
      mockLlamaService.getState.mockReturnValue(mockState);

      (global as any).registry.get.mockReturnValue(mockLlamaService);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.models).toEqual([]);
    });

    it('uses default type when missing', async () => {
      const mockModels = [
        {
          id: 'model1',
          name: 'Model Without Type',
          size: 1000000000,
        },
      ];

      const mockState = { models: mockModels };
      mockLlamaService.getState.mockReturnValue(mockState);

      (global as any).registry.get.mockReturnValue(mockLlamaService);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.models[0].type).toBe('unknown');
    });
  });

  describe('Service Unavailable', () => {
    it('returns 503 when service is not initialized', async () => {
      (global as any).registry.get.mockReturnValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data).toEqual({
        error: 'Llama service not initialized',
        models: [],
      });
    });

    it('returns 503 when registry is not available', async () => {
      delete (global as any).registry;

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data).toEqual({
        error: 'Llama service not initialized',
        models: [],
      });
    });
  });

  describe('Error Handling', () => {
    it('handles service errors gracefully', async () => {
      const serviceError = new Error('Service internal error');
      mockLlamaService.getState.mockImplementation(() => {
        throw serviceError;
      });

      (global as any).registry.get.mockReturnValue(mockLlamaService);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to fetch models',
        models: [],
      });

      expect(mockLogger.error).toHaveBeenCalledWith('Error fetching models:', serviceError);
    });

    it('handles malformed model data', async () => {
      const mockModels = [
        {
          // Missing required name field
          id: 'bad-model',
          type: 'llama',
        },
      ];

      const mockState = { models: mockModels };
      mockLlamaService.getState.mockReturnValue(mockState);

      (global as any).registry.get.mockReturnValue(mockLlamaService);

      const response = await GET();
      const data = await response.json();

      // Should handle missing name gracefully
      expect(response.status).toBe(200);
      expect(data.models).toHaveLength(1);
    });
  });

  describe('Data Transformation', () => {
    it('converts modified_at timestamp correctly', async () => {
      const mockModels = [
        {
          id: 'model1',
          name: 'Test Model',
          type: 'llama',
          size: 1000000000,
          modified_at: 1640995200, // 2022-01-01 00:00:00 UTC
        },
      ];

      const mockState = { models: mockModels };
      mockLlamaService.getState.mockReturnValue(mockState);

      (global as any).registry.get.mockReturnValue(mockLlamaService);

      const response = await GET();
      const data = await response.json();

      expect(data.models[0].createdAt).toBe('2022-01-01T00:00:00.000Z');
      expect(data.models[0].updatedAt).toBe('2022-01-01T00:00:00.000Z');
    });

    it('uses current timestamp when modified_at is missing', async () => {
      const beforeCall = Date.now();

      const mockModels = [
        {
          id: 'model1',
          name: 'Test Model',
          type: 'llama',
          size: 1000000000,
          // modified_at is missing
        },
      ];

      const mockState = { models: mockModels };
      mockLlamaService.getState.mockReturnValue(mockState);

      (global as any).registry.get.mockReturnValue(mockLlamaService);

      const response = await GET();
      const data = await response.json();

      const afterCall = Date.now();
      const createdAt = new Date(data.models[0].createdAt).getTime();

      expect(createdAt).toBeGreaterThanOrEqual(beforeCall - 1000); // Allow 1s tolerance
      expect(createdAt).toBeLessThanOrEqual(afterCall + 1000);
    });

    it('preserves all model properties', async () => {
      const mockModels = [
        {
          id: 'model1',
          name: 'Test Model',
          type: 'llama',
          size: 1000000000,
          modified_at: 1704067200,
          customProperty: 'custom value',
        },
      ];

      const mockState = { models: mockModels };
      mockLlamaService.getState.mockReturnValue(mockState);

      (global as any).registry.get.mockReturnValue(mockLlamaService);

      const response = await GET();
      const data = await response.json();

      expect(data.models[0]).toEqual({
        id: 'model1',
        name: 'Test Model',
        type: 'llama',
        available: true,
        size: 1000000000,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('handles large model arrays efficiently', async () => {
      const largeModelArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `model-${i}`,
        name: `Model ${i}`,
        type: 'llama',
        size: 1000000000 + i,
        modified_at: 1704067200 + i,
      }));

      const mockState = { models: largeModelArray };
      mockLlamaService.getState.mockReturnValue(mockState);

      (global as any).registry.get.mockReturnValue(mockLlamaService);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.models).toHaveLength(1000);
      expect(data.models[0].id).toBe('model-0');
      expect(data.models[999].id).toBe('model-999');
    });
  });

  describe('Response Format', () => {
    it('returns correct response structure', async () => {
      const mockModels = [
        {
          id: 'model1',
          name: 'Test Model',
          type: 'llama',
          size: 1000000000,
        },
      ];

      const mockState = { models: mockModels };
      mockLlamaService.getState.mockReturnValue(mockState);

      (global as any).registry.get.mockReturnValue(mockLlamaService);

      const response = await GET();
      const data = await response.json();

      expect(data).toHaveProperty('models');
      expect(Array.isArray(data.models)).toBe(true);
      expect(response.headers.get('content-type')).toBe('application/json');
    });
  });
});