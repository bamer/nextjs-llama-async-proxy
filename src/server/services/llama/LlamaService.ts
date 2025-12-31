import { LlamaServerConfig, LlamaServiceState } from "./types";
import { ProcessManager } from "./ProcessManager";
import { HealthCheck } from "./HealthCheck";
import { ModelLoader } from "./ModelLoader";
import { StateManager } from "./StateManager";
import { RetryHandler } from "./RetryHandler";
import { getLogger } from "@/lib/logger";

const logger = getLogger();

export class LlamaService {
  private config: LlamaServerConfig;
  private processManager: ProcessManager;
  private healthChecker: HealthCheck;
  private modelLoader: ModelLoader;
  private stateManager: StateManager;
  private retryHandler: RetryHandler;

  constructor(config: LlamaServerConfig) {
    this.config = config;
    this.processManager = new ProcessManager(config);
    this.healthChecker = new HealthCheck(
      async () => {
        try {
          const response = await fetch(`http://${config.host}:${config.port}/health`);
          return response.ok;
        } catch {
          return false;
        }
      }
    );
    this.modelLoader = new ModelLoader(config.basePath, this.loadModelsFromServer.bind(this));
    this.stateManager = new StateManager();
    this.retryHandler = new RetryHandler();

    logger.info("🔧 LlamaService initialized");
  }

  onStateChange(callback: (state: LlamaServiceState) => void): void {
    this.stateManager.onStateChange(callback);
  }

  getState(): LlamaServiceState {
    return this.stateManager.getState();
  }

  async start(): Promise<void> {
    const currentStatus = this.stateManager.getState().status;

    if (currentStatus === "ready") {
      logger.info("✅ Llama server already running");
      return;
    }

    if (currentStatus === "starting") {
      logger.warn("⏳ Llama server is already starting");
      return;
    }

    this.stateManager.updateState("starting");

    try {
      const isAlive = await this.healthChecker.check();
      if (isAlive) {
        logger.info("✅ Llama server already running");
        await this.loadModels();
        this.stateManager.updateState("ready");
        this.stateManager.startUptimeTracking();
        return;
      }

      await this.spawnServer();
      this.stateManager.startUptimeTracking();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`❌ Failed to start llama server: ${message}`);
      this.stateManager.updateState("error", message);
      await this.handleCrash();
    }
  }

  async stop(): Promise<void> {
    logger.info("🛑 Stopping llama server...");
    this.stateManager.updateState("stopping");
    this.stateManager.stopUptimeTracking();

    await this.processManager.stop();

    this.stateManager.updateState("initial");
  }

  private async spawnServer(): Promise<void> {
    await this.processManager.spawnServer(
      async () => {
        await this.healthChecker.waitForReady();
        await this.loadModels();
        this.stateManager.updateState("ready");
        logger.info("✅ Llama server is ready and models loaded");
      },
      async (error) => {
        logger.error(`Process error: ${error.message}`);
        await this.handleCrash();
      },
      async (code, signal) => {
        logger.warn(`Process exited with code ${code} signal ${signal}`);
        if (this.stateManager.getState().status !== "stopping") {
          await this.handleCrash();
        }
      }
    );
  }

  private async loadModels(): Promise<void> {
    try {
      logger.info("🔍 Querying llama-server for available models...");
      const models = await this.modelLoader.loadModels();

      this.stateManager.updateModels(models);

      logger.info(`✅ Loaded ${models.length} model(s)`);
      models.forEach((model) => {
        const sizeGb =
          model.size > 0
            ? (model.size / 1024 / 1024 / 1024).toFixed(2)
            : "unknown";
        logger.info(`  - ${model.name} (${sizeGb} GB)`);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn(`Failed to load models: ${message}`);
      this.stateManager.updateModels([]);
    }
  }

  private async loadModelsFromServer(): Promise<import("./types").LlamaModel[]> {
    try {
      const response = await fetch(`http://${this.config.host}:${this.config.port}/models`);
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn(`Failed to fetch models from server: ${message}`);
      return [];
    }
  }

  private async handleCrash(): Promise<void> {
    const currentRetries = this.stateManager.getState().retries;

    const onFailure = () => {
      logger.error(
        `❌ Max retries exceeded. Giving up.`
      );
      this.stateManager.updateState("error", "Max retries exceeded");
    };

    try {
      await this.retryHandler.retry(currentRetries, () => this.start(), onFailure);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Retry failed: ${message}`);
      await this.handleCrash();
    }
  }
}

// Export types for backward compatibility
export type { LlamaServerConfig, LlamaModel, LlamaServiceStatus, LlamaServiceState } from "./types";
