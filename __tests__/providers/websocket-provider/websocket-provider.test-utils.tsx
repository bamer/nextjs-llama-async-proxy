/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { useWebSocketContext } from "@/providers/websocket-provider";

/**
 * Mock metrics data for testing
 */
export const mockMetrics = {
  cpuUsage: 45,
  memoryUsage: 60,
  uptimeSeconds: 3600,
  totalRequests: 100,
  gpuUsage: 0,
  gpuPowerUsage: 0,
  timestamp: new Date().toISOString(),
};

/**
 * Mock logs data for testing
 */
export const mockLogs = [
  {
    id: "1",
    level: "info",
    message: "Test log message",
    timestamp: new Date().toISOString(),
  },
  {
    id: "2",
    level: "error",
    message: "Test error message",
    timestamp: new Date().toISOString(),
  },
];

/**
 * Mock model config data for testing
 */
export const mockModelConfig = {
  id: "1",
  name: "test-model",
  status: "running",
  size: "7B",
  quantization: "Q4_K_M",
};

/**
 * Mock models data for testing
 */
export const mockModels = [
  {
    id: "1",
    name: "test-model-1",
    status: "running",
    size: "7B",
    quantization: "Q4_K_M",
  },
  {
    id: "2",
    name: "test-model-2",
    status: "loaded",
    size: "13B",
    quantization: "Q5_K_M",
  },
];

/**
 * Test component for accessing WebSocket context
 */
export const TestComponent = () => {
  const context = useWebSocketContext();
  return (
    <div>
      <span data-testid="isConnected">{String(context.isConnected)}</span>
      <span data-testid="connectionState">{context.connectionState}</span>
    </div>
  );
};

/**
 * Setup mocks for WebSocket tests
 */
export const setupMocks = () => {
  // Mock store
  const mockStore = {
    setMetrics: jest.fn(),
    addLog: jest.fn(),
    updateModel: jest.fn(),
    setModels: jest.fn(),
    setLlamaServerStatus: jest.fn(),
  };

  // Mock store module
  jest.mocked(require("@/lib/store").useStore).mockImplementation((selector: unknown) => {
    const state = {
      metrics: null,
      chartHistory: {
        cpu: [],
        memory: [],
        requests: [],
        gpuUtil: [],
        power: [],
      },
      setMetrics: mockStore.setMetrics,
      addLog: mockStore.addLog,
      updateModel: mockStore.updateModel,
      setModels: mockStore.setModels,
      setLlamaServerStatus: mockStore.setLlamaServerStatus,
    };
    return selector(state);
  });

  // Mock websocket client
  jest.mocked(require("@/lib/websocket-client").websocketServer).connect = jest.fn();
  jest.mocked(require("@/lib/websocket-client").websocketServer).disconnect = jest.fn();
  jest.mocked(require("@/lib/websocket-client").websocketServer).on = jest.fn();
  jest.mocked(require("@/lib/websocket-client").websocketServer).off = jest.fn();
  jest.mocked(require("@/lib/websocket-client").websocketServer).sendMessage = jest.fn();
  jest.mocked(require("@/lib/websocket-client").websocketServer).requestMetrics = jest.fn();
  jest.mocked(require("@/lib/websocket-client").websocketServer).requestLogs = jest.fn();
  jest.mocked(require("@/lib/websocket-client").websocketServer).requestModels = jest.fn();

  return { mockStore };
};
