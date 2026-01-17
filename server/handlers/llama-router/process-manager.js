/**
 * Process Manager for llama-server.
 * Handles spawning, monitoring, and cleanup of llama-server child process.
 * @class
 */
export class LlamaServerProcessManager {
  /**
   * Create a new LlamaServerProcessManager.
   * @param {Object} config - Configuration object for the process manager.
   * @param {string} [config.baseModelsPath] - Base path for models directory.
   * @param {number} [config.port=8080] - Port number for the server.
   * @param {string} [config.host="0.0.0.0"] - Host address to bind to.
   * @param {number} [config.modelsMax=4] - Maximum number of models to load.
   * @param {number} [config.ctxSize] - Context size for inference.
   * @param {number} [config.batchSize] - Batch size for inference.
   * @param {number} [config.threads] - Number of threads to use.
   * @param {number} [config.ngl] - Number of GPU layers to offload.
   */
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
   * Stop llama-server process.
   * Attempts graceful shutdown with SIGTERM, then force kills with SIGKILL if needed.
   */
  async stop() {
    if (!this.isRunning) {
      console.log("[DEBUG] llama-server not running");
      return;
    }

    console.log("[DEBUG] Stopping llama-server, PID:", this.pid);

    // Try graceful shutdown first
    if (this.process.kill("SIGTERM")) {
      // Wait 1 second for graceful shutdown (reduced from 5 seconds)
      await new Promise((r) => setTimeout(r, 1000));

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
   * Check if process is running and get status information.
   * @returns {Object} Status object with isRunning, pid, uptime, and metrics.
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
   * Parse output for metrics and logs.
   * @param {string} line - Output line from the process.
   * @param {string} source - Source stream ("stdout" or "stderr").
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
   * Attempt to parse metrics from output lines.
   * This is implementation-dependent based on actual llama-server output format.
   * @param {string} line - Output line to parse for metrics.
   */
  _tryParseMetrics(line) {
    // This is implementation-dependent based on actual llama-server output format
    // We'll update based on actual observed output
  }

  /**
   * Cleanup resources when process stops.
   * Destroys stdout and stderr streams to free resources.
   */
  _cleanup() {
    if (this.process) {
      this.process.stdout.destroy();
      this.process.stderr.destroy();
    }
  }
}
