import { Server } from 'socket.io';
import { LlamaService } from './LlamaService.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class LlamaServerIntegration {
  constructor(io) {
    this.io = io;
    this.llamaService = null;
    this.metricsInterval = null;
    this.totalRequests = 0;
    this.responseTimes = [];
  }

  async initialize(config) {
    try {
      this.llamaService = new LlamaService(config);

      this.llamaService.onStateChange((state) => {
        this.broadcastState(state);
      });

      await this.llamaService.start();
      console.log('✅ LlamaServer integration initialized');

      this.startMetricsBroadcast();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to initialize LlamaServer integration: ${message}`);
      throw error;
    }
  }

  broadcastState(state) {
    this.io.emit('llamaStatus', {
      type: 'status',
      data: {
        status: state.status,
        lastError: state.lastError,
        uptime: state.uptime,
        models: state.models.map((m) => ({
          id: m.id || m.name,
          name: m.name,
          type: m.type || 'unknown',
          status: 'available',
          size: m.size,
          createdAt: new Date(m.modified_at * 1000).toISOString(),
          updatedAt: new Date(m.modified_at * 1000).toISOString(),
        })),
      },
      timestamp: Date.now(),
    });

    this.io.emit('models', {
      type: 'models',
      data: state.models.map((m) => ({
        id: m.id || m.name,
        name: m.name,
        type: m.type || 'unknown',
        status: 'available',
        size: m.size,
        createdAt: new Date(m.modified_at * 1000).toISOString(),
        updatedAt: new Date(m.modified_at * 1000).toISOString(),
      })),
      timestamp: Date.now(),
    });
  }

  startMetricsBroadcast() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    this.metricsInterval = setInterval(async () => {
      const metrics = await this.collectMetrics();
      this.io.emit('metrics', { type: 'metrics', data: metrics, timestamp: Date.now() });
    }, 3000);

    console.log('📊 Metrics broadcasting started (every 3s)');
  }

  async collectMetrics() {
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

  async getCpuMemoryUsage() {
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

  async getDiskUsage() {
    try {
      const { stdout } = await execAsync("df / | tail -1 | awk '{print $5}' | cut -d'%' -f1");
      return parseFloat(stdout.trim()) || 0;
    } catch {
      return 0;
    }
  }

  async getGpuMetrics() {
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
        gpuName: name || 'Unknown GPU',
      };
    } catch (error) {
      return {};
    }
  }

  setupWebSocketHandlers(socket) {
    socket.on('requestMetrics', () => {
      this.collectMetrics().then(metrics => {
        socket.emit('metrics', { type: 'metrics', data: metrics, timestamp: Date.now() });
      });
    });

    socket.on('requestModels', async () => {
      if (this.llamaService) {
        const state = this.llamaService.getState();
        socket.emit('models', {
          type: 'models',
          data: state.models.map((m) => ({
            id: m.id || m.name,
            name: m.name,
            type: m.type || 'unknown',
            status: 'available',
            size: m.size,
            createdAt: new Date(m.modified_at * 1000).toISOString(),
            updatedAt: new Date(m.modified_at * 1000).toISOString(),
          })),
          timestamp: Date.now(),
        });
      }
    });

    socket.on('requestLlamaStatus', async () => {
      if (this.llamaService) {
        const state = this.llamaService.getState();
        socket.emit('llamaStatus', {
          type: 'status',
          data: {
            status: state.status,
            lastError: state.lastError,
            uptime: state.uptime,
          },
          timestamp: Date.now(),
        });
      }
    });

    socket.on('startModel', async (data) => {
      try {
        console.log(`[WS] Starting model: ${data.modelId}`);
        
        if (!this.llamaService) {
          socket.emit('error', { message: 'Llama service not available' });
          return;
        }

        const state = this.llamaService.getState();
        const model = state.models.find((m) => m.id === data.modelId || m.name === data.modelId);

        if (!model) {
          socket.emit('error', { message: `Model ${data.modelId} not found` });
          return;
        }

        const llamaServerHost = process.env.LLAMA_SERVER_HOST || 'localhost';
        const llamaServerPort = process.env.LLAMA_SERVER_PORT || '8134';

        const response = await fetch(`http://${llamaServerHost}:${llamaServerPort}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: model.name,
            messages: [{ role: 'user', content: 'Hi' }],
            max_tokens: 1,
          }),
        });

        if (response.ok) {
          socket.emit('modelStarted', { modelId: data.modelId, status: 'running' });
        } else {
          const errorData = await response.json().catch(() => ({}));
          socket.emit('error', { message: `Failed to start model: ${errorData.error || response.statusText}` });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        socket.emit('error', { message: `Failed to start model: ${message}` });
      }
    });

    socket.on('stopModel', async (data) => {
      try {
        console.log(`[WS] Stopping model: ${data.modelId}`);
        
        socket.emit('modelStopped', { 
          modelId: data.modelId,
          message: 'llama.cpp auto-manages model memory. Model will be unloaded when loading a different one.'
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        socket.emit('error', { message: `Failed to stop model: ${message}` });
      }
    });

    socket.on('logs', () => {
      socket.emit('logs', {
        type: 'logs',
        data: [],
        timestamp: Date.now(),
      });
    });
  }

  async stop() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    if (this.llamaService) {
      await this.llamaService.stop();
      this.llamaService = null;
    }

    console.log('🛑 LlamaServer integration stopped');
  }

  getLlamaService() {
    return this.llamaService;
  }
}

export default LlamaServerIntegration;
