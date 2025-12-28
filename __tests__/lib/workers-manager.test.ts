import { WorkersManager } from "@/lib/workers-manager";

// Mock Worker class
class MockWorker {
  public url: string;
  public onmessage: ((e: MessageEvent) => void) | null = null;
  public onerror: ((e: ErrorEvent) => void) | null = null;
  public terminated: boolean = false;

  constructor(url: string) {
    this.url = url;
  }

  terminate() {
    this.terminated = true;
  }

  postMessage(_data: unknown) {
    // Simulate message sending
  }
}

// Mock global Worker
(global as any).Worker = MockWorker;

// Mock window and require
delete (global as any).window;
(global as any).window = undefined;

// Mock require for Node environment
const mockRequire = jest.fn((path: string) => `/mocked/path/${path}`);
(global as any).require = mockRequire;

// Type assertion helper
function asMockWorker(worker: unknown): MockWorker {
  return worker as MockWorker;
}

describe("WorkersManager", () => {
  beforeEach(() => {
    // Clear workers before each test
    (WorkersManager as any).workers.clear();
    jest.clearAllMocks();
  });

  describe("getWorker", () => {
    it("should create a new worker when not cached", () => {
      const worker = WorkersManager.getWorker("template-processor");
      expect(worker).toBeDefined();
      expect(worker).toBeInstanceOf(MockWorker);
    });

    it("should return cached worker on subsequent calls", () => {
      const worker1 = WorkersManager.getWorker("template-processor");
      const worker2 = WorkersManager.getWorker("template-processor");
      expect(worker1).toBe(worker2);
    });

    it("should create workers with different names separately", () => {
      const worker1 = WorkersManager.getWorker("template-processor");
      const worker2 = WorkersManager.getWorker("metrics-processor");
      expect(worker1).not.toBe(worker2);
    });

    it("should handle browser environment with window defined", () => {
      (global as any).window = { location: { href: "http://localhost" } };
      const worker = WorkersManager.getWorker("test-worker");
      expect(worker).toBeDefined();
      (global as any).window = undefined;
    });

    it("should handle Node.js environment without window", () => {
      const worker = WorkersManager.getWorker("test-worker");
      expect(worker).toBeDefined();
      expect(mockRequire).toHaveBeenCalled();
    });

    it("should construct correct worker URL in browser environment", () => {
      (global as any).window = {
        location: { href: "http://localhost:3000" }
      };
      const worker = asMockWorker(WorkersManager.getWorker("test-worker"));
      expect(worker.url).toContain("test-worker.worker");
      (global as any).window = undefined;
    });

    it("should use require in server environment", () => {
      (global as any).window = undefined;
      WorkersManager.getWorker("server-worker");
      expect(mockRequire).toHaveBeenCalledWith("./workers/server-worker.worker.ts");
    });
  });

  describe("terminateWorker", () => {
    it("should terminate and remove existing worker", () => {
      const worker = asMockWorker(WorkersManager.getWorker("template-processor"));
      WorkersManager.terminateWorker("template-processor");
      expect(worker.terminated).toBe(true);
    });

    it("should not throw when terminating non-existent worker", () => {
      expect(() => {
        WorkersManager.terminateWorker("non-existent");
      }).not.toThrow();
    });

    it("should remove worker from cache after termination", () => {
      WorkersManager.getWorker("template-processor");
      WorkersManager.terminateWorker("template-processor");
      const worker = asMockWorker(WorkersManager.getWorker("template-processor"));
      expect(worker.terminated).toBe(false); // Should create new worker
    });

    it("should handle multiple terminations gracefully", () => {
      const worker = asMockWorker(WorkersManager.getWorker("test-worker"));
      WorkersManager.terminateWorker("test-worker");
      WorkersManager.terminateWorker("test-worker");
      expect(worker.terminated).toBe(true);
    });
  });

  describe("terminateAll", () => {
    it("should terminate all workers", () => {
      const worker1 = asMockWorker(WorkersManager.getWorker("worker1"));
      const worker2 = asMockWorker(WorkersManager.getWorker("worker2"));
      const worker3 = asMockWorker(WorkersManager.getWorker("worker3"));

      WorkersManager.terminateAll();

      expect(worker1.terminated).toBe(true);
      expect(worker2.terminated).toBe(true);
      expect(worker3.terminated).toBe(true);
    });

    it("should clear workers cache", () => {
      WorkersManager.getWorker("worker1");
      WorkersManager.getWorker("worker2");
      WorkersManager.terminateAll();

      const worker = asMockWorker(WorkersManager.getWorker("worker1"));
      expect(worker.terminated).toBe(false); // Should create new worker
    });

    it("should handle empty workers gracefully", () => {
      expect(() => {
        WorkersManager.terminateAll();
      }).not.toThrow();
    });

    it("should handle single worker", () => {
      const worker = asMockWorker(WorkersManager.getWorker("single-worker"));
      WorkersManager.terminateAll();
      expect(worker.terminated).toBe(true);
    });
  });

  describe("Environment Detection", () => {
    it("should detect browser environment when window is defined", () => {
      (global as any).window = { location: { href: "http://localhost" } };
      const worker = WorkersManager.getWorker("browser-worker");
      expect(worker).toBeDefined();
      expect(mockRequire).not.toHaveBeenCalled();
      (global as any).window = undefined;
    });

    it("should detect server environment when window is undefined", () => {
      (global as any).window = undefined;
      const worker = WorkersManager.getWorker("server-worker");
      expect(worker).toBeDefined();
      expect(mockRequire).toHaveBeenCalled();
    });

    it("should handle mixed environment transitions", () => {
      // Start in server environment
      (global as any).window = undefined;
      const serverWorker = WorkersManager.getWorker("worker1");
      expect(mockRequire).toHaveBeenCalled();

      // Switch to browser environment
      (global as any).window = { location: { href: "http://localhost" } };
      const browserWorker = WorkersManager.getWorker("worker2");
      expect(browserWorker).toBeDefined();

      (global as any).window = undefined;
    });
  });

  describe("Error Handling", () => {
    it("should handle worker creation errors gracefully", () => {
      // Mock Worker to throw error
      const originalWorker = global.Worker;
      (global as any).Worker = jest.fn(() => {
        throw new Error("Worker creation failed");
      });

      expect(() => {
        WorkersManager.getWorker("failing-worker");
      }).toThrow();

      // Restore Worker
      (global as any).Worker = originalWorker;
    });

    it("should handle worker URL construction errors", () => {
      (global as any).window = {
        location: { href: "http://localhost" }
      };

      // This should not throw even with invalid URL
      const worker = WorkersManager.getWorker("test-worker");
      expect(worker).toBeDefined();

      (global as any).window = undefined;
    });

    it("should handle require errors in server environment", () => {
      (global as any).window = undefined;
      mockRequire.mockImplementationOnce(() => {
        throw new Error("Module not found");
      });

      expect(() => {
        WorkersManager.getWorker("missing-worker");
      }).toThrow();

      mockRequire.mockRestore();
    });
  });

  describe("Message Passing", () => {
    it("should support postMessage on worker", () => {
      const worker = asMockWorker(WorkersManager.getWorker("message-worker"));
      expect(() => {
        worker.postMessage({ type: "test", data: "value" });
      }).not.toThrow();
    });

    it("should support onmessage handler", () => {
      const worker = asMockWorker(WorkersManager.getWorker("event-worker"));
      const mockHandler = jest.fn();
      worker.onmessage = mockHandler;

      expect(worker.onmessage).toBe(mockHandler);
    });

    it("should support onerror handler", () => {
      const worker = asMockWorker(WorkersManager.getWorker("error-worker"));
      const mockHandler = jest.fn();
      worker.onerror = mockHandler;

      expect(worker.onerror).toBe(mockHandler);
    });
  });

  describe("Worker Lifecycle", () => {
    it("should maintain separate lifecycle for multiple workers", () => {
      const worker1 = asMockWorker(WorkersManager.getWorker("lifecycle-1"));
      const worker2 = asMockWorker(WorkersManager.getWorker("lifecycle-2"));

      WorkersManager.terminateWorker("lifecycle-1");

      expect(worker1.terminated).toBe(true);
      expect(worker2.terminated).toBe(false);
    });

    it("should allow re-creation after termination", () => {
      const worker1 = asMockWorker(WorkersManager.getWorker("recreate-worker"));
      WorkersManager.terminateWorker("recreate-worker");

      const worker2 = asMockWorker(WorkersManager.getWorker("recreate-worker"));
      expect(worker1).not.toBe(worker2);
      expect(worker2.terminated).toBe(false);
    });
  });

  describe("Concurrent Access", () => {
    it("should handle concurrent getWorker calls", async () => {
      const workers = await Promise.all([
        Promise.resolve(WorkersManager.getWorker("concurrent-1")),
        Promise.resolve(WorkersManager.getWorker("concurrent-1")),
        Promise.resolve(WorkersManager.getWorker("concurrent-1")),
      ]);

      expect(workers[0]).toBe(workers[1]);
      expect(workers[1]).toBe(workers[2]);
    });

    it("should handle concurrent termination", () => {
      WorkersManager.getWorker("term-1");
      WorkersManager.getWorker("term-2");
      WorkersManager.getWorker("term-3");

      // Terminate all concurrently
      WorkersManager.terminateWorker("term-1");
      WorkersManager.terminateWorker("term-2");
      WorkersManager.terminateWorker("term-3");

      expect(() => {
        WorkersManager.terminateAll();
      }).not.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle worker names with special characters", () => {
      const worker = WorkersManager.getWorker("worker-with-special.chars_123");
      expect(worker).toBeDefined();
    });

    it("should handle empty worker name", () => {
      const worker = WorkersManager.getWorker("");
      expect(worker).toBeDefined();
    });

    it("should handle very long worker names", () => {
      const longName = "a".repeat(1000);
      const worker = WorkersManager.getWorker(longName);
      expect(worker).toBeDefined();
    });

    it("should handle rapid create-destroy cycles", () => {
      for (let i = 0; i < 10; i++) {
        WorkersManager.getWorker(`rapid-worker-${i}`);
      }

      WorkersManager.terminateAll();

      expect(() => {
        WorkersManager.getWorker("rapid-worker-0");
      }).not.toThrow();
    });
  });

  describe("Memory Management", () => {
    it("should not leak memory after worker termination", () => {
      const worker1 = asMockWorker(WorkersManager.getWorker("memory-worker"));
      WorkersManager.terminateWorker("memory-worker");

      const worker2 = asMockWorker(WorkersManager.getWorker("memory-worker"));
      expect(worker2.terminated).toBe(false);
    });

    it("should clean up all workers on terminateAll", () => {
      for (let i = 0; i < 100; i++) {
        WorkersManager.getWorker(`worker-${i}`);
      }

      WorkersManager.terminateAll();

      // Get all workers again - they should be fresh
      for (let i = 0; i < 100; i++) {
        const worker = asMockWorker(WorkersManager.getWorker(`worker-${i}`));
        expect(worker.terminated).toBe(false);
      }
    });
  });
});
