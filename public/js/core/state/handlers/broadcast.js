/**
 * State Broadcast Handlers - Handle broadcast events
 * Includes memory leak prevention with Map size limits
 */

class StateBroadcastHandlers {
  /**
   * Maximum number of event types to track in _lastTimestamps Map.
   * Prevents unbounded memory growth from repeated unique event types.
   */
  static MAX_TIMESTAMP_ENTRIES = 100;

  constructor(stateCore, handlers) {
    this.core = stateCore;
    this.handlers = handlers;
    this._lastTimestamps = new Map(); // Track last timestamp for each event type
  }

  /**
   * Remove oldest entry when Map exceeds maximum size.
   * Uses FIFO eviction to keep most recent events.
   */
  _pruneTimestampsMap() {
    if (this._lastTimestamps.size > StateBroadcastHandlers.MAX_TIMESTAMP_ENTRIES) {
      const firstKey = this._lastTimestamps.keys().next().value;
      this._lastTimestamps.delete(firstKey);
    }
  }

  /**
   * Setup broadcast event handlers
   * @param {Object} socket - Socket instance
   */
  setup(socket) {
    socket.on("models:list", (data) => {
      if (data?.type === "broadcast" && this._shouldProcess("models:list", data.timestamp)) {
        console.log("[DEBUG] Broadcast models:list:", {
          timestamp: data.timestamp,
          modelsCount: data.data?.models?.length,
        });
        this.core.set("models", data.data?.models || []);
      }
    });

    socket.on("models:created", (data) => {
      if (data?.type === "broadcast" && this._shouldProcess("models:created", data.timestamp)) {
        console.log("[DEBUG] Broadcast models:created:", { model: data.data?.model?.name });
        this.handlers.onModelCreated?.(data.data?.model);
      }
    });

    socket.on("models:updated", (data) => {
      if (data?.type === "broadcast" && this._shouldProcess("models:updated", data.timestamp)) {
        console.log("[DEBUG] Broadcast models:updated:", { model: data.data?.model?.name });
        this.handlers.onModelUpdated?.(data.data?.model);
      }
    });

    socket.on("models:deleted", (data) => {
      if (data?.type === "broadcast" && this._shouldProcess("models:deleted", data.timestamp)) {
        console.log("[DEBUG] Broadcast models:deleted:", { modelId: data.data?.modelId });
        this.handlers.onModelDeleted?.(data.data?.modelId);
      }
    });

    socket.on("models:scanned", () => {
      console.log("[DEBUG] Broadcast models:scanned");
      this.handlers.onModelsScanned?.();
    });

    socket.on("models:router-stopped", () => {
      console.log("[DEBUG] Broadcast models:router-stopped received!");
      const models = this.core.get("models") || [];
      const updatedModels = models.map((m) => ({ ...m, status: "unloaded" }));
      this.core.set("models", updatedModels);
      const currentRouterStatus = this.core.get("routerStatus");
      console.log("[DEBUG] Broadcast models:router-stopped - current routerStatus:", currentRouterStatus);
      console.log("[DEBUG] Broadcast models:router-stopped - current llamaServerStatus:", this.core.get("llamaServerStatus"));
      // Only set routerStatus to null, don't touch llamaServerStatus
      this.core.set("routerStatus", null);
    });

    socket.on("metrics:update", (data) => {
      if (data?.type === "broadcast" && this._shouldProcess("metrics:update", data.timestamp)) {
        this.core.set("metrics", data.data?.metrics);
        this.handlers.onMetric?.(data.data?.metrics);
      }
    });

    socket.on("logs:entry", (data) => {
      if (data?.type === "broadcast" && this._shouldProcess("logs:entry", data.timestamp)) {
        console.log("[DEBUG] Broadcast logs:entry:", { level: data.data?.entry?.level });
        this.handlers.onLog?.(data.data?.entry);
      }
    });
  }

  /**
   * Check if broadcast should be processed based on timestamp.
   * Only process if timestamp is newer than last seen.
   * Includes memory leak prevention with Map size limits.
   * @param {string} eventType - Event type.
   * @param {number} timestamp - Event timestamp.
   * @returns {boolean} True if should process.
   */
  _shouldProcess(eventType, timestamp) {
    if (!timestamp) {
      return true; // Process if no timestamp provided
    }
    const lastTs = this._lastTimestamps.get(eventType) || 0;
    if (timestamp > lastTs) {
      this._lastTimestamps.set(eventType, timestamp);
      // Prune oldest entries to prevent memory leaks
      this._pruneTimestampsMap();
      return true;
    }
    console.log("[DEBUG] Broadcast skipped (stale):", { eventType, timestamp, lastTs });
    return false;
  }

  /**
   * Clean up resources.
   */
  destroy() {
    this._lastTimestamps.clear();
  }
}

window.StateBroadcastHandlers = StateBroadcastHandlers;
