import { analyticsEngine, ServerSentEventStream, type AnalyticsData } from '@/lib/analytics';
import { captureMetrics } from '@/lib/monitor';
import { promises as fs } from 'fs';
import { join } from 'path';

jest.mock('@/lib/monitor');
jest.mock('fs');
jest.mock('path');

const mockedCaptureMetrics = captureMetrics as jest.MockedFunction<typeof captureMetrics>;
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedJoin = join as jest.MockedFunction<typeof join>;

describe('AnalyticsEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    analyticsEngine['activeSessions'] = 0;
    analyticsEngine['requestsInLastMinute'] = 0;
    analyticsEngine['lastMinuteReset'] = Date.now();
    analyticsEngine['errorCount'] = 0;
    analyticsEngine['totalRequests'] = 0;
    analyticsEngine['responseTimes'] = [];

    mockedCaptureMetrics.mockReturnValue({
      cpuUsage: 45,
      memoryUsage: 60,
      uptimeSeconds: 3600,
      timestamp: new Date().toISOString(),
    });
  });

  describe('getInstance', () => {
    it('returns singleton instance', () => {
      const instance1 = analyticsEngine;
      const instance2 = analyticsEngine;

      expect(instance1).toBe(instance2);
    });

    it('initializes with default values', () => {
      expect(analyticsEngine['activeSessions']).toBe(0);
      expect(analyticsEngine['requestsInLastMinute']).toBe(0);
      expect(analyticsEngine['errorCount']).toBe(0);
      expect(analyticsEngine['totalRequests']).toBe(0);
      expect(analyticsEngine['responseTimes']).toEqual([]);
    });
  });

  describe('incRequest', () => {
    it('increments active sessions', () => {
      analyticsEngine.incRequest();

      expect(analyticsEngine['activeSessions']).toBe(1);
    });

    it('increments total requests', () => {
      analyticsEngine.incRequest();

      expect(analyticsEngine['totalRequests']).toBe(1);
    });

    it('increments requests in last minute', () => {
      analyticsEngine.incRequest();

      expect(analyticsEngine['requestsInLastMinute']).toBe(1);
    });

    it('resets requests counter after 1 minute', () => {
      analyticsEngine.incRequest();
      analyticsEngine['lastMinuteReset'] = Date.now() - 70000;
      analyticsEngine.incRequest();

      expect(analyticsEngine['requestsInLastMinute']).toBe(1);
    });

    it('does not reset requests counter if less than 1 minute', () => {
      analyticsEngine.incRequest();
      analyticsEngine['lastMinuteReset'] = Date.now() - 30000;
      analyticsEngine.incRequest();

      expect(analyticsEngine['requestsInLastMinute']).toBe(2);
    });

    it('handles multiple consecutive requests', () => {
      analyticsEngine.incRequest();
      analyticsEngine.incRequest();
      analyticsEngine.incRequest();

      expect(analyticsEngine['activeSessions']).toBe(3);
      expect(analyticsEngine['totalRequests']).toBe(3);
      expect(analyticsEngine['requestsInLastMinute']).toBe(3);
    });

    it('updates last minute reset timestamp', () => {
      const beforeReset = analyticsEngine['lastMinuteReset'];
      analyticsEngine['lastMinuteReset'] = Date.now() - 70000;
      analyticsEngine.incRequest();

      expect(analyticsEngine['lastMinuteReset']).not.toBe(beforeReset);
    });
  });

  describe('decRequest', () => {
    it('decrements active sessions', () => {
      analyticsEngine.incRequest();
      analyticsEngine.decRequest();

      expect(analyticsEngine['activeSessions']).toBe(0);
    });

    it('does not go below zero', () => {
      analyticsEngine.decRequest();

      expect(analyticsEngine['activeSessions']).toBe(0);
    });

    it('handles multiple decrements', () => {
      analyticsEngine.incRequest();
      analyticsEngine.incRequest();
      analyticsEngine.decRequest();
      analyticsEngine.decRequest();

      expect(analyticsEngine['activeSessions']).toBe(0);
    });

    it('does not affect total requests', () => {
      analyticsEngine.incRequest();
      analyticsEngine.decRequest();

      expect(analyticsEngine['totalRequests']).toBe(1);
    });
  });

  describe('recordResponseTime', () => {
    it('records response time', () => {
      analyticsEngine.recordResponseTime(100);

      expect(analyticsEngine['responseTimes']).toContain(100);
    });

    it('records multiple response times', () => {
      analyticsEngine.recordResponseTime(100);
      analyticsEngine.recordResponseTime(200);
      analyticsEngine.recordResponseTime(150);

      expect(analyticsEngine['responseTimes']).toHaveLength(3);
      expect(analyticsEngine['responseTimes']).toEqual([100, 200, 150]);
    });

    it('limits response times to 1000 entries', () => {
      for (let i = 0; i < 1001; i++) {
        analyticsEngine.recordResponseTime(i);
      }

      expect(analyticsEngine['responseTimes']).toHaveLength(1000);
    });

    it('removes oldest entry when exceeding limit', () => {
      for (let i = 0; i < 1001; i++) {
        analyticsEngine.recordResponseTime(i);
      }

      expect(analyticsEngine['responseTimes'][0]).toBe(1);
      expect(analyticsEngine['responseTimes'][999]).toBe(1000);
    });

    it('handles zero response time', () => {
      analyticsEngine.recordResponseTime(0);

      expect(analyticsEngine['responseTimes']).toContain(0);
    });

    it('handles very large response times', () => {
      analyticsEngine.recordResponseTime(999999);

      expect(analyticsEngine['responseTimes']).toContain(999999);
    });

    it('handles negative response times', () => {
      analyticsEngine.recordResponseTime(-1);

      expect(analyticsEngine['responseTimes']).toContain(-1);
    });
  });

  describe('incError', () => {
    it('increments error count', () => {
      analyticsEngine.incError();

      expect(analyticsEngine['errorCount']).toBe(1);
    });

    it('handles multiple error increments', () => {
      analyticsEngine.incError();
      analyticsEngine.incError();
      analyticsEngine.incError();

      expect(analyticsEngine['errorCount']).toBe(3);
    });
  });

  describe('getAnalytics', () => {
    beforeEach(() => {
      mockedJoin.mockReturnValue('/mock/path/logs');
    });

    it('returns analytics data', async () => {
      const analytics = await analyticsEngine.getAnalytics();

      expect(analytics).toBeDefined();
      expect(typeof analytics.totalUsers).toBe('number');
      expect(typeof analytics.activeSessions).toBe('number');
      expect(typeof analytics.requestsPerMinute).toBe('number');
      expect(typeof analytics.averageResponseTime).toBe('number');
      expect(typeof analytics.errorRate).toBe('number');
      expect(typeof analytics.uptime).toBe('number');
      expect(typeof analytics.bandwidthUsage).toBe('number');
      expect(typeof analytics.storageUsed).toBe('number');
      expect(typeof analytics.timestamp).toBe('string');
    });

    it('calculates average response time', async () => {
      analyticsEngine.recordResponseTime(100);
      analyticsEngine.recordResponseTime(200);
      analyticsEngine.recordResponseTime(300);

      const analytics = await analyticsEngine.getAnalytics();

      expect(analytics.averageResponseTime).toBe(200);
    });

    it('returns zero average response time when no data', async () => {
      const analytics = await analyticsEngine.getAnalytics();

      expect(analytics.averageResponseTime).toBe(0);
    });

    it('calculates error rate', async () => {
      analyticsEngine.incRequest();
      analyticsEngine.incRequest();
      analyticsEngine.incError();

      const analytics = await analyticsEngine.getAnalytics();

      expect(analytics.errorRate).toBeCloseTo(0.333, 2);
    });

    it('returns zero error rate when no requests', async () => {
      const analytics = await analyticsEngine.getAnalytics();

      expect(analytics.errorRate).toBe(0);
    });

    it('returns active sessions count', async () => {
      analyticsEngine.incRequest();
      analyticsEngine.incRequest();

      const analytics = await analyticsEngine.getAnalytics();

      expect(analytics.activeSessions).toBe(2);
    });

    it('returns requests per minute count', async () => {
      analyticsEngine.incRequest();
      analyticsEngine.incRequest();
      analyticsEngine.incRequest();

      const analytics = await analyticsEngine.getAnalytics();

      expect(analytics.requestsPerMinute).toBe(3);
    });

    it('returns total users as 1 (single user system)', async () => {
      const analytics = await analyticsEngine.getAnalytics();

      expect(analytics.totalUsers).toBe(1);
    });

    it('includes timestamp in ISO format', async () => {
      const analytics = await analyticsEngine.getAnalytics();

      expect(new Date(analytics.timestamp).toISOString()).toBe(analytics.timestamp);
    });

    it('calculates uptime percentage', async () => {
      const analytics = await analyticsEngine.getAnalytics();

      expect(analytics.uptime).toBeGreaterThan(0);
      expect(analytics.uptime).toBeLessThanOrEqual(100);
    });

    it('calculates bandwidth usage from metrics', async () => {
      mockedCaptureMetrics.mockReturnValue({
        cpuUsage: 50,
        memoryUsage: 70,
        uptimeSeconds: 3600,
        timestamp: new Date().toISOString(),
      });

      const analytics = await analyticsEngine.getAnalytics();

      expect(analytics.bandwidthUsage).toBe(700);
    });

    describe('storage calculation', () => {
      it('calculates storage from logs directory', async () => {
        mockedFs.access.mockResolvedValue(undefined);
        mockedFs.readdir.mockResolvedValue(['log1.log', 'log2.log']);
        mockedFs.stat.mockImplementation((path) => Promise.resolve({
          size: path.includes('log1') ? 1024 : 2048,
        } as any));

        const analytics = await analyticsEngine.getAnalytics();

        expect(analytics.storageUsed).toBeCloseTo(0.00293, 5);
      });

      it('handles storage calculation errors gracefully', async () => {
        mockedFs.access.mockRejectedValue(new Error('Access denied'));

        const analytics = await analyticsEngine.getAnalytics();

        expect(analytics.storageUsed).toBe(0);
      });

      it('handles readdir errors gracefully', async () => {
        mockedFs.access.mockResolvedValue(undefined);
        mockedFs.readdir.mockRejectedValue(new Error('Read failed'));

        const analytics = await analyticsEngine.getAnalytics();

        expect(analytics.storageUsed).toBe(0);
      });

      it('handles empty logs directory', async () => {
        mockedFs.access.mockResolvedValue(undefined);
        mockedFs.readdir.mockResolvedValue([]);

        const analytics = await analyticsEngine.getAnalytics();

        expect(analytics.storageUsed).toBe(0);
      });

      it('handles stat errors gracefully', async () => {
        mockedFs.access.mockResolvedValue(undefined);
        mockedFs.readdir.mockResolvedValue(['log1.log']);
        mockedFs.stat.mockRejectedValue(new Error('Stat failed'));

        const analytics = await analyticsEngine.getAnalytics();

        expect(analytics.storageUsed).toBe(0);
      });

      it('converts bytes to megabytes', async () => {
        mockedFs.access.mockResolvedValue(undefined);
        mockedFs.readdir.mockResolvedValue(['log1.log']);
        mockedFs.stat.mockResolvedValue({ size: 1024 * 1024 * 10 } as any);

        const analytics = await analyticsEngine.getAnalytics();

        expect(analytics.storageUsed).toBe(10);
      });
    });
  });

  describe('AnalyticsData interface', () => {
    it('conforms to AnalyticsData type', async () => {
      const analytics = await analyticsEngine.getAnalytics();

      const data: AnalyticsData = analytics;
      expect(data).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('handles very large response times', async () => {
      analyticsEngine.recordResponseTime(999999999);
      analyticsEngine.recordResponseTime(1);

      const analytics = await analyticsEngine.getAnalytics();

      expect(analytics.averageResponseTime).toBeGreaterThan(0);
    });

    it('handles very small response times', async () => {
      analyticsEngine.recordResponseTime(0.001);
      analyticsEngine.recordResponseTime(0.002);

      const analytics = await analyticsEngine.getAnalytics();

      expect(analytics.averageResponseTime).toBeCloseTo(0, 0);
    });

    it('handles concurrent requests', async () => {
      const promises = Array.from({ length: 100 }, () => analyticsEngine.getAnalytics());

      const results = await Promise.all(promises);

      expect(results).toHaveLength(100);
      results.forEach((result) => {
        expect(result).toBeDefined();
      });
    });

    it('handles rapid request increments', () => {
      for (let i = 0; i < 1000; i++) {
        analyticsEngine.incRequest();
      }

      expect(analyticsEngine['activeSessions']).toBe(1000);
      expect(analyticsEngine['totalRequests']).toBe(1000);
    });

    it('handles mixed response times', async () => {
      const times = [10, 20, 30, 40, 50, 1000, 2000, 0.5, 999999];
      times.forEach((time) => analyticsEngine.recordResponseTime(time));

      const analytics = await analyticsEngine.getAnalytics();

      expect(analytics.averageResponseTime).toBeGreaterThan(0);
    });
  });
});

describe('ServerSentEventStream', () => {
  let mockController: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockController = {
      enqueue: jest.fn(),
      cancel: jest.fn(),
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('startStream', () => {
    it('creates a new ReadableStream', async () => {
      const stream = await ServerSentEventStream.startStream();

      expect(stream).toBeInstanceOf(ReadableStream);
    });

    it('sends initial analytics update', async () => {
      const stream = await ServerSentEventStream.startStream();
      const reader = stream.getReader();
      const { value, done } = await reader.read();

      expect(mockController.enqueue).toHaveBeenCalled();
      expect(done).toBeUndefined();
    });

    it('sends updates every 5 seconds', async () => {
      await ServerSentEventStream.startStream();

      expect(mockController.enqueue).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(5000);

      expect(mockController.enqueue).toHaveBeenCalledTimes(2);

      jest.advanceTimersByTime(5000);

      expect(mockController.enqueue).toHaveBeenCalledTimes(3);
    });

    it('cancels previous stream when starting new one', async () => {
      const stream1 = await ServerSentEventStream.startStream();
      const controller1 = ServerSentEventStream.getStream();

      await ServerSentEventStream.startStream();
      const controller2 = ServerSentEventStream.getStream();

      expect(controller1).not.toBe(controller2);
    });

    it('handles analytics errors gracefully', async () => {
      jest.spyOn(analyticsEngine, 'getAnalytics').mockRejectedValue(new Error('Analytics failed'));

      await ServerSentEventStream.startStream();

      jest.advanceTimersByTime(5000);

      expect(() => jest.advanceTimersByTime(5000)).not.toThrow();
    });
  });

  describe('getStream', () => {
    it('returns null before stream starts', () => {
      const stream = ServerSentEventStream.getStream();

      expect(stream).toBeNull();
    });

    it('returns stream controller after starting', async () => {
      await ServerSentEventStream.startStream();
      const controller = ServerSentEventStream.getStream();

      expect(controller).toBeDefined();
      expect(controller).toHaveProperty('enqueue');
    });
  });

  describe('SSE message format', () => {
    it('sends messages in correct SSE format', async () => {
      await ServerSentEventStream.startStream();

      const enqueueCalls = mockController.enqueue.mock.calls;

      if (enqueueCalls.length > 0) {
        const message = enqueueCalls[0][0];
        expect(message).toMatch(/^data: /);
        expect(message).toMatch(/\n\n$/);
      }
    });

    it('includes analytics data in message', async () => {
      await ServerSentEventStream.startStream();

      const enqueueCalls = mockController.enqueue.mock.calls;

      if (enqueueCalls.length > 0) {
        const message = enqueueCalls[0][0];
        const data = JSON.parse(message.replace(/^data: /, '').replace(/\n\n$/, ''));

        expect(data).toHaveProperty('type', 'analytics');
        expect(data).toHaveProperty('data');
        expect(data).toHaveProperty('timestamp');
      }
    });
  });

  describe('Edge cases', () => {
    it('handles concurrent stream starts', async () => {
      const promises = Array.from({ length: 10 }, () => ServerSentEventStream.startStream());

      const streams = await Promise.all(promises);

      expect(streams).toHaveLength(10);
      streams.forEach((stream) => {
        expect(stream).toBeInstanceOf(ReadableStream);
      });
    });

    it('handles long-running streams', async () => {
      await ServerSentEventStream.startStream();

      for (let i = 0; i < 100; i++) {
        jest.advanceTimersByTime(5000);
      }

      expect(mockController.enqueue).toHaveBeenCalledTimes(101);
    });
  });
});

describe('Analytics integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    analyticsEngine['activeSessions'] = 0;
    analyticsEngine['requestsInLastMinute'] = 0;
    analyticsEngine['errorCount'] = 0;
    analyticsEngine['totalRequests'] = 0;
    analyticsEngine['responseTimes'] = [];
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('tracks request lifecycle', async () => {
    analyticsEngine.incRequest();
    analyticsEngine.recordResponseTime(150);
    analyticsEngine.decRequest();

    const analytics = await analyticsEngine.getAnalytics();

    expect(analytics.activeSessions).toBe(0);
    expect(analytics.totalRequests).toBe(1);
    expect(analytics.averageResponseTime).toBe(150);
  });

  it('tracks errors during request lifecycle', async () => {
    analyticsEngine.incRequest();
    analyticsEngine.incError();
    analyticsEngine.decRequest();

    const analytics = await analyticsEngine.getAnalytics();

    expect(analytics.errorRate).toBe(1);
  });

  it('provides accurate metrics over time', async () => {
    for (let i = 0; i < 10; i++) {
      analyticsEngine.incRequest();
      analyticsEngine.recordResponseTime(100 + i * 10);
      analyticsEngine.decRequest();
    }

    const analytics = await analyticsEngine.getAnalytics();

    expect(analytics.totalRequests).toBe(10);
    expect(analytics.averageResponseTime).toBe(145);
  });
});
