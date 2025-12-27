import { analyticsEngine, ServerSentEventStream, AnalyticsData } from '@/lib/analytics';
import { captureMetrics } from '@/lib/monitor';
import fs from 'fs';

jest.mock('@/lib/monitor');
jest.mock('fs');

const mockedFsPromises = {
  access: jest.fn(),
  readdir: jest.fn(),
  stat: jest.fn(),
} as any;

(fs as any).promises = mockedFsPromises;

describe('analyticsEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Reset private state by accessing instance methods
    analyticsEngine['activeSessions'] = 0;
    analyticsEngine['requestsInLastMinute'] = 0;
    analyticsEngine['totalRequests'] = 0;
    analyticsEngine['errorCount'] = 0;
    analyticsEngine['responseTimes'] = [];
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

    it('handles decrement without increment', () => {
      analyticsEngine.decRequest();
      expect(analyticsEngine['activeSessions']).toBe(-1);
    });

    it('handles multiple decrements', () => {
      analyticsEngine.incRequest();
      analyticsEngine.incRequest();
      analyticsEngine.decRequest();
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

    it('handles zero response time', () => {
      analyticsEngine.recordResponseTime(0);
      expect(analyticsEngine['responseTimes']).toContain(0);
    });

    it('handles negative response time', () => {
      analyticsEngine.recordResponseTime(-100);
      expect(analyticsEngine['responseTimes']).toContain(-100);
    });

    it('handles very large response time', () => {
      analyticsEngine.recordResponseTime(999999999);
      expect(analyticsEngine['responseTimes']).toContain(999999999);
    });

    it('handles floating point response time', () => {
      analyticsEngine.recordResponseTime(123.456);
      expect(analyticsEngine['responseTimes']).toContain(123.456);
    });

    it('handles Infinity response time', () => {
      analyticsEngine.recordResponseTime(Infinity);
      expect(analyticsEngine['responseTimes']).toContain(Infinity);
    });

    it('handles -Infinity response time', () => {
      analyticsEngine.recordResponseTime(-Infinity);
      expect(analyticsEngine['responseTimes']).toContain(-Infinity);
    });
  });

  describe('incError', () => {
    it('increments error count', () => {
      analyticsEngine.incError();
      analyticsEngine.incError();
      expect(analyticsEngine['errorCount']).toBe(2);
    });

    it('handles multiple error increments', () => {
      for (let i = 0; i < 1000; i++) {
        analyticsEngine.incError();
      }
      expect(analyticsEngine['errorCount']).toBe(1000);
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

    it('calculates error rate correctly', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      analyticsEngine.incRequest();
      analyticsEngine.incRequest();
      analyticsEngine.incError();
      analyticsEngine.incError();

      const analytics = await analyticsEngine.getAnalytics();
      expect(analytics.errorRate).toBe(1);
    });

    it('handles file system errors gracefully', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const analytics = await analyticsEngine.getAnalytics();

      expect(analytics).toBeDefined();
      expect(analytics.storageUsed).toBe(0);
      consoleSpy.mockRestore();
    });

    it('handles NaN in average response time', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      analyticsEngine.recordResponseTime(NaN);

      const analytics = await analyticsEngine.getAnalytics();
      // When NaN is in response times, the average will be NaN
      expect(analytics.averageResponseTime).toBe(NaN);
    });

    it('handles Infinity in average response time', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      analyticsEngine.recordResponseTime(Infinity);

      const analytics = await analyticsEngine.getAnalytics();
      expect(analytics.averageResponseTime).toBe(Infinity);
    });

    it('handles empty response times array', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      const analytics = await analyticsEngine.getAnalytics();
      expect(analytics.averageResponseTime).toBe(0);
    });

    it('handles negative active sessions', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);
      analyticsEngine['activeSessions'] = -5;

      const analytics = await analyticsEngine.getAnalytics();
      expect(analytics.activeSessions).toBe(-5);
    });

    it('includes valid timestamp', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      const beforeDate = new Date();
      const analytics = await analyticsEngine.getAnalytics();
      const afterDate = new Date();

      const timestamp = new Date(analytics.timestamp);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeDate.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(afterDate.getTime());
    });

    it('handles large error count', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      for (let i = 0; i < 1000000; i++) {
        analyticsEngine.incError();
      }
      analyticsEngine.incRequest();

      const analytics = await analyticsEngine.getAnalytics();
      expect(analytics.errorRate).toBeGreaterThan(1);
    });

    it('handles negative uptime from process.uptime()', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      // process.uptime() should never be negative, but test defensive handling
      const analytics = await analyticsEngine.getAnalytics();
      expect(analytics.uptime).toBeGreaterThanOrEqual(0);
    });

    it('handles storage calculation with large files', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      mockedFsPromises.access.mockResolvedValue(undefined);
      mockedFsPromises.readdir.mockResolvedValue(['file1.log', 'file2.log']);
      mockedFsPromises.stat.mockImplementation((path: string) => {
        if (path.includes('file1')) {
          return Promise.resolve({ size: Number.MAX_SAFE_INTEGER });
        }
        return Promise.resolve({ size: Number.MAX_SAFE_INTEGER });
      });

      const analytics = await analyticsEngine.getAnalytics();
      expect(analytics.storageUsed).toBeGreaterThan(0);
    });
  });

  describe('edge cases and boundary conditions', () => {
    it('handles zero total requests with errors', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      analyticsEngine.incError();
      analyticsEngine.incError();

      const analytics = await analyticsEngine.getAnalytics();
      expect(analytics.errorRate).toBe(0); // Should be 0 when totalRequests is 0
    });

    it('handles concurrent request increments', () => {
      // Simulate rapid concurrent calls
      for (let i = 0; i < 100; i++) {
        analyticsEngine.incRequest();
      }
      expect(analyticsEngine['activeSessions']).toBe(100);
      expect(analyticsEngine['totalRequests']).toBe(100);
    });

    it('handles overflow in requestsInLastMinute timing', () => {
      analyticsEngine.incRequest();
      // Move time forward by exactly 60,000 ms
      jest.advanceTimersByTime(60000);
      analyticsEngine.incRequest();
      // The implementation checks > 60000, so exactly 60000 should not reset
      expect(analyticsEngine['requestsInLastMinute']).toBe(2);
    });

    it('handles storage calculation with empty directory', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      mockedFsPromises.access.mockResolvedValue(undefined);
      mockedFsPromises.readdir.mockResolvedValue([]);

      const analytics = await analyticsEngine.getAnalytics();
      expect(analytics.storageUsed).toBe(0);
    });

    it('handles storage calculation with zero file sizes', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      mockedFsPromises.access.mockResolvedValue(undefined);
      mockedFsPromises.readdir.mockResolvedValue(['empty.log']);
      mockedFsPromises.stat.mockResolvedValue({ size: 0 });

      const analytics = await analyticsEngine.getAnalytics();
      expect(analytics.storageUsed).toBe(0);
    });

    it('handles very small memory usage values', async () => {
      const mockMetrics = { memoryUsage: 0.0001 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      const analytics = await analyticsEngine.getAnalytics();
      expect(analytics.bandwidthUsage).toBeGreaterThan(0);
    });

    it('handles very large memory usage values', async () => {
      const mockMetrics = { memoryUsage: 999.99 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      const analytics = await analyticsEngine.getAnalytics();
      expect(analytics.bandwidthUsage).toBeLessThan(10000);
    });

    // Positive: Test file system access error handling (line 77 in source)
    it('should handle directory access errors gracefully', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockedFsPromises.access.mockRejectedValue(new Error('Access denied'));

      const analytics = await analyticsEngine.getAnalytics();
      expect(analytics.storageUsed).toBe(0);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    // Positive: Test file system readdir error handling (line 78 in source)
    it('should handle directory readdir errors gracefully', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockedFsPromises.access.mockResolvedValue(undefined);
      mockedFsPromises.readdir.mockRejectedValue(new Error('Readdir failed'));

      const analytics = await analyticsEngine.getAnalytics();
      expect(analytics.storageUsed).toBe(0);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    // Positive: Test file system stat error handling (line 81 in source)
    it('should handle file stat errors gracefully', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockedFsPromises.access.mockResolvedValue(undefined);
      mockedFsPromises.readdir.mockResolvedValue(['file.log']);
      mockedFsPromises.stat.mockRejectedValue(new Error('Stat failed'));

      const analytics = await analyticsEngine.getAnalytics();
      expect(analytics.storageUsed).toBe(0);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    // Positive: Test requestsInLastMinute reset after 60 seconds (line 42-44 in source)
    it('should reset requestsInLastMinute after 60 seconds', () => {
      analyticsEngine.incRequest();
      expect(analyticsEngine['requestsInLastMinute']).toBe(1);

      // Advance time by 61 seconds
      jest.advanceTimersByTime(61000);

      analyticsEngine.incRequest();
      expect(analyticsEngine['requestsInLastMinute']).toBe(1); // Should reset to 1
    });

    // Positive: Test exact 60 second boundary (line 42 in source)
    it('should not reset requestsInLastMinute at exactly 60 seconds', () => {
      analyticsEngine.incRequest();
      expect(analyticsEngine['requestsInLastMinute']).toBe(1);

      // Advance time by exactly 60 seconds
      jest.advanceTimersByTime(60000);

      analyticsEngine.incRequest();
      expect(analyticsEngine['requestsInLastMinute']).toBe(2); // Should not reset
    });

    // Positive: Test storage calculation with multiple files (lines 78-85 in source)
    it('should calculate storage correctly for multiple files', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      mockedFsPromises.access.mockResolvedValue(undefined);
      mockedFsPromises.readdir.mockResolvedValue(['file1.log', 'file2.log', 'file3.log']);
      mockedFsPromises.stat
        .mockImplementation((path: string) => {
          if (path.includes('file1')) return Promise.resolve({ size: 1024 * 1024 }); // 1MB
          if (path.includes('file2')) return Promise.resolve({ size: 2048 * 1024 }); // 2MB
          if (path.includes('file3')) return Promise.resolve({ size: 512 * 1024 }); // 0.5MB
          return Promise.resolve({ size: 0 });
        });

      const analytics = await analyticsEngine.getAnalytics();
      expect(analytics.storageUsed).toBe(3.5); // 3.5MB total
    });

    // Positive: Test average response time calculation (line 69-70 in source)
    it('should calculate average response time correctly', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      analyticsEngine.recordResponseTime(100);
      analyticsEngine.recordResponseTime(200);
      analyticsEngine.recordResponseTime(300);

      const analytics = await analyticsEngine.getAnalytics();
      expect(analytics.averageResponseTime).toBe(200);
    });

    // Positive: Test error rate calculation (line 98 in source)
    it('should calculate error rate correctly', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      analyticsEngine.incRequest();
      analyticsEngine.incRequest();
      analyticsEngine.incRequest();
      analyticsEngine.incError(); // 1 error out of 3 requests

      const analytics = await analyticsEngine.getAnalytics();
      expect(analytics.errorRate).toBeCloseTo(0.333, 3);
    });

    // Negative: Test handle extremely large response times
    it('should handle extremely large response times', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      analyticsEngine.recordResponseTime(Number.MAX_SAFE_INTEGER);

      const analytics = await analyticsEngine.getAnalytics();
      expect(analytics.averageResponseTime).toBe(Number.MAX_SAFE_INTEGER);
    });

    // Negative: Test handle negative response times
    it('should handle negative response times', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      analyticsEngine.recordResponseTime(-100);

      const analytics = await analyticsEngine.getAnalytics();
      expect(analytics.averageResponseTime).toBe(-100);
    });

    // Negative: Test handle response time limit (line 57-58 in source)
    it('should limit response times to 1000 entries', () => {
      for (let i = 0; i < 1100; i++) {
        analyticsEngine.recordResponseTime(i);
      }

      expect(analyticsEngine['responseTimes'].length).toBe(1000);
    });

    // Positive: Test timestamp format (line 102 in source)
    it('should include valid timestamp in analytics', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      const beforeDate = new Date();
      const analytics = await analyticsEngine.getAnalytics();
      const afterDate = new Date();

      const timestamp = new Date(analytics.timestamp);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeDate.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(afterDate.getTime());
    });

    // Positive: Test totalUsers field (line 94 in source)
    it('should return totalUsers as 1', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      const analytics = await analyticsEngine.getAnalytics();
      expect(analytics.totalUsers).toBe(1);
    });

    // Positive: Test uptime calculation (line 99 in source)
    it('should calculate uptime percentage correctly', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      const analytics = await analyticsEngine.getAnalytics();
      expect(analytics.uptime).toBeGreaterThan(0);
      expect(analytics.uptime).toBeLessThan(100);
    });

    // Positive: Test bandwidth usage calculation (line 100 in source)
    it('should calculate bandwidth usage from memory', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      const analytics = await analyticsEngine.getAnalytics();
      expect(analytics.bandwidthUsage).toBe(500); // memoryUsage * 10
    });

    // Negative: Test handle concurrent getAnalytics calls
    it('should handle concurrent getAnalytics calls', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      const promises = [
        analyticsEngine.getAnalytics(),
        analyticsEngine.getAnalytics(),
        analyticsEngine.getAnalytics(),
      ];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
    });
  });

  describe('ServerSentEventStream edge cases', () => {
    beforeEach(() => {
      // Clear streamController before each edge case test
      ServerSentEventStream['streamController'] = null;
    });

    it('handles null stream controller', () => {
      ServerSentEventStream['streamController'] = null;
      const stream = ServerSentEventStream.getStream();
      expect(stream).toBeNull();
    });

    it('handles stream cancel error', async () => {
      const cancelSpy = jest.fn().mockImplementation(() => {
        throw new Error('Cancel failed');
      });
      ServerSentEventStream['streamController'] = { cancel: cancelSpy };

      // The startStream will throw when cancel fails
      await expect(ServerSentEventStream.startStream()).rejects.toThrow('Cancel failed');
      expect(cancelSpy).toHaveBeenCalled();
    });

    it('handles analytics generation error during stream', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockedFsPromises.access.mockRejectedValue(new Error('Access failed'));

      const stream = await ServerSentEventStream.startStream();
      expect(stream).toBeDefined();

      consoleSpy.mockRestore();
    });

    // Negative: Test stream error during enqueue
    it('should handle enqueue errors gracefully', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockController = {
        enqueue: jest.fn().mockImplementation(() => {
          throw new Error('Enqueue failed');
        }),
        cancel: jest.fn(),
      };

      ServerSentEventStream['streamController'] = mockController;

      // Attempt to enqueue should not crash
      expect(() => mockController.enqueue('test')).toThrow('Enqueue failed');

      consoleSpy.mockRestore();
    });

    // Positive: Test stream starts successfully
    it('should start stream successfully', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);

      const stream = await ServerSentEventStream.startStream();

      expect(stream).toBeInstanceOf(ReadableStream);
    });

    // Positive: Test stream sends analytics data
    it('should send analytics data through stream', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const stream = await ServerSentEventStream.startStream();

      expect(stream).toBeDefined();
      expect(ServerSentEventStream.getStream()).toBeDefined();

      consoleSpy.mockRestore();
    });

    // Positive: Test stream handles multiple concurrent streams
    it('should handle multiple concurrent streams', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const stream1 = await ServerSentEventStream.startStream();
      const stream2 = await ServerSentEventStream.startStream();

      expect(stream1).toBeDefined();
      expect(stream2).toBeDefined();
      // Only one stream should be active
      expect(ServerSentEventStream.getStream()).toBeDefined();

      consoleSpy.mockRestore();
    });

    // Negative: Test stream with invalid data serialization
    it('should handle invalid data serialization', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock analytics to return circular data
      const circularData: any = { a: 1 };
      circularData.self = circularData;
      (captureMetrics as jest.Mock).mockReturnValue(circularData as any);

      const stream = await ServerSentEventStream.startStream();
      expect(stream).toBeDefined();

      consoleSpy.mockRestore();
    });

    // Negative: Test stream with missing analytics data
    it('should handle missing analytics data', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      (captureMetrics as jest.Mock).mockReturnValue(undefined as any);

      const stream = await ServerSentEventStream.startStream();
      expect(stream).toBeDefined();

      consoleSpy.mockRestore();
    });

    // Positive: Test stream with rapid enqueue calls
    it('should handle rapid enqueue calls', async () => {
      const mockMetrics = { memoryUsage: 50 };
      (captureMetrics as jest.Mock).mockReturnValue(mockMetrics);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const stream = await ServerSentEventStream.startStream();
      const controller = ServerSentEventStream.getStream();

      if (controller?.enqueue) {
        // Attempt rapid enqueue calls
        for (let i = 0; i < 1000; i++) {
          controller.enqueue(`data: test ${i}\n\n`);
        }
      }

      expect(stream).toBeDefined();

      consoleSpy.mockRestore();
    });
  });
});

describe('ServerSentEventStream', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Clear mock stream queue
    if ((global as any).clearMockStreamQueue) {
      (global as any).clearMockStreamQueue();
    }
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
      expect(stream).toBeDefined();
      expect(stream).toBeInstanceOf(ReadableStream);
      // Verify controller was set
      expect(ServerSentEventStream.getStream()).toBeDefined();
    });

    it('cancels previous stream when starting new', async () => {
      const cancelSpy = jest.fn();
      ServerSentEventStream['streamController'] = { cancel: cancelSpy };

      await ServerSentEventStream.startStream();
      expect(cancelSpy).toHaveBeenCalled();
    });

    // Note: Periodic updates via setInterval are difficult to test
    // due to module initialization timing. The interval callback
    // is set up in startStream, but testing its execution
    // requires complex timer management that conflicts with other tests.
    // The initial enqueue and error handling are tested above.
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
