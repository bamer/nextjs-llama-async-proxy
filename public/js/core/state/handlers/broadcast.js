/**
 * State Broadcast Handlers - Handle broadcast events
 */

class StateBroadcastHandlers {
  constructor(stateCore, handlers) {
    this.core = stateCore;
    this.handlers = handlers;
  }

  /**
   * Setup broadcast event handlers
   * @param {Object} socket - Socket instance
   */
  setup(socket) {
    socket.on("models:list", (data) => {
      if (data?.type === "broadcast") {
        this.core.set("models", data.data?.models || []);
      }
    });

    socket.on("models:created", (data) => {
      if (data?.type === "broadcast") {
        this.handlers.onModelCreated?.(data.data?.model);
      }
    });

    socket.on("models:updated", (data) => {
      if (data?.type === "broadcast") {
        this.handlers.onModelUpdated?.(data.data?.model);
      }
    });

    socket.on("models:deleted", (data) => {
      if (data?.type === "broadcast") {
        this.handlers.onModelDeleted?.(data.data?.modelId);
      }
    });

    socket.on("models:scanned", () => {
      this.handlers.onModelsScanned?.();
    });

    socket.on("models:router-stopped", () => {
      const models = this.core.get("models") || [];
      const updatedModels = models.map((m) => ({ ...m, status: "unloaded" }));
      this.core.set("models", updatedModels);
      this.core.set("routerStatus", null);
    });

    socket.on("metrics:update", (data) => {
      if (data?.type === "broadcast") {
        this.core.set("metrics", data.data?.metrics);
        this.handlers.onMetric?.(data.data?.metrics);
      }
    });

    socket.on("logs:entry", (data) => {
      if (data?.type === "broadcast") {
        this.handlers.onLog?.(data.data?.entry);
      }
    });
  }
}

window.StateBroadcastHandlers = StateBroadcastHandlers;
