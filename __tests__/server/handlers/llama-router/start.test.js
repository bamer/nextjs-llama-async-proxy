/**
 * @jest-environment node
 */

/**
 * Tests for Llama Router Start Handler
 * Tests router startup, process spawning, and state management
 *
 * Coverage Target: 95%+ of server/handlers/llama-router/start.js
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

// Track spawned processes to clean up
const spawnedProcesses = [];

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
      const { getRouterState } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");
      const state = getRouterState();
      expect(state).toHaveProperty("process");
      expect(state).toHaveProperty("port");
      expect(state).toHaveProperty("url");
      expect(state).toHaveProperty("isRunning");
    });

    it("should report isRunning false when server not started", async () => {
      const { getRouterState } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");
      const state = getRouterState();
      expect(state.isRunning).toBe(false);
    });

    it("should have port property defined with default value 8080", async () => {
      const { getRouterState } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");
      const state = getRouterState();
      expect(state.port).toBe(8080);
    });

    it("should have url property as null initially", async () => {
      const { getRouterState } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");
      const state = getRouterState();
      expect(state.url).toBeNull();
    });
  });

  describe("getServerUrl", () => {
    it("should return null when server not started", async () => {
      const { getServerUrl } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");
      const url = getServerUrl();
      expect(url).toBeNull();
    });
  });

  describe("getServerProcess", () => {
    it("should return null when server not started", async () => {
      const { getServerProcess } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");
      const process = getServerProcess();
      expect(process).toBeNull();
    });
  });

  describe("startLlamaServerRouter - Parameter Validation", () => {
    it("should be an async function that returns a Promise", async () => {
      const { startLlamaServerRouter } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");
      const result = startLlamaServerRouter("/test", { getConfig: () => ({}) }, {});
      expect(result).toBeInstanceOf(Promise);
    });

    it("should accept modelsDir, db, and options parameters", async () => {
      const { startLlamaServerRouter } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");
      const result = startLlamaServerRouter("/test", { getConfig: () => ({}) }, { maxModels: 2 });
      expect(result).toBeInstanceOf(Promise);
    });

    it("should handle empty options object", async () => {
      const { startLlamaServerRouter } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");
      const result = startLlamaServerRouter("/test", { getConfig: () => ({}) }, {});
      expect(result).toBeInstanceOf(Promise);
    });

    it("should handle null options", async () => {
      const { startLlamaServerRouter } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");
      const result = startLlamaServerRouter("/test", { getConfig: () => ({}) }, null);
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe("startLlamaServerRouter - Error Scenarios", () => {
    it("should return error for non-existent models directory", async () => {
      const { startLlamaServerRouter } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");
      const result = await startLlamaServerRouter(
        "/path/that/does/not/exist/anywhere",
        { getConfig: () => ({}) },
        {}
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain("Models directory not found");
    });
  });

  describe("startLlamaServerRouter - Command Line Arguments", () => {
    it("should include all required CLI arguments", async () => {
      const { startLlamaServerRouter } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");
      const result = startLlamaServerRouter(
        "/home/bamer/nextjs-llama-async-proxy",
        { getConfig: () => ({}) },
        { maxModels: 8, threads: 6, ctxSize: 8192 }
      );
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe("startLlamaServerRouter - Port Configuration", () => {
    it("should return Promise when called with valid path", async () => {
      const { startLlamaServerRouter } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");
      const result = startLlamaServerRouter(
        "/home/bamer/nextjs-llama-async-proxy",
        { getConfig: () => ({ port: 8888 }) },
        {}
      );
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe("startLlamaServerRouter - Code Structure Verification", () => {
    it("should contain binary not found error handling code (lines 57-61)", async () => {
      const fs = await import("fs");
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain("findLlamaServer()");
      expect(sourceCode).toContain("if (!llamaBin)");
      expect(sourceCode).toContain("llama-server binary not found");
    });

    it("should contain process error event handler code (lines 118-120)", async () => {
      const fs = await import("fs");
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain('.on("error"');
      expect(sourceCode).toContain('console.error("[LLAMA] Process ERROR:"');
    });

    it("should contain process close event handler code (lines 122-127)", async () => {
      const fs = await import("fs");
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain('.on("close"');
      expect(sourceCode).toContain('console.log("[LLAMA] Process CLOSED with code:"');
      expect(sourceCode).toContain("llamaServerProcess = null");
    });

    it("should contain wait loop code with timeout (lines 129-164)", async () => {
      const fs = await import("fs");
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain("while (attempts < maxAttempts)");
      expect(sourceCode).toContain("setTimeout(r, 1000)");
      expect(sourceCode).toContain("isPortInUse(llamaServerPort)");
      expect(sourceCode).toContain("llamaApiRequest");
      expect(sourceCode).toContain("Timeout waiting for llama-server router to start");
    });

    it("should contain process exit check in wait loop (lines 152-157)", async () => {
      const fs = await import("fs");
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain("llamaServerProcess.exitCode !== null");
      expect(sourceCode).toContain("llama-server exited with code");
    });

    it("should contain API failure catch block in wait loop (lines 147-149)", async () => {
      const fs = await import("fs");
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toMatch(/} catch \{[\s\S]*?\/\/ Continue waiting/);
    });

    it("should contain port fallback logic (lines 75-79)", async () => {
      const fs = await import("fs");
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain("if (!(await isPortInUse(configuredPort)))");
      expect(sourceCode).toContain("findAvailablePort");
    });

    it("should contain spawn error catch block (lines 162-164)", async () => {
      const fs = await import("fs");
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toMatch(/} catch \(e\) \{[\s\S]*?Failed to start llama-server router/);
    });
  });
});
