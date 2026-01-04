import { useStore } from "@/lib/store";
import { useWebSocket } from "@/hooks/use-websocket";

interface MockMetrics {
  cpu?: { usage: number };
  memory?: { used: number };
  totalRequests?: number;
  gpu?: {
    usage?: number;
    memoryUsed?: number;
    powerUsage?: number;
    memoryTotal?: number;
    temperature?: number;
    name?: string;
  };
}

let mockMetrics: MockMetrics | null | undefined = null;

export function setupMockStore() {
  (useStore as jest.Mock).mockImplementation((selector: (state: unknown) => unknown) => {
    const state = {
      metrics: mockMetrics,
      chartHistory: {
        cpu: [],
        memory: [],
        requests: [],
        gpuUtil: [],
        power: [],
      },
      addChartData: jest.fn(),
    };
    return selector(state);
  });
}

export function setupMockWebSocket(isConnected: boolean = false) {
  (useWebSocket as jest.Mock).mockReturnValue({
    isConnected,
    connectionState: isConnected ? "connected" : "disconnected",
    sendMessage: jest.fn(),
  });
}

export function setMockMetrics(metrics: MockMetrics | null | undefined) {
  mockMetrics = metrics;
}

export function setMockIsConnected(connected: boolean) {
  setupMockWebSocket(connected);
}

export function clearMockMetrics() {
  mockMetrics = null;
  setupMockStore();
  setupMockWebSocket(false);
}

export const mockStore = useStore as jest.Mock;
export const mockWebSocket = useWebSocket as jest.Mock;
