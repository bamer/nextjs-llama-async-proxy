import { RetryHandler } from '@/server/services/llama/retryHandler';

describe('RetryHandler', () => {
  let retryHandler: RetryHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    retryHandler = new RetryHandler();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should create with default values', () => {
      expect((retryHandler as any).maxRetries).toBe(5);
      expect((retryHandler as any).initialBackoffMs).toBe(1000);
      expect((retryHandler as any).maxBackoffMs).toBe(30000);
    });

    it('should create with custom values', () => {
      const customHandler = new RetryHandler(10, 500, 60000);

      expect((customHandler as any).maxRetries).toBe(10);
      expect((customHandler as any).initialBackoffMs).toBe(500);
      expect((customHandler as any).maxBackoffMs).toBe(60000);
    });
  });

  describe('canRetry', () => {
    it('should return true when retries below max', () => {
      expect(retryHandler.canRetry(0)).toBe(true);
      expect(retryHandler.canRetry(1)).toBe(true);
      expect(retryHandler.canRetry(4)).toBe(true);
    });

    it('should return false when retries equal max', () => {
      expect(retryHandler.canRetry(5)).toBe(false);
    });

    it('should return false when retries exceed max', () => {
      expect(retryHandler.canRetry(6)).toBe(false);
      expect(retryHandler.canRetry(10)).toBe(false);
    });

    it('should work with custom max retries', () => {
      const customHandler = new RetryHandler(3);

      expect(customHandler.canRetry(0)).toBe(true);
      expect(customHandler.canRetry(1)).toBe(true);
      expect(customHandler.canRetry(2)).toBe(true);
      expect(customHandler.canRetry(3)).toBe(false);
    });
  });

  describe('getBackoffMs', () => {
    it('should calculate exponential backoff', () => {
      expect(retryHandler.getBackoffMs(0)).toBe(1000);
      expect(retryHandler.getBackoffMs(1)).toBe(2000);
      expect(retryHandler.getBackoffMs(2)).toBe(4000);
      expect(retryHandler.getBackoffMs(3)).toBe(8000);
    });

    it('should use initial backoff for first retry', () => {
      expect(retryHandler.getBackoffMs(0)).toBe(1000);
    });

    it('should cap backoff at max value', () => {
      expect(retryHandler.getBackoffMs(5)).toBe(30000);
      expect(retryHandler.getBackoffMs(6)).toBe(30000);
      expect(retryHandler.getBackoffMs(10)).toBe(30000);
    });

    it('should handle custom initial backoff', () => {
      const customHandler = new RetryHandler(5, 500);

      expect(customHandler.getBackoffMs(0)).toBe(500);
      expect(customHandler.getBackoffMs(1)).toBe(1000);
      expect(customHandler.getBackoffMs(2)).toBe(2000);
    });

    it('should handle custom max backoff', () => {
      const customHandler = new RetryHandler(5, 1000, 5000);

      expect(customHandler.getBackoffMs(0)).toBe(1000);
      expect(customHandler.getBackoffMs(1)).toBe(2000);
      expect(customHandler.getBackoffMs(2)).toBe(4000);
      expect(customHandler.getBackoffMs(3)).toBe(5000);
    });

    it('should calculate correct sequence', () => {
      const handler = new RetryHandler(10, 1000, 32000);

      expect(handler.getBackoffMs(0)).toBe(1000);
      expect(handler.getBackoffMs(1)).toBe(2000);
      expect(handler.getBackoffMs(2)).toBe(4000);
      expect(handler.getBackoffMs(3)).toBe(8000);
      expect(handler.getBackoffMs(4)).toBe(16000);
      expect(handler.getBackoffMs(5)).toBe(32000);
      expect(handler.getBackoffMs(6)).toBe(32000);
    });
  });

  describe('waitForRetry', () => {
    it('should wait for calculated backoff time', async () => {
      const promise = retryHandler.waitForRetry(2);

      jest.advanceTimersByTime(3000);

      await expect(promise).resolves.not.toThrow();
    });

    it('should use correct backoff for retry count', async () => {
      const spy = jest.spyOn(retryHandler, 'getBackoffMs');

      await retryHandler.waitForRetry(0);
      await retryHandler.waitForRetry(1);
      await retryHandler.waitForRetry(2);

      expect(spy).toHaveBeenCalledWith(0);
      expect(spy).toHaveBeenCalledWith(1);
      expect(spy).toHaveBeenCalledWith(2);

      spy.mockRestore();
    });

    it('should wait longer for higher retry counts', async () => {
      const startTime1 = Date.now();
      const promise1 = retryHandler.waitForRetry(0);
      jest.advanceTimersByTime(1000);
      await promise1;

      const startTime2 = Date.now();
      const promise2 = retryHandler.waitForRetry(1);
      jest.advanceTimersByTime(2000);
      await promise2;

      const startTime3 = Date.now();
      const promise3 = retryHandler.waitForRetry(2);
      jest.advanceTimersByTime(4000);
      await promise3;
    });

    it('should cap wait time at max backoff', async () => {
      const promise = retryHandler.waitForRetry(10);

      jest.advanceTimersByTime(30000);

      await expect(promise).resolves.not.toThrow();
    });

    it('should work with custom backoff values', async () => {
      const customHandler = new RetryHandler(5, 500, 5000);

      const promise = customHandler.waitForRetry(3);

      jest.advanceTimersByTime(4000);

      await expect(promise).resolves.not.toThrow();
    });
  });

  describe('integration tests', () => {
    it('should handle full retry cycle', async () => {
      let retryCount = 0;

      const attempt = async (): Promise<void> => {
        if (!retryHandler.canRetry(retryCount)) {
          throw new Error('Max retries exceeded');
        }

        await retryHandler.waitForRetry(retryCount);
        retryCount++;

        throw new Error('Failed');
      };

      let attempts = 0;
      while (attempts < 5) {
        try {
          await attempt();
        } catch (error) {
          attempts++;
        }
      }

      expect(retryHandler.canRetry(retryCount)).toBe(false);
    });

    it('should calculate increasing delays', () => {
      const delays: number[] = [];
      for (let i = 0; i < 5; i++) {
        delays.push(retryHandler.getBackoffMs(i));
      }

      expect(delays).toEqual([1000, 2000, 4000, 8000, 16000]);
    });
  });

  describe('edge cases', () => {
    it('should handle zero retries', () => {
      expect(retryHandler.canRetry(0)).toBe(true);
      expect(retryHandler.getBackoffMs(0)).toBe(1000);
    });

    it('should handle large retry counts', () => {
      expect(retryHandler.canRetry(100)).toBe(false);
      expect(retryHandler.getBackoffMs(100)).toBe(30000);
    });

    it('should handle negative retry counts', () => {
      expect(retryHandler.canRetry(-1)).toBe(true);
      expect(retryHandler.getBackoffMs(-1)).toBe(500);
    });

    it('should handle custom small backoff values', () => {
      const customHandler = new RetryHandler(5, 100, 1000);

      expect(customHandler.getBackoffMs(0)).toBe(100);
      expect(customHandler.getBackoffMs(1)).toBe(200);
      expect(customHandler.getBackoffMs(2)).toBe(400);
      expect(customHandler.getBackoffMs(3)).toBe(800);
      expect(customHandler.getBackoffMs(4)).toBe(1000);
    });

    it('should handle custom large backoff values', () => {
      const customHandler = new RetryHandler(5, 10000, 300000);

      expect(customHandler.getBackoffMs(0)).toBe(10000);
      expect(customHandler.getBackoffMs(1)).toBe(20000);
      expect(customHandler.getBackoffMs(2)).toBe(40000);
      expect(customHandler.getBackoffMs(3)).toBe(80000);
    });
  });
});
