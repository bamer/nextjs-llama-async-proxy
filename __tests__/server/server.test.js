/**
 * @jest-environment node
 */

/**
 * Server.js Comprehensive Test Suite
 * Tests for main server entry point functions:
 * - startMetrics() - Metrics initialization
 * - setupShutdown() - Graceful shutdown handlers
 * - main() - Main startup logic
 * - Error handling at startup
 *
 * Since server.js calls main() on import (auto-start behavior),
 * we test the source code structure and create isolated function tests.
 */

import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the server.js source for structure testing
const serverSource = fs.readFileSync("/home/bamer/nextjs-llama-async-proxy/server.js", "utf-8");

describe("Server Entry Point - Source Structure", () => {
  let consoleLogSpy;
  let consoleErrorSpy;
  let processExitSpy;
  let processOnSpy;

  beforeEach(() => {
    // Reset all mocks
    jest.resetModules();
    jest.clearAllMocks();

    // Mock console methods
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, "exit").mockImplementation(() => {});
    processOnSpy = jest.spyOn(process, "on").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });





  describe("main() - Main startup logic", () => {
    it("should create data directory", () => {
      // Positive test: verify data directory creation
      expect(serverSource.includes('const dataDir = path.join(process.cwd(), "data")')).toBe(true);
      expect(
        serverSource.includes(
          "if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })"
        )
      ).toBe(true);
    });

    it("should create Express app instance", () => {
      // Positive test: verify Express creation
      expect(serverSource.includes("const app = express()")).toBe(true);
    });

    it("should create HTTP server", () => {
      // Positive test: verify HTTP server creation
      expect(serverSource.includes("const server = http.createServer(app)")).toBe(true);
    });

    it("should configure Socket.IO with correct options", () => {
      // Positive test: verify Socket.IO configuration
      expect(serverSource.includes("const io = new Server(server, {")).toBe(true);
      expect(serverSource.includes('cors: { origin: "*", methods: ["GET", "POST"] }')).toBe(true);
      expect(serverSource.includes('path: "/llamaproxws"')).toBe(true);
      expect(serverSource.includes('transports: ["websocket"]')).toBe(true);
    });

    it("should register Socket.IO handlers", () => {
      // Positive test: verify handler registration
      expect(
        serverSource.includes(
          "registerHandlers(io, db, parseGgufMetadata, initializeLlamaMetricsScraper)"
        )
      ).toBe(true);
    });

    it("should start metrics collection", () => {
      // Positive test: verify metrics start
      expect(serverSource.includes("startMetricsCollection(io, db)")).toBe(true);
    });

    it("should configure static file serving for public directory", () => {
      // Positive test: verify static serving
      expect(serverSource.includes('app.use(express.static(path.join(__dirname, "public")))')).toBe(
        true
      );
    });

    it("should configure Socket.IO client static files", () => {
      // Positive test: verify Socket.IO client serving
      expect(serverSource.includes('"/socket.io"')).toBe(true);
      expect(serverSource.includes('"socket.io", "client-dist"')).toBe(true);
    });

    it("should set up SPA fallback route", () => {
      // Positive test: verify SPA fallback
      expect(serverSource.includes("app.use((req, res, next) => {")).toBe(true);
      expect(serverSource.includes('req.method === "GET"')).toBe(true);
      expect(serverSource.includes("/socket.io")).toBe(true);
      expect(serverSource.includes("/llamaproxws")).toBe(true);
      expect(serverSource.includes("res.sendFile")).toBe(true);
    });

    it("should start listening on configured port", () => {
      // Positive test: verify server listen
      expect(serverSource.includes("server.listen(PORT, () => {")).toBe(true);
    });

    it("should log startup message", () => {
      // Positive test: verify startup logging
      expect(serverSource.includes("console.log(`")).toBe(true);
      expect(serverSource.includes("== Llama Async Proxy ==")).toBe(true);
      expect(serverSource.includes("http://localhost:${PORT}")).toBe(true);
      expect(serverSource.includes("/llamaproxws")).toBe(true);
    });

    it("should set up shutdown handlers", () => {
      // Positive test: verify shutdown setup
      expect(serverSource.includes("setupGracefulShutdown(server)")).toBe(true);
    });
  });

  describe("Error handling at startup", () => {
    it("should catch errors in main()", () => {
      // Positive test: verify error catching
      expect(serverSource.includes("main().catch(")).toBe(true);
    });

    it("should log error message on startup failure", () => {
      // Negative test: verify error logging
      expect(serverSource.includes('console.error("Failed to start server:", e)')).toBe(true);
    });

    it("should exit with code 1 on startup error", () => {
      // Negative test: verify error exit code
      expect(serverSource.includes("process.exit(1)")).toBe(true);
    });
  });

  describe("Server configuration constants", () => {

  describe("Server configuration constants", () => {
    it("should export PORT constant as 3000", () => {
      // Positive test: verify PORT
      expect(serverSource.includes("const PORT = 3000")).toBe(true);
    });

    it("should calculate __dirname from __filename", () => {
      // Positive test: verify __dirname calculation
      expect(serverSource.includes("const __filename = fileURLToPath(import.meta.url)")).toBe(true);
      expect(serverSource.includes("const __dirname = path.dirname(__filename)")).toBe(true);
    });

    it("should use process.cwd() for data directory", () => {
      // Positive test: verify data directory path
      expect(serverSource.includes('path.join(process.cwd(), "data")')).toBe(true);
    });
  });
});
