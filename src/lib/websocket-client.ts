/**
 * WebSocket client for real-time communication
 * Combines connection management, message handling, and API methods
 */

import { EventEmitter } from 'events';
import { Socket } from 'socket.io-client';
import { ConnectionManager } from './websocket-client/connection';
import { MessageHandler } from './websocket-client/message-handler';
import { WebSocketAPI } from './websocket-client/api';

export class WebSocketClient extends EventEmitter {
  private connectionManager: ConnectionManager;
  private messageHandler: MessageHandler;
  private api: WebSocketAPI;

  constructor() {
    super();
    this.connectionManager = new ConnectionManager();
    this.messageHandler = new MessageHandler();
    this.api = new WebSocketAPI(this.messageHandler);
    this.setupEventForwarding();
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    this.connectionManager.connect();
    this.messageHandler.attachSocket(this.connectionManager.getSocket());
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.connectionManager.disconnect();
    this.messageHandler.attachSocket(null);
  }

  /**
   * Send a message to server
   */
  sendMessage(event: string, data?: unknown): void {
    this.messageHandler.sendMessage(event, data);
  }

  /**
   * Get current connection state
   */
  getConnectionState(): string {
    return this.connectionManager.getConnectionState();
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | null {
    return this.connectionManager.getSocketId();
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.connectionManager.getSocket();
  }

  /**
   * Forward connection events to this client's emitter
   */
  private setupEventForwarding(): void {
    this.connectionManager.on('connect', () => {
      this.emit('connect');
      this.messageHandler.flushQueue();
    });

    this.connectionManager.on('connect_error', (error: unknown) => {
      this.emit('connect_error', error);
    });

    this.connectionManager.on('disconnect', () => {
      this.emit('disconnect');
    });

    this.messageHandler.on('message', (message: unknown) => {
      this.emit('message', message);
    });

    // Forward all database-related events
    const dbEvents = [
      'models_loaded',
      'model_saved',
      'model_updated',
      'model_deleted',
      'config_loaded',
      'config_saved',
      'models_imported',
    ];

    dbEvents.forEach((event) => {
      this.messageHandler.on(event, (data: unknown) => {
        this.emit(event, data);
      });
    });
  }

  // API methods
  readonly requestMetrics = () => this.api.requestMetrics();
  readonly requestLogs = () => this.api.requestLogs();
  readonly requestModels = () => this.api.requestModels();
  readonly requestLlamaStatus = () => this.api.requestLlamaStatus();
  readonly rescanModels = () => this.api.rescanModels();
  readonly startModel = (modelId: string) => this.api.startModel(modelId);
  readonly stopModel = (modelId: string) => this.api.stopModel(modelId);
}

// Export singleton instance
export const websocketServer = new WebSocketClient();
