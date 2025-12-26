import { ModelConfig, SystemMetrics, LogEntry } from '@/types/global';

export const testModels: ModelConfig[] = [
  {
    id: 'test-model-1',
    name: 'Llama-2-7B-Chat',
    type: 'llama',
    parameters: {
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 2048,
    },
    status: 'idle',
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 'test-model-2',
    name: 'Mistral-7B-Instruct',
    type: 'mistral',
    parameters: {
      temperature: 0.8,
      top_p: 0.95,
      max_tokens: 4096,
    },
    status: 'idle',
    createdAt: '2024-01-10T14:30:00.000Z',
    updatedAt: '2024-01-10T14:30:00.000Z',
  },
  {
    id: 'test-model-3',
    name: 'Qwen-14B-Chat',
    type: 'llama',
    parameters: {
      temperature: 0.6,
      top_p: 0.85,
      max_tokens: 8192,
    },
    status: 'running',
    createdAt: '2024-01-05T09:15:00.000Z',
    updatedAt: '2024-01-05T09:15:00.000Z',
  },
];

export const testMetrics: SystemMetrics = {
  cpuUsage: 25.5,
  memoryUsage: 45.2,
  diskUsage: 62.8,
  activeModels: 1,
  totalRequests: 847,
  avgResponseTime: 185,
  uptime: 1200000,
  timestamp: new Date().toISOString(),
  gpuUsage: 45.8,
  gpuMemoryUsage: 52.3,
  gpuMemoryTotal: 24576,
  gpuMemoryUsed: 12843,
  gpuPowerUsage: 185,
  gpuPowerLimit: 320,
  gpuTemperature: 65,
  gpuName: 'NVIDIA RTX 4090',
};

export const testLogs: LogEntry[] = [
  {
    id: 'log-test-1',
    level: 'info',
    message: 'Application started successfully',
    timestamp: new Date(Date.now() - 60000).toISOString(),
  },
  {
    id: 'log-test-2',
    level: 'info',
    message: 'Connected to llama-server',
    timestamp: new Date(Date.now() - 45000).toISOString(),
  },
  {
    id: 'log-test-3',
    level: 'info',
    message: 'Loaded 3 models from server',
    timestamp: new Date(Date.now() - 30000).toISOString(),
    context: {
      models: testModels.map(m => m.name),
    },
  },
  {
    id: 'log-test-4',
    level: 'warn',
    message: 'High GPU memory usage detected',
    timestamp: new Date(Date.now() - 15000).toISOString(),
    context: {
      gpuMemoryUsage: 85,
      threshold: 80,
    },
  },
  {
    id: 'log-test-5',
    level: 'debug',
    message: 'Metrics update: CPU 25%, Memory 45%',
    timestamp: new Date(Date.now() - 5000).toISOString(),
  },
];

export const testModelResponses = {
  successResponse: {
    success: true,
    data: testModels[0],
    timestamp: new Date().toISOString(),
  },
  errorResponse: {
    success: false,
    error: {
      code: 'MODEL_NOT_FOUND',
      message: 'Model not found',
      details: {
        modelId: 'invalid-model-id',
      },
    },
    timestamp: new Date().toISOString(),
  },
  validationError: {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid configuration',
      details: {
        field: 'temperature',
        issue: 'Must be between 0 and 2',
      },
    },
    timestamp: new Date().toISOString(),
  },
};

export const testWebSocketMessages = {
  connectionMessage: {
    type: 'connection',
    clientId: 'test-client-123',
    message: 'Connected to Socket.IO server',
    timestamp: Date.now(),
  },
  metricsMessage: {
    type: 'metrics',
    data: testMetrics,
    timestamp: Date.now(),
  },
  modelsMessage: {
    type: 'models',
    data: testModels,
    timestamp: Date.now(),
  },
  logsMessage: {
    type: 'logs',
    data: testLogs,
    timestamp: Date.now(),
  },
  modelStartedMessage: {
    type: 'modelStarted',
    data: {
      modelId: 'test-model-3',
      status: 'running',
    },
    timestamp: Date.now(),
  },
  modelStoppedMessage: {
    type: 'modelStopped',
    data: {
      modelId: 'test-model-3',
      status: 'idle',
    },
    timestamp: Date.now(),
  },
  errorMessage: {
    type: 'error',
    data: {
      code: 'CONNECTION_ERROR',
      message: 'Failed to connect to server',
    },
    timestamp: Date.now(),
  },
};

export const testConfigurations = {
  defaultConfig: {
    llamaHost: 'localhost',
    llamaPort: 8134,
    maxTokens: 2048,
    temperature: 0.7,
    topP: 0.9,
  },
  highPerformanceConfig: {
    llamaHost: 'localhost',
    llamaPort: 8134,
    maxTokens: 8192,
    temperature: 0.6,
    topP: 0.85,
  },
  lowResourceConfig: {
    llamaHost: 'localhost',
    llamaPort: 8134,
    maxTokens: 512,
    temperature: 0.8,
    topP: 0.95,
  },
};

export const testApiEndpoints = {
  getModels: '/api/models',
  getModelById: '/api/models/[name]',
  startModel: '/api/models/[name]/start',
  stopModel: '/api/models/[name]/stop',
  getMetrics: '/api/metrics',
  getLogs: '/api/logs',
};

export function getTestModelById(id: string): ModelConfig | undefined {
  return testModels.find(model => model.id === id);
}

export function getRandomTestModel(): ModelConfig {
  return testModels[Math.floor(Math.random() * testModels.length)];
}

export function createTestLog(
  level: LogEntry['level'],
  message: string,
  context?: Record<string, unknown>
): LogEntry {
  return {
    id: `log-${Date.now()}`,
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  };
}

export function createTestMetric(overrides: Partial<SystemMetrics> = {}): SystemMetrics {
  return {
    ...testMetrics,
    ...overrides,
    timestamp: new Date().toISOString(),
  };
}

export const testUser = {
  id: 'test-user-1',
  username: 'testuser',
  email: 'test@example.com',
  role: 'admin',
};

export const testSession = {
  token: 'test-jwt-token-123456',
  user: testUser,
  expiresAt: new Date(Date.now() + 3600000).toISOString(),
};
