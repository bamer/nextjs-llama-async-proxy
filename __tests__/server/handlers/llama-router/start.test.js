/**
 * @jest-environment node
 */

/**
 * Tests for Llama Router Start Handler
 * Tests router startup, process spawning, and state management
 *
 * Coverage Target: 100% of server/handlers/llama-router/start.js
 */

// Create mock process factory
const createMockProcess = () => {
  const listeners = {};
  return {
    on: jest.fn((event, callback) => {
      listeners[event] = callback;
    }),
    emit: (event, ...args) => {
      if (listeners[event]) {
        listeners[event](...args);
      }
    },
    kill: jest.fn(),
    exitCode: null,
    _listeners: listeners,
  };
};

describe("Llama Router Start Handler", () => {
  let startLlamaServerRouter;
  let getRouterState;
  let getServerUrl;
  let getServerProcess;
  let spawnMock;
  let findLlamaServerMock;
  let isPortInUseMock;
  let llamaApiRequestMock;
  let killLlamaServerMock;
  let killLlamaOnPortMock;
  let findAvailablePortMock;
  let existsSyncMock;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Create mock functions
    spawnMock = jest.fn();
    findLlamaServerMock = jest.fn();
    isPortInUseMock = jest.fn();
    llamaApiRequestMock = jest.fn();
    killLlamaServerMock = jest.fn();
    killLlamaOnPortMock = jest.fn();
    findAvailablePortMock = jest.fn();
    existsSyncMock = jest.fn((path) => path === "/home/bamer/nextjs-llama-async-proxy");

    // Mock child_process
    jest.doMock("child_process", () => ({
      spawn: spawnMock,
    }));

    // Mock fs
    jest.doMock("fs", () => ({
      existsSync: existsSyncMock,
    }));

    // Mock process.js
    jest.doMock(
      "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/process.js",
      () => ({
        findLlamaServer: findLlamaServerMock,
        isPortInUse: isPortInUseMock,
        killLlamaServer: killLlamaServerMock,
        killLlamaOnPort: killLlamaOnPortMock,
        findAvailablePort: findAvailablePortMock,
      })
    );

    // Mock api.js
    jest.doMock("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/api.js", () => ({
      llamaApiRequest: llamaApiRequestMock,
    }));

    // Default mock implementations
    findLlamaServerMock.mockReturnValue("/fake/bin/llama-server");
    isPortInUseMock.mockReturnValue(true);
    llamaApiRequestMock.mockResolvedValue({ data: { models: [] } });

    // Import the module
    const module =
      await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");
    startLlamaServerRouter = module.startLlamaServerRouter;
    getRouterState = module.getRouterState;
    getServerUrl = module.getServerUrl;
    getServerProcess = module.getServerProcess;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe("Module Exports", () => {
    it("should export getRouterState function", () => {
      expect(typeof getRouterState).toBe("function");
    });

    it("should export getServerUrl function", () => {
      expect(typeof getServerUrl).toBe("function");
    });

    it("should export getServerProcess function", () => {
      expect(typeof getServerProcess).toBe("function");
    });

    it("should export startLlamaServerRouter function", () => {
      expect(typeof startLlamaServerRouter).toBe("function");
    });
  });

  describe("getRouterState", () => {
    it("should return correct state object structure", () => {
      const state = getRouterState();
      expect(state).toHaveProperty("process");
      expect(state).toHaveProperty("port");
      expect(state).toHaveProperty("url");
      expect(state).toHaveProperty("isRunning");
    });

    it("should report isRunning false when server not started", () => {
      const state = getRouterState();
      expect(state.isRunning).toBe(false);
    });

    it("should have port property defined with default value 8080", () => {
      const state = getRouterState();
      expect(state.port).toBe(8080);
    });

    it("should have url property as null initially", () => {
      const state = getRouterState();
      expect(state.url).toBeNull();
    });
  });

  describe("getServerUrl", () => {
    it("should return null when server not started", () => {
      const url = getServerUrl();
      expect(url).toBeNull();
    });
  });

  describe("getServerProcess", () => {
    it("should return null when server not started", () => {
      const process = getServerProcess();
      expect(process).toBeNull();
    });
  });

  describe("startLlamaServerRouter - Binary Not Found", () => {
    it("should return error when llama-server binary is not found", async () => {
      // Test objective: Cover lines 58-60 - Binary not found error handling
      // When findLlamaServer() returns null/undefined, function should return error
      findLlamaServerMock.mockReturnValue(null);

      const result = await startLlamaServerRouter(
        "/home/bamer/nextjs-llama-async-proxy",
        { getConfig: () => ({}) },
        {}
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("llama-server binary not found");
    });
  });

  describe("startLlamaServerRouter - Process Events", () => {
    it("should handle process error event during startup", async () => {
      // Test objective: Cover line 119 - Process error event handler
      // When spawn succeeds but process emits 'error' event, should handle gracefully
      const mockProcess = createMockProcess();
      spawnMock.mockReturnValue(mockProcess);
      isPortInUseMock.mockReturnValue(false);
      llamaApiRequestMock.mockRejectedValue(new Error("Connection refused"));

      const resultPromise = startLlamaServerRouter(
        "/home/bamer/nextjs-llama-async-proxy",
        { getConfig: () => ({}) },
        {}
      );

      // Simulate process error event
      mockProcess.emit("error", new Error("ENOENT: no such file or directory"));

      // Advance timers to allow any pending operations
      jest.advanceTimersByTime(65000);

      const result = await resultPromise;
      expect(result.success).toBe(false);
      expect(result.error).toContain("Timeout waiting");
    });

    it("should handle process close event during startup", async () => {
      // Test objective: Cover lines 123-125 - Process close event handler
      // When process emits 'close' event with exit code, should set llamaServerProcess to null
      const mockProcess = createMockProcess();
      spawnMock.mockReturnValue(mockProcess);
      isPortInUseMock.mockReturnValue(false);
      llamaApiRequestMock.mockRejectedValue(new Error("Connection refused"));

      const resultPromise = startLlamaServerRouter(
        "/home/bamer/nextjs-llama-async-proxy",
        { getConfig: () => ({}) },
        {}
      );

      // Simulate process close event with non-null exit code
      mockProcess.exitCode = 1;
      mockProcess.emit("close", 1);

      // Advance timers to allow pending operations
      jest.advanceTimersByTime(65000);

      const result = await resultPromise;
      // Process closed during startup, should return error about exit
      expect(result.success).toBe(false);
      expect(result.error).toContain("llama-server exited with code 1");
    });

    it("should return error when spawn throws exception", async () => {
      // Test objective: Cover line 161-163 - Catch block for spawn errors
      // When spawn() throws an exception (not just emits error event)
      spawnMock.mockImplementation(() => {
        throw new Error("EACCES: permission denied");
      });

      const result = await startLlamaServerRouter(
        "/home/bamer/nextjs-llama-async-proxy",
        { getConfig: () => ({}) },
        {}
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to start llama-server router");
    });
  });

  describe("startLlamaServerRouter - Wait Loop Scenarios", () => {
    it("should return success when server starts successfully on first attempt", async () => {
      // Test objective: Cover successful startup path in wait loop (lines 137-149)
      // Port is in use AND API request succeeds on first attempt
      const mockProcess = createMockProcess();
      spawnMock.mockReturnValue(mockProcess);

      const result = await startLlamaServerRouter(
        "/home/bamer/nextjs-llama-async-proxy",
        { getConfig: () => ({}) },
        {}
      );

      expect(result.success).toBe(true);
      expect(result.port).toBe(8080);
      expect(result.url).toBe("http://127.0.0.1:8080");
      expect(result.mode).toBe("router");
    });

    it("should continue waiting when port is in use but API request fails", async () => {
      // Test objective: Cover the catch branch in wait loop (lines 147-149)
      // Port is in use but API request fails, should continue loop
      const mockProcess = createMockProcess();
      spawnMock.mockReturnValue(mockProcess);

      // First attempt: port in use but API fails
      // Second attempt: port in use and API succeeds
      llamaApiRequestMock
        .mockRejectedValueOnce(new Error("Connection refused"))
        .mockResolvedValue({ data: { models: [] } });

      const result = await startLlamaServerRouter(
        "/home/bamer/nextjs-llama-async-proxy",
        { getConfig: () => ({}) },
        {}
      );

      expect(result.success).toBe(true);
      expect(llamaApiRequestMock).toHaveBeenCalledTimes(2);
    });

    it("should return error when process exits during wait loop", async () => {
      // Test objective: Cover lines 152-157 - Process exits during wait loop
      // Process exits with non-null exitCode before server is ready
      const mockProcess = createMockProcess();
      spawnMock.mockReturnValue(mockProcess);
      isPortInUseMock.mockReturnValue(false); // Port not in use

      const resultPromise = startLlamaServerRouter(
        "/home/bamer/nextjs-llama-async-proxy",
        { getConfig: () => ({}) },
        {}
      );

      // Simulate process exiting before server is ready
      mockProcess.exitCode = 1;
      mockProcess.emit("close", 1);

      // Advance timers to complete the wait
      jest.advanceTimersByTime(65000);

      const result = await resultPromise;
      expect(result.success).toBe(false);
      expect(result.error).toContain("llama-server exited with code 1");
    });

    it("should return timeout error when server doesn't become ready", async () => {
      // Test objective: Cover lines 135-162 - Timeout scenario
      // Port is never in use, loop runs for 60 attempts (60 seconds), then times out
      const mockProcess = createMockProcess();
      spawnMock.mockReturnValue(mockProcess);
      isPortInUseMock.mockReturnValue(false); // Port never becomes in use
      llamaApiRequestMock.mockRejectedValue(new Error("Connection refused"));

      const resultPromise = startLlamaServerRouter(
        "/home/bamer/nextjs-llama-async-proxy",
        { getConfig: () => ({}) },
        {}
      );

      // Advance timers by 60+ seconds to trigger timeout (60 attempts * 1000ms each)
      jest.advanceTimersByTime(61000);

      const result = await resultPromise;
      expect(result.success).toBe(false);
      expect(result.error).toContain("Timeout waiting for llama-server router to start");
    });
  });

  describe("startLlamaServerRouter - Port Configuration", () => {
    it("should use configured port when available", async () => {
      const mockProcess = createMockProcess();
      spawnMock.mockReturnValue(mockProcess);

      const result = await startLlamaServerRouter(
        "/home/bamer/nextjs-llama-async-proxy",
        { getConfig: () => ({ port: 8888 }) },
        {}
      );

      expect(result.success).toBe(true);
      expect(result.port).toBe(8888);
    });

    it("should find new port when configured port is in use", async () => {
      const mockProcess = createMockProcess();
      spawnMock.mockReturnValue(mockProcess);

      // Port 8080 is in use, findAvailablePort should return 8081
      isPortInUseMock.mockImplementation((port) => port === 8080);
      findAvailablePortMock.mockResolvedValue(8081);

      const result = await startLlamaServerRouter(
        "/home/bamer/nextjs-llama-async-proxy",
        { getConfig: () => ({ port: 8080 }) },
        {}
      );

      expect(result.success).toBe(true);
      expect(result.port).toBe(8081);
    });
  });

  describe("startLlamaServerRouter - Options", () => {
    it("should handle noAutoLoad option when true", async () => {
      const mockProcess = createMockProcess();
      spawnMock.mockReturnValue(mockProcess);

      const result = await startLlamaServerRouter(
        "/home/bamer/nextjs-llama-async-proxy",
        { getConfig: () => ({}) },
        { noAutoLoad: true }
      );

      expect(result.success).toBe(true);
      expect(spawnMock).toHaveBeenCalledWith(
        "/fake/bin/llama-server",
        expect.arrayContaining(["--no-models-autoload"]),
        expect.any(Object)
      );
    });

    it("should handle custom maxModels, threads, and ctxSize options", async () => {
      const mockProcess = createMockProcess();
      spawnMock.mockReturnValue(mockProcess);

      await startLlamaServerRouter(
        "/home/bamer/nextjs-llama-async-proxy",
        { getConfig: () => ({}) },
        { maxModels: 8, threads: 6, ctxSize: 8192 }
      );

      expect(spawnMock).toHaveBeenCalledWith(
        "/fake/bin/llama-server",
        expect.arrayContaining(["--models-max", "8", "--threads", "6", "--ctx-size", "8192"]),
        expect.any(Object)
      );
    });
  });

  describe("startLlamaServerRouter - Error Scenarios", () => {
    it("should return error for non-existent models directory", async () => {
      existsSyncMock.mockReturnValueOnce(false);

      const result = await startLlamaServerRouter(
        "/path/that/does/not/exist/anywhere",
        { getConfig: () => ({}) },
        {}
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Models directory not found");
    });
  });
});
