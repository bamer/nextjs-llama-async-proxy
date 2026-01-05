/**
 * Socket.IO Client Service
 * Handles connection management and message routing
 */

class SocketClient {
  constructor(options = {}) {
    this.socket = null;
    this.options = {
      path: '/llamaproxws',
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      ...options
    };
    this.eventHandlers = new Map();
    this.connectionHandlers = {
      connect: [],
      disconnect: [],
      connect_error: [],
      reconnect: []
    };
    this._reconnectCount = 0;
  }

  /**
   * Connect to Socket.IO server
   */
  connect() {
    if (this.socket?.connected) {
      console.warn('[SocketClient] Already connected');
      return this;
    }

    // Load Socket.IO client script if not loaded
    if (!window.io) {
      this._loadSocketIO().then(() => this._connect());
    } else {
      this._connect();
    }

    return this;
  }

  /**
   * Load Socket.IO client script
   */
  _loadSocketIO() {
    return new Promise((resolve, reject) => {
      if (window.io) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = '/socket.io/socket.io.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Actually connect
   */
  _connect() {
    const url = window.location.origin;

    this.socket = window.io(url, this.options);

    this.socket.on('connect', () => {
      console.log('[SocketClient] Connected:', this.socket.id);
      this._reconnectCount = 0;
      this._emitConnection('connect', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[SocketClient] Disconnected:', reason);
      this._emitConnection('disconnect', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[SocketClient] Connection error:', error.message);
      this._emitConnection('connect_error', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('[SocketClient] Reconnected after', attemptNumber, 'attempts');
      this._reconnectCount = attemptNumber;
      this._emitConnection('reconnect', attemptNumber);
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('[SocketClient] Reconnection attempt:', attemptNumber);
    });

    // Handle responses to requests
    this._setupResponseHandler();

    // Setup default broadcast handlers
    this._setupDefaultHandlers();

    return this;
  }

  /**
   * Handle request/response pairs
   */
  _setupResponseHandler() {
    this.socket.onAny((event, data) => {
      if (data?.type === 'response') {
        // This is a response to a request
        if (data.requestId) {
          // Handled by StateManager
          window.stateManager?._handleResponse(data);
        }
      } else if (data?.type === 'broadcast') {
        // This is a broadcast
        // Let StateManager handle it
      }
    });
  }

  /**
   * Setup default broadcast event handlers
   */
  _setupDefaultHandlers() {
    const broadcasts = [
      'models:list',
      'models:status',
      'models:created',
      'models:updated',
      'models:deleted',
      'metrics:update',
      'logs:entry',
      'llama:status',
      'connection:established'
    ];

    broadcasts.forEach(event => {
      this.socket.on(event, (data) => {
        this._dispatchEvent(event, data);
      });
    });
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    return this;
  }

  /**
   * Send event to server
   */
  emit(event, data = {}) {
    if (!this.socket?.connected) {
      console.warn('[SocketClient] Cannot emit - not connected');
      return this;
    }

    this.socket.emit(event, data);
    return this;
  }

  /**
   * Request with response
   */
  request(event, data = {}) {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error(`Request timeout: ${event}`));
      }, 30000);

      // One-time response handler
      const responseHandler = (response) => {
        if (response.type === 'response' && response.requestId === requestId) {
          clearTimeout(timeout);
          this.socket.off(event, responseHandler);
          if (response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response.error?.message || 'Request failed'));
          }
        }
      };

      this.socket.on(event, responseHandler);
      this.socket.emit(event, { ...data, requestId });
    });
  }

  /**
   * Register event handler
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);

    if (this.socket) {
      this.socket.on(event, (data) => {
        this._dispatchEvent(event, data);
      });
    }

    return this;
  }

  /**
   * Remove event handler
   */
  off(event, handler) {
    if (handler) {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.eventHandlers.delete(event);
        }
      }
    } else {
      this.eventHandlers.delete(event);
    }

    return this;
  }

  /**
   * Register one-time event handler
   */
  once(event, handler) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      handler(...args);
    };
    this.on(event, wrapper);
    return this;
  }

  /**
   * Dispatch event to handlers
   */
  _dispatchEvent(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[SocketClient] Event handler error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Register connection handler
   */
  onConnect(handler) {
    this.connectionHandlers.connect.push(handler);
    return this;
  }

  /**
   * Register disconnection handler
   */
  onDisconnect(handler) {
    this.connectionHandlers.disconnect.push(handler);
    return this;
  }

  /**
   * Register connection error handler
   */
  onConnectError(handler) {
    this.connectionHandlers.connect_error.push(handler);
    return this;
  }

  /**
   * Emit connection event
   */
  _emitConnection(type, data) {
    const handlers = this.connectionHandlers[type];
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[SocketClient] Connection handler error:`, error);
        }
      });
    }
  }

  /**
   * Get connection status
   */
  get isConnected() {
    return this.socket?.connected || false;
  }

  /**
   * Get socket ID
   */
  get id() {
    return this.socket?.id || null;
  }
}

// Singleton instance
const socketClient = new SocketClient();

// Export
window.SocketClient = SocketClient;
window.socketClient = socketClient;
