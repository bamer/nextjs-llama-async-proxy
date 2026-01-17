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
      if (data?.requestId && this.pending.has(data.requestId)) {
        const p = this.pending.get(data.requestId);
        this.pending.delete(data.requestId);
        if (data.success) {
          p.resolve(data.data);
        } else {
          p.reject(new Error(data.error?.message || "Request failed"));
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
    ];

    responseEvents.forEach((evt) => {
      socket.on(evt, (data) => handleResponse(evt, data));
    });
  }
}

window.StateResponseHandlers = StateResponseHandlers;
