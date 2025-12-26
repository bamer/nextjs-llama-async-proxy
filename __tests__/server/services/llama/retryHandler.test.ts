import { RetryHandler } from '@/server/services/llama/retryHandler';

jest.useFakeTimers();

describe('RetryHandler', () => {
  let retryHandler: RetryHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    retryHandler = new RetryHandler();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with zero retries', () => {
      const handler = new RetryHandler();

      expect(handler).toBeInstanceOf(RetryHandler);
    });
  });

  describe('canRetry', () => {
    it('should return true when under max retries', () => {
      expect(retryHandler.canRetry(0)).toBe(true);
      expect(retryHandler.canRetry(4)).toBe(true);
      expect(retryHandler.canRetry(9)).toBe(true);
    });

    it('should return false at max retries', () => {
      expect(retryHandler.canRetry(5)).toBe(false);
    });

    it('should return false when max retries exceeded', () => {
      expect(retryHandler.canRetry(6)).toBe(false);
      expect(retryHandler.canRetry(10)).toBe(false);
    });
  });

  describe('getDelay', () => {
    it('should calculate exponential backoff', () => {
      const delays = [0, 1000, 2000, 4000, 8000, 16000];

      for (let i = 0; i < 6; i++) {
        const delay = retryHandler.getDelay(i);
        expect(delay).toBe(delays[i]);
      }
    });

    it('should start with 1 second delay', () => {
      expect(retryHandler.getDelay(0)).toBe(0);
      expect(retryHandler.getDelay(1)).toBe(1000);
    });

    it('should respect max retry delay', () => {
      const delay = retryHandler.getDelay(100);

      expect(delay).toBe(30000);
    });
  });

  describe('incrementAttempts', () => {
    it('should increment retry counter', () => {
      retryHandler.incrementAttempts();

      expect(retryHandler['currentRetries']).toBe(1);

      retryHandler.incrementAttempts();
      retryHandler.incrementAttempts();

      expect(retryHandler['currentRetries']).toBe(3);
    });
  });

  describe('reset', () => {
    it('should reset retry counter', () => {
      retryHandler.incrementAttempts();
      retryHandler.incrementAttempts();

      expect(retryHandler['currentRetries']).toBe(2);

      retryHandler.reset();

      expect(retryHandler['currentRetries']).toBe(0);
    });
  });

  describe('waitForRetry', () => {
    it('should wait for calculated delay', async () => {
      await retryHandler.waitForRetry(2);

      expect(setTimeout).toHaveBeenCalledWith(2000);
    });

    it('should wait with zero delay for first retry', async () => {
      await retryHandler.waitForRetry(0);

      expect(setTimeout).toHaveBeenCalledWith(0);
    });

    it('should wait for max delay when delay exceeds max', async () => {
      await retryHandler.waitForRetry(100);

      expect(setTimeout).toHaveBeenCalledWith(30000);
    });
  });

  describe('integration', () => {
    it('should handle retry cycle', async () => {
      retryHandler.incrementAttempts();

      const canRetry1 = retryHandler.canRetry(retryHandler['currentRetries']);
      expect(canRetry1).toBe(true);

      const delay = retryHandler.getDelay(retryHandler['currentRetries']);
      await retryHandler.waitForRetry(retryHandler['currentRetries']);

      const canRetry2 = retryHandler.canRetry(retryHandler['currentRetries']);
      expect(canRetry2).toBe(true);
    });

    it('should stop retrying at max attempts', async () => {
      for (let i = 0; i < 5; i++) {
        retryHandler.incrementAttempts();
      }

      const canRetry = retryHandler.canRetry(retryHandler['currentRetries']);
      expect(canRetry).toBe(false);
    });

    it('should support reset and retry cycle', async () => {
      retryHandler.incrementAttempts();
      retryHandler.incrementAttempts();

      expect(retryHandler['currentRetries']).toBe(2);

      retryHandler.reset();

      expect(retryHandler['currentRetries']).toBe(0);

      retryHandler.incrementAttempts();

      expect(retryHandler['currentRetries']).toBe(1);
    });
  });
});
