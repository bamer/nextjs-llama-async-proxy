import {
  requestIdleCallbackPromise,
  isRequestIdleCallbackSupported,
  requestIdleCallback,
  cancelIdleCallback,
  runTasksInIdle,
} from "@/utils/request-idle-callback";

// Mock window APIs
const mockRequestIdleCallback = jest.fn();
const mockCancelIdleCallback = jest.fn();
const mockRequestAnimationFrame = jest.fn();
const mockSetTimeout = jest.fn();
const mockClearTimeout = jest.fn();

describe("requestIdleCallback utilities", () => {
  let originalWindow: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Save original window reference
    originalWindow = global.window;

    // Mock window APIs directly on the window object
    (window as any).requestIdleCallback = mockRequestIdleCallback;
    (window as any).cancelIdleCallback = mockCancelIdleCallback;
    (window as any).requestAnimationFrame = mockRequestAnimationFrame;
    (window as any).setTimeout = mockSetTimeout;
    (window as any).clearTimeout = mockClearTimeout;
  });

  afterEach(() => {
    // Restore original window properties
    if (originalWindow) {
      (window as any).requestIdleCallback = originalWindow.requestIdleCallback;
      (window as any).cancelIdleCallback = originalWindow.cancelIdleCallback;
      (window as any).requestAnimationFrame = originalWindow.requestAnimationFrame;
      (window as any).setTimeout = originalWindow.setTimeout;
      (window as any).clearTimeout = originalWindow.clearTimeout;
    }
    jest.useRealTimers();
  });

  describe("isRequestIdleCallbackSupported", () => {
    it("returns true when requestIdleCallback is available", () => {
      expect(isRequestIdleCallbackSupported()).toBe(true);
    });

    it("returns false when requestIdleCallback is not available", () => {
      const savedRequestIdleCallback = (global as any).window.requestIdleCallback;
      delete (global as any).window.requestIdleCallback;
      expect(isRequestIdleCallbackSupported()).toBe(false);
      (global as any).window.requestIdleCallback = savedRequestIdleCallback;
    });

    // Note: Testing "window is undefined (server-side)" is not feasible in jsdom environment
    // because typeof window always returns 'object' in the jsdom test environment.
    // The actual server-side behavior is tested through other tests that set global.window = undefined.
  });

  describe("requestIdleCallbackPromise", () => {
    it("uses requestIdleCallback when available", async () => {
      const callback = jest.fn().mockReturnValue("result");
      const deadline = { didTimeout: false, timeRemaining: () => 10 };
      let requestIdleCallbackCallback: ((deadline: any) => void) | null = null;

      mockRequestIdleCallback.mockImplementation((cb: any) => {
        requestIdleCallbackCallback = cb;
        return 123;
      });

      const resultPromise = requestIdleCallbackPromise(callback);

      // Execute the requestIdleCallback callback with deadline
      if (requestIdleCallbackCallback) {
        requestIdleCallbackCallback(deadline);
      }

      const result = await resultPromise;

      expect(result).toBe("result");
      expect(mockRequestIdleCallback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("falls back to requestAnimationFrame when requestIdleCallback unavailable", async () => {
      const savedRequestIdleCallback = (global as any).window.requestIdleCallback;
      delete (global as any).window.requestIdleCallback;

      const callback = jest.fn().mockReturnValue("result");
      let requestAnimationFrameCallback: (() => void) | null = null;
      let setTimeoutCallback: (() => void) | null = null;

      mockRequestAnimationFrame.mockImplementation((cb: any) => {
        requestAnimationFrameCallback = cb;
        return 456;
      });

      mockSetTimeout.mockImplementation((cb: any, _timeout: number) => {
        setTimeoutCallback = cb;
        return 789;
      });

      const resultPromise = requestIdleCallbackPromise(callback);

      // Execute the requestAnimationFrame callback first
      if (requestAnimationFrameCallback) {
        requestAnimationFrameCallback();
      }

      const result = await resultPromise;

      expect(result).toBe("result");
      expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledTimes(1);

      // Restore
      (global as any).window.requestIdleCallback = savedRequestIdleCallback;
    });

    it("uses setTimeout fallback when requestAnimationFrame times out", async () => {
      const savedRequestIdleCallback = (global as any).window.requestIdleCallback;
      delete (global as any).window.requestIdleCallback;

      const callback = jest.fn().mockReturnValue("result");
      let setTimeoutCallback: (() => void) | null = null;

      mockRequestAnimationFrame.mockImplementation((_cb: any) => {
        // Don't execute the callback - simulate timeout
        return 456;
      });

      mockSetTimeout.mockImplementation((cb: any, _timeout: number) => {
        setTimeoutCallback = cb;
        return 789;
      });

      const resultPromise = requestIdleCallbackPromise(callback, { timeout: 50 });

      // Simulate timeout by executing setTimeout callback (not the RAF callback)
      if (setTimeoutCallback) {
        setTimeoutCallback();
      }

      const result = await resultPromise;

      expect(result).toBe("result");
      expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(1);
      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 50);

      // Restore
      (global as any).window.requestIdleCallback = savedRequestIdleCallback;
    });

    it("falls back to setTimeout when neither API is available", async () => {
      const savedRequestIdleCallback = (global as any).window.requestIdleCallback;
      const savedRequestAnimationFrame = (global as any).window.requestAnimationFrame;
      delete (global as any).window.requestIdleCallback;
      delete (global as any).window.requestAnimationFrame;

      const callback = jest.fn().mockReturnValue("result");
      let setTimeoutCallback: (() => void) | null = null;

      mockSetTimeout.mockImplementation((cb: any, _timeout: number) => {
        setTimeoutCallback = cb;
        return 789;
      });

      const resultPromise = requestIdleCallbackPromise(callback, { timeout: 50 });

      // Manually execute the setTimeout callback
      if (setTimeoutCallback) {
        setTimeoutCallback();
      }

      const result = await resultPromise;

      expect(result).toBe("result");
      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 50);

      // Restore
      (global as any).window.requestIdleCallback = savedRequestIdleCallback;
      (global as any).window.requestAnimationFrame = savedRequestAnimationFrame;
    });

    it("handles errors in setTimeout fallback path", async () => {
      const savedRequestIdleCallback = (global as any).window.requestIdleCallback;
      const savedRequestAnimationFrame = (global as any).window.requestAnimationFrame;
      delete (global as any).window.requestIdleCallback;
      delete (global as any).window.requestAnimationFrame;

      const error = new Error("Callback failed in setTimeout");
      const callback = jest.fn().mockImplementation(() => {
        throw error;
      });
      let setTimeoutCallback: (() => void) | null = null;

      mockSetTimeout.mockImplementation((cb: any, _timeout: number) => {
        setTimeoutCallback = cb;
        return 789;
      });

      const resultPromise = requestIdleCallbackPromise(callback, { timeout: 50 });

      // Manually execute the setTimeout callback
      if (setTimeoutCallback) {
        setTimeoutCallback();
      }

      await expect(resultPromise).rejects.toThrow("Callback failed in setTimeout");

      // Restore
      (global as any).window.requestIdleCallback = savedRequestIdleCallback;
      (global as any).window.requestAnimationFrame = savedRequestAnimationFrame;
    });
  });

  describe("requestIdleCallback", () => {
    it("uses requestIdleCallback when available", () => {
      const callback = jest.fn();
      mockRequestIdleCallback.mockReturnValue(123);

      const result = requestIdleCallback(callback);

      expect(result).toBe(123);
      expect(mockRequestIdleCallback).toHaveBeenCalledWith(callback, undefined);
    });

    it("falls back to setTimeout when requestIdleCallback unavailable", () => {
      const savedRequestIdleCallback = (global as any).window.requestIdleCallback;
      delete (global as any).window.requestIdleCallback;

      const callback = jest.fn();
      let setTimeoutCallback: ((deadline: any) => void) | null = null;

      mockSetTimeout.mockImplementation((cb: any, _timeout: number) => {
        setTimeoutCallback = cb;
        return 456 as any;
      });

      const result = requestIdleCallback(callback, { timeout: 100 });

      expect(result).toBe(456);
      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 100);

      // Execute the timeout callback to test deadline parameter
      if (setTimeoutCallback) {
        setTimeoutCallback({ didTimeout: true, timeRemaining: () => 0 });
      }

      expect(callback).toHaveBeenCalledWith({ didTimeout: true, timeRemaining: expect.any(Function) });

      // Restore
      (global as any).window.requestIdleCallback = savedRequestIdleCallback;
    });
  });

  describe("cancelIdleCallback", () => {
    it("does nothing when handle is not a number", () => {
      cancelIdleCallback(undefined);
      cancelIdleCallback(null as any);

      expect(mockCancelIdleCallback).not.toHaveBeenCalled();
      expect(mockClearTimeout).not.toHaveBeenCalled();
    });

    it("does nothing when window is undefined", () => {
      const savedWindow = global.window;
      (global as any).window = undefined;

      cancelIdleCallback(123);

      (global as any).window = savedWindow;
    });

    it("uses cancelIdleCallback when available", () => {
      cancelIdleCallback(123);

      expect(mockCancelIdleCallback).toHaveBeenCalledWith(123);
      expect(mockClearTimeout).not.toHaveBeenCalled();
    });

    it("falls back to clearTimeout when cancelIdleCallback unavailable", () => {
      const savedCancelIdleCallback = (global as any).window.cancelIdleCallback;
      delete (global as any).window.cancelIdleCallback;

      cancelIdleCallback(123);

      expect(mockClearTimeout).toHaveBeenCalledWith(123);
      expect(mockCancelIdleCallback).not.toHaveBeenCalled();

      // Restore
      (global as any).window.cancelIdleCallback = savedCancelIdleCallback;
    });
  });

  describe("runTasksInIdle", () => {
    it("executes tasks sequentially", async () => {
      const tasks = [
        jest.fn().mockReturnValue("task1"),
        jest.fn().mockReturnValue("task2"),
        jest.fn().mockReturnValue("task3"),
      ];

      // Mock requestIdleCallback to immediately execute callback
      const deadline = { didTimeout: false, timeRemaining: () => 1000 };
      mockRequestIdleCallback.mockImplementation((cb: any) => {
        // Execute callback immediately with deadline
        try {
          cb(deadline);
        } catch (e) {
          // Ignore sync errors
        }
        return 123;
      });

      const result = await runTasksInIdle(tasks);

      expect(result).toEqual(["task1", "task2", "task3"]);
      expect(tasks[0]).toHaveBeenCalledTimes(1);
      expect(tasks[1]).toHaveBeenCalledTimes(1);
      expect(tasks[2]).toHaveBeenCalledTimes(1);
    });

    it("handles empty task list", async () => {
      const result = await runTasksInIdle([]);

      expect(result).toEqual([]);
    });

    it("handles task errors", async () => {
      const error = new Error("Task failed");
      const tasks = [
        jest.fn().mockReturnValue("task1"),
        jest.fn().mockImplementation(() => {
          throw error;
        }),
      ];

      const deadline = { didTimeout: false, timeRemaining: () => 1000 };
      mockRequestIdleCallback.mockImplementation((cb: any) => {
        try {
          cb(deadline);
        } catch (e) {
          // Ignore sync errors
        }
        return 123;
      });

      await expect(runTasksInIdle(tasks)).rejects.toThrow("Task failed");
    });
  });

  describe("server-side behavior", () => {
    let originalWindow: any;

    beforeEach(() => {
      originalWindow = global.window;
      jest.useRealTimers(); // Use real timers for server-side tests
    });

    afterEach(() => {
      if (originalWindow) {
        global.window = originalWindow;
      }
      jest.useFakeTimers(); // Restore fake timers for other tests
    });

    it("executes callback immediately on server-side (requestIdleCallbackPromise)", async () => {
      global.window = undefined as any;

      const callback = jest.fn().mockReturnValue("result");
      const result = await requestIdleCallbackPromise(callback);

      expect(result).toBe("result");
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("handles async callbacks on server-side", async () => {
      global.window = undefined as any;

      const callback = jest.fn().mockResolvedValue("async result");
      const result = await requestIdleCallbackPromise(callback);

      expect(result).toBe("async result");
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("handles callback errors on server-side", async () => {
      global.window = undefined as any;

      const error = new Error("Callback failed");
      const callback = jest.fn().mockImplementation(() => {
        throw error;
      });

      await expect(requestIdleCallbackPromise(callback)).rejects.toThrow("Callback failed");
    });

    it("executes callback immediately on server-side (requestIdleCallback)", () => {
      global.window = undefined as any;

      const callback = jest.fn();
      requestIdleCallback(callback);

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});
