import { Server, Socket } from "socket.io";
import { LlamaService, LlamaServerConfig, LlamaModel } from "./LlamaService";
import { exec } from "child_process";
import { promisify } from "util";
import { getWebSocketTransport, getLogger } from "../../lib/logger";

const logger = getLogger();
const execAsync = promisify(exec);

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  activeModels: number;
  totalRequests: number;
  avgResponseTime: number;
  uptime: number;
  timestamp: string;
  gpuUsage?: number;
  gpuMemoryUsage?: number;
  gpuMemoryTotal?: number;
  gpuMemoryUsed?: number;
  gpuPowerUsage?: number;
  gpuPowerLimit?: number;
  gpuTemperature?: number;
  gpuName?: string;
}

export class LlamaServerIntegration {
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
      this.llamaService = new LlamaService(config);

      this.llamaService.onStateChange((state) => {
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

  private broadcastState(state: any): void {
    this.io.emit("llamaStatus", {
      type: "status",
      data: {
        status: state.status,
        lastError: state.lastError,
        uptime: state.uptime,
        models: state.models.map((m: any) => ({
          id: m.id || m.name,
          name: m.name,
          type: m.type || "unknown",
          status: typeof m.status === 'string'
            ? (m.status === 'loaded' ? 'running' : m.status)
            : (m.status && typeof m.status === 'object' && 'value' in m.status
              ? (m.status.value === 'loaded' ? 'running' : m.status.value)
              : 'idle'),
          size: m.size,
          template: m.template,
          availableTemplates: m.availableTemplates,
          createdAt: new Date(m.modified_at * 1000).toISOString(),
          updatedAt: new Date(m.modified_at * 1000).toISOString(),
        })),
      },
      timestamp: Date.now(),
    });

      this.io.emit("models", {
        type: "models",
        data: state.models.map((m: any) => ({
          id: m.id || m.name,
          name: m.name,
          type: m.type || "unknown",
          status: typeof m.status === 'string'
            ? (m.status === 'loaded' ? 'running' : m.status)
            : (m.status && typeof m.status === 'object' && 'value' in m.status
              ? (m.status.value === 'loaded' ? 'running' : m.status.value)
              : 'idle'),
          size: m.size,
          template: m.template,
          availableTemplates: m.availableTemplates,
          createdAt: new Date(m.modified_at * 1000).toISOString(),
          updatedAt: new Date(m.modified_at * 1000).toISOString(),
        })),
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
    }, 3000);

    logger.info("📊 Metrics broadcasting started (every 3s)");
  }

  private async collectMetrics(): Promise<SystemMetrics> {
    const state = this.llamaService?.getState();
    const uptime = state?.uptime || 0;

    const cpuMem = await this.getCpuMemoryUsage();
    const gpuMetrics = await this.getGpuMetrics();

    return {
      cpuUsage: cpuMem.cpu,
      memoryUsage: cpuMem.memory,
      diskUsage: await this.getDiskUsage(),
      activeModels: state?.models?.length || 0,
      totalRequests: this.totalRequests,
      avgResponseTime: this.responseTimes.length > 0
        ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
        : 0,
      uptime,
      timestamp: new Date().toISOString(),
      ...gpuMetrics,
    };
  }

  private async getCpuMemoryUsage(): Promise<{ cpu: number; memory: number }> {
    try {
      const { stdout: cpuOut } = await execAsync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1");
      const cpu = parseFloat(cpuOut.trim()) || 0;

      const { stdout: memOut } = await execAsync("free | grep Mem | awk '{print ($3/$2) * 100.0}'");
      const memory = parseFloat(memOut.trim()) || 0;

      return { cpu: Math.round(cpu), memory: Math.round(memory) };
    } catch {
      return { cpu: 0, memory: 0 };
    }
  }

  private async getDiskUsage(): Promise<number> {
    try {
      const { stdout } = await execAsync("df / | tail -1 | awk '{print $5}' | cut -d'%' -f1");
      return parseFloat(stdout.trim()) || 0;
    } catch {
      return 0;
    }
  }

  private async getGpuMetrics(): Promise<Partial<SystemMetrics>> {
    try {
      const { stdout } = await execAsync("nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total,power.draw,power.limit,temperature.gpu,name --format=csv,noheader,nounits");

      if (!stdout.trim()) {
        return {};
      }

      const [gpu, memUsed, memTotal, powerUsed, powerLimit, temp, name] = stdout.trim().split(",").map(s => s.trim());

      const gpuMemoryUsage = memTotal && memUsed ? (parseFloat(memUsed) / parseFloat(memTotal)) * 100 : 0;

      return {
        gpuUsage: parseFloat(gpu) || 0,
        gpuMemoryUsed: parseFloat(memUsed) || 0,
        gpuMemoryTotal: parseFloat(memTotal) || 0,
        gpuMemoryUsage,
        gpuPowerUsage: parseFloat(powerUsed) || 0,
        gpuPowerLimit: parseFloat(powerLimit) || 0,
        gpuTemperature: parseFloat(temp) || 0,
        gpuName: name || "Unknown GPU",
      };
    } catch (error) {
      return {};
    }
  }

  public setupWebSocketHandlers(socket: Socket): void {
    socket.on("requestMetrics", () => {
      this.collectMetrics().then(metrics => {
        socket.emit("metrics", { type: "metrics", data: metrics, timestamp: Date.now() });
      });
    });

    socket.on("requestModels", async () => {
      if (this.llamaService) {
        const state = this.llamaService.getState();
        socket.emit("models", {
          type: "models",
          data: state.models.map((m: any) => ({
            id: m.id || m.name,
            name: m.name,
            type: m.type || "unknown",
            status: typeof m.status === 'string'
              ? (m.status === 'loaded' ? 'running' : m.status)
              : (m.status && typeof m.status === 'object' && 'value' in m.status
                ? (m.status.value === 'loaded' ? 'running' : m.status.value)
                : 'idle'),
            size: m.size,
            template: m.template,
            availableTemplates: m.availableTemplates,
            createdAt: new Date(m.modified_at * 1000).toISOString(),
            updatedAt: new Date(m.modified_at * 1000).toISOString(),
          })),
          timestamp: Date.now(),
        });
      }
    });

    socket.on("requestLlamaStatus", async () => {
      if (this.llamaService) {
        const state = this.llamaService.getState();
        socket.emit("llamaStatus", {
          type: "status",
          data: {
            status: state.status,
            lastError: state.lastError,
            uptime: state.uptime,
          },
          timestamp: Date.now(),
        });
      }
    });

    socket.on("rescanModels", async () => {
      logger.info("[WS] Rescan models request received");
      if (this.llamaService && this.currentConfig) {
        try {
          await this.llamaService.stop();
          await this.llamaService.start();
          logger.info("[WS] ✅ Models rescanned successfully");
          socket.emit("llamaStatus", {
            type: "status",
            data: { message: "Models rescanned successfully" },
            timestamp: Date.now(),
          });
        } catch (error) {
          logger.error("[WS] ❌ Failed to rescan models:", error);
          socket.emit("llamaStatus", {
            type: "error",
            data: { error: "Failed to rescan models" },
            timestamp: Date.now(),
          });
        }
      }
    });

    socket.on("startModel", async (data: { modelId: string }) => {
      try {
        logger.info(`[WS] Starting model: ${data.modelId}`);

        if (!this.llamaService) {
          socket.emit("error", { message: "Llama service not available" });
          return;
        }

        const state = this.llamaService.getState();
        const model = state.models.find((m: LlamaModel) => m.id === data.modelId || m.name === data.modelId);

        if (!model) {
          socket.emit("error", { message: `Model ${data.modelId} not found` });
          return;
        }

        const llamaServerHost = process.env.LLAMA_SERVER_HOST || "localhost";
        const llamaServerPort = process.env.LLAMA_SERVER_PORT || "8134";

        const response = await fetch(`http://${llamaServerHost}:${llamaServerPort}/v1/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: model.name,
            messages: [{ role: "user", content: "Hi" }],
            max_tokens: 1,
          }),
        });

        if (response.ok) {
          socket.emit("modelStarted", { modelId: data.modelId, status: "running" });
        } else {
          const errorData = await response.json().catch(() => ({}));
          socket.emit("error", { message: `Failed to start model: ${errorData.error || response.statusText}` });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        socket.emit("error", { message: `Failed to start model: ${message}` });
      }
    });

    socket.on("stopModel", async (data: { modelId: string }) => {
      try {
        logger.info(`[WS] Stopping model: ${data.modelId}`);

        socket.emit("modelStopped", {
          modelId: data.modelId,
          message: "llama.cpp auto-manages model memory. Model will be unloaded when loading a different one."
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        socket.emit("error", { message: `Failed to stop model: ${message}` });
      }
    });

    socket.on("requestLogs", () => {
      try {
        const wsTransport = getWebSocketTransport();
        if (wsTransport) {
          const cachedLogs = wsTransport.getCachedLogs();
          socket.emit("logs", {
            type: "logs",
            data: cachedLogs,
            timestamp: Date.now(),
          });
        } else {
          socket.emit("logs", {
            type: "logs",
            data: [],
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        logger.error("[WS] Error retrieving logs:", error);
        socket.emit("logs", {
          type: "logs",
          data: [],
          timestamp: Date.now(),
        });
      }
    });

    socket.on("restart_server", async () => {
      try {
        logger.info("[WS] Restarting llama-server...");
        await this.llamaService?.stop();
        await this.llamaService?.start();
        logger.info("[WS] ✅ Llama-server restarted successfully");
        socket.emit("serverRestarted", { message: "Server restarted successfully" });
      } catch (error) {
        logger.error("[WS] ❌ Failed to restart llama-server:", error);
        socket.emit("error", { message: "Failed to restart server" });
      }
    });

    socket.on("download_logs", () => {
      try {
        logger.info("[WS] Downloading logs requested");
        socket.emit("error", { message: "Log download not implemented yet" });
      } catch (error) {
        logger.error("[WS] ❌ Failed to download logs:", error);
      }
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

  public getLlamaService(): LlamaService | null {
    return this.llamaService;
  }
}

export default LlamaServerIntegration;
