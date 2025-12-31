/**
 * WebSocket connection management
 */

import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';
import { ConnectionState, WEBSOCKET_CONFIG } from './types';

export class ConnectionManager extends EventEmitter {
  private socket: Socket | null = null;
  private socketId: string | null = null;
  private isConnecting: boolean = false;

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      const url = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

      console.log('[ConnectionManager] Connecting to WebSocket server at:', url);
      console.log('[ConnectionManager] WebSocket config path:', WEBSOCKET_CONFIG.path);
      console.log('[ConnectionManager] WebSocket config transports:', WEBSOCKET_CONFIG.transports);

      this.socket = io(url, WEBSOCKET_CONFIG);
      this.setupEventHandlers();

      // Explicitly connect since autoConnect is false
      this.socket.connect();
      console.log('[ConnectionManager] Socket.IO connect() called');
    } catch (error) {
      console.error('Failed to create Socket.IO connection:', error);
      this.isConnecting = false;
      this.emit('connect_error', error);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    if (this.isConnecting) return 'connecting';
    if (!this.socket) return 'disconnected';
    return this.socket.connected ? 'connected' : 'disconnected';
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | null {
    return this.socketId;
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Set up Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnecting = false;
      this.socketId = this.socket?.id || null;
      console.log('[ConnectionManager] ✅ WebSocket connected! Socket ID:', this.socketId);
      this.emit('connect');
    });

    this.socket.on('connect_error', (error) => {
      this.isConnecting = false;
      console.error('[ConnectionManager] ❌ WebSocket connection error:', error);
      console.error('[ConnectionManager] Error details:', {
        message: error.message,
        description: (error as any).description,
        context: (error as any).context,
        type: (error as any).type,
        request: (error as any).request
      });
      this.emit('connect_error', error);
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnecting = false;
      console.log('[ConnectionManager] ⚠️ WebSocket disconnected:', reason);
      if (reason !== 'io client disconnect') {
        console.log('[ConnectionManager] Disconnect reason:', reason);
      }
      this.emit('disconnect');
    });

    // Log all socket.io debug events
    this.socket.io.on('open', () => {
      console.log('[ConnectionManager] 🔄 Socket.IO underlying connection opened');
    });

    this.socket.io.on('close', (reason) => {
      console.log('[ConnectionManager] 🔒 Socket.IO underlying connection closed:', reason);
    });

    this.socket.io.on('error', (error) => {
      console.error('[ConnectionManager] ❌ Socket.IO underlying error:', error);
    });

    this.socket.io.on('reconnect', (attemptNumber) => {
      console.log('[ConnectionManager] 🔄 Socket.IO reconnected after attempt:', attemptNumber);
    });

    this.socket.io.on('reconnect_attempt', (attemptNumber) => {
      console.log('[ConnectionManager] 🔄 Socket.IO reconnection attempt:', attemptNumber);
    });

    this.socket.io.on('reconnect_error', (error) => {
      console.error('[ConnectionManager] ❌ Socket.IO reconnection error:', error);
    });

    this.socket.io.on('reconnect_failed', () => {
      console.error('[ConnectionManager] ❌ Socket.IO reconnection failed');
    });
  }
}
