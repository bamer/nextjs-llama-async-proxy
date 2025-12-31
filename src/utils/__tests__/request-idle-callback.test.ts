/**
 * Tests for requestIdleCallback utility
 */

import {
  requestIdleCallback,
  cancelIdleCallback,
} from '../request-idle-callback';

// Mock window object
const mockWindow = global as unknown as { requestIdleCallback?: jest.Mock; cancelIdleCallback?: jest.Mock };

describe('requestIdleCallback utility', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('isRequestIdleCallbackSupported', () => {
    it('should return true when requestIdleCallback is supported', () => {
      mockWindow.requestIdleCallback = jest.fn();
      expect(isRequestIdleCallbackSupported()).toBe(true);
      delete mockWindow.requestIdleCallback;
    });

    it('should return false when requestIdleCallback is not supported', () => {
      expect(isRequestIdleCallbackSupported()).toBe(false);
    });
  });

  describe('requestIdleCallbackPromise', () => {
    it('should execute callback when supported API exists', async () => {
      mockWindow.requestIdleCallback = jest.fn((cb: any) => {
        cb({ didTimeout: false, timeRemaining: () => 10 });
      });

      const callback = jest.fn(() => 'result');
      const result = await requestIdleCallbackPromise(callback);

      expect(callback).toHaveBeenCalled();
      expect(result).toBe('result');
      expect(mockWindow.requestIdleCallback).toHaveBeenCalled();
      delete mockWindow.requestIdleCallback;
    });

    it('should execute async callback when supported API exists', async () => {
      mockWindow.requestIdleCallback = jest.fn((cb: any) => {
        cb({ didTimeout: false, timeRemaining: () => 10 });
      });

      const callback = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'async-result';
      });
      const result = await requestIdleCallbackPromise(callback);

      expect(callback).toHaveBeenCalled();
      expect(result).toBe('async-result');
      delete mockWindow.requestIdleCallback;
    });

    it('should fallback to requestAnimationFrame when requestIdleCallback is not supported', async () => {
      const callback = jest.fn(() => 'fallback-result');

      const promise = requestIdleCallbackPromise(callback);
      jest.advanceTimersByTime(50);
      const result = await promise;

      expect(callback).toHaveBeenCalled();
      expect(result).toBe('fallback-result');
    });

    it('should handle timeout when didTimeout is true', async () => {
      mockWindow.requestIdleCallback = jest.fn((cb: any) => {
        cb({ didTimeout: true, timeRemaining: () => 0 });
      });

      const callback = jest.fn(() => 'timeout-result');
      const result = await requestIdleCallbackPromise(callback);

      expect(callback).toHaveBeenCalled();
      expect(result).toBe('timeout-result');
      delete mockWindow.requestIdleCallback;
    });

    it('should reject when callback throws an error', async () => {
      mockWindow.requestIdleCallback = jest.fn((cb: any) => {
        cb({ didTimeout: false, timeRemaining: () => 10 });
      });

      const error = new Error('Test error');
      const callback = jest.fn(() => {
        throw error;
      });

      await expect(requestIdleCallbackPromise(callback)).rejects.toThrow(error);
      delete mockWindow.requestIdleCallback;
    });

    it('should reject when async callback rejects', async () => {
      mockWindow.requestIdleCallback = jest.fn((cb: any) => {
        cb({ didTimeout: false, timeRemaining: () => 10 });
      });

      const error = new Error('Async error');
      const callback = jest.fn(async () => {
        throw error;
      });

      await expect(requestIdleCallbackPromise(callback)).rejects.toThrow(error);
      delete mockWindow.requestIdleCallback;
    });
  });

  describe('requestIdleCallback', () => {
    it('should call window.requestIdleCallback when supported', () => {
      const mockHandle = 12345;
      mockWindow.requestIdleCallback = jest.fn(() => mockHandle);

      const callback = jest.fn();
      const handle = requestIdleCallback(callback);

      expect(mockWindow.requestIdleCallback).toHaveBeenCalledWith(callback, undefined);
      expect(handle).toBe(mockHandle);
      delete mockWindow.requestIdleCallback;
    });

    it('should pass options to window.requestIdleCallback', () => {
      const mockHandle = 12345;
      mockWindow.requestIdleCallback = jest.fn(() => mockHandle);

      const callback = jest.fn();
      const options = { timeout: 1000 };
      const handle = requestIdleCallback(callback, options);

      expect(mockWindow.requestIdleCallback).toHaveBeenCalledWith(callback, options);
      expect(handle).toBe(mockHandle);
      delete mockWindow.requestIdleCallback;
    });

    it('should fallback to setTimeout when not supported', () => {
      const callback = jest.fn();
      const handle = requestIdleCallback(callback);

      jest.advanceTimersByTime(50);

      expect(callback).toHaveBeenCalled();
      expect(handle).toBeDefined();
    });
  });

  describe('cancelIdleCallback', () => {
    it('should call window.cancelIdleCallback when supported', () => {
      const mockHandle = 12345;
      mockWindow.cancelIdleCallback = jest.fn();

      cancelIdleCallback(mockHandle);

      expect(mockWindow.cancelIdleCallback).toHaveBeenCalledWith(mockHandle);
      delete mockWindow.cancelIdleCallback;
    });

    it('should clear timeout when cancelIdleCallback is not supported', () => {
      const handle = 12345;
      jest.spyOn(global, 'clearTimeout');

      cancelIdleCallback(handle);

      expect(global.clearTimeout).toHaveBeenCalledWith(handle);
    });
  });

  describe('runTasksInIdle', () => {
    it('should execute all tasks in idle periods', async () => {
      mockWindow.requestIdleCallback = jest.fn((cb: any) => {
        cb({ didTimeout: false, timeRemaining: () => 10 });
      });

      const tasks = [
        jest.fn(() => 'task1'),
        jest.fn(() => 'task2'),
        jest.fn(() => 'task3'),
      ];

      const results = await runTasksInIdle(tasks);

      expect(results).toEqual(['task1', 'task2', 'task3']);
      tasks.forEach(task => expect(task).toHaveBeenCalled());
      delete mockWindow.requestIdleCallback;
    });

    it('should execute async tasks in idle periods', async () => {
      mockWindow.requestIdleCallback = jest.fn((cb: any) => {
        cb({ didTimeout: false, timeRemaining: () => 10 });
      });

      const tasks = [
        jest.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return 'async-task1';
        }),
        jest.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return 'async-task2';
        }),
      ];

      const results = await runTasksInIdle(tasks);

      expect(results).toEqual(['async-task1', 'async-task2']);
      tasks.forEach(task => expect(task).toHaveBeenCalled());
      delete mockWindow.requestIdleCallback;
    });

    it('should reject when a task throws an error', async () => {
      mockWindow.requestIdleCallback = jest.fn((cb: any) => {
        cb({ didTimeout: false, timeRemaining: () => 10 });
      });

      const error = new Error('Task error');
      const tasks = [
        jest.fn(() => 'task1'),
        jest.fn(() => {
          throw error;
        }),
        jest.fn(() => 'task3'),
      ];

      await expect(runTasksInIdle(tasks)).rejects.toThrow(error);
      delete mockWindow.requestIdleCallback;
    });

    it('should handle empty task array', async () => {
      const results = await runTasksInIdle([]);

      expect(results).toEqual([]);
    });
  });

  describe('Server-side rendering', () => {
    let originalWindow: typeof window;

    beforeEach(() => {
      originalWindow = global.window;
      delete (global as any).window;
    });

    afterEach(() => {
      global.window = originalWindow;
    });

    it('should execute immediately on server side', async () => {
      const callback = jest.fn(() => 'server-result');
      const result = await requestIdleCallbackPromise(callback);

      expect(callback).toHaveBeenCalled();
      expect(result).toBe('server-result');
    });

    it('should execute requestIdleCallback immediately on server side', () => {
      const callback = jest.fn();
      requestIdleCallback(callback);

      expect(callback).toHaveBeenCalled();
    });
  });
});
