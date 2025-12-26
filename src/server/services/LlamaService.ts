import { spawn, ChildProcess } from "child_process";
import axios from "axios";
import type { AxiosInstance } from "axios";
import fs from "fs";
import path from "path";

export interface LlamaServerConfig {
  host: string;
  port: number;
  modelPath?: string;
  basePath?: string; // Path where models are stored (for auto-discovery)
  serverPath?: string;
  serverArgs?: string[];
  // Full llama-server configuration options
  ctx_size?: number;
  batch_size?: number;
  ubatch_size?: number;
  threads?: number;
  threads_batch?: number;
  gpu_layers?: number;
  main_gpu?: number;
  flash_attn?: "on" | "off" | "auto";
  n_predict?: number;
  temperature?: number;
  top_k?: number;
  top_p?: number;
  repeat_penalty?: number;
  seed?: number;
  verbose?: boolean;
  embedding?: boolean;
  cache_type_k?: string;
  cache_type_v?: string;
  [key: string]: any;
}

export interface LlamaModel {
  id: string;
  name: string;
  size: number;
  type: string;
  modified_at: number;
}

export type LlamaServiceStatus =
  | "initial"
  | "starting"
  | "ready"
  | "error"
  | "crashed"
  | "stopping";

export interface LlamaServiceState {
  status: LlamaServiceStatus;
  models: LlamaModel[];
  lastError: string | null;
  retries: number;
  uptime: number;
  startedAt: Date | null;
}

export class LlamaService {
  private config: LlamaServerConfig;
  private process: ChildProcess | null = null;
  private client: AxiosInstance;
  private state: LlamaServiceState = {
    status: "initial",
    models: [],
    lastError: null,
    retries: 0,
    uptime: 0,
    startedAt: null,
  };

  private maxRetries = 5;
  private retryBackoffMs = 1000;
  private maxRetryWait = 30000;
  private healthCheckTimeoutMs = 5000;
  private maxHealthChecks = 60; // 60 seconds max wait
  private healthCheckIntervalMs = 1000;
  private statusChangeCallbacks: ((state: LlamaServiceState) => void)[] = [];
  private uptimeInterval: NodeJS.Timer | null = null;

  constructor(config: LlamaServerConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: `http://${config.host}:${config.port}`,
      timeout: this.healthCheckTimeoutMs,
      validateStatus: () => true, // Don't throw on any status code
    });

    this.logger("info", "🔧 LlamaService initialized");
  }

  /**
   * Register callback for state changes
   */
  onStateChange(callback: (state: LlamaServiceState) => void): void {
    this.statusChangeCallbacks.push(callback);
  }

  /**
   * Get current state
   */
  getState(): LlamaServiceState {
    return { ...this.state };
  }

  /**
   * Start llama.cpp server
   */
  async start(): Promise<void> {
    if (this.state.status === "ready") {
      this.logger("info", "✅ Llama server already running");
      return;
    }

    if (this.state.status === "starting") {
      this.logger("warn", "⏳ Llama server is already starting");
      return;
    }

    this.updateState("starting");

    try {
      // Check if server is already running
      const isAlive = await this.healthCheck();
      if (isAlive) {
        this.logger("info", "✅ Llama server already running");
        await this.loadModels();
        this.updateState("ready");
        this.startUptimeTracking();
        return;
      }

      // Spawn new process
      await this.spawnServer();
      this.startUptimeTracking();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      this.logger("error", `❌ Failed to start llama server: ${message}`);
      this.updateState("error", message);
      await this.handleCrash();
    }
  }

  /**
   * Stop llama.cpp server
   */
  async stop(): Promise<void> {
    this.logger("info", "🛑 Stopping llama server...");
    this.updateState("stopping");

    if (this.uptimeInterval) {
      clearInterval(this.uptimeInterval as NodeJS.Timeout);
      this.uptimeInterval = null;
    }

    if (this.process) {
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          this.logger("warn", "⏱️ Force killing llama server process");
          this.process?.kill("SIGKILL");
          this.process = null;
          resolve();
        }, 5000);

        this.process!.on("exit", () => {
          clearTimeout(timeout);
          this.logger("info", "✅ Llama server stopped");
          this.process = null;
          resolve();
        });

        this.process!.kill("SIGTERM");
      });
    }

    this.updateState("initial");
  }

  /**
   * Check if server is healthy
   */
  private async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get("/health");
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Spawn new llama-server process
   */
  private async spawnServer(): Promise<void> {
    const args = this.buildArgs();
    const serverBinary = this.config.serverPath || "llama-server";
    this.logger("info", `🚀 Spawning ${serverBinary} with args: ${args.join(" ")}`);

    this.process = spawn(serverBinary, args, {
      stdio: ["ignore", "pipe", "pipe"],
      detached: false,
    });

    // Handle process errors
    this.process.on("error", (error) => {
      this.logger("error", `Process error: ${error.message}`);
      this.handleCrash();
    });

    // Handle process exit
    this.process.on("exit", (code, signal) => {
      this.logger(
        "warn",
        `Process exited with code ${code} signal ${signal}`
      );
      if (this.state.status !== "stopping") {
        this.handleCrash();
      }
    });

    // Log stdout
    this.process.stdout?.on("data", (data) => {
      const message = data.toString().trim();
      if (message) {
        this.logger("debug", `[llama-server] ${message}`);
      }
    });

    // Log stderr
    this.process.stderr?.on("data", (data) => {
      const message = data.toString().trim();
      if (message) {
        this.logger("warn", `[llama-server-err] ${message}`);
      }
    });

    // Wait for server to be ready
    await this.waitForReady();

    // Load models after server is ready
    await this.loadModels();

    this.updateState("ready");
    this.logger("info", "✅ Llama server is ready and models loaded");
  }

  /**
   * Wait for server to respond to health checks
   */
  private async waitForReady(): Promise<void> {
    let attempts = 0;

    while (attempts < this.maxHealthChecks) {
      try {
        const isHealthy = await this.healthCheck();
        if (isHealthy) {
          this.logger("info", `✅ Server ready after ${attempts} checks`);
          return;
        }
      } catch {
        // Expected during startup
      }

      attempts++;
      await new Promise((resolve) =>
        setTimeout(resolve, this.healthCheckIntervalMs)
      );
    }

    throw new Error(
      `Llama server did not respond after ${this.maxHealthChecks * this.healthCheckIntervalMs / 1000}s`
    );
  }

  /**
    * Load available models from llama-server
    * Uses the /models endpoint (not /api/models)
    */
  private async loadModels(): Promise<void> {
    try {
      this.logger("info", "🔍 Querying llama-server for available models...");
      
      // Try the correct endpoint: /models (OpenAI-compatible)
      const response = await this.client.get("/models");

      if (response.status === 200 && response.data) {
        // Handle both array and object with data property
        const modelsData = Array.isArray(response.data) 
          ? response.data 
          : response.data.data || response.data;

        if (Array.isArray(modelsData) && modelsData.length > 0) {
          this.state.models = modelsData.map((model) => ({
            id: model.id || model.name,
            name: model.id || model.name,
            size: model.size || 0,
            type: model.type || "unknown",
            modified_at: Math.floor(Date.now() / 1000),
          }));

          this.logger(
            "info",
            `✅ Loaded ${this.state.models.length} model(s) from llama-server`
          );

          this.state.models.forEach((model) => {
            const sizeGb = model.size > 0 
              ? (model.size / 1024 / 1024 / 1024).toFixed(2) 
              : "unknown";
            this.logger("info", `  - ${model.name} (${sizeGb} GB)`);
          });
        } else {
          this.logger(
            "warn",
            "⚠️ No models found on server. Check --models-dir configuration."
          );
          this.state.models = [];
        }
      } else {
        this.logger(
          "warn",
          `⚠️ Failed to fetch models: HTTP ${response.status}`
        );
        this.state.models = [];
      }

      this.emitStateChange();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      this.logger("warn", `Failed to load models from server: ${message}`);
      // Fallback: scan filesystem
      this.loadModelsFromFilesystem();
    }
  }

  /**
   * Fallback: Load models by scanning the filesystem
   */
  private loadModelsFromFilesystem(): void {
    try {
      if (!this.config.basePath) {
        this.logger(
          "warn",
          "⚠️ No basePath configured. Cannot discover models."
        );
        this.state.models = [];
        return;
      }

      this.logger(
        "info",
        `📂 Fallback: Scanning filesystem for models in: ${this.config.basePath}`
      );

      // Check if directory exists
      if (!fs.existsSync(this.config.basePath)) {
        this.logger(
          "warn",
          `⚠️ Models directory not found: ${this.config.basePath}`
        );
        this.state.models = [];
        return;
      }

      // Scan directory for model files
      const files = fs.readdirSync(this.config.basePath);
      const modelFiles = files.filter(
        (file) => file.endsWith(".gguf") || file.endsWith(".bin")
      );

      // Convert files to model objects
      this.state.models = modelFiles.map((file) => {
        const fullPath = path.join(this.config.basePath || "", file);
        const stats = fs.statSync(fullPath);
        return {
          id: file,
          name: file.replace(/\.(gguf|bin)$/i, ""),
          size: stats.size,
          type: file.endsWith(".gguf") ? "gguf" : "bin",
          modified_at: Math.floor(stats.mtimeMs / 1000),
        };
      });

      this.logger(
        "info",
        `✅ Loaded ${this.state.models.length} model(s) from filesystem`
      );

      this.state.models.forEach((model) => {
        this.logger(
          "info",
          `  - ${model.name} (${(model.size / 1024 / 1024 / 1024).toFixed(2)} GB)`
        );
      });

      this.emitStateChange();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      this.logger("warn", `Failed to load models from filesystem: ${message}`);
      this.state.models = [];
    }
  }

  /**
   * Handle process crash with exponential backoff
   */
  private async handleCrash(): Promise<void> {
    this.process = null;

    if (this.state.retries >= this.maxRetries) {
      this.logger(
        "error",
        `❌ Max retries (${this.maxRetries}) exceeded. Giving up.`
      );
      this.updateState("error", "Max retries exceeded");
      return;
    }

    this.state.retries++;
    const delayMs = Math.min(
      this.retryBackoffMs * Math.pow(2, this.state.retries - 1),
      this.maxRetryWait
    );

    this.logger(
      "info",
      `🔄 Retry ${this.state.retries}/${this.maxRetries} in ${delayMs / 1000}s`
    );
    this.updateState("crashed");

    await new Promise((resolve) => setTimeout(resolve, delayMs));

    try {
      await this.start();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      this.logger("error", `Retry failed: ${message}`);
      await this.handleCrash();
    }
  }

  /**
   * Build command line arguments for llama-server from config
   */
  private buildArgs(): string[] {
    const args: string[] = [];

    // Explicit model file takes precedence
    if (this.config.modelPath) {
      args.push("-m", this.config.modelPath);
    }
    // Otherwise, specify models directory for llama-server to discover
    else if (this.config.basePath) {
      args.push("--models-dir", this.config.basePath);
    }

    // Server binding
    args.push("--host", this.config.host);
    args.push("--port", String(this.config.port));

    // Basic options
    if (this.config.ctx_size !== undefined) {
      args.push("-c", String(this.config.ctx_size));
    }
    if (this.config.batch_size !== undefined) {
      args.push("-b", String(this.config.batch_size));
    }
    if (this.config.ubatch_size !== undefined) {
      args.push("--ubatch-size", String(this.config.ubatch_size));
    }

    // Threading
    if (this.config.threads !== undefined && this.config.threads !== -1) {
      args.push("-t", String(this.config.threads));
    }
    if (this.config.threads_batch !== undefined && this.config.threads_batch !== -1) {
      args.push("--threads-batch", String(this.config.threads_batch));
    }

    // GPU options
    if (this.config.gpu_layers !== undefined && this.config.gpu_layers !== -1) {
      args.push("-ngl", String(this.config.gpu_layers));
    }
    if (this.config.main_gpu !== undefined && this.config.main_gpu !== 0) {
      args.push("-mg", String(this.config.main_gpu));
    }

    // Flash attention
    if (this.config.flash_attn === "on") {
      args.push("-fa");
    } else if (this.config.flash_attn === "off") {
      args.push("--no-flash-attn");
    }

    // Sampling defaults
    if (this.config.temperature !== undefined) {
      args.push("--temp", String(this.config.temperature));
    }
    if (this.config.top_k !== undefined) {
      args.push("--top-k", String(this.config.top_k));
    }
    if (this.config.top_p !== undefined) {
      args.push("--top-p", String(this.config.top_p));
    }
    if (this.config.repeat_penalty !== undefined) {
      args.push("--repeat-penalty", String(this.config.repeat_penalty));
    }

    // Prediction
    if (this.config.n_predict !== undefined && this.config.n_predict !== -1) {
      args.push("-n", String(this.config.n_predict));
    }

    // Seed
    if (this.config.seed !== undefined && this.config.seed !== -1) {
      args.push("--seed", String(this.config.seed));
    }

    // Embedding mode
    if (this.config.embedding) {
      args.push("--embedding");
    }

    // Cache types
    if (this.config.cache_type_k) {
      args.push("--cache-type-k", this.config.cache_type_k);
    }
    if (this.config.cache_type_v) {
      args.push("--cache-type-v", this.config.cache_type_v);
    }

    // Verbose logging
    if (this.config.verbose) {
      args.push("--verbose");
    }

    // Additional options
    if (this.config.penalize_nl) {
      args.push("--penalize-nl");
    }
    if (this.config.ignore_eos) {
      args.push("--ignore-eos");
    }
    if (this.config.mlock) {
      args.push("--mlock");
    }
    if (this.config.numa) {
      args.push("--numa");
    }
    if (this.config.memory_mapped) {
      args.push("--memory-mapped");
    }
    if (this.config.use_mmap === false) {
      args.push("--no-mmap");
    }
    if (this.config.grp_attn_n && this.config.grp_attn_n !== 1) {
      args.push("--grp-attn-n", String(this.config.grp_attn_n));
    }
    if (this.config.grp_attn_w && this.config.grp_attn_w !== 512) {
      args.push("--grp-attn-w", String(this.config.grp_attn_w));
    }
    if (this.config.neg_prompt_multiplier && this.config.neg_prompt_multiplier !== 1.0) {
      args.push("--neg-prompt-multiplier", String(this.config.neg_prompt_multiplier));
    }
    if (this.config.min_p && this.config.min_p > 0) {
      args.push("--min-p", String(this.config.min_p));
    }
    if (this.config.xtc_probability && this.config.xtc_probability > 0) {
      args.push("--xtc-probability", String(this.config.xtc_probability));
    }
    if (this.config.xtc_threshold && this.config.xtc_threshold !== 0.1) {
      args.push("--xtc-threshold", String(this.config.xtc_threshold));
    }
    if (this.config.typical_p && this.config.typical_p !== 1.0) {
      args.push("--typical-p", String(this.config.typical_p));
    }
    if (this.config.presence_penalty && this.config.presence_penalty !== 0) {
      args.push("--presence-penalty", String(this.config.presence_penalty));
    }
    if (this.config.frequency_penalty && this.config.frequency_penalty !== 0) {
      args.push("--frequency-penalty", String(this.config.frequency_penalty));
    }
    if (this.config.dry_multiplier && this.config.dry_multiplier > 0) {
      args.push("--dry-multiplier", String(this.config.dry_multiplier));
    }
    if (this.config.dry_base && this.config.dry_base !== 1.75) {
      args.push("--dry-base", String(this.config.dry_base));
    }
    if (this.config.dry_allowed_length && this.config.dry_allowed_length !== 2) {
      args.push("--dry-allowed-length", String(this.config.dry_allowed_length));
    }
    if (this.config.dry_penalty_last_n && this.config.dry_penalty_last_n !== 20) {
      args.push("--dry-penalty-last-n", String(this.config.dry_penalty_last_n));
    }
    if (this.config.repeat_last_n && this.config.repeat_last_n !== 64) {
      args.push("--repeat-last-n", String(this.config.repeat_last_n));
    }
    if (this.config.rope_freq_base && this.config.rope_freq_base > 0) {
      args.push("--rope-freq-base", String(this.config.rope_freq_base));
    }
    if (this.config.rope_freq_scale && this.config.rope_freq_scale > 0) {
      args.push("--rope-freq-scale", String(this.config.rope_freq_scale));
    }
    if (this.config.yarn_ext_factor && this.config.yarn_ext_factor > 0) {
      args.push("--yarn-ext-factor", String(this.config.yarn_ext_factor));
    }
    if (this.config.yarn_attn_factor && this.config.yarn_attn_factor > 0) {
      args.push("--yarn-attn-factor", String(this.config.yarn_attn_factor));
    }
    if (this.config.yarn_beta_fast && this.config.yarn_beta_fast > 0) {
      args.push("--yarn-beta-fast", String(this.config.yarn_beta_fast));
    }
    if (this.config.yarn_beta_slow && this.config.yarn_beta_slow > 0) {
      args.push("--yarn-beta-slow", String(this.config.yarn_beta_slow));
    }
    if (this.config.no_kv_offload) {
      args.push("--no-kv-offload");
    }
    if (this.config.ml_lock) {
      args.push("--ml-lock");
    }

    // Custom server arguments (can override above)
    if (this.config.serverArgs) {
      args.push(...this.config.serverArgs);
    }

    return args;
  }

  /**
   * Update internal state and emit changes
   */
  private updateState(
    status: LlamaServiceStatus,
    error: string | null = null
  ): void {
    this.state.status = status;
    if (error) {
      this.state.lastError = error;
    }
    if (status === "ready") {
      this.state.retries = 0;
    }
    this.emitStateChange();
  }

  /**
   * Emit state change to callbacks
   */
  private emitStateChange(): void {
    this.statusChangeCallbacks.forEach((callback) => {
      try {
        callback(this.getState());
      } catch (error) {
        this.logger("error", `Error in state change callback: ${error}`);
      }
    });
  }

  /**
   * Start tracking uptime
   */
  private startUptimeTracking(): void {
    if (this.uptimeInterval) {
      clearInterval(this.uptimeInterval as NodeJS.Timeout);
    }

    this.state.startedAt = new Date();
    this.uptimeInterval = setInterval(() => {
      if (this.state.startedAt) {
        this.state.uptime = Math.floor(
          (Date.now() - this.state.startedAt.getTime()) / 1000
        );
        this.emitStateChange();
      }
    }, 1000);
  }

  /**
   * Logging utility
   */
  private logger(
    level: "info" | "warn" | "error" | "debug",
    message: string
  ): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [LlamaService] ${message}`;

    switch (level) {
      case "info":
        console.log(prefix);
        break;
      case "warn":
        console.warn(prefix);
        break;
      case "error":
        console.error(prefix);
        break;
      case "debug":
        console.debug(prefix);
        break;
    }
  }
}
