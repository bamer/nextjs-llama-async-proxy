/**
 * Models Controller - Handles models page lifecycle
 */

class ModelsController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.comp = null;
    this.models = [];
    this.routerStatus = null;
    this._unsubscribers = [];
  }

  /**
   * Register a socket subscription for cleanup
   */
  _subscribe(event, callback) {
    const unsub = socketClient.on(event, callback);
    this._unsubscribers.push(unsub);
    return unsub;
  }

  /**
   * Cleanup all socket subscriptions
   */
  _cleanupSubscriptions() {
    if (this._unsubscribers && this._unsubscribers.length > 0) {
      this._unsubscribers.forEach((unsub) => {
        try {
          if (typeof unsub === "function") unsub();
        } catch (e) {
          console.warn("[Models] Error cleaning up subscription:", e);
        }
      });
      this._unsubscribers = [];
    }
  }

  willUnmount() {
    this._cleanupSubscriptions();
    this.comp?.destroy();
  }

  destroy() {
    this.willUnmount();
  }

  async render() {
    await this.load();
    this.comp = new ModelsPage({ models: this.models });
    return this.comp.render();
  }

  /**
   * Load models from socket and update router status.
   * Sets models status to "unloaded" if router is not running.
   * @returns {Promise<void>} Promise that resolves when models are loaded
   */
  async load() {
    try {
      // Fetch models via socket
      const response = await socketClient.request("models:list", {});
      const models = response.data || [];
      let routerStatus = null;

      // Fetch router status via socket
      try {
        const rsResponse = await socketClient.request("router:status", {});
        routerStatus = rsResponse.data || null;
      } catch (e) {
        console.log("[MODELS] Router not running:", e.message);
      }

      const routerRunning = routerStatus?.status === "running";
      this.models = routerRunning
        ? models
        : models.map((m) => ({ ...m, status: "unloaded" }));
      this.routerStatus = routerStatus;

      // Subscribe to updates
      this._subscribe("models:updated", (data) => {
        this.models = data.models || [];
      });
    } catch (e) {
      console.error("[MODELS] Load error:", e);
    }
  }
}

window.ModelsController = ModelsController;
