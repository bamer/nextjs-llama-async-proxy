import { spawn, ChildProcess } from 'child_process';
import { Socket } from 'socket.io';

export class MockLlamaService {
  private state: string = 'initial';
  private models: any[] = [];

  constructor() {
    this.state = 'initial';
  }

  async start(): Promise<void> {
    this.state = 'starting';
    await new Promise(resolve => setTimeout(resolve, 100));
    this.state = 'ready';
  }

  async stop(): Promise<void> {
    this.state = 'stopped';
  }

  onStateChange(callback: (state: string) => void): void {
    callback(this.state);
  }

  getState(): string {
    return this.state;
  }

  async healthCheck(): Promise<boolean> {
    return this.state === 'ready';
  }

  getModels(): any[] {
    return this.models;
  }
}

export class MockChildProcess {
  private killed = false;

  kill(signal: string): void {
    this.killed = true;
  }

  on(event: string, callback: () => void): void {
  }

  stdout = {
    on: (event: string, callback: (data: Buffer) => void) => void => {},
  };

  stderr = {
    on: (event: string, callback: (data: Buffer) => void) => void => {},
  };
}

export const mockSpawn = jest.fn((command: string, args: string[]): MockChildProcess => {
  return new MockChildProcess();
});

jest.mock('child_process', () => ({
  spawn: mockSpawn,
}));

export const createMockLlamaServerIntegration = () => ({
  initialize: jest.fn().mockResolvedValue(undefined),
  setupWebSocketHandlers: jest.fn(),
  getSystemMetrics: jest.fn().mockResolvedValue({
    cpuUsage: 50,
    memoryUsage: 60,
    diskUsage: 70,
    activeModels: 1,
    totalRequests: 100,
    avgResponseTime: 200,
    uptime: 3600,
    timestamp: new Date().toISOString(),
  }),
  getMetrics: jest.fn().mockResolvedValue({
    cpuUsage: 50,
    memoryUsage: 60,
  }),
  stop: jest.fn().mockResolvedValue(undefined),
  getLlamaService: jest.fn().mockReturnValue(new MockLlamaService()),
});

export const createMockSocket = (): Partial<Socket> => ({
  id: 'test-socket-id',
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  join: jest.fn(),
  leave: jest.fn(),
  disconnect: jest.fn(),
});

export const waitForAsync = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
