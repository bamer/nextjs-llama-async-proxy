import {
  requestIdleCallbackPromise,
  isRequestIdleCallbackSupported,
  requestIdleCallback,
  cancelIdleCallback,
  runTasksInIdle,
} from "@/utils/request-idle-callback";

describe("requestIdleCallback - Additional Edge Cases", () => {
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

  describe("requestIdleCallbackPromise - timeout scenarios", () => {
    it("should execute callback after timeout if didTimeout is true", async () => {
      const mockRIC = jest.fn((cb: any) => {
        setTimeout(() => cb({ didTimeout: true, timeRemaining: () => 0 }), 10);
        return 123;
      });
      (global as any).window = {
        requestIdleCallback: mockRIC,
      };

      const callback = jest.fn().mockReturnValue("result");
      const promise = requestIdleCallbackPromise(callback);

      jest.advanceTimersByTime(10);

      const result = await promise;
      expect(result).toBe("result");
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should handle timeout option of 0", async () => {
      const mockRIC = jest.fn((cb: any) => {
        cb({ didTimeout: false, timeRemaining: () => 10 });
        return 1;
      });
      (global as any).window = {
        requestIdleCallback: mockRIC,
      };

      const callback = jest.fn().mockReturnValue("result");
      const result = await requestIdleCallbackPromise(callback, { timeout: 0 });

      expect(result).toBe("result");
      expect(callback).toHaveBeenCalled();
    });

    it("should handle large timeout values", async () => {
      const mockRIC = jest.fn((cb: any) => {
        cb({ didTimeout: false, timeRemaining: () => 10 });
        return 1;
      });
      (global as any).window = {
        requestIdleCallback: mockRIC,
      };

      const callback = jest.fn().mockReturnValue("result");
      const result = await requestIdleCallbackPromise(callback, {
        timeout: 60000,
      });

      expect(result).toBe("result");
      expect(callback).toHaveBeenCalled();
    });
  });

  describe("requestIdleCallbackPromise - async callback handling", () => {
    it("should handle promise-returning callback with requestIdleCallback", async () => {
      const mockRIC = jest.fn((cb: any) => {
        setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 10 }), 10);
        return 123;
      });
      (global as any).window = {
        requestIdleCallback: mockRIC,
      };

      const callback = jest.fn().mockResolvedValue("async result");
      const promise = requestIdleCallbackPromise(callback);

      jest.advanceTimersByTime(10);

      const result = await promise;
      expect(result).toBe("async result");
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should handle rejected promise callback", async () => {
      const mockRIC = jest.fn((cb: any) => {
        cb({ didTimeout: false, timeRemaining: () => 10 });
        return 123;
      });
      (global as any).window = {
        requestIdleCallback: mockRIC,
      };

      const error = new Error("Promise rejected");
      const callback = jest.fn().mockRejectedValue(error);

      await expect(requestIdleCallbackPromise(callback)).rejects.toThrow("Promise rejected");
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("requestIdleCallbackPromise - timeRemaining", () => {
    it("should access timeRemaining function", async () => {
      const mockRIC = jest.fn((cb: any) => {
        cb({ didTimeout: false, timeRemaining: () => 50 });
        return 1;
      });
      (global as any).window = {
        requestIdleCallback: mockRIC,
      };

      const callback = jest.fn().mockReturnValue("result");
      await requestIdleCallbackPromise(callback);

      expect(callback).toHaveBeenCalled();
    });

    it("should handle timeRemaining returning 0", async () => {
      const mockRIC = jest.fn((cb: any) => {
        cb({ didTimeout: false, timeRemaining: () => 0 });
        return 1;
      });
      (global as any).window = {
        requestIdleCallback: mockRIC,
      };

      const callback = jest.fn().mockReturnValue("result");
      const result = await requestIdleCallbackPromise(callback);

      expect(result).toBe("result");
    });
  });

  describe("requestIdleCallback - additional scenarios", () => {
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

    it("should handle undefined callback", () => {
      const mockRIC = jest.fn().mockReturnValue(1);
      (global as any).window = {
        requestIdleCallback: mockRIC,
      };

      const handle = requestIdleCallback(undefined as any);
      expect(handle).toBeDefined();
    });

    it("should return undefined when window is undefined", () => {
      global.window = undefined as any;

      const callback = jest.fn();
      const handle = requestIdleCallback(callback);

      expect(handle).toBeUndefined();
      expect(callback).toHaveBeenCalled();
    });
  });

  describe("cancelIdleCallback - additional scenarios", () => {
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

    it("should pass timeout option to requestIdleCallbackPromise", async () => {
      const mockRIC = jest.fn((cb: any, options: any) => {
        cb({ didTimeout: false, timeRemaining: () => 1000 });
        return 1;
      });
      (global as any).window = {
        requestIdleCallback: mockRIC,
      };

      const task = jest.fn().mockReturnValue("test");
      await runTasksInIdle([task], { timeout: 100 });

      expect(task).toHaveBeenCalledTimes(1);
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
  });

  describe("error handling - additional scenarios", () => {
    it("should handle callback throwing string", async () => {
      const mockRIC = jest.fn((cb: any) => {
        cb({ didTimeout: false, timeRemaining: () => 10 });
        return 1;
      });
      (global as any).window = {
        requestIdleCallback: mockRIC,
      };

      const callback = jest.fn().mockImplementation(() => {
        throw "error string";
      });

      await expect(requestIdleCallbackPromise(callback)).rejects.toThrow("error string");
    });

    it("should handle callback throwing object", async () => {
      const mockRIC = jest.fn((cb: any) => {
        cb({ didTimeout: false, timeRemaining: () => 10 });
        return 1;
      });
      (global as any).window = {
        requestIdleCallback: mockRIC,
      };

      const errorObject = { code: "ERR123", message: "Custom error" };
      const callback = jest.fn().mockImplementation(() => {
        throw errorObject;
      });

      await expect(requestIdleCallbackPromise(callback)).rejects.toEqual(errorObject);
    });

    it("should handle callback throwing null", async () => {
      const mockRIC = jest.fn((cb: any) => {
        cb({ didTimeout: false, timeRemaining: () => 10 });
        return 1;
      });
      (global as any).window = {
        requestIdleCallback: mockRIC,
      };

      const callback = jest.fn().mockImplementation(() => {
        throw null;
      });

      await expect(requestIdleCallbackPromise(callback)).rejects.toEqual(null);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("server-side execution - additional cases", () => {
    it("should handle callback returning 0 on server", async () => {
      global.window = undefined as any;

      const callback = jest.fn().mockReturnValue(0);
      const result = await requestIdleCallbackPromise(callback);

      expect(result).toBe(0);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should handle callback returning null on server", async () => {
      global.window = undefined as any;

      const callback = jest.fn().mockReturnValue(null);
      const result = await requestIdleCallbackPromise(callback);

      expect(result).toBeNull();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should handle callback returning false on server", async () => {
      global.window = undefined as any;

      const callback = jest.fn().mockReturnValue(false);
      const result = await requestIdleCallbackPromise(callback);

      expect(result).toBe(false);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should handle callback returning empty string on server", async () => {
      global.window = undefined as any;

      const callback = jest.fn().mockReturnValue("");
      const result = await requestIdleCallbackPromise(callback);

      expect(result).toBe("");
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});
