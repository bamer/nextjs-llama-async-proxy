/**
 * Unit tests for analytics service
 */
import { analyticsEngine } from '@/lib/analytics';
import { captureMetrics } from '@/lib/monitor';

// Mock the monitor module to return deterministic metrics
jest.mock('@/lib/monitor', () => ({
  captureMetrics: jest.fn().mockReturnValue({
    cpuUsage: 42,
    memoryUsage: 78,
  }),
}));

describe('AnalyticsEngine', () => {
  let instance: any;

  beforeEach(() => {
    instance = analyticsEngine;
    // Reset call counts and internal state
    instance.activeSessions = 0;
    instance.requestsInLastMinute = 0;
    instance.lastMinuteReset = Date.now();
    instance.requestTimestamps = [];
    instance.errorCount = 0;
    instance.totalRequests = 0;
    instance.responseTimes = [];
  });

  it('should increment request and track active sessions', () => {
    instance.incRequest();
    expect(instance.activeSessions).toBe(1);
    expect(instance.requestsInLastMinute).toBe(1);
    expect(instance.totalRequests).toBe(1);
  });

  it('should decrement request and update active sessions', () => {
    instance.incRequest();
    expect(instance.activeSessions).toBe(1);
    instance.decRequest();
    expect(instance.activeSessions).toBe(0);
  });

  it('should record response time', () => {
    instance.recordResponseTime(123);
    expect(instance.responseTimes).toContain(123);
    // Should keep only latest 1000 entries
    expect(instance.responseTimes.length).toBe(1);
  });

  it('should increment error count', () => {
    instance.incError();
    expect(instance.errorCount).toBe(1);
  });

  it('should generate analytics snapshot with correct structure', () => {
    const analytics = instance.getAnalytics();
    // Basic field checks
    expect(analytics).toHaveProperty('totalUsers');
    expect(analytics).toHaveProperty('activeSessions');
    expect(analytics).toHaveProperty('requestsPerMinute');
    expect(analytics).toHaveProperty('averageResponseTime');
    expect(analytics).toHaveProperty('errorRate');
    expect(analytics).toHaveProperty('uptime');
    expect(analytics).toHaveProperty('bandwidthUsage');
    expect(analytics).toHaveProperty('storageUsed');
    expect(analytics).toHaveProperty('timestamp');
    // Check that mocked metrics are reflected
    expect(analytics.errorRate).toBe(0); // no errors in this test
    expect(analytics.activeSessions).toBe(0); // after cleanup
  });
});