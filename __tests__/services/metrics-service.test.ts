import { metricsService } from '@/services/metrics-service';

jest.mock('@/services/metrics-service');

describe('metrics-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getMetrics', () => {
    it('should return current metrics', async () => {
      const mockMetrics = {
        cpuUsage: 50,
        memoryUsage: 60,
        diskUsage: 70,
        activeModels: 1,
        totalRequests: 100,
        avgResponseTime: 200,
        uptime: 3600,
        timestamp: new Date().toISOString(),
      };

      metricsService.getMetrics.mockResolvedValue(mockMetrics);

      const result = await metricsService.getMetrics();

      expect(metricsService.getMetrics).toHaveBeenCalled();
      expect(result).toEqual(mockMetrics);
    });

    it('should handle errors gracefully', async () => {
      metricsService.getMetrics.mockRejectedValue(new Error('Failed to get metrics'));

      const result = await metricsService.getMetrics();

      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          message: 'Failed to get metrics',
        }),
        timestamp: expect.any(String),
      });
    });
  });

  describe('getSystemMetrics', () => {
    it('should return system metrics', async () => {
      const mockSystemMetrics = {
        cpuUsage: 45,
        memoryUsage: 55,
        diskUsage: 65,
        activeModels: 2,
        totalRequests: 200,
        avgResponseTime: 150,
        uptime: 7200,
        timestamp: new Date().toISOString(),
        gpuUsage: 80,
        gpuMemoryUsage: 8,
        gpuMemoryTotal: 24,
        gpuMemoryUsed: 8,
        gpuPowerUsage: 250,
        gpuPowerLimit: 350,
        gpuTemperature: 65,
        gpuName: 'NVIDIA GeForce RTX 3080',
      };

      metricsService.getSystemMetrics.mockResolvedValue(mockSystemMetrics);

      const result = await metricsService.getSystemMetrics();

      expect(result).toEqual(mockSystemMetrics);
    });

    it('should handle missing GPU metrics', async () => {
      const mockSystemMetrics = {
        cpuUsage: 50,
        memoryUsage: 60,
        diskUsage: 70,
        activeModels: 1,
        totalRequests: 100,
        avgResponseTime: 200,
        uptime: 3600,
        timestamp: new Date().toISOString(),
      };

      metricsService.getSystemMetrics.mockResolvedValue(mockSystemMetrics);

      const result = await metricsService.getSystemMetrics();

      expect(result).toHaveProperty('cpuUsage');
      expect(result).not.toHaveProperty('gpuUsage');
    });
  });

  describe('getHistory', () => {
    it('should return metrics history', async () => {
      const mockHistory = [
        { timestamp: '2024-01-01T00:00:00Z', cpuUsage: 50 },
        { timestamp: '2024-01-01T00:01:00Z', cpuUsage: 55 },
        { timestamp: '2024-01-01T00:02:00Z', cpuUsage: 45 },
      ];

      metricsService.getHistory.mockResolvedValue(mockHistory);

      const result = await metricsService.getHistory(3);

      expect(result).toHaveLength(3);
      expect(result[0].timestamp).toBe('2024-01-01T00:02:00Z');
    });

    it('should respect limit parameter', async () => {
      const mockHistory = [
        { timestamp: '2024-01-01T00:00:00Z', cpuUsage: 50 },
        { timestamp: '2024-01-01T00:01:00Z', cpuUsage: 55 },
      ];

      metricsService.getHistory.mockResolvedValue(mockHistory);

      const result = await metricsService.getHistory(1);

      expect(result).toHaveLength(1);
    });
  });

  describe('formatMetrics', () => {
    it('should format metrics for display', () => {
      const rawMetrics = {
        cpuUsage: 50.5,
        memoryUsage: 60.2,
        avgResponseTime: 250.75,
      };

      const formatted = metricsService.formatMetrics(rawMetrics);

      expect(formatted.cpuUsage).toBe('50.50%');
      expect(formatted.memoryUsage).toBe('60.20%');
      expect(formatted.avgResponseTime).toBe('250.75ms');
    });

    it('should handle null values', () => {
      const rawMetrics = {
        cpuUsage: null,
        memoryUsage: null,
      };

      const formatted = metricsService.formatMetrics(rawMetrics);

      expect(formatted.cpuUsage).toBe('N/A');
      expect(formatted.memoryUsage).toBe('N/A');
    });
  });

  describe('calculateAverages', () => {
    it('should calculate average of metrics', () => {
      const metrics = [
        { cpuUsage: 50 },
        { cpuUsage: 60 },
        { cpuUsage: 70 },
      ];

      const avg = metricsService.calculateAverages(metrics, 'cpuUsage');

      expect(avg).toBe(60);
    });

    it('should handle empty array', () => {
      const avg = metricsService.calculateAverages([], 'cpuUsage');

      expect(avg).toBe(0);
    });

    it('should calculate multiple metrics', () => {
      const metrics = [
        { cpuUsage: 50, memoryUsage: 60 },
        { cpuUsage: 60, memoryUsage: 70 },
      ];

      const avgs = metricsService.calculateAverages(metrics, ['cpuUsage', 'memoryUsage']);

      expect(avgs.cpuUsage).toBe(55);
      expect(avgs.memoryUsage).toBe(65);
    });
  });

  describe('resetMetrics', () => {
    it('should reset metrics collection', () => {
      metricsService.resetMetrics();

      expect(metricsService.resetMetrics).toHaveBeenCalled();
    });

    it('should clear history', () => {
      metricsService.resetMetrics();
      metricsService.getHistory.mockResolvedValue([]);

      const result = await metricsService.getHistory();

      expect(result).toEqual([]);
    });
  });

  describe('integration', () => {
    it('should support collect → format flow', async () => {
      const mockRawMetrics = {
        cpuUsage: 50.75,
        memoryUsage: 60.25,
      };

      metricsService.getMetrics.mockResolvedValue(mockRawMetrics);
      metricsService.formatMetrics.mockReturnValue({
        cpuUsage: '50.75%',
        memoryUsage: '60.25%',
        avgResponseTime: 'N/A',
      });

      await metricsService.getMetrics();
      const formatted = metricsService.formatMetrics(mockRawMetrics);

      expect(formatted.cpuUsage).toBe('50.75%');
    });

    it('should handle error scenarios', async () => {
      metricsService.getMetrics.mockRejectedValue(new Error('Collection failed'));

      const result = await metricsService.getMetrics();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
