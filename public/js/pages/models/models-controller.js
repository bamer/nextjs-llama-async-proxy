/**
 * Models Controller - Handles models page lifecycle
 */

class ModelsController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.comp = null;
    this._stateUnsubscribers = []; // Track state subscriptions for cleanup
  }

  /**
   * Register a state subscription for cleanup
   */
  _subscribe(key, callback) {
    const unsub = stateManager.subscribe(key, callback);
    this._stateUnsubscribers.push(unsub);
    return unsub;
  }

  /**
   * Cleanup all state subscriptions
   */
  _cleanupSubscriptions() {
    if (this._stateUnsubscribers && this._stateUnsubscribers.length > 0) {
      this._stateUnsubscribers.forEach((unsub) => {
        try {
          if (typeof unsub === "function") unsub();
        } catch (e) {
          console.warn("[Models] Error cleaning up subscription:", e);
        }
      });
      this._stateUnsubscribers = [];
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
    const models = stateManager.get("models") || [];
    this.comp = new ModelsPage({ models });
    return this.comp.render();
  }

  async load() {
    try {
      const d = await stateManager.getModels();
      const models = d.models || [];
      let routerStatus = null;
      try {
        const rs = await stateManager.getRouterStatus();
        routerStatus = rs.routerStatus;
      } catch (e) {
        console.log("[MODELS] Router not running:", e.message);
      }
      const routerRunning = routerStatus?.status === "running";
      const finalModels = routerRunning
        ? models
        : models.map((m) => ({ ...m, status: "unloaded" }));
      stateManager.set("models", finalModels);
      stateManager.set("routerStatus", routerStatus);
    } catch (e) {
      console.error("[MODELS] Load error:", e);
    }
  }
}

window.ModelsController = ModelsController;
