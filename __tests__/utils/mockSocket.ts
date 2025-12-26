import { Server, Socket } from 'socket.io-client';

export class MockSocket {
  private listeners: Map<string, Function[]> = new Map();
  private connected: boolean = false;

  connect(): void {
    setTimeout(() => {
      this.connected = true;
      this.emit('connect');
    }, 100);
  }

  disconnect(): void {
    this.connected = false;
    this.emit('disconnect');
  }

  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(listener);
  }

  off(event: string, listener?: Function): void {
    if (!this.listeners.has(event)) {
      return;
    }

    const listeners = this.listeners.get(event);
    if (!listeners) {
      return;
    }

    if (listener) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    } else {
      this.listeners.delete(event);
    }
  }

  emit(event: string, ...args: unknown[]): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(...args));
    }
  }

  send(data: unknown): void {
    this.emit('message', data);
  }

  get connected(): boolean {
    return this.connected;
  }
}

export class MockSocketServer {
  private socket: MockSocket = new MockSocket();
  private id: string | null = null;

  connect(): void {
    this.socket.connect();
    this.id = 'mock-socket-123';
  }

  disconnect(): void {
    this.socket.disconnect();
    this.id = null;
  }

  on(event: string, listener: Function): void {
    this.socket.on(event, listener);
  }

  off(event: string, listener?: Function): void {
    this.socket.off(event, listener);
  }

  emit(event: string, ...args: unknown[]): void {
    this.socket.emit(event, ...args);
  }

  sendMessage(event: string, data?: unknown): void {
    this.socket.send({ event, data });
  }

  requestMetrics(): void {
    this.emit('requestMetrics');
    this.emit('metrics', {
      type: 'metrics',
      data: {
        cpuUsage: 50,
        memoryUsage: 60,
        diskUsage: 45,
        timestamp: new Date().toISOString(),
      },
      timestamp: Date.now(),
    });
  }

  requestModels(): void {
    this.emit('requestModels');
    this.emit('models', {
      type: 'models',
      data: [],
      timestamp: Date.now(),
    });
  }

  requestLogs(): void {
    this.emit('requestLogs');
    this.emit('logs', {
      type: 'logs',
      data: [],
      timestamp: Date.now(),
    });
  }

  startModel(modelId: string): void {
    this.emit('startModel', { modelId });
    this.emit('modelStarted', { modelId, status: 'running' });
  }

  stopModel(modelId: string): void {
    this.emit('stopModel', { modelId });
    this.emit('modelStopped', { modelId });
  }

  getSocketId(): string | null {
    return this.id;
  }

  get connected(): boolean {
    return this.socket.connected;
  }
}

export function createMockServer(): MockSocketServer {
  return new MockSocketServer();
}
