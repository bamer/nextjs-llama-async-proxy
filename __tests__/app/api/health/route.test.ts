import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/health/route';

jest.mock('@/server/ServiceRegistry', () => ({
  registry: {
    get: jest.fn(),
  },
}));

const mockRegistry = jest.requireMock('@/server/ServiceRegistry').registry;

describe('Health API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET', () => {
    it('should return overall health status', async () => {
      const mockLlamaService = {
        getState: jest.fn().mockReturnValue({
          status: 'ready',
        }),
      };

      const mockMetricsService = {
        getMetrics: jest.fn().mockResolvedValue({
          cpuUsage: 50,
          memoryUsage: 60,
        }),
      };

      mockRegistry.get.mockImplementation((name: string) => {
        if (name === 'llamaService') return mockLlamaService;
        if (name === 'metricsService') return mockMetricsService;
        return null;
      });

      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty('overall');
      expect(data).toHaveProperty('services');
      expect(data).toHaveProperty('timestamp');
    });

    it('should return healthy status when all services OK', async () => {
      const mockLlamaService = {
        getState: jest.fn().mockReturnValue({
          status: 'ready',
        }),
      };

      const mockMetricsService = {
        getMetrics: jest.fn().mockResolvedValue({
          cpuUsage: 50,
          memoryUsage: 60,
        }),
      };

      mockRegistry.get.mockImplementation((name: string) => {
        if (name === 'llamaService') return mockLlamaService;
        if (name === 'metricsService') return mockMetricsService;
        return null;
      });

      const response = await GET();
      const data = await response.json();

      expect(data.overall).toBe('healthy');
      expect(data.services.llamaService).toBe('ready');
      expect(data.services.metricsService).toBe('healthy');
    });

    it('should return unhealthy status when llama service down', async () => {
      const mockLlamaService = {
        getState: jest.fn().mockReturnValue({
          status: 'error',
        }),
      };

      mockRegistry.get.mockReturnValue(mockLlamaService);

      const response = await GET();
      const data = await response.json();

      expect(data.overall).toBe('unhealthy');
      expect(data.services.llamaService).toBe('error');
    });

    it('should handle missing services gracefully', async () => {
      mockRegistry.get.mockReturnValue(null);

      const response = await GET();
      const data = await response.json();

      expect(data.overall).toBe('healthy');
      expect(data.services).toEqual({});
    });

    it('should include timestamp in response', async () => {
      const mockLlamaService = {
        getState: jest.fn().mockReturnValue({
          status: 'ready',
        }),
      };

      mockRegistry.get.mockReturnValue(mockLlamaService);

      const response = await GET();
      const data = await response.json();

      expect(data).toHaveProperty('timestamp');
      expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should handle service errors', async () => {
      const mockMetricsService = {
        getMetrics: jest.fn().mockRejectedValue(new Error('Metrics error')),
      };

      mockRegistry.get.mockImplementation((name: string) => {
        if (name === 'llamaService') {
          return {
            getState: jest.fn().mockReturnValue({
              status: 'ready',
            }),
          };
        }
        if (name === 'metricsService') return mockMetricsService;
        return null;
      });

      const response = await GET();
      const data = await response.json();

      expect(data.overall).toBe('unhealthy');
      expect(data.services.metricsService).toBe('error');
    });
  });

  describe('POST', () => {
    it('should trigger health check manually', async () => {
      const mockLlamaService = {
        getState: jest.fn().mockReturnValue({
          status: 'ready',
        }),
      };

      mockRegistry.get.mockReturnValue(mockLlamaService);

      const request = new NextRequest('http://localhost/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toEqual({
        message: 'Health check triggered',
      });
    });

    it('should check all registered services on POST', async () => {
      const mockLlamaService = {
        getState: jest.fn().mockReturnValue({
          status: 'ready',
        }),
      };

      const mockMetricsService = {
        getMetrics: jest.fn(),
      };

      mockRegistry.get.mockImplementation((name: string) => {
        if (name === 'llamaService') return mockLlamaService;
        if (name === 'metricsService') return mockMetricsService;
        return null;
      });

      await POST(new NextRequest('http://localhost/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }));

      expect(mockLlamaService.getState).toHaveBeenCalled();
      expect(mockMetricsService.getMetrics).toHaveBeenCalled();
    });

    it('should handle invalid request body', async () => {
      const request = new NextRequest('http://localhost/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('error handling', () => {
    it('should handle service not found error', async () => {
      mockRegistry.get.mockReturnValue(null);

      const response = await GET();

      expect(response.status).toBe(500);
      const data = await response.json();

      expect(data).toEqual({
        error: 'No services registered',
      });
    });

    it('should handle service errors gracefully', async () => {
      const mockLlamaService = {
        getState: jest.fn().mockImplementation(() => {
          throw new Error('Service error');
        }),
      };

      mockRegistry.get.mockReturnValue(mockLlamaService);

      const response = await GET();

      expect(response.status).toBe(500);
      const data = await response.json();

      expect(data).toEqual({
        error: 'Service unavailable',
      });
    });
  });
});
