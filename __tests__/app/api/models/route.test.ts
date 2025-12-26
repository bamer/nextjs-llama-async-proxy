import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/models/route';

jest.mock('@/server/ServiceRegistry', () => ({
  registry: {
    get: jest.fn(),
  },
}));

const mockRegistry = jest.requireMock('@/server/ServiceRegistry').registry;

const mockModels = [
  { id: 'model1', name: 'Model 1', size: 10737418240 },
  { id: 'model2', name: 'Model 2', size: 53687091200 },
];

const mockLlamaService = {
  getState: jest.fn().mockReturnValue({
    status: 'ready',
    models: mockModels,
  }),
};

describe('Models API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRegistry.get.mockReturnValue(mockLlamaService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET', () => {
    it('should return list of models', async () => {
      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toEqual({ models: mockModels });
    });

    it('should return 500 when llama service not found', async () => {
      mockRegistry.get.mockReturnValue(null);

      const response = await GET();

      expect(response.status).toBe(500);
      const data = await response.json();

      expect(data).toEqual({ error: 'LlamaService not found' });
    });

    it('should handle service without getState method', async () => {
      const invalidService = {};

      mockRegistry.get.mockReturnValue(invalidService);

      const response = await GET();

      expect(response.status).toBe(500);
      const data = await response.json();

      expect(data).toHaveProperty('error');
    });

    it('should return 500 on service error', async () => {
      mockRegistry.get.mockImplementation(() => {
        throw new Error('Service error');
      });

      const response = await GET();

      expect(response.status).toBe(500);
      const data = await response.json();

      expect(data).toEqual({ error: 'Failed to fetch models' });
    });
  });

  describe('POST', () => {
    it('should load model successfully', async () => {
      const requestBody = { modelId: 'model1' };
      const request = new NextRequest('http://localhost/api/models', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toEqual({ success: true, message: 'Model loaded' });
    });

    it('should return 400 when modelId not provided', async () => {
      const requestBody = {};
      const request = new NextRequest('http://localhost/api/models', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();

      expect(data).toEqual({ error: 'modelId is required' });
    });

    it('should return 404 when model not found', async () => {
      const requestBody = { modelId: 'nonexistent' };
      const request = new NextRequest('http://localhost/api/models', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const models = [
        { id: 'model1', name: 'Model 1', size: 10737418240 },
        { id: 'model2', name: 'Model 2', size: 53687091200 },
      ];

      const mockServiceWithModels = {
        ...mockLlamaService,
        getState: jest.fn().mockReturnValue({
          status: 'ready',
          models,
        }),
      };

      mockRegistry.get.mockReturnValue(mockServiceWithModels);

      const response = await POST(request);

      expect(response.status).toBe(404);
      const data = await response.json();

      expect(data).toEqual({ error: 'Model not found' });
    });

    it('should return 500 when llama service not found', async () => {
      mockRegistry.get.mockReturnValue(null);

      const requestBody = { modelId: 'model1' };
      const request = new NextRequest('http://localhost/api/models', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();

      expect(data).toEqual({ error: 'LlamaService not found' });
    });
  });

  describe('error handling', () => {
    it('should handle invalid JSON body', async () => {
      const request = new NextRequest('http://localhost/api/models', {
        method: 'POST',
        body: 'invalid json{{{',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('response format', () => {
    it('should return JSON content type', async () => {
      const response = await GET();

      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should include timestamp in responses', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data).toHaveProperty('timestamp');
      expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });
});
