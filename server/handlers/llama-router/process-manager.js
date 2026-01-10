/**
 * Process Manager for llama-server
 * Handles spawning, monitoring, and cleanup of llama-server child process
 */

import { spawn } from "child_process";

export class LlamaServerProcessManager {
  constructor(config) {
    this.config = config;
    this.process = null;
    this.stdoutLines = [];
    this.stderrLines = [];
    this.metrics = null;
    this.isRunning = false;
    this.startTime = null;
    this.pid = null;
  }

  /**
   * Start llama-server as child process
   * @returns {Promise<ChildProcess>}
   */
  async start() {
    if (this.isRunning) {
      console.log("[DEBUG] llama-server already running, PID:", this.pid);
      return this.process;
    }

    const args = this._buildArgs();
    console.log("[DEBUG] Starting llama-server with args:", args);

    this.process = spawn("llama-server", args, {
      cwd: this.config.baseModelsPath || process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        LLAMA_METRICS_ENABLED: "1",
      },
    });

    this.pid = this.process.pid;
    this.startTime = Date.now();
    this.isRunning = true;

    // Capture stdout
    this.process.stdout.on("data", (data) => {
      const line = data.toString();
      this.stdoutLines.push(line);
      this._parseOutput(line, "stdout");
    });

    // Capture stderr
    this.process.stderr.on("data", (data) => {
      const line = data.toString();
      this.stderrLines.push(line);
      this._parseOutput(line, "stderr");
    });

    // Handle process exit
    this.process.on("exit", (code, signal) => {
      console.log("[DEBUG] llama-server exited:", { code, signal });
      this.isRunning = false;
      this._cleanup();
    });

    // Handle process errors
    this.process.on("error", (error) => {
      console.error("[DEBUG] llama-server error:", error);
      this.isRunning = false;
    });

    return this.process;
  }

  /**
   * Stop llama-server process
   */
  async stop() {
    if (!this.isRunning) {
      console.log("[DEBUG] llama-server not running");
      return;
    }

    console.log("[DEBUG] Stopping llama-server, PID:", this.pid);

    // Try graceful shutdown first
    if (this.process.kill("SIGTERM")) {
      // Wait 5 seconds for graceful shutdown
      await new Promise((r) => setTimeout(r, 5000));

      // Force kill if still running
      if (this.isRunning) {
        console.warn("[DEBUG] Force killing llama-server");
        this.process.kill("SIGKILL");
      }
    }

    this.isRunning = false;
    this._cleanup();
  }

  /**
   * Check if process is running
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      pid: this.pid,
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      metrics: this.metrics,
    };
  }

  /**
   * Build command-line arguments for llama-server
   */
  _buildArgs() {
    const args = [];

    // Router mode settings
    args.push("--models-dir", this.config.baseModelsPath || "./models");
    args.push("--models-max", String(this.config.modelsMax || 4));
    args.push("--port", String(this.config.port || 8080));
    args.push("--host", this.config.host || "0.0.0.0");

    // Model settings
    if (this.config.ctxSize) {
      args.push("--ctx-size", String(this.config.ctxSize));
    }
    if (this.config.batchSize) {
      args.push("--batch-size", String(this.config.batchSize));
    }
    if (this.config.threads) {
      args.push("--threads", String(this.config.threads));
    }

    // GPU settings
    if (this.config.ngl) {
      args.push("-ngl", String(this.config.ngl));
    }

    // Metrics (if supported)
    args.push("--verbose");

    console.log("[DEBUG] llama-server args:", args);

    return args;
  }

  /**
   * Parse output for metrics and logs
   */
  _parseOutput(line, source) {
    // Store for log pages
    const logEntry = {
      level: source === "stderr" ? "error" : "info",
      message: line,
      source: "llama-server",
      timestamp: Date.now(),
    };

    // Emit to logs via socket
    if (global.io) {
      global.io.emit("logs:entry", {
        type: "broadcast",
        data: { entry: logEntry },
      });
    }

    // Try to parse metrics from output
    this._tryParseMetrics(line);
  }

  /**
   * Attempt to parse metrics from output lines
   */
  _tryParseMetrics(line) {
    // This is implementation-dependent based on actual llama-server output format
    // We'll update based on actual observed output
  }

  /**
   * Cleanup resources
   */
  _cleanup() {
    if (this.process) {
      this.process.stdout.destroy();
      this.process.stderr.destroy();
    }
  }
}
