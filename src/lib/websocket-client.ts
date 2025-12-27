import { EventEmitter } from 'events';
import { io, Socket } from 'socket.io-client';

class WebSocketClient extends EventEmitter {
  private socket: Socket | null = null;
  private socketId: string | null = null;

  constructor() {
    super();
  }

  connect() {
    if (this.socket?.connected) {
      return;
    }

    try {
      const url = typeof window !== 'undefined' 
        ? window.location.origin 
        : 'http://localhost:3000';

      this.socket = io(url, {
        path: '/llamaproxws',
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.socket.on('connect', () => {
        this.socketId = this.socket?.id || null;
        this.emit('connect');
      });

      this.socket.on('message', (message) => {
        if (message.type === 'connection') {
          this.socketId = message.clientId;
        }
        this.emit('message', message);
      });

      this.socket.on('metrics', (data) => {
        this.emit('message', { type: 'metrics', data: data.data });
      });

      this.socket.on('models', (data) => {
        this.emit('message', { type: 'models', data: data.data });
      });

      this.socket.on('logs', (data) => {
        this.emit('message', { type: 'logs', data: data.data });
      });

      // Listen for real-time individual log events
      this.socket.on('log', (data) => {
        if (data.data) {
          this.emit('message', { type: 'log', data: data.data });
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        this.emit('connect_error', error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket.IO disconnected:', reason);
        this.emit('disconnect');
      });

    } catch (error) {
      console.error('Failed to create Socket.IO connection:', error);
      this.emit('connect_error', error);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  sendMessage(event: string, data?: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket.IO is not connected');
    }
  }

  requestMetrics() {
    this.sendMessage('requestMetrics');
  }

  requestLogs() {
    this.sendMessage('requestLogs');
  }

  requestModels() {
    this.sendMessage('requestModels');
  }

  requestLlamaStatus() {
    this.sendMessage('requestLlamaStatus');
  }

  rescanModels() {
    this.sendMessage('rescanModels');
  }

  startModel(modelId: string) {
    this.sendMessage('startModel', { modelId });
  }

  stopModel(modelId: string) {
    this.sendMessage('stopModel', { modelId });
  }

  getConnectionState(): string {
    if (!this.socket) return 'disconnected';
    return this.socket.connected ? 'connected' : 'disconnected';
  }

  getSocketId(): string | null {
    return this.socketId;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const websocketServer = new WebSocketClient();
