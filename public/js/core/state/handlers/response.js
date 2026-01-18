/**
 * State Response Handlers - Handle response events
 */

class StateResponseHandlers {
  constructor(pending) {
    this.pending = pending;
  }

  /**
   * Setup response event handlers
   * @param {Object} socket - Socket instance
   */
  setup(socket) {
    const handleResponse = (event, data) => {
      console.log("[StateResponse] Received:", event, "RequestID:", data?.requestId, "Pending count:", this.pending.size);
      if (data?.requestId && this.pending.has(data.requestId)) {
        console.log("[StateResponse] Found pending request, resolving...");
        const p = this.pending.get(data.requestId);
        this.pending.delete(data.requestId);
        if (data.success) {
          console.log("[StateResponse] Resolving with data:", data.data);
          p.resolve(data.data);
        } else {
          console.log("[StateResponse] Rejecting:", data.error);
          p.reject(new Error(data.error?.message || "Request failed"));
        }
      } else {
        console.log("[StateResponse] No pending request for", data?.requestId, "Looking for:", event);
        // Debug: show what pending requests we have
        if (this.pending.size > 0) {
          console.log("[StateResponse] Pending requests:", Array.from(this.pending.keys()));
        }
      }
    };

    const responseEvents = [
      "models:list:result",
      "models:get:result",
      "models:create:result",
      "models:update:result",
      "models:delete:result",
      "models:start:result",
      "models:stop:result",
      "models:load:result",
      "models:unload:result",
      "llama:status:result",
      "models:scan:result",
      "models:cleanup:result",
      "metrics:get:result",
      "metrics:history:result",
      "logs:get:result",
      "logs:read-file:result",
      "logs:list-files:result",
      "logs:clear:result",
      "logs:clear-files:result",
      "config:get:result",
      "config:update:result",
      "settings:get:result",
      "settings:update:result",
      "llama:start:result",
      "llama:start-with-preset:result",
      "llama:stop:result",
      "llama:restart:result",
      "llama:config:result",
      "presets:list:result",
      // Router Config events (unified schema)
      "routerConfig:get:result",
      "routerConfig:update:result",
      "routerConfig:reset:result",
      // Logging Config events (unified schema)
      "loggingConfig:get:result",
      "loggingConfig:update:result",
      "loggingConfig:reset:result",
    ];

    responseEvents.forEach((evt) => {
      socket.on(evt, (data) => handleResponse(evt, data));
    });
  }
}

window.StateResponseHandlers = StateResponseHandlers;
