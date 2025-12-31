/**
 * WebSocket message handling and routing
 */

import { Socket } from 'socket.io-client';
import { EventEmitter } from 'events';
import { QueuedMessage } from './types';

export class MessageHandler extends EventEmitter {
  private socket: Socket | null = null;
  private messageQueue: QueuedMessage[] = [];

  /**
   * Set socket instance and set up message handlers
   */
  attachSocket(socket: Socket | null): void {
    this.socket = socket;

    if (this.socket) {
      this.setupMessageListeners();
    }
  }

  /**
   * Send a message to server
   */
  sendMessage(event: string, data?: unknown): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      this.queueMessage(event, data);
    }
  }

  /**
   * Queue a message for later sending
   */
  private queueMessage(event: string, data?: unknown): void {
    this.messageQueue.push({ event, data });

    if (this.messageQueue.length > 10) {
      console.warn(
        `Message queue size: ${this.messageQueue.length}, some messages may not be sent`
      );
    }
  }

  /**
   * Flush all queued messages
   */
  flushQueue(): void {
    if (this.messageQueue.length === 0) {
      return;
    }

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

  /**
   * Set up Socket.IO message listeners
   */
  private setupMessageListeners(): void {
    if (!this.socket) return;

    // Generic message handler
    this.socket.on('message', (message) => {
      if (message.type === 'connection') {
        // Update socket ID from connection message
        this.emit('socketIdUpdated', message.clientId);
      }
      this.emit('message', message);
    });

    // Specific event handlers
    this.setupEventListeners();
  }

  /**
   * Set up specific event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Metrics
    this.socket.on('metrics', (data) => {
      this.emit('message', { type: 'metrics', data: data.data });
    });

    // Models
    this.socket.on('models', (data) => {
      this.emit('message', { type: 'models', data: data.data });
    });

    // Logs
    this.socket.on('logs', (data) => {
      this.emit('message', { type: 'logs', data: data.data });
    });

    // Individual log events
    this.socket.on('log', (data) => {
      if (data.data) {
        this.emit('message', { type: 'log', data: data.data });
      }
    });

    // Database-related events
    this.setupDatabaseListeners();
  }

  /**
   * Set up database event listeners
   */
  private setupDatabaseListeners(): void {
    if (!this.socket) return;

    const dbEvents = [
      'models_loaded',
      'model_saved',
      'model_updated',
      'model_deleted',
      'config_loaded',
      'config_saved',
      'models_imported',
    ] as const;

    dbEvents.forEach((event) => {
      this.socket?.on(event, (data) => {
        this.emit('message', { type: event, ...data });
        this.emit(event, data);
      });
    });
  }
}
