import { EventEmitter } from 'events';

class WebSocketClient extends EventEmitter {
  private socket: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private socketId: string | null = null;

  constructor() {
    super();
    // Determine the WebSocket URL based on the current origin
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.url = `${protocol}//${window.location.host}/ws`;
  }

  connect() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.emit('connect');
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'connection') {
            this.socketId = message.clientId;
            console.log('Received client ID:', this.socketId);
          }
          this.emit('message', message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('connect_error', error);
      };

      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.emit('disconnect');
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.emit('connect_error', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('reconnect_failed');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  sendMessage(event: string, data?: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ event, data }));
    } else {
      console.warn('WebSocket is not connected');
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

  startModel(modelId: string) {
    this.sendMessage('startModel', { modelId });
  }

  stopModel(modelId: string) {
    this.sendMessage('stopModel', { modelId });
  }

  getConnectionState(): string {
    if (!this.socket) return 'disconnected';
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }

  getSocketId(): string | null {
    return this.socketId;
  }
}

export const websocketServer = new WebSocketClient();
