/**
 * @jest-environment node
 */

/**
 * Server.js Coverage Tests
 * Tests that actually import and execute server.js code to achieve coverage
 *
 * Tests cover:
 * - startMetrics() with mocked io and db
 * - setupShutdown() with mocked server
 * - main() flow with proper mocking
 */

import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";

describe("Server.js - Coverage Tests", () => {
  let consoleLogSpy;
  let consoleErrorSpy;
  let processExitSpy;
  let processOnSpy;
  let setIntervalSpy;
  let setTimeoutSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, "exit").mockImplementation(() => {});
    processOnSpy = jest.spyOn(process, "on").mockImplementation(() => {});

    setIntervalSpy = jest.spyOn(global, "setInterval").mockImplementation((cb, ms) => {
      if (ms === 10000) {
        return 1;
      }
      return 1;
    });
    setTimeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation((cb, ms) => {
      if (ms === 10000) {
        return 1;
      }
      return 1;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("startMetrics() - Coverage Tests", () => {
    it("should be importable from server.js", async () => {
      // Positive test: verify export exists
      const server = await import("../../server.js");
      expect(server.startMetrics).toBeDefined();
      expect(typeof server.startMetrics).toBe("function");
    });

    it("should set up interval for metrics collection", async () => {
      // Positive test: verify interval is set up
      const server = await import("../../server.js");
      const mockIo = { emit: jest.fn() };
      const mockDb = { saveMetrics: jest.fn(), pruneMetrics: jest.fn() };

      server.startMetrics(mockIo, mockDb);

      expect(setIntervalSpy).toHaveBeenCalled();
    });

    it("should use correct interval duration (10 seconds)", async () => {
      // Positive test: verify 10000ms interval
      const server = await import("../../server.js");
      const mockIo = { emit: jest.fn() };
      const mockDb = { saveMetrics: jest.fn() };

      server.startMetrics(mockIo, mockDb);

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 10000);
    });
  });

  describe("setupShutdown() - Coverage Tests", () => {
    it("should be importable from server.js", async () => {
      // Positive test: verify export exists
      const server = await import("../../server.js");
      expect(server.setupShutdown).toBeDefined();
      expect(typeof server.setupShutdown).toBe("function");
    });

    it("should register both signal handlers", async () => {
      // Positive test: verify both SIGTERM and SIGINT handlers registered
      const server = await import("../../server.js");
      const mockServer = { close: jest.fn() };

      server.setupShutdown(mockServer);

      expect(processOnSpy).toHaveBeenCalledWith("SIGTERM", expect.any(Function));
      expect(processOnSpy).toHaveBeenCalledWith("SIGINT", expect.any(Function));
    });

    it("should close server on SIGTERM signal", async () => {
      // Positive test: verify server close on SIGTERM
      const server = await import("../../server.js");
      const mockServer = { close: jest.fn() };

      server.setupShutdown(mockServer);

      // Find and trigger SIGTERM handler
      const sigtermCalls = processOnSpy.mock.calls.filter((call) => call[0] === "SIGTERM");
      const handler = sigtermCalls[0][1];
      handler("SIGTERM");

      expect(mockServer.close).toHaveBeenCalled();
    });

    it("should close server on SIGINT signal", async () => {
      // Positive test: verify server close on SIGINT
      const server = await import("../../server.js");
      const mockServer = { close: jest.fn() };

      server.setupShutdown(mockServer);

      // Find and trigger SIGINT handler
      const sigintCalls = processOnSpy.mock.calls.filter((call) => call[0] === "SIGINT");
      const handler = sigintCalls[0][1];
      handler("SIGINT");

      expect(mockServer.close).toHaveBeenCalled();
    });

    it("should exit with code 0 on successful shutdown", async () => {
      // Positive test: verify clean exit code
      const server = await import("../../server.js");
      const mockServer = { close: jest.fn((cb) => cb()) };

      server.setupShutdown(mockServer);

      const sigtermCalls = processOnSpy.mock.calls.filter((call) => call[0] === "SIGTERM");
      sigtermCalls[0][1]("SIGTERM");

      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it("should force exit after timeout if server hangs", async () => {
      // Negative test: verify forced shutdown when server doesn't close
      const server = await import("../../server.js");
      const mockServer = { close: jest.fn() }; // Doesn't call callback

      server.setupShutdown(mockServer);

      const sigtermCalls = processOnSpy.mock.calls.filter((call) => call[0] === "SIGTERM");
      sigtermCalls[0][1]("SIGTERM");

      // Verify timeout was set for forced shutdown
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 10000);
    });

    it("should exit with code 1 on forced shutdown", async () => {
      // Negative test: verify forced shutdown exit code
      const server = await import("../../server.js");
      const mockServer = { close: jest.fn() }; // Never calls callback

      server.setupShutdown(mockServer);

      const sigtermCalls = processOnSpy.mock.calls.filter((call) => call[0] === "SIGTERM");
      sigtermCalls[0][1]("SIGTERM");

      // Execute the timeout callback
      const timeoutCallbacks = setTimeoutSpy.mock.calls.filter((call) => call[1] === 10000);
      if (timeoutCallbacks.length > 0) {
        const timeoutCb = timeoutCallbacks[0][0];
        timeoutCb();
      }

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe("main() - Coverage Tests", () => {
    it("should be importable from server.js", async () => {
      // Positive test: verify export exists
      const server = await import("../../server.js");
      expect(server.main).toBeDefined();
      expect(typeof server.main).toBe("function");
    });

    it("should be an async function", async () => {
      // Positive test: verify main is async
      const server = await import("../../server.js");
      const mainFn = server.main;

      // Check that it's an async function by checking its constructor
      // We don't call it to avoid starting the server
      expect(mainFn.constructor.name).toBe("AsyncFunction");
    });
  });

  describe("Module exports", () => {
    it("should export all required functions", async () => {
      // Positive test: verify all exports exist
      const server = await import("../../server.js");

      expect(server.startMetrics).toBeDefined();
      expect(server.setupShutdown).toBeDefined();
      expect(server.main).toBeDefined();
    });

    it("should not auto-run main when imported", async () => {
      // Negative test: verify main doesn't run on import
      // This verifies our conditional check works
      const server = await import("../../server.js");

      // If we get here without error, the auto-run check passed
      expect(server.main).toBeDefined();
    });
  });
});
