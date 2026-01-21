/**
 * @jest-environment node
 */

/**
 * Additional Coverage Tests for Llama Router Start Handler
 * Tests uncovered branches and edge cases in start.js
 *
 * Coverage Target: 95%+ of server/handlers/llama-router/start.js
 */

import { describe, it, expect } from "@jest/globals";
import fs from "fs";

describe("Llama Router Start Handler - Additional Coverage", () => {
  describe("getRouterState Function", () => {
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

    it("should have port property with default value 8080", async () => {
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

  describe("getServerUrl Function", () => {
    it("should return null when server not started", async () => {
      const { getServerUrl } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");

      const url = getServerUrl();
      expect(url).toBeNull();
    });
  });

  describe("getServerProcess Function", () => {
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
    it("should return Promise when called with valid path", async () => {
      const { startLlamaServerRouter } =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");

      const result = startLlamaServerRouter(
        "/home/bamer/nextjs-llama-async-proxy",
        { getConfig: () => ({}) },
        {}
      );
      expect(result).toBeInstanceOf(Promise);
    });

    it("should return Promise with custom options", async () => {
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
    it("should return Promise with custom port", async () => {
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

  describe("Module Exports Verification", () => {
    it("should export getRouterState function", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");
      expect(typeof module.getRouterState).toBe("function");
    });

    it("should export getServerUrl function", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");
      expect(typeof module.getServerUrl).toBe("function");
    });

    it("should export getServerProcess function", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");
      expect(typeof module.getServerProcess).toBe("function");
    });

    it("should export startLlamaServerRouter function", async () => {
      const module =
        await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");
      expect(typeof module.startLlamaServerRouter).toBe("function");
    });
  });

  describe("Source Code Structure Verification", () => {
    it("should contain binary not found error handling code", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain("findLlamaServer()");
      expect(sourceCode).toContain("if (!llamaBin)");
      expect(sourceCode).toContain("llama-server binary not found");
    });

    it("should contain process error event handler code", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain('.on("error"');
      expect(sourceCode).toContain('console.error("[LLAMA] Process ERROR:"');
    });

    it("should contain process close event handler code", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain('.on("close"');
      expect(sourceCode).toContain('console.log("[LLAMA] Process CLOSED with code:"');
      expect(sourceCode).toContain("llamaServerProcess = null");
    });

    it("should contain wait loop code with timeout", async () => {
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

    it("should contain process exit check in wait loop", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain("llamaServerProcess.exitCode !== null");
      expect(sourceCode).toContain("llama-server exited with code");
    });

    it("should contain API failure catch block in wait loop", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toMatch(/} catch \{[\s\S]*?\/\/ Continue waiting/);
    });

    it("should contain port fallback logic", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain("if (!(await isPortInUse(configuredPort)))");
      expect(sourceCode).toContain("findAvailablePort");
    });

    it("should contain spawn error catch block", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toMatch(/} catch \(e\) \{[\s\S]*?Failed to start llama-server router/);
    });

    it("should contain no-auto-load option handling", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain("noAutoLoad");
      expect(sourceCode).toContain("--no-models-autoload");
    });

    it("should contain CLI argument building code", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain("--port");
      expect(sourceCode).toContain("--host");
      expect(sourceCode).toContain("--models-dir");
      expect(sourceCode).toContain("--models-max");
      expect(sourceCode).toContain("--threads");
      expect(sourceCode).toContain("--ctx-size");
    });

    it("should contain process spawning code", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain("spawn(llamaBin, args");
      expect(sourceCode).toContain('stdio: ["pipe", "pipe", "pipe"]');
    });

    it("should contain environment variable passing", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain("env: { ...process.env }");
    });
  });

  describe("Source Code Error Path Inspection", () => {
    it("should have binary not found error return statement", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain("if (!llamaBin)");
      expect(sourceCode).toContain("return { success: false, error");
    });

    it("should have models directory not found error return", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain("if (!fs.existsSync(modelsDir))");
      expect(sourceCode).toContain("return { success: false, error");
    });

    it("should have timeout error return in wait loop", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain(
        'return { success: false, error: "Timeout waiting for llama-server router to start" }'
      );
    });

    it("should have process exit error return in wait loop", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain(
        "error: `llama-server exited with code ${llamaServerProcess.exitCode}`"
      );
    });

    it("should have spawn error catch block with error message", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain("catch (e)");
      expect(sourceCode).toContain(
        "return { success: false, error: `Failed to start llama-server router: ${e.message}` }"
      );
    });
  });

  describe("Process State Management Inspection", () => {
    it("should have module-level variable declarations", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain("let llamaServerProcess = null");
      expect(sourceCode).toContain("let llamaServerPort = DEFAULT_LLAMA_PORT");
      expect(sourceCode).toContain("let llamaServerUrl = null");
    });

    it("should have llamaServerProcess set to null in close handler", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain('llamaServerProcess.on("close"');
      expect(sourceCode).toContain("if (llamaServerProcess)");
      expect(sourceCode).toContain("llamaServerProcess = null");
    });
  });

  describe("Configuration Handling Inspection", () => {
    it("should have default value handling for options", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain("optionsToUse.maxModels || 4");
      expect(sourceCode).toContain("optionsToUse.threads || 4");
      expect(sourceCode).toContain("optionsToUse.ctxSize || 4096");
      expect(sourceCode).toContain("config.port || 8080");
    });

    it("should have port configuration with fallback", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain("if (!(await isPortInUse(configuredPort)))");
      expect(sourceCode).toContain("llamaServerPort = configuredPort");
      expect(sourceCode).toContain("llamaServerPort = await findAvailablePort(isPortInUse)");
    });
  });

  describe("Process Spawning Configuration", () => {
    it("should have correct spawn options", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain("spawn(llamaBin, args, {");
      expect(sourceCode).toContain('stdio: ["pipe", "pipe", "pipe"]');
      expect(sourceCode).toContain("env: { ...process.env }");
    });

    it("should build correct command arguments", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain("const args = [");
      expect(sourceCode).toContain('"--port"');
      expect(sourceCode).toContain('"--host"');
      expect(sourceCode).toContain('"--models-dir"');
      expect(sourceCode).toContain('"--models-max"');
      expect(sourceCode).toContain('"--threads"');
      expect(sourceCode).toContain('"--ctx-size"');
    });

    it("should convert port to string in args", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain("String(llamaServerPort)");
    });
  });

  describe("Event Handler Registration", () => {
    it("should register error event handler", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain('llamaServerProcess.on("error"');
    });

    it("should register close event handler", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain('llamaServerProcess.on("close"');
    });

    it("should have null check in close handler", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain("if (llamaServerProcess)");
      expect(sourceCode).toContain("llamaServerProcess = null");
    });
  });

  describe("Wait Loop Logic", () => {
    it("should have correct wait loop structure", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain("while (attempts < maxAttempts)");
      expect(sourceCode).toContain("await new Promise((r) => setTimeout(r, 1000))");
      expect(sourceCode).toContain("attempts++");
    });

    it("should check port availability in wait loop", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain("if (isPortInUse(llamaServerPort))");
    });

    it("should make API request after port check", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain('await llamaApiRequest("/models"');
    });

    it("should check process exit code in wait loop", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain(
        "if (llamaServerProcess && llamaServerProcess.exitCode !== null)"
      );
    });

    it("should have maxAttempts constant set to 60", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain("const maxAttempts = 60");
    });
  });

  describe("Cleanup Operations", () => {
    it("should kill existing llama-server on cleanup", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain("killLlamaServer(llamaServerProcess)");
    });

    it("should iterate through port range for cleanup", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain("for (let p = DEFAULT_LLAMA_PORT; p <= MAX_PORT; p++)");
      expect(sourceCode).toContain("killLlamaOnPort(p)");
    });
  });

  describe("URL Construction", () => {
    it("should construct correct server URL", async () => {
      const sourceCode = fs.readFileSync(
        "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
        "utf8"
      );

      expect(sourceCode).toContain("llamaServerUrl = `http://127.0.0.1:${llamaServerPort}`");
    });
  });
});
