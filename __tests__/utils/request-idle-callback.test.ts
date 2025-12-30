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
  const originalWindow = global.window;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

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

    it("returns false when window is undefined (server-side)", () => {
      delete (global as any).window;
      expect(isRequestIdleCallbackSupported()).toBe(false);
      (global as any).window = originalWindow;
    });

    it("returns false when requestIdleCallback is not available", () => {
      delete (global as any).window.requestIdleCallback;
      expect(isRequestIdleCallbackSupported()).toBe(false);
    });
  });

  describe("requestIdleCallbackPromise", () => {
    it("executes callback immediately on server-side", async () => {
      delete (global as any).window;

      const callback = jest.fn().mockReturnValue("result");
      const result = await requestIdleCallbackPromise(callback);

      expect(result).toBe("result");
      expect(callback).toHaveBeenCalledTimes(1);

      (global as any).window = originalWindow;
    });

    it("handles async callbacks on server-side", async () => {
      delete (global as any).window;

      const callback = jest.fn().mockResolvedValue("async result");
      const result = await requestIdleCallbackPromise(callback);

      expect(result).toBe("async result");
      expect(callback).toHaveBeenCalledTimes(1);

      (global as any).window = originalWindow;
    });

    it("handles callback errors on server-side", async () => {
      delete (global as any).window;

      const error = new Error("Callback failed");
      const callback = jest.fn().mockImplementation(() => {
        throw error;
      });

      await expect(requestIdleCallbackPromise(callback)).rejects.toThrow("Callback failed");

      (global as any).window = originalWindow;
    });

    it("uses requestIdleCallback when available", async () => {
      const callback = jest.fn().mockReturnValue("result");
      const deadline = { didTimeout: false, timeRemaining: () => 10 };

      mockRequestIdleCallback.mockImplementation((cb) => {
        setImmediate(() => cb(deadline));
        return 123;
      });

      const result = await requestIdleCallbackPromise(callback);

      expect(result).toBe("result");
      expect(mockRequestIdleCallback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(deadline);
    });

    it("falls back to requestAnimationFrame when requestIdleCallback unavailable", async () => {
      delete (global as any).window.requestIdleCallback;

      const callback = jest.fn().mockReturnValue("result");

      mockRequestAnimationFrame.mockImplementation((cb) => {
        setImmediate(cb);
        return 456;
      });

      const result = await requestIdleCallbackPromise(callback);

      expect(result).toBe("result");
      expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(1);
    });

    it("falls back to setTimeout when neither API is available", async () => {
      delete (global as any).window.requestIdleCallback;
      delete (global as any).window.requestAnimationFrame;

      const callback = jest.fn().mockReturnValue("result");

      mockSetTimeout.mockImplementation((cb, timeout) => {
        setTimeout(cb, timeout);
        return 789;
      });

      const result = await requestIdleCallbackPromise(callback, { timeout: 50 });

      jest.runAllTimers();

      expect(result).toBe("result");
      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 50);
    });
  });

  describe("requestIdleCallback", () => {
    it("executes callback immediately on server-side", () => {
      delete (global as any).window;

      const callback = jest.fn();
      requestIdleCallback(callback);

      expect(callback).toHaveBeenCalledTimes(1);

      (global as any).window = originalWindow;
    });

    it("uses requestIdleCallback when available", () => {
      const callback = jest.fn();
      mockRequestIdleCallback.mockReturnValue(123);

      const result = requestIdleCallback(callback);

      expect(result).toBe(123);
      expect(mockRequestIdleCallback).toHaveBeenCalledWith(callback, undefined);
    });

    it("falls back to setTimeout when requestIdleCallback unavailable", () => {
      delete (global as any).window.requestIdleCallback;

      const callback = jest.fn();
      mockSetTimeout.mockReturnValue(456 as any);

      const result = requestIdleCallback(callback, { timeout: 100 });

      expect(result).toBe(456);
      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 100);
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
      delete (global as any).window;

      cancelIdleCallback(123);

      (global as any).window = originalWindow;
    });

    it("uses cancelIdleCallback when available", () => {
      cancelIdleCallback(123);

      expect(mockCancelIdleCallback).toHaveBeenCalledWith(123);
      expect(mockClearTimeout).not.toHaveBeenCalled();
    });

    it("falls back to clearTimeout when cancelIdleCallback unavailable", () => {
      delete (global as any).window.cancelIdleCallback;

      cancelIdleCallback(123);

      expect(mockClearTimeout).toHaveBeenCalledWith(123);
      expect(mockCancelIdleCallback).not.toHaveBeenCalled();
    });
  });

  describe("runTasksInIdle", () => {
    it("executes tasks sequentially", async () => {
      const tasks = [
        jest.fn().mockReturnValue("task1"),
        jest.fn().mockReturnValue("task2"),
        jest.fn().mockReturnValue("task3"),
      ];

      // Mock requestIdleCallbackPromise to resolve immediately
      const originalRequestIdleCallbackPromise = require("@/utils/request-idle-callback").requestIdleCallbackPromise;
      (global as any).originalRequestIdleCallbackPromise = originalRequestIdleCallbackPromise;

      // Replace with mock
      require("@/utils/request-idle-callback").requestIdleCallbackPromise = jest.fn().mockResolvedValue(undefined);

      const result = await runTasksInIdle(tasks);

      expect(result).toEqual(["task1", "task2", "task3"]);
      expect(tasks[0]).toHaveBeenCalledTimes(1);
      expect(tasks[1]).toHaveBeenCalledTimes(1);
      expect(tasks[2]).toHaveBeenCalledTimes(1);

      // Restore
      require("@/utils/request-idle-callback").requestIdleCallbackPromise = originalRequestIdleCallbackPromise;
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

      const originalRequestIdleCallbackPromise = require("@/utils/request-idle-callback").requestIdleCallbackPromise;
      require("@/utils/request-idle-callback").requestIdleCallbackPromise = jest.fn().mockResolvedValue(undefined);

      await expect(runTasksInIdle(tasks)).rejects.toThrow("Task failed");

      // Restore
      require("@/utils/request-idle-callback").requestIdleCallbackPromise = originalRequestIdleCallbackPromise;
    });
  });
});