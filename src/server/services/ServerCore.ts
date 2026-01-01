import type { LlamaService, LlamaServerConfig, LlamaServiceState } from "./llama/LlamaService";
import type { Server, Socket } from "socket.io";
import { getLogger } from "../../lib/logger";
import { METRICS_BROADCAST_INTERVAL } from "./server.constants";
import { getCpuMemoryUsage, getDiskUsage, getGpuMetrics } from "./server.utils";
import { transformLlamaModelToDisplay } from "./server.utils";
import type { SystemMetrics } from "@/types/monitoring";
import { LlamaService as LlamaServiceClass } from "./llama/LlamaService";
import { ModelImportService } from "./model-import-service";

const logger = getLogger();

export class ServerCore {
  private io: Server;
  private llamaService: LlamaService | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  private totalRequests: number = 0;
  private responseTimes: number[] = [];
  private currentConfig: LlamaServerConfig | null = null;

  constructor(io: Server) {
    this.io = io;
  }

  async initialize(config: LlamaServerConfig): Promise<void> {
    try {
      this.currentConfig = config;
      this.llamaService = new LlamaServiceClass(config);

      this.llamaService.onStateChange((state: LlamaServiceState) => {
        this.broadcastState(state);
      });

      await this.llamaService.start();
      logger.info("✅ LlamaServer integration initialized");

      this.startMetricsBroadcast();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`❌ Failed to initialize LlamaServer integration: ${message}`);
      throw error;
    }
  }

  private broadcastState(state: LlamaServiceState): void {
    const models = state.models.map(transformLlamaModelToDisplay);

    this.io.emit("llamaStatus", {
      type: "status",
      data: {
        status: state.status,
        lastError: state.lastError,
        uptime: state.uptime || 0,
        startedAt: state.startedAt ? state.startedAt.toISOString() : null,
        models,
      },
      timestamp: Date.now(),
    });

    this.io.emit("models", {
      type: "models",
      data: models,
      timestamp: Date.now(),
    });
  }

  private startMetricsBroadcast(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    this.metricsInterval = setInterval(async () => {
      const metrics = await this.collectMetrics();
      this.io.emit("metrics", { type: "metrics", data: metrics, timestamp: Date.now() });

      try {
        this.persistMetricsToDatabase(metrics);
      } catch (error) {
        logger.error("Failed to save metrics to database:", error);
      }
    }, METRICS_BROADCAST_INTERVAL);

    logger.info("Metrics broadcasting started (every 10s)");
  }

  private async collectMetrics(): Promise<SystemMetrics> {
    try {
      const state = this.llamaService?.getState();
      const uptime = state?.uptime || 0;

      const cpuMem = await getCpuMemoryUsage();
      const diskUsage = await getDiskUsage();
      const gpuMetrics = await getGpuMetrics();

      const result: SystemMetrics = {
        cpu: { usage: cpuMem.cpu },
        memory: { used: cpuMem.memory },
        disk: { used: diskUsage },
        network: { rx: 0, tx: 0 },
        uptime,
      };

      if (gpuMetrics) {
        result.gpu = gpuMetrics;
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`[METRICS] Failed to collect metrics: ${message}`);
      return {
        cpu: { usage: 0 },
        memory: { used: 0 },
        disk: { used: 0 },
        network: { rx: 0, tx: 0 },
        uptime: this.llamaService?.getState()?.uptime || 0,
      };
    }
  }

  private async persistMetricsToDatabase(metrics: SystemMetrics): Promise<void> {
    const { saveMetrics } = await import("../../lib/database");

    return saveMetrics({
      cpu_usage: metrics.cpu.usage || 0,
      memory_usage: metrics.memory.used || 0,
      disk_usage: metrics.disk.used || 0,
      gpu_usage: metrics.gpu?.usage || 0,
      gpu_temperature: metrics.gpu?.temperature || 0,
      gpu_memory_used: metrics.gpu?.memoryUsed || 0,
      gpu_memory_total: metrics.gpu?.memoryTotal || 0,
      gpu_power_usage: metrics.gpu?.powerUsage || 0,
      active_models: 0,
      uptime: metrics.uptime || 0,
      requests_per_minute: Math.round((this.totalRequests || 0) / 10),
    });
  }

  async stop(): Promise<void> {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    if (this.llamaService) {
      await this.llamaService.stop();
      this.llamaService = null;
    }

    logger.info("🛑 LlamaServer integration stopped");
  }

  getLlamaService(): LlamaService | null {
    return this.llamaService;
  }

  getIo(): Server {
    return this.io;
  }

  async setupWebSocketHandlers(
    socket: Socket,
    modelImportService: ModelImportService
  ): Promise<void> {
    const { setupMetricsHandlers } = await import("./modules/handlers-metrics");
    const { setupModelsHandlers } = await import("./modules/handlers-models");
    const { setupLogsHandlers } = await import("./modules/handlers-logs");
    const { setupServerControlHandlers } = await import("./modules/handlers-server");
    const { setupConfigHandlers } = await import("./modules/handlers-config");
    const { setupModelCRUDHandlers } = await import("./modules/handlers-model-crud");

    const dependencies = {
      llamaService: this.llamaService,
      modelImportService,
      collectMetrics: async () => this.collectMetrics(),
      broadcastState: (state) => this.broadcastState(state),
    };

    setupMetricsHandlers(socket, dependencies);
    setupModelsHandlers(socket, dependencies);
    setupLogsHandlers(socket);
    setupServerControlHandlers(socket, dependencies);
    setupConfigHandlers(socket);
    setupModelCRUDHandlers(socket);
  }
}
