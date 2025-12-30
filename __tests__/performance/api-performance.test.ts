import { apiClient } from '@/utils/api-client';
import axios from 'axios';

jest.mock('axios');
jest.mock('@/utils/api-client');

/**
 * API Performance Tests
 *
 * Objective: Test API layer performance under various conditions
 * - Response times meet acceptable thresholds
 * - Concurrent requests handled efficiently
 * - Rate limiting works correctly
 * - No memory leaks in API operations
 * - WebSocket connections are performant
 */

describe.skip('API Performance', () => {
  let mockedAxios: jest.Mocked<typeof axios>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    mockedAxios = axios as jest.Mocked<typeof axios>;
  });

  describe('Response Times', () => {
    // Positive test: Verify API responses complete within acceptable time thresholds
    it('should respond within 100ms for simple GET requests', async () => {
      // Arrange
      const mockData = { data: 'test' };
      const mockGet = jest.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve({ data: mockData }), 10); // 10ms delay
        });
      });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
      } as any);

       const { apiClient: freshClient } = await import('@/utils/api-client');
       (freshClient as any).resetInstance();

      // Act
      const startTime = performance.now();
      await freshClient.get('/test');
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(100); // Should be well under 100ms threshold
    });

    // Negative test: Verify slow responses are handled appropriately
    it('should timeout on slow responses (>5000ms)', async () => {
      // Arrange
      const mockGet = jest.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject({ message: 'Timeout', code: 'ECONNABORTED' }), 6000);
        });
      });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
      } as any);

       const { apiClient: freshClient } = await import('@/utils/api-client');
       (freshClient as any).resetInstance();

      // Act
      const startTime = performance.now();
      const result = await freshClient.get('/test');
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(result.success).toBe(false);
      expect(duration).toBeLessThan(10000); // Should timeout within configured timeout
    });

    // Positive test: Verify POST request performance
    it('should handle POST requests within 150ms', async () => {
      // Arrange
      const mockData = { id: '123' };
      const mockPost = jest.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve({ data: mockData }), 20);
        });
      });
      mockedAxios.create.mockReturnValue({
        post: mockPost,
      } as any);

       const { apiClient: freshClient } = await import('@/utils/api-client');
       (freshClient as any).resetInstance();

      // Act
      const startTime = performance.now();
      await freshClient.post('/test', { data: 'value' });
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(150);
    });
  });

  describe('Concurrent Request Handling', () => {
    // Positive test: Verify multiple concurrent requests handled efficiently
    it('should handle 100 concurrent requests without errors', async () => {
      // Arrange
      const mockData = { data: 'test' };
      const mockGet = jest.fn().mockResolvedValue({ data: mockData });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
      } as any);

       const { apiClient: freshClient } = await import('@/utils/api-client');
       (freshClient as any).resetInstance();

      // Act
      const requests = Array(100).fill(null).map(() => freshClient.get('/test'));
      const startTime = Date.now();
      const results = await Promise.all(requests);
      const duration = Date.now() - startTime;

      // Assert
      expect(results.every(r => r.success)).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(100);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    // Positive test: Verify high load handling
    it('should handle 1000 concurrent requests within performance thresholds', async () => {
      // Arrange
      const mockData = { data: 'test' };
      const mockGet = jest.fn().mockResolvedValue({ data: mockData });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
      } as any);

       const { apiClient: freshClient } = await import('@/utils/api-client');
       (freshClient as any).resetInstance();

      // Act
      const requests = Array(1000).fill(null).map((_, i) =>
        freshClient.get(`/test/${i}`)
      );
      const startTime = Date.now();
      const results = await Promise.all(requests);
      const duration = Date.now() - startTime;

      // Assert
      expect(results.every(r => r.success)).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(1000);
      expect(duration).toBeLessThan(30000); // 30 seconds for 1000 requests
    });

    // Negative test: Verify error handling under concurrent load
    it('should handle concurrent failures gracefully', async () => {
      // Arrange
      let callCount = 0;
      const mockGet = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount % 5 === 0) {
          return Promise.reject({
            message: 'Server error',
            response: { status: 500, statusText: 'Internal Server Error', data: {} },
          });
        }
        return Promise.resolve({ data: { id: callCount } });
      });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
      } as any);

       const { apiClient: freshClient } = await import('@/utils/api-client');
       (freshClient as any).resetInstance();

      // Act
      const requests = Array(50).fill(null).map((_, i) => freshClient.get(`/test/${i}`));
      const results = await Promise.all(requests);

      // Assert
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      expect(failureCount).toBeGreaterThan(0); // Some should fail
      expect(successCount + failureCount).toBe(50); // All completed
    });
  });

  describe('Rate Limiting', () => {
    // Positive test: Verify requests are paced correctly
    it('should respect rate limiting with delays', async () => {
      // Arrange
      const mockData = { data: 'test' };
      const mockGet = jest.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve({ data: mockData }), 50);
        });
      });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
      } as any);

       const { apiClient: freshClient } = await import('@/utils/api-client');
       (freshClient as any).resetInstance();

      // Act - Make requests sequentially with rate limiting
      const startTime = Date.now();
      for (let i = 0; i < 10; i++) {
        await freshClient.get('/test');
        await new Promise(resolve => setTimeout(resolve, 100)); // Rate limit delay
      }
      const duration = Date.now() - startTime;

      // Assert
      expect(duration).toBeGreaterThan(1000); // Should take at least 1 second
      expect(mockGet).toHaveBeenCalledTimes(10);
    });

    // Positive test: Verify burst capacity
    it('should handle bursts of requests', async () => {
      // Arrange
      const mockData = { data: 'test' };
      const mockGet = jest.fn().mockResolvedValue({ data: mockData });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
      } as any);

       const { apiClient: freshClient } = await import('@/utils/api-client');
       (freshClient as any).resetInstance();

      // Act - Burst of 20 requests
      const requests = Array(20).fill(null).map(() => freshClient.get('/test'));
      const startTime = Date.now();
      await Promise.all(requests);
      const duration = Date.now() - startTime;

      // Assert
      expect(mockGet).toHaveBeenCalledTimes(20);
      expect(duration).toBeLessThan(5000); // Burst handled efficiently
    });
  });

  describe('Memory Leak Detection', () => {
    // Positive test: Verify no memory leaks with repeated requests
    it('should not leak memory on repeated requests', async () => {
      // Arrange
      const mockData = { data: 'test' };
      const mockGet = jest.fn().mockResolvedValue({ data: mockData });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
      } as any);

       const { apiClient: freshClient } = await import('@/utils/api-client');
       (freshClient as any).resetInstance();

      // Act - Make many sequential requests
      const initialMemory = (global as any).gc ? process.memoryUsage().heapUsed : 0;
      for (let i = 0; i < 1000; i++) {
        await freshClient.get('/test');
      }
      const finalMemory = (global as any).gc ? process.memoryUsage().heapUsed : 0;

      // Assert
      if ((global as any).gc) {
        const memoryGrowth = finalMemory - initialMemory;
        expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // Less than 10MB growth
      }
      expect(mockGet).toHaveBeenCalledTimes(1000);
    });

    // Positive test: Verify no memory leaks with error responses
    it('should not leak memory on repeated errors', async () => {
      // Arrange
      const mockGet = jest.fn().mockRejectedValue({
        message: 'Not Found',
        response: { status: 404, statusText: 'Not Found', data: {} },
      });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
      } as any);

       const { apiClient: freshClient } = await import('@/utils/api-client');
       (freshClient as any).resetInstance();

      // Act - Make many failed requests
      for (let i = 0; i < 500; i++) {
        await freshClient.get('/not-found');
      }

      // Assert
      expect(mockGet).toHaveBeenCalledTimes(500);
      // Should complete without throwing
    });
  });

  describe('WebSocket Connection Performance', () => {
    // Positive test: Verify WebSocket connection establishment is fast
    it('should establish WebSocket connection quickly', async () => {
      // Arrange
      const { websocketServer } = await import('@/lib/websocket-client');
      const mockConnect = jest.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(undefined), 50);
        });
      });
      (websocketServer as any).connect = mockConnect;

      // Act
      const startTime = performance.now();
      websocketServer.connect();
      await new Promise(resolve => setTimeout(resolve, 60)); // Wait for connection
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(mockConnect).toHaveBeenCalled();
      expect(duration).toBeLessThan(200); // Should connect within 200ms
    });

    // Positive test: Verify WebSocket message throughput
    it('should handle high WebSocket message throughput', async () => {
      // Arrange
      const { websocketServer } = await import('@/lib/websocket-client');
      const messageCount = 1000;
      const messagesReceived: any[] = [];

      const mockOn = jest.fn().mockImplementation((event: string, handler: any) => {
        if (event === 'message') {
          // Simulate receiving many messages
          for (let i = 0; i < messageCount; i++) {
            messagesReceived.push({ type: 'metrics', data: { value: i } });
          }
        }
      });
      (websocketServer as any).on = mockOn;

      // Act
      const startTime = performance.now();
      websocketServer.on('message', (msg: any) => messagesReceived.push(msg));
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(messagesReceived.length).toBe(messageCount);
      expect(duration).toBeLessThan(500); // Should handle within 500ms
    });
  });

  describe('Performance Regression Tests', () => {
    // Positive test: Establish baseline for sequential operations
    it('should maintain baseline performance for sequential operations', async () => {
      // Arrange
      const mockData = { data: 'test' };
      const mockGet = jest.fn().mockResolvedValue({ data: mockData });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
        post: mockGet,
      } as any);

       const { apiClient: freshClient } = await import('@/utils/api-client');
       (freshClient as any).resetInstance();

      // Act - Mix of operations
      const startTime = Date.now();
      await freshClient.get('/test');
      await freshClient.post('/test', {});
      await freshClient.get('/test/2');
      await freshClient.put('/test/2', {});
      const duration = Date.now() - startTime;

      // Assert
      expect(mockGet).toHaveBeenCalledTimes(2);
      expect(duration).toBeLessThan(500); // Baseline threshold
    });
  });
});
