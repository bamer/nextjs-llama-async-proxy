/**
 * @jest-environment node
 */

/**
 * Tests for Llama Router Start Handler
 * Tests router startup, process spawning, and state management
 *
 * Coverage targets:
 * - getRouterState() - State retrieval (4 tests)
 * - getServerUrl() - URL retrieval (1 test)
 * - getServerProcess() - Process retrieval (1 test)
 * - startLlamaServerRouter() - Router startup validation (2 tests)
 */

describe("Llama Router Start Handler", () => {
  describe("Module Exports", () => {
    it("should export getRouterState function", async () => {
      const { getRouterState } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");
      expect(typeof getRouterState).toBe("function");
    });

    it("should export getServerUrl function", async () => {
      const { getServerUrl } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");
      expect(typeof getServerUrl).toBe("function");
    });

    it("should export getServerProcess function", async () => {
      const { getServerProcess } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");
      expect(typeof getServerProcess).toBe("function");
    });

    it("should export startLlamaServerRouter function", async () => {
      const { startLlamaServerRouter } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");
      expect(typeof startLlamaServerRouter).toBe("function");
    });
  });

  describe("getRouterState", () => {
    it("should return correct state object structure", async () => {
      // Test objective: Verify getRouterState returns correct state object structure
      // This ensures proper state tracking for the router
      const { getRouterState } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");
      const state = getRouterState();
      expect(state).toHaveProperty("process");
      expect(state).toHaveProperty("port");
      expect(state).toHaveProperty("url");
      expect(state).toHaveProperty("isRunning");
    });

    it("should report isRunning false when server not started", async () => {
      // Test objective: Verify isRunning returns false when process is null
      // This ensures proper detection of stopped/not-started processes
      const { getRouterState } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");
      const state = getRouterState();
      expect(state.isRunning).toBe(false);
    });

    it("should have port property defined with default value 8080", async () => {
      // Test objective: Verify state includes port property with default value
      // This ensures port tracking is part of the router state
      const { getRouterState } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");
      const state = getRouterState();
      expect(state.port).toBe(8080);
    });

    it("should have url property as null initially", async () => {
      // Test objective: Verify state includes url property as null initially
      // This ensures URL tracking is part of the router state
      const { getRouterState } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");
      const state = getRouterState();
      expect(state.url).toBeNull();
    });
  });

  describe("getServerUrl", () => {
    it("should return null when server not started", async () => {
      // Test objective: Verify getServerUrl returns null when server not started
      // This ensures proper handling when server is not running
      const { getServerUrl } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");
      const url = getServerUrl();
      expect(url).toBeNull();
    });
  });

  describe("getServerProcess", () => {
    it("should return null when server not started", async () => {
      // Test objective: Verify getServerProcess returns null when server not started
      // This ensures proper handling when server is not running
      const { getServerProcess } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");
      const process = getServerProcess();
      expect(process).toBeNull();
    });
  });

  describe("startLlamaServerRouter", () => {
    it("should be an async function that returns a Promise", async () => {
      // Test objective: Verify startLlamaServerRouter is an async function
      // This ensures proper async handling for the router startup
      const { startLlamaServerRouter } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");
      const result = startLlamaServerRouter("/test", { getConfig: () => ({}) }, {});
      expect(result).toBeInstanceOf(Promise);
    });

    it("should return error when models directory does not exist", async () => {
      // Test objective: Verify start fails when models directory is missing
      // This ensures proper validation of the models directory path
      const { startLlamaServerRouter } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");
      const result = await startLlamaServerRouter("/nonexistent", { getConfig: () => ({}) }, {});
      expect(result.success).toBe(false);
      expect(result.error).toContain("Models directory not found");
    });

    it("should accept modelsDir, db, and options parameters", async () => {
      // Test objective: Verify startLlamaServerRouter accepts correct parameters
      // This ensures the API is properly defined
      const { startLlamaServerRouter } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");
      const result = startLlamaServerRouter("/test", { getConfig: () => ({}) }, { maxModels: 2 });
      expect(result).toBeInstanceOf(Promise);
    });
  });
});
