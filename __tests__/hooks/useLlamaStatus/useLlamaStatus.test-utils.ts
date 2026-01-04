import { renderHook } from "@testing-library/react";

export const createMockSocket = () => ({
  on: jest.fn(),
  off: jest.fn(),
});

export const createMockWebsocketServer = () => ({
  on: jest.fn(),
  off: jest.fn(),
  sendMessage: jest.fn(),
  getSocket: jest.fn(() => null),
});

export const createDefaultStatusMessage = (overrides = {}) => ({
  type: "llama_status",
  data: {
    status: "running",
    models: [],
    lastError: null,
    retries: 0,
    uptime: 0,
    startedAt: null,
    ...overrides,
  },
});

export const createComplexModels = () => [
  {
    id: "model1",
    name: "Model 1",
    size: "7B",
    quantization: "Q4_K_M",
    memory: "4.2GB",
  },
  {
    id: "model2",
    name: "Model 2",
    size: "13B",
    quantization: "Q4_K_M",
    memory: "7.8GB",
  },
];

export const allStatusTypes = [
  "initial",
  "starting",
  "ready",
  "error",
  "crashed",
  "stopping",
] as const;
