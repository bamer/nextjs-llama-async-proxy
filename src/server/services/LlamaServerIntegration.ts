import { Server, Socket } from "socket.io";
import { LlamaService, LlamaServerConfig, LlamaModel } from "./LlamaService";
import { exec } from "child_process";
import { promisify } from "util";
import { getWebSocketTransport, getLogger } from "../../lib/logger";
import type { SystemMetrics } from "@/types/monitoring";

const logger = getLogger();
const execAsync = promisify(exec);

// Import database functions
import {
  initDatabase,
  getModels,
  getModelById,
  saveModel,
  updateModel,
  deleteModel,
  saveModelSamplingConfig,
  getModelSamplingConfig,
  saveModelMemoryConfig,
  getModelMemoryConfig,
  saveModelGpuConfig,
  getModelGpuConfig,
  saveModelAdvancedConfig,
  getModelAdvancedConfig,
  saveModelLoraConfig,
  getModelLoraConfig,
  saveModelMultimodalConfig,
  getModelMultimodalConfig,
  saveMetrics as saveMetricsToDb,
} from "../../lib/database";

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
        uptime: state.uptime || 0,
        startedAt: state.startedAt ? state.startedAt.toISOString() : null,
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

      // Also persist metrics to database for chart history
      try {
        logger.debug('[METRICS] Saving to database:', {
          cpu: metrics.cpu.usage,
          memory: metrics.memory.used,
          gpu: metrics.gpu?.usage,
          requests: this.totalRequests
        });
        saveMetricsToDb({
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
        logger.debug('✅ Metrics saved to database successfully');
      } catch (error) {
        logger.error('❌ Failed to save metrics to database:', error);
      }
    }, 3000);

    logger.info("📊 Metrics broadcasting started (every 3s)");
  }

  private async collectMetrics(): Promise<import("@/types/monitoring").SystemMetrics> {
    try {
      const state = this.llamaService?.getState();
      const uptime = state?.uptime || 0;

      const cpuMem = await this.getCpuMemoryUsage();
      const diskUsage = await this.getDiskUsage();
      const gpuMetrics = await this.getGpuMetrics();

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

      logger.info('[METRICS] Collected metrics:', {
        cpu: cpuMem.cpu,
        memory: cpuMem.memory,
        disk: diskUsage,
        gpu: gpuMetrics?.usage,
        uptime
      });

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

  private async getGpuMetrics(): Promise<SystemMetrics["gpu"]> {
    try {
      const { stdout } = await execAsync("nvidia-smi --query-gpu=index,utilization.gpu,memory.used,memory.total,power.draw,power.limit,temperature.gpu,name --format=csv,noheader,nounits");

      if (!stdout.trim()) {
        return undefined;
      }

      const [gpuIndex, gpu, memUsed, memTotal, powerUsed, powerLimit, temp, name] = stdout.trim().split(",").map((s) => s.trim());

      // Only use GPU 0 (primary GPU) for metrics
      if (gpuIndex !== '0') {
        return undefined;
      }

      return {
        usage: parseFloat(gpu) || 0,
        memoryUsed: parseFloat(memUsed) || 0,
        memoryTotal: parseFloat(memTotal) || 0,
        powerUsage: parseFloat(powerUsed) || 0,
        powerLimit: parseFloat(powerLimit) || 0,
        temperature: parseFloat(temp) || 0,
        name: name || "Unknown GPU",
      };
    } catch (error) {
      return undefined;
    }
  }

      const [gpuIndex, gpu, memUsed, memTotal, powerUsed, powerLimit, temp, name] = stdout.trim().split(",").map((s) => s.trim());

      // Only use GPU 0 (primary GPU) for metrics
      if (gpuIndex !== '0') {
        return undefined;
      }

      return {
        usage: parseFloat(gpu) || 0,
        memoryUsed: parseFloat(memUsed) || 0,
        memoryTotal: parseFloat(memTotal) || 0,
        powerUsage: parseFloat(powerUsed) || 0,
        powerLimit: parseFloat(powerLimit) || 0,
        temperature: parseFloat(temp) || 0,
        name: name || "Unknown GPU",
      };
    } catch (error) {
      return undefined;
    }
  }

      const [gpuIndex, gpu, memUsed, memTotal, powerUsed, powerLimit, temp, name] = stdout.trim().split(",").map((s) => s.trim());

      // Only use GPU 0 for now (primary GPU)
      if (gpuIndex !== '0') {
        return undefined;
      }

      return {
        usage: parseFloat(gpu) || 0,
        memoryUsed: parseFloat(memUsed) || 0,
        memoryTotal: parseFloat(memTotal) || 0,
        powerUsage: parseFloat(powerUsed) || 0,
        powerLimit: parseFloat(powerLimit) || 0,
        temperature: parseFloat(temp) || 0,
        name: name || "Unknown GPU",
      };
    } catch (error) {
      return undefined;
    }
  }

      if (!stdout.trim()) {
        return undefined;
      }

      const [gpu, memUsed, memTotal, powerUsed, powerLimit, temp, name] = stdout.trim().split(",").map((s) => s.trim());

      return {
        usage: parseFloat(gpu) || 0,
        memoryUsed: parseFloat(memUsed) || 0,
        memoryTotal: parseFloat(memTotal) || 0,
        powerUsage: parseFloat(powerUsed) || 0,
        powerLimit: parseFloat(powerLimit) || 0,
        temperature: parseFloat(temp) || 0,
        name: name || "Unknown GPU",
      };
    } catch (error) {
      return undefined;
    }
  }

  public setupWebSocketHandlers(socket: Socket): void {
    // Handle both camelCase and snake_case naming for compatibility
    socket.on("requestMetrics", () => {
      this.collectMetrics().then(metrics => {
        socket.emit("metrics", { type: "metrics", data: metrics, timestamp: Date.now() });
      });
    });

    socket.on("request_metrics", () => {
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

    socket.on("request_models", async () => {
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
            uptime: state.uptime || 0,
            startedAt: state.startedAt ? state.startedAt.toISOString() : null,
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

    socket.on("request_logs", () => {
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

    socket.on("restartServer", async () => {
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

    socket.on("start_llama_server", async () => {
      try {
        logger.info("[WS] Starting llama-server...");
        if (!this.llamaService) {
          socket.emit("error", { message: "Llama service not available" });
          return;
        }
        await this.llamaService.start();
        logger.info("[WS] ✅ Llama-server started successfully");
        socket.emit("serverStarted", { message: "Server started successfully" });
      } catch (error) {
        logger.error("[WS] ❌ Failed to start llama-server:", error);
        socket.emit("error", { message: "Failed to start server" });
      }
    });

    socket.on("startLlamaServer", async () => {
      try {
        logger.info("[WS] Starting llama-server...");
        if (!this.llamaService) {
          socket.emit("error", { message: "Llama service not available" });
          return;
        }
        await this.llamaService.start();
        logger.info("[WS] ✅ Llama-server started successfully");
        socket.emit("serverStarted", { message: "Server started successfully" });
      } catch (error) {
        logger.error("[WS] ❌ Failed to start llama-server:", error);
        socket.emit("error", { message: "Failed to start server" });
      }
    });

    socket.on("toggle_model", async (data: { modelId: string }) => {
      try {
        logger.info(`[WS] Toggling model: ${data.modelId}`);

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

        // Check current status - models from llama-server API don't have status in LlamaModel
        // We need to check the current loaded model state via the API
        const llamaServerHost = process.env.LLAMA_SERVER_HOST || "localhost";
        const llamaServerPort = process.env.LLAMA_SERVER_PORT || "8134";

        // Try to start the model by making a chat completion request
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
          socket.emit("modelToggled", { modelId: data.modelId, status: "running" });
          logger.info(`[WS] Model started: ${data.modelId}`);
        } else {
          const errorData = await response.json().catch(() => ({}));
          socket.emit("error", { message: `Failed to start model: ${errorData.error || response.statusText}` });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`[WS] ❌ Failed to toggle model:`, error);
        socket.emit("error", { message: `Failed to toggle model: ${message}` });
      }
    });

    socket.on("toggleModel", async (data: { modelId: string }) => {
      try {
        logger.info(`[WS] Toggling model: ${data.modelId}`);

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

        // Check current status - models from llama-server API don't have status in LlamaModel
        // We need to check the current loaded model state via the API
        const llamaServerHost = process.env.LLAMA_SERVER_HOST || "localhost";
        const llamaServerPort = process.env.LLAMA_SERVER_PORT || "8134";

        // Try to start the model by making a chat completion request
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
          socket.emit("modelToggled", { modelId: data.modelId, status: "running" });
          logger.info(`[WS] Model started: ${data.modelId}`);
        } else {
          const errorData = await response.json().catch(() => ({}));
          socket.emit("error", { message: `Failed to start model: ${errorData.error || response.statusText}` });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`[WS] ❌ Failed to toggle model:`, error);
        socket.emit("error", { message: `Failed to toggle model: ${message}` });
      }
    });

    socket.on("toggleModel", async (data: { modelId: string }) => {
      try {
        logger.info(`[WS] Toggling model: ${data.modelId}`);

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

        // Try to start model by making a chat completion request
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
          socket.emit("modelToggled", { modelId: data.modelId, status: "running" });
          logger.info(`[WS] Model started: ${data.modelId}`);
        } else {
          const errorData = await response.json().catch(() => ({}));
          socket.emit("error", { message: `Failed to start model: ${errorData.error || response.statusText}` });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`[WS] ❌ Failed to toggle model:`, error);
        socket.emit("error", { message: `Failed to toggle model: ${message}` });
      }
    });

    socket.on("download_logs", () => {
      try {
        logger.info("[WS] Downloading logs requested");
        const wsTransport = getWebSocketTransport();
        if (wsTransport) {
          const cachedLogs = wsTransport.getCachedLogs();
          socket.emit("logs", {
            type: "logs",
            data: cachedLogs,
            timestamp: Date.now(),
          });
          logger.info("[WS] ✅ Logs sent for download");
        } else {
          socket.emit("error", { message: "No logs available" });
        }
      } catch (error) {
        logger.error("[WS] ❌ Failed to download logs:", error);
        socket.emit("error", { message: "Failed to download logs" });
      }
    });

    socket.on("downloadLogs", () => {
      try {
        logger.info("[WS] Downloading logs requested");
        const wsTransport = getWebSocketTransport();
        if (wsTransport) {
          const cachedLogs = wsTransport.getCachedLogs();
          socket.emit("logs", {
            type: "logs",
            data: cachedLogs,
            timestamp: Date.now(),
          });
          logger.info("[WS] ✅ Logs sent for download");
        } else {
          socket.emit("error", { message: "No logs available" });
        }
      } catch (error) {
        logger.error("[WS] ❌ Failed to download logs:", error);
        socket.emit("error", { message: "Failed to download logs" });
      }
    });

    // Database configuration handlers
    socket.on("load_config", async (data: { id: number; type: string }) => {
      try {
        logger.info(`[WS] Loading ${data.type} config for model ${data.id}`);
        
        // Ensure database is initialized
        await initDatabase();
        
        let config: any;
        switch (data.type) {
          case "sampling":
            config = await getModelSamplingConfig(data.id);
            break;
          case "memory":
            config = await getModelMemoryConfig(data.id);
            break;
          case "gpu":
            config = await getModelGpuConfig(data.id);
            break;
          case "advanced":
            config = await getModelAdvancedConfig(data.id);
            break;
          case "lora":
            config = await getModelLoraConfig(data.id);
            break;
          case "multimodal":
            config = await getModelMultimodalConfig(data.id);
            break;
          default:
            throw new Error(`Invalid config type: ${data.type}`);
        }
        
        if (config) {
          socket.emit("config_loaded", {
            success: true,
            data: { id: data.id, type: data.type, config },
            timestamp: Date.now(),
          });
          logger.info(`[WS] ✅ Config loaded successfully: ${data.type}`);
        } else {
          socket.emit("config_loaded", {
            success: true,
            data: { id: data.id, type: data.type, config: {} },
            timestamp: Date.now(),
          });
          logger.info(`[WS] ℹ️  No existing config found, returning empty config`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`[WS] ❌ Failed to load config: ${message}`);
        socket.emit("config_loaded", {
          success: false,
          error: { code: "LOAD_CONFIG_FAILED", message },
          timestamp: Date.now(),
        });
      }
    });

    socket.on("save_config", async (data: { id: number; type: string; config: any }) => {
      try {
        logger.info(`[WS] Saving ${data.type} config for model ${data.id}`);
        
        // Ensure database is initialized
        await initDatabase();
        
        let result: any;
        switch (data.type) {
          case "sampling":
            result = await saveModelSamplingConfig(data.id, data.config);
            break;
          case "memory":
            result = await saveModelMemoryConfig(data.id, data.config);
            break;
          case "gpu":
            result = await saveModelGpuConfig(data.id, data.config);
            break;
          case "advanced":
            result = await saveModelAdvancedConfig(data.id, data.config);
            break;
          case "lora":
            result = await saveModelLoraConfig(data.id, data.config);
            break;
          case "multimodal":
            result = await saveModelMultimodalConfig(data.id, data.config);
            break;
          default:
            throw new Error(`Invalid config type: ${data.type}`);
        }
        
        socket.emit("config_saved", {
          success: true,
          data: { id: data.id, type: data.type, config: result },
          timestamp: Date.now(),
        });
        logger.info(`[WS] ✅ Config saved successfully: ${data.type}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`[WS] ❌ Failed to save config: ${message}`);
        socket.emit("config_saved", {
          success: false,
          error: { code: "SAVE_CONFIG_FAILED", message },
          timestamp: Date.now(),
        });
      }
    });

    socket.on("save_model", async (data: any) => {
      try {
        logger.info(`[WS] Saving model: ${data.name}`);
        
        // Ensure database is initialized
        await initDatabase();
        
        const model = await saveModel(data);
        socket.emit("model_saved", {
          success: true,
          data: model,
          timestamp: Date.now(),
        });
        logger.info(`[WS] ✅ Model saved successfully: ${data.name}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`[WS] ❌ Failed to save model: ${message}`);
        socket.emit("model_saved", {
          success: false,
          error: { code: "SAVE_MODEL_FAILED", message },
          timestamp: Date.now(),
        });
      }
    });

    socket.on("update_model", async (data: { id: number; updates: any }) => {
      try {
        logger.info(`[WS] Updating model ${data.id}`);
        
        // Ensure database is initialized
        await initDatabase();
        
        const model = await updateModel(data.id, data.updates);
        socket.emit("model_updated", {
          success: true,
          data: model,
          timestamp: Date.now(),
        });
        logger.info(`[WS] ✅ Model updated successfully: ${data.id}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`[WS] ❌ Failed to update model: ${message}`);
        socket.emit("model_updated", {
          success: false,
          error: { code: "UPDATE_MODEL_FAILED", message },
          timestamp: Date.now(),
        });
      }
    });

    socket.on("delete_model", async (data: { id: number }) => {
      try {
        logger.info(`[WS] Deleting model ${data.id}`);
        
        // Ensure database is initialized
        await initDatabase();
        
        await deleteModel(data.id);
        socket.emit("model_deleted", {
          success: true,
          data: { id: data.id },
          timestamp: Date.now(),
        });
        logger.info(`[WS] ✅ Model deleted successfully: ${data.id}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`[WS] ❌ Failed to delete model: ${message}`);
        socket.emit("model_deleted", {
          success: false,
          error: { code: "DELETE_MODEL_FAILED", message },
          timestamp: Date.now(),
        });
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
