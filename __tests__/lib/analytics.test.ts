import { analyticsEngine, ServerSentEventStream, AnalyticsData } from '@/lib/analytics';
import { captureMetrics } from '@/lib/monitor';

jest.mock('@/lib/monitor');
jest.mock('fs');

describe('analyticsEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getInstance', () => {
    it('returns singleton instance', () => {
      const instance1 = analyticsEngine;
      const instance2 = analyticsEngine;
      expect(instance1).toBe(instance2);
    });
  });

  describe('incRequest', () => {
    it('increments active sessions and requests', () => {
      analyticsEngine.incRequest();
      analyticsEngine.incRequest();
      expect(analyticsEngine['activeSessions']).toBe(2);
      expect(analyticsEngine['totalRequests']).toBe(2);
    });

    it('resets requestsInLastMinute after 60 seconds', () => {
      analyticsEngine.incRequest();
      jest.advanceTimersByTime(61000);
      analyticsEngine.incRequest();
      expect(analyticsEngine['requestsInLastMinute']).toBe(1);
    });
  });

  describe('decRequest', () => {
    it('decrements active sessions', () => {
      analyticsEngine.incRequest();
      analyticsEngine.decRequest();
      expect(analyticsEngine['activeSessions']).toBe(0);
    });
  });

  describe('recordResponseTime', () => {
    it('records response time', () => {
      analyticsEngine.recordResponseTime(100);
      analyticsEngine.recordResponseTime(200);
      expect(analyticsEngine['responseTimes']).toEqual([100, 200]);
    });

    it('limits response times to 1000 entries', () => {
      const times = new Array(1001).fill(100);
      times.forEach(t => analyticsEngine.recordResponseTime(t));
      expect(analyticsEngine['responseTimes'].length).toBe(1000);
    });
  });

  describe('incError', () => {
    it('increments error count', () => {
      analyticsEngine.incError();
      analyticsEngine.incError();
      expect(analyticsEngine['errorCount']).toBe(2);
    });
  });

  describe('getAnalytics', () => {
    it('returns analytics snapshot', async () => {
      const mockMetrics = { memoryUsage: 50, cpuUsage: 30 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      analyticsEngine.incRequest();
      analyticsEngine.recordResponseTime(100);

      const analytics = await analyticsEngine.getAnalytics();

      expect(analytics).toHaveProperty('activeSessions');
      expect(analytics).toHaveProperty('requestsPerMinute');
      expect(analytics).toHaveProperty('averageResponseTime');
      expect(analytics).toHaveProperty('errorRate');
      expect(analytics).toHaveProperty('uptime');
      expect(analytics).toHaveProperty('bandwidthUsage');
      expect(analytics).toHaveProperty('timestamp');
      expect(analytics.totalUsers).toBe(1);
    });

    it('calculates average response time correctly', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      analyticsEngine.recordResponseTime(100);
      analyticsEngine.recordResponseTime(200);
      analyticsEngine.recordResponseTime(300);

      const analytics = await analyticsEngine.getAnalytics();
      expect(analytics.averageResponseTime).toBe(200);
    });

    it('returns zero error rate when no requests', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      const analytics = await analyticsEngine.getAnalytics();
      expect(analytics.errorRate).toBe(0);
    });
  });
});

describe('ServerSentEventStream', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('startStream', () => {
    it('creates a readable stream', async () => {
      const stream = await ServerSentEventStream.startStream();
      expect(stream).toBeDefined();
      expect(stream).toBeInstanceOf(ReadableStream);
    });

    it('sends initial analytics update', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      const stream = await ServerSentEventStream.startStream();
      const reader = stream.getReader();

      const { value } = await reader.read();
      expect(value).toContain('data:');
      expect(value).toContain('"type":"analytics"');
    });

    it('cancels previous stream when starting new', async () => {
      const cancelSpy = jest.fn();
      ServerSentEventStream['streamController'] = { cancel: cancelSpy };

      await ServerSentEventStream.startStream();
      expect(cancelSpy).toHaveBeenCalled();
    });
  });

  describe('getStream', () => {
    it('returns current stream controller', () => {
      const mockController = {};
      ServerSentEventStream['streamController'] = mockController as any;

      const stream = ServerSentEventStream.getStream();
      expect(stream).toBe(mockController);
    });

    it('returns null when no stream exists', () => {
      ServerSentEventStream['streamController'] = null;

      const stream = ServerSentEventStream.getStream();
      expect(stream).toBeNull();
    });
  });
});
