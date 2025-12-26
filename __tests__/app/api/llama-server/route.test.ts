import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/llama-server/route';

jest.mock('@/server/ServiceRegistry', () => ({
  registry: {
    get: jest.fn(),
  },
}));

jest.mock('child_process');
const { exec } = require('child_process');

const mockRegistry = jest.requireMock('@/server/ServiceRegistry').registry;
const mockExec = jest.mocked(exec);

describe('Llama Server API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /status', () => {
    it('should return server status', async () => {
      const mockService = {
        getState: jest.fn().mockReturnValue({
          status: 'ready',
          uptime: 3600,
        }),
      };

      mockRegistry.get.mockReturnValue(mockService);

      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toEqual({
        status: 'ready',
        uptime: 3600,
      });
    });

    it('should return 503 when service not found', async () => {
      mockRegistry.get.mockReturnValue(null);

      const response = await GET();

      expect(response.status).toBe(503);
      const data = await response.json();

      expect(data).toEqual({
        error: 'LlamaServer service not found',
      });
    });

    it('should return 500 on service error', async () => {
      const mockService = {
        getState: jest.fn().mockImplementation(() => {
          throw new Error('Service error');
        }),
      };

      mockRegistry.get.mockReturnValue(mockService);

      const response = await GET();

      expect(response.status).toBe(500);
      const data = await response.json();

      expect(data).toEqual({
        error: 'Failed to get server status',
      });
    });
  });

  describe('POST /start', () => {
    it('should start llama server successfully', async () => {
      const mockService = {
        start: jest.fn().mockResolvedValue(undefined),
      };

      mockRegistry.get.mockReturnValue(mockService);

      const request = new NextRequest('http://localhost/api/llama-server/start', {
        method: 'POST',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockService.start).toHaveBeenCalled();
    });

    it('should return 503 when service not found', async () => {
      mockRegistry.get.mockReturnValue(null);

      const request = new NextRequest('http://localhost/api/llama-server/start', {
        method: 'POST',
      });

      const response = await POST(request);

      expect(response.status).toBe(503);
      const data = await response.json();

      expect(data).toEqual({
        error: 'LlamaServer service not found',
      });
    });

    it('should return 500 on service error', async () => {
      const mockService = {
        start: jest.fn().mockRejectedValue(new Error('Start failed')),
      };

      mockRegistry.get.mockReturnValue(mockService);

      const request = new NextRequest('http://localhost/api/llama-server/start', {
        method: 'POST',
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();

      expect(data).toEqual({
        error: 'Failed to start server',
      });
    });
  });

  describe('POST /stop', () => {
    it('should stop llama server successfully', async () => {
      const mockService = {
        stop: jest.fn().mockResolvedValue(undefined),
      };

      mockRegistry.get.mockReturnValue(mockService);

      const request = new NextRequest('http://localhost/api/llama-server/stop', {
        method: 'POST',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockService.stop).toHaveBeenCalled();
    });

    it('should return 503 when service not found', async () => {
      mockRegistry.get.mockReturnValue(null);

      const request = new NextRequest('http://localhost/api/llama-server/stop', {
        method: 'POST',
      });

      const response = await POST(request);

      expect(response.status).toBe(503);
    });
  });

  describe('POST /restart', () => {
    it('should restart llama server successfully', async () => {
      const mockService = {
        stop: jest.fn().mockResolvedValue(undefined),
        start: jest.fn().mockResolvedValue(undefined),
      };

      mockRegistry.get.mockReturnValue(mockService);

      const request = new NextRequest('http://localhost/api/llama-server/restart', {
        method: 'POST',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockService.stop).toHaveBeenCalled();
      expect(mockService.start).toHaveBeenCalled();
    });

    it('should stop before starting on restart', async () => {
      const mockService = {
        stop: jest.fn().mockResolvedValue(undefined),
        start: jest.fn().mockResolvedValue(undefined),
      };

      mockRegistry.get.mockReturnValue(mockService);

      const request = new NextRequest('http://localhost/api/llama-server/restart', {
        method: 'POST',
      });

      await POST(request);

      expect(mockService.stop).toHaveBeenCalled();
      expect(mockService.start).toHaveBeenCalled();
    });
  });

  describe('POST /load-model', () => {
    it('should load model successfully', async () => {
      const requestBody = { modelId: 'model1' };
      const mockService = {
        loadModel: jest.fn().mockResolvedValue(undefined),
      };

      mockRegistry.get.mockReturnValue(mockService);

      const request = new NextRequest('http://localhost/api/llama-server/load-model', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockService.loadModel).toHaveBeenCalledWith('model1');
    });

    it('should return 400 when modelId not provided', async () => {
      const requestBody = {};
      const request = new NextRequest('http://localhost/api/llama-server/load-model', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();

      expect(data).toEqual({
        error: 'modelId is required',
      });
    });

    it('should return 404 when model not found', async () => {
      const requestBody = { modelId: 'nonexistent' };
      const mockService = {
        loadModel: jest.fn().mockRejectedValue(new Error('Model not found')),
      };

      mockRegistry.get.mockReturnValue(mockService);

      const request = new NextRequest('http://localhost/api/llama-server/load-model', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(404);
      const data = await response.json();

      expect(data).toEqual({
        error: 'Model not found',
      });
    });
  });

  describe('POST /unload-model', () => {
    it('should unload model successfully', async () => {
      const requestBody = { modelId: 'model1' };
      const mockService = {
        unloadModel: jest.fn().mockResolvedValue(undefined),
      };

      mockRegistry.get.mockReturnValue(mockService);

      const request = new NextRequest('http://localhost/api/llama-server/unload-model', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockService.unloadModel).toHaveBeenCalledWith('model1');
    });

    it('should return 400 when modelId not provided', async () => {
      const requestBody = {};
      const request = new NextRequest('http://localhost/api/llama-server/unload-model', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should return 404 when model not loaded', async () => {
      const requestBody = { modelId: 'nonexistent' };
      const mockService = {
        unloadModel: jest.fn().mockRejectedValue(new Error('Model not loaded')),
      };

      mockRegistry.get.mockReturnValue(mockService);

      const request = new NextRequest('http://localhost/api/llama-server/unload-model', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(404);
    });
  });

  describe('integration', () => {
    it('should handle start → status → stop flow', async () => {
      const mockService = {
        start: jest.fn().mockResolvedValue(undefined),
        getState: jest.fn().mockReturnValue({ status: 'ready' }),
        stop: jest.fn().mockResolvedValue(undefined),
      };

      mockRegistry.get.mockReturnValue(mockService);

      await POST(new NextRequest('http://localhost/api/llama-server/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }));

      const statusResponse = await GET();
      const statusData = await statusResponse.json();

      expect(statusData.status).toBe('ready');

      await POST(new NextRequest('http://localhost/api/llama-server/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }));

      expect(mockService.stop).toHaveBeenCalled();
    });
  });
});
