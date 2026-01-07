/**
 * State Requests Module - Request management (merged with socket for efficiency)
 * This module provides request functionality using the socket module
 */

const StateRequests = {
  /**
   * Make an async request with timeout
   * @param {Object} socket - Socket instance
   * @param {boolean} connected - Connection status
   * @param {string} event - Event name
   * @param {Object} data - Request data
   * @param {Map} pending - Pending requests map
   * @returns {Promise} Response promise
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
   * Execute the actual request
   * @param {Object} socket - Socket instance
   * @param {string} event - Event name
   * @param {Object} data - Request data
   * @param {Function} resolve - Resolve callback
   * @param {Function} reject - Reject callback
   * @param {Map} pending - Pending requests map
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
