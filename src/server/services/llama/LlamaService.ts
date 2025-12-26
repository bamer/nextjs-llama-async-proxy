import { LlamaServerConfig, LlamaServiceState } from "./types";
import { ProcessManager } from "./processManager";
import { HealthChecker } from "./healthCheck";
import { ModelLoader } from "./modelLoader";
import { ArgumentBuilder } from "./argumentBuilder";
import { StateManager } from "./stateManager";
import { Logger } from "./logger";
import { RetryHandler } from "./retryHandler";

export class LlamaService {
  private config: LlamaServerConfig;
  private processManager: ProcessManager;
  private healthChecker: HealthChecker;
  private modelLoader: ModelLoader;
  private stateManager: StateManager;
  private logger: Logger;
  private retryHandler: RetryHandler;

  constructor(config: LlamaServerConfig) {
    this.config = config;
    this.processManager = new ProcessManager();
    this.healthChecker = new HealthChecker(config.host, config.port);
    this.modelLoader = new ModelLoader(config.host, config.port, config.basePath);
    this.stateManager = new StateManager();
    this.logger = new Logger("LlamaService");
    this.retryHandler = new RetryHandler();

    this.logger.info("🔧 LlamaService initialized");
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
      this.logger.info("✅ Llama server already running");
      return;
    }

    if (currentStatus === "starting") {
      this.logger.warn("⏳ Llama server is already starting");
      return;
    }

    this.stateManager.updateStatus("starting");

    try {
      const isAlive = await this.healthChecker.check();
      if (isAlive) {
        this.logger.info("✅ Llama server already running");
        await this.loadModels();
        this.stateManager.updateStatus("ready");
        this.stateManager.startUptimeTracking();
        return;
      }

      await this.spawnServer();
      this.stateManager.startUptimeTracking();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Failed to start llama server: ${message}`);
      this.stateManager.updateStatus("error", message);
      await this.handleCrash();
    }
  }

  async stop(): Promise<void> {
    this.logger.info("🛑 Stopping llama server...");
    this.stateManager.updateStatus("stopping");
    this.stateManager.stopUptimeTracking();

    if (this.processManager.isRunning()) {
      await this.processManager.kill("SIGTERM");
      this.logger.info("✅ Llama server stopped");
    }

    this.stateManager.updateStatus("initial");
  }

  private async spawnServer(): Promise<void> {
    const args = ArgumentBuilder.build(this.config);
    const serverBinary = this.config.serverPath || "llama-server";

    this.logger.info(
      `🚀 Spawning ${serverBinary} with args: ${args.join(" ")}`
    );

    const process = this.processManager.spawn(serverBinary, args);

    this.processManager.onData((message) => {
      this.logger.debug(`[llama-server] ${message}`);
    }, "stdout");

    this.processManager.onData((message) => {
      this.logger.warn(`[llama-server-err] ${message}`);
    }, "stderr");

    this.processManager.onError((error) => {
      this.logger.error(`Process error: ${error.message}`);
      this.handleCrash();
    });

    this.processManager.onExit((code, signal) => {
      this.logger.warn(`Process exited with code ${code} signal ${signal}`);
      if (this.stateManager.getState().status !== "stopping") {
        this.handleCrash();
      }
    });

    await this.healthChecker.waitForReady();
    await this.loadModels();

    this.stateManager.updateStatus("ready");
    this.logger.info("✅ Llama server is ready and models loaded");
  }

  private async loadModels(): Promise<void> {
    try {
      this.logger.info("🔍 Querying llama-server for available models...");
      const models = await this.modelLoader.load();

      this.stateManager.setModels(models);

      this.logger.info(`✅ Loaded ${models.length} model(s)`);
      models.forEach((model) => {
        const sizeGb =
          model.size > 0
            ? (model.size / 1024 / 1024 / 1024).toFixed(2)
            : "unknown";
        this.logger.info(`  - ${model.name} (${sizeGb} GB)`);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to load models: ${message}`);
      this.stateManager.setModels([]);
    }
  }

  private async handleCrash(): Promise<void> {
    const currentRetries = this.stateManager.getState().retries;

    if (!this.retryHandler.canRetry(currentRetries)) {
      this.logger.error(
        `❌ Max retries exceeded. Giving up.`
      );
      this.stateManager.updateStatus("error", "Max retries exceeded");
      return;
    }

    this.stateManager.incrementRetries();
    const nextRetries = this.stateManager.getState().retries;
    const delayMs = this.retryHandler.getBackoffMs(nextRetries - 1);

    this.logger.info(
      `🔄 Retry ${nextRetries} in ${delayMs / 1000}s`
    );
    this.stateManager.updateStatus("crashed");

    await this.retryHandler.waitForRetry(nextRetries - 1);

    try {
      await this.start();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Retry failed: ${message}`);
      await this.handleCrash();
    }
  }
}

// Export types for backward compatibility
export type { LlamaServerConfig, LlamaModel, LlamaServiceStatus, LlamaServiceState } from "./types";
