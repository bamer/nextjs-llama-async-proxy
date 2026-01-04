import type { StoreSelector } from "__tests__/types/mock-types";

export const mockState = {
  models: [
    { id: 'model1', name: 'Llama 2 7B', status: 'running', type: 'llama' },
    { id: 'model2', name: 'Mistral 7B', status: 'idle', type: 'mistral' },
  ],
  metrics: {
    cpuUsage: 50,
    memoryUsage: 60,
    diskUsage: 70,
    activeModels: 1,
    uptime: 3600,
    totalRequests: 1000,
    avgResponseTime: 150,
    gpuUsage: { utilization: 80, power: 200 },
    gpuMemoryUsed: 10,
    gpuMemoryTotal: 24,
    gpuTemperature: 65,
    gpuName: 'NVIDIA RTX 4090',
  },
  logs: [],
};

export const mockChartHistory = {
  cpu: [{ value: 50, timestamp: Date.now() }],
  memory: [{ value: 60, timestamp: Date.now() }],
  requests: [{ value: 100, timestamp: Date.now() }],
  gpuUtil: [{ value: 80, timestamp: Date.now() }],
  power: [{ value: 200, timestamp: Date.now() }],
};

export const mockWebSocketConnected = {
  isConnected: true,
  connectionState: "connected",
  sendMessage: jest.fn(),
  requestMetrics: jest.fn(),
  requestLogs: jest.fn(),
  requestModels: jest.fn(),
  startModel: jest.fn(),
  stopModel: jest.fn(),
  socketId: "socket-123",
};

export const mockWebSocketDisconnected = {
  isConnected: false,
  connectionState: "disconnected",
  sendMessage: jest.fn(),
  requestMetrics: jest.fn(),
  requestLogs: jest.fn(),
  requestModels: jest.fn(),
  startModel: jest.fn(),
  stopModel: jest.fn(),
  socketId: null,
};

export const mockSendMessage = jest.fn();
