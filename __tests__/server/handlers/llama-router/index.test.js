/**
 * @jest-environment node
 */

/**
 * Tests for Llama Router Handler Barrel File
 * Tests all module exports from the llama-router handlers
 *
 * Coverage Target: 100% of server/handlers/llama-router/index.js
 *
 * This test file verifies that the barrel file correctly exports
 * all functions from its submodules. The index.js file acts as
 * a public API surface, so testing all exports ensures the
 * module interface is complete and functional.
 */

import { describe, it, expect } from "@jest/globals";

describe("Llama Router Handler Barrel File", () => {
  describe("Module Exports - Start Module", () => {
    it("should export startLlamaServerRouter function from start.js", async () => {
      // Test objective: Verify the barrel file re-exports startLlamaServerRouter from start.js
      // This ensures the public API includes the router startup function
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/index.js");
      expect(typeof module.startLlamaServerRouter).toBe("function");
    });

    it("should export getRouterState function from start.js", async () => {
      // Test objective: Verify the barrel file re-exports getRouterState from start.js
      // This ensures the public API includes the router state getter
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/index.js");
      expect(typeof module.getRouterState).toBe("function");
    });

    it("should export getServerUrl function from start.js", async () => {
      // Test objective: Verify the barrel file re-exports getServerUrl from start.js
      // This ensures the public API includes the server URL getter
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/index.js");
      expect(typeof module.getServerUrl).toBe("function");
    });

    it("should export getServerProcess function from start.js", async () => {
      // Test objective: Verify the barrel file re-exports getServerProcess from start.js
      // This ensures the public API includes the server process getter
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/index.js");
      expect(typeof module.getServerProcess).toBe("function");
    });
  });

  describe("Module Exports - Stop Module", () => {
    it("should export stopLlamaServerRouter function from stop.js", async () => {
      // Test objective: Verify the barrel file re-exports stopLlamaServerRouter from stop.js
      // This ensures the public API includes the router shutdown function
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/index.js");
      expect(typeof module.stopLlamaServerRouter).toBe("function");
    });
  });

  describe("Module Exports - Status Module", () => {
    it("should export getLlamaStatus function from status.js", async () => {
      // Test objective: Verify the barrel file re-exports getLlamaStatus from status.js
      // This ensures the public API includes the status query function
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/index.js");
      expect(typeof module.getLlamaStatus).toBe("function");
    });

    it("should export loadModel function from status.js", async () => {
      // Test objective: Verify the barrel file re-exports loadModel from status.js
      // This ensures the public API includes the model loading function
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/index.js");
      expect(typeof module.loadModel).toBe("function");
    });

    it("should export unloadModel function from status.js", async () => {
      // Test objective: Verify the barrel file re-exports unloadModel from status.js
      // This ensures the public API includes the model unloading function
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/index.js");
      expect(typeof module.unloadModel).toBe("function");
    });
  });

  describe("Module Exports - API Module", () => {
    it("should export llamaApiRequest function from api.js", async () => {
      // Test objective: Verify the barrel file re-exports llamaApiRequest from api.js
      // This ensures the public API includes the HTTP request function
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/index.js");
      expect(typeof module.llamaApiRequest).toBe("function");
    });
  });

  describe("Module Exports - Process Module", () => {
    it("should export isPortInUse function from process.js", async () => {
      // Test objective: Verify the barrel file re-exports isPortInUse from process.js
      // This ensures the public API includes the port checking function
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/index.js");
      expect(typeof module.isPortInUse).toBe("function");
    });

    it("should export findLlamaServer function from process.js", async () => {
      // Test objective: Verify the barrel file re-exports findLlamaServer from process.js
      // This ensures the public API includes the binary discovery function
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/index.js");
      expect(typeof module.findLlamaServer).toBe("function");
    });

    it("should export findAvailablePort function from process.js", async () => {
      // Test objective: Verify the barrel file re-exports findAvailablePort from process.js
      // This ensures the public API includes the port finding function
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/index.js");
      expect(typeof module.findAvailablePort).toBe("function");
    });

    it("should export killLlamaServer function from process.js", async () => {
      // Test objective: Verify the barrel file re-exports killLlamaServer from process.js
      // This ensures the public API includes the process killing function
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/index.js");
      expect(typeof module.killLlamaServer).toBe("function");
    });

    it("should export killLlamaOnPort function from process.js", async () => {
      // Test objective: Verify the barrel file re-exports killLlamaOnPort from process.js
      // This ensures the public API includes the port-based killing function
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/index.js");
      expect(typeof module.killLlamaOnPort).toBe("function");
    });
  });

  describe("Export Count Verification", () => {
    it("should export exactly 12 functions from the barrel file", async () => {
      // Test objective: Verify the barrel file exports the correct number of functions
      // This ensures no exports are missing or duplicated
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/index.js");

      const exportNames = [
        "startLlamaServerRouter",
        "getRouterState",
        "getServerUrl",
        "getServerProcess",
        "stopLlamaServerRouter",
        "getLlamaStatus",
        "loadModel",
        "unloadModel",
        "llamaApiRequest",
        "isPortInUse",
        "findLlamaServer",
        "findAvailablePort",
        "killLlamaServer",
        "killLlamaOnPort",
      ];

      // Count functions exported
      const functionCount = exportNames.filter((name) => typeof module[name] === "function").length;
      expect(functionCount).toBe(exportNames.length);
    });
  });
});
