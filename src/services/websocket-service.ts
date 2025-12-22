// WebSocket Service using Socket.IO - Client-side WebSocket management
// This service provides a unified interface for WebSocket communications
import { io, Socket } from "socket.io-client";

interface WebSocketEventListeners {
  [key: string]: ((...args: any[]) => void)[];
}

interface MetricsData {
  activeModels: number;
  totalRequests: number;
  avgResponseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  uptime: number;
  timestamp: string;
}

interface ModelData {
  id: string;
  name: string;
  type: string;
  status: string;
  parameters: any;
  createdAt: string;
  updatedAt: string;
}

interface LogData {
  level: string;
  message: string;
  timestamp: number;
  source: string;
  context?: any;
}

class WebSocketService {
  private eventListeners: WebSocketEventListeners = {};
  private socketId: string;
  private isConnectedState: boolean = false;
  private connectionState: string = "disconnected";
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 3000;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private socket: Socket | null = null;
  private serverUrl: string;

  constructor() {
    this.socketId = 'ws-' + Math.random().toString(36).substring(2, 9);
    this.serverUrl = this.getServerUrl();
  }

  private getServerUrl(): string {
    // Use the same protocol as the current page
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    // Use Socket.IO endpoint
    return `${protocol}//${host}/api/websocket`;
  }

  private triggerEvent(event: string, ...args: any[]): void {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(...args));
    }
  }

  private setConnectionState(state: string): void {
    this.connectionState = state;
    this.triggerEvent('state_change', state);
  }

  // Public API
  
  connect(): void {
    if (this.isConnectedState) {
      console.log('Socket.IO already connected');
      return;
    }

    this.setConnectionState('connecting');
    
    try {
      // Convert protocol to http/https for Socket.IO
      const httpProtocol = window.location.protocol;
      const host = window.location.host;
      const socketIOUrl = `${httpProtocol}//${host}/api/websocket`;

      console.log('Connecting to Socket.IO server:', socketIOUrl);

      this.socket = io(socketIOUrl, {
        transports: ['websocket'], // Force WebSocket transport
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectInterval,
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('Socket.IO connected to', socketIOUrl);
        this.isConnectedState = true;
        this.reconnectAttempts = 0;
        this.setConnectionState('connected');
        this.triggerEvent('connect');
        
        // Start periodic data requests
        this.startPeriodicUpdates();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket.IO disconnected:', reason);
        this.isConnectedState = false;
        this.setConnectionState('disconnected');
        this.triggerEvent('disconnect');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        this.setConnectionState('error');
        this.triggerEvent('connect_error', error);
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log('Socket.IO reconnected after', attemptNumber, 'attempts');
        this.setConnectionState('connected');
        this.triggerEvent('reconnect');
      });

      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('Socket.IO reconnect attempt', attemptNumber);
        this.setConnectionState('reconnecting');
        this.triggerEvent('reconnect_attempt', attemptNumber);
      });

      this.socket.on('reconnect_failed', () => {
        console.log('Socket.IO reconnect failed');
        this.setConnectionState('disconnected');
        this.triggerEvent('reconnect_failed');
      });

      this.socket.on('status', (data) => {
        console.log('Socket.IO status:', data);
        this.triggerEvent('status', data);
      });

      this.socket.on('metrics', (data) => {
        console.log('Socket.IO metrics received:', data);
        this.triggerEvent('message', { type: 'metrics', data: data });
      });

      this.socket.on('models', (data) => {
        console.log('Socket.IO models received:', data);
        this.triggerEvent('message', { type: 'models', data: data });
      });

      this.socket.on('logs', (data) => {
        console.log('Socket.IO logs received:', data);
        this.triggerEvent('message', { type: 'logs', data: data });
      });

      this.socket.on('model_status', (data) => {
        console.log('Socket.IO model status received:', data);
        this.triggerEvent('message', { type: 'model_status', data: data });
      });

      this.socket.onAny((event, data) => {
        console.log('Socket.IO any event:', event, data);
        this.triggerEvent('message', { type: event, data: data });
      });

    } catch (error) {
      console.error('Failed to create Socket.IO connection:', error);
      this.setConnectionState('error');
      this.triggerEvent('connect_error', error);
    }
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnectedState = false;
    this.setConnectionState('disconnected');
  }

  getConnectionState(): string {
    return this.connectionState;
  }

  isConnected(): boolean {
    return this.isConnectedState;
  }

  getSocketId(): string {
    return this.socketId;
  }

  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  off(event: string, callback: (...args: any[]) => void): void {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(
        cb => cb !== callback
      );
    }
  }

  sendMessage(event: string, data?: any): void {
    if (!this.isConnectedState || !this.socket) {
      console.warn('Socket.IO not connected, cannot send message');
      return;
    }

    const message = {
      type: event,
      data: data,
      timestamp: Date.now(),
      socketId: this.socketId
    };

    try {
      this.socket.emit(event, message);
      console.log('Socket.IO message sent:', message);
    } catch (error) {
      console.error('Failed to send Socket.IO message:', error);
    }
  }

  requestMetrics(): void {
    if (this.isConnectedState && this.socket) {
      console.log('Requesting metrics via Socket.IO');
      this.socket.emit('getMetrics');
    } else {
      console.warn('Socket.IO not connected, cannot request metrics');
      // Fallback to mock data if not connected
      this.generateMockMetrics();
    }
  }

  requestModels(): void {
    if (this.isConnectedState && this.socket) {
      console.log('Requesting models via Socket.IO');
      this.socket.emit('getModels');
    } else {
      console.warn('Socket.IO not connected, cannot request models');
      // Fallback to mock data if not connected
      this.generateMockModels();
    }
  }

  requestLogs(): void {
    if (this.isConnectedState && this.socket) {
      console.log('Requesting logs via Socket.IO');
      this.socket.emit('getLogs');
    } else {
      console.warn('Socket.IO not connected, cannot request logs');
      // Fallback to mock data if not connected
      this.generateMockLogs();
    }
  }

  startModel(modelId: string): void {
    if (this.isConnectedState && this.socket) {
      console.log('Starting model via Socket.IO:', modelId);
      this.socket.emit('startModel', { modelId });
    } else {
      console.warn('Socket.IO not connected, cannot start model');
    }
  }

  stopModel(modelId: string): void {
    if (this.isConnectedState && this.socket) {
      console.log('Stopping model via Socket.IO:', modelId);
      this.socket.emit('stopModel', { modelId });
    } else {
      console.warn('Socket.IO not connected, cannot stop model');
    }
  }

  // Fallback mock data generators
  private generateMockMetrics(): void {
    const metrics: MetricsData = {
      activeModels: Math.floor(Math.random() * 5) + 1,
      totalRequests: Math.floor(Math.random() * 1000) + 500,
      avgResponseTime: Math.floor(Math.random() * 500) + 100,
      memoryUsage: Math.floor(Math.random() * 30) + 50,
      cpuUsage: Math.floor(Math.random() * 20) + 5,
      diskUsage: Math.floor(Math.random() * 40) + 30,
      uptime: Math.floor(Math.random() * 100) + 80,
      timestamp: new Date().toISOString()
    };
    
    setTimeout(() => {
      this.triggerEvent('message', { type: 'metrics', data: metrics });
    }, 100);
  }

  private generateMockModels(): void {
    const models: ModelData[] = [
      {
        id: 'llama-7b',
        name: 'Llama 7B',
        type: 'llama',
        status: 'running',
        parameters: { temperature: 0.7, maxTokens: 2048, topP: 0.9 },
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString()
      }
    ];
    
    setTimeout(() => {
      this.triggerEvent('message', { type: 'models', data: models });
    }, 100);
  }

  private generateMockLogs(): void {
    const logs: LogData[] = [
      {
        level: 'info',
        message: 'Model loading completed successfully',
        timestamp: Date.now(),
        source: 'model-manager'
      },
      {
        level: 'debug',
        message: 'Socket.IO connection established',
        timestamp: Date.now(),
        source: 'websocket-service'
      }
    ];
    
    setTimeout(() => {
      this.triggerEvent('message', { type: 'logs', data: logs });
    }, 100);
  }

  private startPeriodicUpdates(): void {
    // Request initial data
    this.requestMetrics();
    this.requestModels();
    this.requestLogs();

    // Set up periodic updates
    setInterval(() => {
      if (this.isConnectedState) {
        this.requestMetrics();
        this.requestModels();
      }
    }, 10000); // Every 10 seconds

    setInterval(() => {
      if (this.isConnectedState) {
        this.requestLogs();
      }
    }, 15000); // Every 15 seconds
  }

  // Singleton pattern
  private static instance: WebSocketService;

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }
}

// Export singleton instance
export const websocketService = WebSocketService.getInstance();