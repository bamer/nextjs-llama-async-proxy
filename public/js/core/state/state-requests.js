/**
 * State Requests Module - Request management with automatic reconnection
 * Provides utility functions for making socket requests with timeout handling
 */

const StateRequests = {
  /**
   * Make an async request with automatic reconnection handling
   * @param {Object} socket - Socket.IO socket instance
   * @param {boolean} connected - Current connection status
   * @param {string} event - Event name to request
   * @param {Object} [data={}] - Data payload to send
   * @param {Map} pending - Map of pending requests for cleanup
   * @returns {Promise<Object>} Response data from server
   * @throws {Error} If connection timeout (10 seconds) or server error
   */
  request(socket, connected, event, data = {}, pending) {
    return new Promise((resolve, reject) => {
      if (!connected) {
        const checkConnection = setInterval(() => {
          if (connected) {
            clearInterval(checkConnection);
            StateRequests._doRequest(socket, event, data, resolve, reject, pending);
          }
        }, 100);
        setTimeout(() => {
          clearInterval(checkConnection);
          reject(new Error("Connection timeout"));
        }, 10000);
        return;
      }
      StateRequests._doRequest(socket, event, data, resolve, reject, pending);
    });
  },

  /**
   * Execute the actual socket request with timeout handling
   * @param {Object} socket - Socket.IO socket instance
   * @param {string} event - Event name to emit
   * @param {Object} data - Data payload to send
   * @param {Function} resolve - Promise resolve callback
   * @param {Function} reject - Promise reject callback
   * @param {Map} pending - Map of pending requests for timeout cleanup
   */
  _doRequest(socket, event, data, resolve, reject, pending) {
    const reqId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const isConfigOperation = event.startsWith("config:") || event.startsWith("settings:");
    const timeoutMs = isConfigOperation ? 5000 : 120000;
    const timeout = setTimeout(() => {
      console.warn("[STATE-REQUESTS] Request timeout:", event, "requestId:", reqId);
      pending.delete(reqId);
      reject(new Error(`Timeout: ${event}`));
    }, timeoutMs);
    pending.set(reqId, { resolve, reject, event, timeout });
    socket.emit(event, { ...data, requestId: reqId });
  },
};

window.StateRequests = StateRequests;
