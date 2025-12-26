import { ModelConfig, SystemMetrics, LogEntry, ApiResponse, PaginatedResponse } from '@/types/global';

export const mockModels: ModelConfig[] = [
  {
    id: 'model-1',
    name: 'Llama-2-7B-Instruct',
    type: 'llama',
    parameters: {
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 2048,
    },
    status: 'idle',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'model-2',
    name: 'Mistral-7B-Instruct',
    type: 'mistral',
    parameters: {
      temperature: 0.8,
      top_p: 0.95,
      max_tokens: 4096,
    },
    status: 'idle',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockMetrics: SystemMetrics = {
  cpuUsage: 45.5,
  memoryUsage: 62.3,
  diskUsage: 35.0,
  activeModels: 2,
  totalRequests: 1250,
  avgResponseTime: 245,
  uptime: 3600000,
  timestamp: new Date().toISOString(),
  gpuUsage: 78.5,
  gpuMemoryUsage: 65.2,
  gpuMemoryTotal: 24576,
  gpuMemoryUsed: 16016,
  gpuPowerUsage: 245,
  gpuPowerLimit: 350,
  gpuTemperature: 72,
  gpuName: 'NVIDIA RTX 3090',
};

export const mockLogs: LogEntry[] = [
  {
    id: 'log-1',
    level: 'info',
    message: 'LlamaServer initialized successfully',
    timestamp: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: 'log-2',
    level: 'warn',
    message: 'High memory usage detected: 85%',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    context: {
      memory: 85,
      threshold: 80,
    },
  },
  {
    id: 'log-3',
    level: 'error',
    message: 'Failed to connect to llama-server',
    timestamp: new Date().toISOString(),
    context: {
      error: 'ECONNREFUSED',
      host: 'localhost:8134',
    },
  },
];

export class MockApiClient {
  private latency: number = 100;

  setLatency(ms: number): void {
    this.latency = ms;
  }

  async getModels(): Promise<ApiResponse<ModelConfig[]>> {
    await this.simulateDelay();
    return {
      success: true,
      data: mockModels,
      timestamp: new Date().toISOString(),
    };
  }

  async getMetrics(): Promise<ApiResponse<SystemMetrics>> {
    await this.simulateDelay();
    return {
      success: true,
      data: mockMetrics,
      timestamp: new Date().toISOString(),
    };
  }

  async getLogs(options: { limit: number } = { limit: 50 }): Promise<ApiResponse<LogEntry[]>> {
    await this.simulateDelay();
    return {
      success: true,
      data: mockLogs.slice(0, options.limit),
      timestamp: new Date().toISOString(),
    };
  }

  async getModel(modelId: string): Promise<ApiResponse<ModelConfig>> {
    await this.simulateDelay();
    const model = mockModels.find(m => m.id === modelId);
    if (!model) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Model ${modelId} not found`,
        },
        timestamp: new Date().toISOString(),
      };
    }
    return {
      success: true,
      data: model,
      timestamp: new Date().toISOString(),
    };
  }

  async startModel(modelId: string): Promise<ApiResponse<{ modelId: string; status: string }>> {
    await this.simulateDelay();
    return {
      success: true,
      data: {
        modelId,
        status: 'running',
      },
      timestamp: new Date().toISOString(),
    };
  }

  async stopModel(modelId: string): Promise<ApiResponse<{ modelId: string; status: string }>> {
    await this.simulateDelay();
    return {
      success: true,
      data: {
        modelId,
        status: 'idle',
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getConfig(): Promise<ApiResponse<Record<string, unknown>>> {
    await this.simulateDelay();
    return {
      success: true,
      data: {
        llamaHost: 'localhost',
        llamaPort: 8134,
        maxTokens: 2048,
      },
      timestamp: new Date().toISOString(),
    };
  }

  async updateConfig(config: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> {
    await this.simulateDelay();
    return {
      success: true,
      data: config,
      timestamp: new Date().toISOString(),
    };
  }

  private async simulateDelay(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, this.latency));
  }

  reset(): void {
    this.latency = 100;
  }
}

export const mockApiClient = new MockApiClient();

export function createMockApiClient(latency?: number): MockApiClient {
  const client = new MockApiClient();
  if (latency !== undefined) {
    client.setLatency(latency);
  }
  return client;
}
