import { getLogger } from "@/lib/logger";
import { ProcessManager } from "./llama/ProcessManager";
import { HealthCheck } from "./llama/HealthCheck";
import { ModelLoader } from "./llama/ModelLoader";
import { StateManager } from "./llama/StateManager";
import { RetryHandler } from "./llama/RetryHandler";
import { HttpService } from "./llama/HttpService";
import type {
  LlamaServerConfig,
  LlamaModel,
  LlamaServiceState,
} from "./llama/types";

const logger = getLogger();

// Export types for backward compatibility
export type { LlamaServerConfig, LlamaModel, LlamaServiceState };

/**
 * LlamaService - Main orchestrator for llama.cpp server management
 * Coordinates between specialized service modules
 */
export class LlamaService {
  private processManager: ProcessManager;
  private healthCheck: HealthCheck;
  private modelLoader: ModelLoader;
  private stateManager: StateManager;
  private retryHandler: RetryHandler;
  private httpService: HttpService;

  constructor(config: LlamaServerConfig) {
    this.processManager = new ProcessManager(config);
    this.httpService = new HttpService(config.host, config.port);
    this.healthCheck = new HealthCheck(
      () => this.httpService.healthCheck(),
      60,
      1000
    );
    this.modelLoader = new ModelLoader(config.basePath, () =>
      this.httpService.getModels()
    );
    this.stateManager = new StateManager();
    this.retryHandler = new RetryHandler(5, 1000, 30000);

    logger.info("🔧 LlamaService initialized");
  }

  /**
   * Register callback for state changes
   */
  onStateChange(callback: (state: LlamaServiceState) => void): void {
    this.stateManager.onStateChange(callback);
  }

  /**
   * Get current state
   */
  getState(): LlamaServiceState {
    return this.stateManager.getState();
  }

  /**
   * Start llama.cpp server
   */
  async start(): Promise<void> {
    const status = this.stateManager.getStatus();

    if (status === "ready") {
      logger.info("✅ Llama server already running");
      return;
    }

    if (status === "starting") {
      logger.warn("⏳ Llama server is already starting");
      return;
    }

    this.stateManager.updateState("starting");

    try {
      // Check if server is already running
      const isAlive = await this.healthCheck.check();
      if (isAlive) {
        logger.info("✅ Llama server already running");
        await this.loadModels();
        this.stateManager.updateState("ready");
        this.stateManager.startUptimeTracking();
        return;
      }

      // Spawn new process
      await this.spawnServer();
      this.stateManager.startUptimeTracking();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      logger.error(`❌ Failed to start llama server: ${message}`);
      this.stateManager.updateState("error", message);
      await this.handleCrash();
    }
  }

  /**
   * Stop llama.cpp server
   */
  async stop(): Promise<void> {
    this.stateManager.updateState("stopping");

    this.stateManager.stopUptimeTracking();

    await this.processManager.stop();

    this.stateManager.reset();
  }

  /**
   * Spawn new llama-server process
   */
  private async spawnServer(): Promise<void> {
    await this.processManager.spawnServer(
      async () => {
        // Wait for server to be ready
        await this.healthCheck.waitForReady();

        // Load models after server is ready
        await this.loadModels();

        this.stateManager.updateState("ready");
        logger.info("✅ Llama server is ready and models loaded");
      },
      (_error: Error) => {
        this.handleCrash();
      },
      (_code: number | null, _signal: NodeJS.Signals | null) => {
        if (this.stateManager.getStatus() !== "stopping") {
          this.handleCrash();
        }
      }
    );
  }

  /**
   * Load available models
   */
  private async loadModels(): Promise<void> {
    const models = await this.modelLoader.loadModels();
    this.stateManager.updateModels(models);
  }

  /**
   * Handle process crash with exponential backoff
   */
  private async handleCrash(): Promise<void> {
    this.stateManager.updateState("crashed");

    await this.retryHandler.retry(
      this.stateManager.getRetries(),
      async () => {
        await this.start();
      },
      () => {
        this.stateManager.updateState("error", "Max retries exceeded");
      }
    );
  }
}
