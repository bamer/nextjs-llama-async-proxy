import {
  requestIdleCallbackPromise,
  isRequestIdleCallbackSupported,
  requestIdleCallback,
  cancelIdleCallback,
  runTasksInIdle,
} from "@/utils/request-idle-callback";

describe("requestIdleCallback - Additional Unit Tests", () => {
  let originalWindow: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    originalWindow = global.window;
  });

  afterEach(() => {
    if (originalWindow) {
      global.window = originalWindow;
    }
    jest.useRealTimers();
  });

  describe("requestIdleCallback - options", () => {
    it("should pass options to native requestIdleCallback", () => {
      const mockRIC = jest.fn().mockReturnValue(123);
      (global as any).window = {
        requestIdleCallback: mockRIC,
      };

      const callback = jest.fn();
      const handle = requestIdleCallback(callback, { timeout: 100 });

      expect(mockRIC).toHaveBeenCalledWith(callback, { timeout: 100 });
      expect(handle).toBe(123);
    });

    it("should handle options with undefined timeout", () => {
      const mockRIC = jest.fn().mockReturnValue(1);
      (global as any).window = {
        requestIdleCallback: mockRIC,
      };

      const callback = jest.fn();
      requestIdleCallback(callback, undefined);

      expect(mockRIC).toHaveBeenCalledWith(callback, undefined);
    });
  });

  describe("cancelIdleCallback - edge cases", () => {
    it("should handle cancelIdleCallback when cancelIdleCallback API exists", () => {
      const mockCancel = jest.fn();
      (global as any).window = {
        cancelIdleCallback: mockCancel,
      };

      cancelIdleCallback(123);
      expect(mockCancel).toHaveBeenCalledWith(123);
    });

    it("should handle cancelIdleCallback when only clearTimeout exists", () => {
      const mockClearTimeout = jest.fn();
      (global as any).window = {
        clearTimeout: mockClearTimeout,
      };

      cancelIdleCallback(123);
      expect(mockClearTimeout).toHaveBeenCalledWith(123);
    });

    it("should handle cancelIdleCallback when window is undefined", () => {
      global.window = undefined as any;

      // Should not throw
      expect(() => cancelIdleCallback(123)).not.toThrow();
    });

    it("should handle cancelIdleCallback with handle value 0", () => {
      const mockCancel = jest.fn();
      (global as any).window = {
        cancelIdleCallback: mockCancel,
      };

      cancelIdleCallback(0);
      expect(mockCancel).toHaveBeenCalledWith(0);
    });

    it("should handle cancelIdleCallback with negative handle", () => {
      const mockClearTimeout = jest.fn();
      (global as any).window = {
        clearTimeout: mockClearTimeout,
      };

      cancelIdleCallback(-1);
      expect(mockClearTimeout).toHaveBeenCalledWith(-1);
    });

    it("should not throw when handle is undefined", () => {
      const mockCancel = jest.fn();
      (global as any).window = {
        cancelIdleCallback: mockCancel,
      };

      expect(() => cancelIdleCallback(undefined)).not.toThrow();
      expect(() => cancelIdleCallback(null as any)).not.toThrow();
      expect(mockCancel).not.toHaveBeenCalled();
    });
  });

  describe("isRequestIdleCallbackSupported - edge cases", () => {
    it("should return false when requestIdleCallback is not a function", () => {
      (global as any).window = {
        requestIdleCallback: "not a function",
      };

      expect(isRequestIdleCallbackSupported()).toBe(false);
    });

    it("should return false when requestIdleCallback is null", () => {
      (global as any).window = {
        requestIdleCallback: null,
      };

      expect(isRequestIdleCallbackSupported()).toBe(false);
    });

    it("should return false when window exists but property is missing", () => {
      (global as any).window = {};

      expect(isRequestIdleCallbackSupported()).toBe(false);
    });

    it("should return true when requestIdleCallback exists and is a function", () => {
      (global as any).window = {
        requestIdleCallback: jest.fn(),
      };

      expect(isRequestIdleCallbackSupported()).toBe(true);
    });
  });

  describe("runTasksInIdle - edge cases", () => {
    it("should handle single task", async () => {
      const mockRIC = jest.fn((cb: any) => {
        cb({ didTimeout: false, timeRemaining: () => 1000 });
        return 1;
      });
      (global as any).window = {
        requestIdleCallback: mockRIC,
      };

      const task = jest.fn().mockReturnValue("single");
      const result = await runTasksInIdle([task]);

      expect(result).toEqual(["single"]);
      expect(task).toHaveBeenCalledTimes(1);
    });

    it("should handle tasks returning undefined", async () => {
      const mockRIC = jest.fn((cb: any) => {
        cb({ didTimeout: false, timeRemaining: () => 1000 });
        return 1;
      });
      (global as any).window = {
        requestIdleCallback: mockRIC,
      };

      const task = jest.fn().mockReturnValue(undefined);
      const result = await runTasksInIdle([task, task]);

      expect(result).toEqual([undefined, undefined]);
      expect(task).toHaveBeenCalledTimes(2);
    });

    it("should handle mixed sync and async tasks", async () => {
      const mockRIC = jest.fn((cb: any) => {
        cb({ didTimeout: false, timeRemaining: () => 1000 });
        return 1;
      });
      (global as any).window = {
        requestIdleCallback: mockRIC,
      };

      const syncTask = jest.fn().mockReturnValue("sync");
      const asyncTask = jest.fn().mockResolvedValue("async");

      const result = await runTasksInIdle([syncTask, asyncTask]);

      expect(result).toEqual(["sync", "async"]);
      expect(syncTask).toHaveBeenCalledTimes(1);
      expect(asyncTask).toHaveBeenCalledTimes(1);
    });

    it("should handle task that returns null", async () => {
      const mockRIC = jest.fn((cb: any) => {
        cb({ didTimeout: false, timeRemaining: () => 1000 });
        return 1;
      });
      (global as any).window = {
        requestIdleCallback: mockRIC,
      };

      const task = jest.fn().mockReturnValue(null);
      const result = await runTasksInIdle([task]);

      expect(result).toEqual([null]);
      expect(task).toHaveBeenCalledTimes(1);
    });

    it("should handle task that returns 0", async () => {
      const mockRIC = jest.fn((cb: any) => {
        cb({ didTimeout: false, timeRemaining: () => 1000 });
        return 1;
      });
      (global as any).window = {
        requestIdleCallback: mockRIC,
      };

      const task = jest.fn().mockReturnValue(0);
      const result = await runTasksInIdle([task]);

      expect(result).toEqual([0]);
      expect(task).toHaveBeenCalledTimes(1);
    });

    it("should handle task that returns false", async () => {
      const mockRIC = jest.fn((cb: any) => {
        cb({ didTimeout: false, timeRemaining: () => 1000 });
        return 1;
      });
      (global as any).window = {
        requestIdleCallback: mockRIC,
      };

      const task = jest.fn().mockReturnValue(false);
      const result = await runTasksInIdle([task]);

      expect(result).toEqual([false]);
      expect(task).toHaveBeenCalledTimes(1);
    });

    it("should handle task that throws non-Error", async () => {
      const mockRIC = jest.fn((cb: any) => {
        cb({ didTimeout: false, timeRemaining: () => 1000 });
        return 1;
      });
      (global as any).window = {
        requestIdleCallback: mockRIC,
      };

      const task = jest.fn().mockImplementation(() => {
        throw "string error";
      });

      await expect(runTasksInIdle([task])).rejects.toThrow("string error");
      expect(task).toHaveBeenCalledTimes(1);
    });
  });
});
