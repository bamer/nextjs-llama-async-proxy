import { EventEmitter } from 'events';
import { io, Socket } from 'socket.io-client';

interface QueuedMessage {
  event: string;
  data?: unknown;
}

class WebSocketClient extends EventEmitter {
  private socket: Socket | null = null;
  private socketId: string | null = null;
  private messageQueue: QueuedMessage[] = [];
  private isConnecting: boolean = false;

  constructor() {
    super();
  }

  connect() {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

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
        this.isConnecting = false;
        this.socketId = this.socket?.id || null;
        this.emit('connect');

        // Send queued messages after connection is established
        this.flushMessageQueue();
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

      // Database-related events (emit as 'message' events with type field)
      this.socket.on('models_loaded', (data) => {
        this.emit('message', { type: 'models_loaded', ...data });
        this.emit('models_loaded', data);
      });

      this.socket.on('model_saved', (data) => {
        this.emit('message', { type: 'model_saved', ...data });
        this.emit('model_saved', data);
      });

      this.socket.on('model_updated', (data) => {
        this.emit('message', { type: 'model_updated', ...data });
        this.emit('model_updated', data);
      });

      this.socket.on('model_deleted', (data) => {
        this.emit('message', { type: 'model_deleted', ...data });
        this.emit('model_deleted', data);
      });

      this.socket.on('config_loaded', (data) => {
        this.emit('message', { type: 'config_loaded', ...data });
        this.emit('config_loaded', data);
      });

      this.socket.on('config_saved', (data) => {
        this.emit('message', { type: 'config_saved', ...data });
        this.emit('config_saved', data);
      });

      this.socket.on('models_imported', (data) => {
        this.emit('message', { type: 'models_imported', ...data });
        this.emit('models_imported', data);
      });

      this.socket.on('connect_error', (error) => {
        this.isConnecting = false;
        console.error('Socket.IO connection error:', error);
        this.emit('connect_error', error);
      });

      this.socket.on('disconnect', (reason) => {
        this.isConnecting = false;
        // Only log important disconnect reasons, not "io client disconnect"
        if (reason !== 'io client disconnect') {
          console.log('Socket.IO disconnected:', reason);
        }
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
      this.isConnecting = false;
    }
  }

  sendMessage(event: string, data?: unknown) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      // Queue message if not connected
      this.messageQueue.push({ event, data });
      // Only log if queue is getting too large (> 10 messages)
      if (this.messageQueue.length > 10) {
        console.warn(`Message queue size: ${this.messageQueue.length}, some messages may not be sent`);
      }
    }
  }

  private flushMessageQueue() {
    if (this.messageQueue.length === 0) {
      return;
    }

    // Only log if queue is substantial (> 5 messages)
    if (this.messageQueue.length > 5) {
      console.debug(`Flushing ${this.messageQueue.length} queued messages`);
    }

    while (this.messageQueue.length > 0) {
      const queued = this.messageQueue.shift();
      if (queued && this.socket?.connected) {
        this.socket.emit(queued.event, queued.data);
      }
    }
  }

  requestMetrics() {
    this.sendMessage('request_metrics', {});
  }

  requestLogs() {
    this.sendMessage('request_logs', {});
  }

  requestModels() {
    this.sendMessage('request_models', {});
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
    if (this.isConnecting) return 'connecting';
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

// Export both the class and singleton instance
export const websocketServer = new WebSocketClient();
export { WebSocketClient };
