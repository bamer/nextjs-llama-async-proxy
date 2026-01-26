// Lightweight Socket.IO client wrapper (vanilla JS)
// Provides a consistent API: connect, disconnect, request, on, off, emit

export class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map(); // event -> Set of callbacks
  }

  connect(opts = {}) {
    if (this.socket) return this;
    // Try to reuse global io if loaded by index.html script
    const path = opts.path || "/llamaproxws";
    const transports = opts.transports || ["websocket"];
    const auth = opts.auth || {};
    const query = opts.query || {};

    // eslint-disable-next-line no-undef
    this.socket = window.io?.({ path, transports, auth, query }) ?? null;
    if (this.socket) {
      this.socket.on("connect", () => {
        // no-op connect handler; user can subscribe externally
      });
    }
    return this;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected() {
    return !!this.socket && this.socket.connected;
  }

  on(event, callback) {
    if (!this.socket) return () => {};
    const wrapped = callback;
    this.socket.on(event, wrapped);
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(wrapped);
    return () => {
      this.socket.off(event, wrapped);
      this.listeners.get(event).delete(wrapped);
    };
  }

  off(event, callback) {
    if (!this.socket) return;
    this.socket.off(event, callback);
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (!this.socket) return;
    this.socket.emit(event, data);
  }

  // Request/ack style with a Promise wrapper
  request(event, data = {}, timeout = 30000) {
    if (!this.socket) return Promise.reject(new Error("Not connected to server"));
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        reject(new Error(`Request timeout (${timeout}ms): ${event}`));
      }, timeout);
      try {
        this.socket.emit(event, data, (response) => {
          clearTimeout(t);
          resolve(response);
        });
      } catch (e) {
        clearTimeout(t);
        reject(e);
      }
    });
  }
}

// Default singleton instance for quick usage
export const socketClient = new SocketService();
