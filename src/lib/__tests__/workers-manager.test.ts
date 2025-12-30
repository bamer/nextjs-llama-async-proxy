import { WorkersManager } from "@/lib/workers-manager";

// Mock Worker
const mockWorker = {
  terminate: jest.fn(),
  postMessage: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

global.Worker = jest.fn(() => mockWorker) as any;

// Mock URL
global.URL = jest.fn().mockImplementation((url) => ({
  href: `mocked-url-for-${url}`,
})) as any;

// Mock import.meta.url
(global as any).import.meta = {
  url: "http://example.com/worker-base",
};

// Mock require (for Node.js environment)
(global as any).require = jest.fn();

describe("WorkersManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the static workers map
    (WorkersManager as any).workers.clear();
  });

  describe("getWorker", () => {
    it("should create a new worker when called first time", () => {
      const worker = WorkersManager.getWorker("test-worker");

      expect(global.Worker).toHaveBeenCalledWith("mocked-url-for-../workers/test-worker.worker.ts");
      expect(worker).toBe(mockWorker);
    });

    it("should return existing worker on subsequent calls", () => {
      const worker1 = WorkersManager.getWorker("test-worker");
      const worker2 = WorkersManager.getWorker("test-worker");

      expect(global.Worker).toHaveBeenCalledTimes(1); // Only once
      expect(worker1).toBe(worker2);
      expect(worker1).toBe(mockWorker);
    });

    it("should create different workers for different names", () => {
      const worker1 = WorkersManager.getWorker("worker1");
      const worker2 = WorkersManager.getWorker("worker2");

      expect(global.Worker).toHaveBeenCalledTimes(2);
      expect(worker1).not.toBe(worker2);
    });

    it("should handle server environment with require", () => {
      // Simulate server environment
      (global as any).window = undefined;

      (global as any).require.mockReturnValue("server-worker-url");

      const worker = WorkersManager.getWorker("server-worker");

      expect(global.Worker).toHaveBeenCalledWith("server-worker-url");
      expect((global as any).require).toHaveBeenCalledWith("./workers/server-worker.worker.ts");
    });
  });

  describe("terminateWorker", () => {
    it("should terminate and remove worker if exists", () => {
      // Create a worker first
      WorkersManager.getWorker("test-worker");

      WorkersManager.terminateWorker("test-worker");

      expect(mockWorker.terminate).toHaveBeenCalled();
      // Should not exist anymore
      expect((WorkersManager as any).workers.has("test-worker")).toBe(false);
    });

    it("should do nothing if worker does not exist", () => {
      WorkersManager.terminateWorker("non-existent");

      expect(mockWorker.terminate).not.toHaveBeenCalled();
    });
  });

  describe("terminateAll", () => {
    it("should terminate all workers and clear map", () => {
      // Create multiple workers
      WorkersManager.getWorker("worker1");
      WorkersManager.getWorker("worker2");
      WorkersManager.getWorker("worker3");

      expect(global.Worker).toHaveBeenCalledTimes(3);

      WorkersManager.terminateAll();

      expect(mockWorker.terminate).toHaveBeenCalledTimes(3);
      expect((WorkersManager as any).workers.size).toBe(0);
    });

    it("should handle empty workers map", () => {
      WorkersManager.terminateAll();

      expect(mockWorker.terminate).not.toHaveBeenCalled();
      expect((WorkersManager as any).workers.size).toBe(0);
    });
  });
});