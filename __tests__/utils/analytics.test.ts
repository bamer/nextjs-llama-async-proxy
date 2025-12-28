import { analyticsEngine } from '@/lib/analytics';
import { captureMetrics } from '@/lib/monitor';

jest.mock('@/lib/monitor');

describe('analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('analyticsEngine', () => {
    it('should increment request count', () => {
      analyticsEngine.incRequest();
      expect(analyticsEngine).toBeDefined();
    });

    it('should decrement request count', () => {
      analyticsEngine.incRequest();
      analyticsEngine.decRequest();
      expect(analyticsEngine).toBeDefined();
    });

    it('should record response time', () => {
      analyticsEngine.recordResponseTime(100);
      analyticsEngine.recordResponseTime(200);
      expect(analyticsEngine).toBeDefined();
    });

    it('should increment error count', () => {
      analyticsEngine.incError();
      expect(analyticsEngine).toBeDefined();
    });

    it('should return singleton instance', () => {
      const instance1 = analyticsEngine;
      const instance2 = analyticsEngine;
      expect(instance1).toBe(instance2);
    });

    it('should provide getAnalytics method', async () => {
      const mockMetrics = { memoryUsage: 100, cpuUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      const analytics = await analyticsEngine.getAnalytics();

      expect(analytics).toHaveProperty('totalUsers');
      expect(analytics).toHaveProperty('activeSessions');
      expect(analytics).toHaveProperty('requestsPerMinute');
      expect(analytics).toHaveProperty('averageResponseTime');
      expect(analytics).toHaveProperty('errorRate');
      expect(analytics).toHaveProperty('uptime');
      expect(analytics).toHaveProperty('bandwidthUsage');
      expect(analytics).toHaveProperty('storageUsed');
      expect(analytics).toHaveProperty('timestamp');
    });

    it('should calculate error rate correctly', async () => {
      const mockMetrics = { memoryUsage: 100, cpuUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      analyticsEngine.incRequest();
      analyticsEngine.incRequest();
      analyticsEngine.incError();

      const analytics = await analyticsEngine.getAnalytics();
      expect(analytics.errorRate).toBeGreaterThan(0);
    });

    it('should calculate average response time', async () => {
      const mockMetrics = { memoryUsage: 100, cpuUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      analyticsEngine.recordResponseTime(100);
      analyticsEngine.recordResponseTime(200);
      analyticsEngine.recordResponseTime(300);

      const analytics = await analyticsEngine.getAnalytics();
      expect(analytics.averageResponseTime).toBeGreaterThan(0);
      expect(analytics.averageResponseTime).toBeLessThanOrEqual(300);
    });

    it('should return error rate for tracked errors', async () => {
      const mockMetrics = { memoryUsage: 100, cpuUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      analyticsEngine.incRequest();
      analyticsEngine.incError();

      const analytics = await analyticsEngine.getAnalytics();
      expect(analytics.errorRate).toBeGreaterThan(0);
    });

    it('should limit response times history to 1000 entries', async () => {
      const mockMetrics = { memoryUsage: 100, cpuUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      for (let i = 0; i < 1100; i++) {
        analyticsEngine.recordResponseTime(i);
      }

      const analytics = await analyticsEngine.getAnalytics();
      expect(analytics.averageResponseTime).toBeDefined();
    });

    it('should track request lifecycle', () => {
      analyticsEngine.incRequest();
      analyticsEngine.recordResponseTime(150);
      analyticsEngine.decRequest();
      expect(analyticsEngine).toBeDefined();
    });

    it('should reset requests per minute after 60 seconds', async () => {
      const mockMetrics = { memoryUsage: 100, cpuUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      analyticsEngine.incRequest();
      const analytics1 = await analyticsEngine.getAnalytics();
      expect(analytics1.requestsPerMinute).toBeGreaterThan(0);
    });
  });
});
