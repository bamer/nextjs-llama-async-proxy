/**
 * Models Page Controller - Event-Driven DOM Updates
 */

class ModelsController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.comp = null;
    this.unsubscribers = [];
    console.log("[MODELS] ModelsController constructor called");
  }

  init() {
    console.log("[MODELS] ModelsController.init() called");

    this.unsubscribers.push(
      stateManager.subscribe("routerStatus", (routerStatus) => {
        console.log("[DEBUG] Router status changed:", routerStatus?.status);
        this._handleRouterStatusChange(routerStatus);
        // Update the component's router indicator
        this.comp?.updateRouterStatus(routerStatus);
      })
    );

    this.unsubscribers.push(
      stateManager.subscribe("connectionStatus", (status) => {
        console.log("[DEBUG] Connection status changed:", status);
        if (status === "disconnected") {
          this._handleDisconnectedState();
        }
      })
    );

    // Listen for action events from components
    this.unsubscribers.push(
      stateManager.subscribe("action:models:scan", (data) => this._handleScan(data)),
      stateManager.subscribe("action:models:load", (data) => this._handleLoad(data)),
      stateManager.subscribe("action:models:unload", (data) => this._handleUnload(data)),
      stateManager.subscribe("action:models:delete", (data) => this._handleDelete(data))
    );
  }

  _handleRouterStatusChange(routerStatus) {
    console.log("[DEBUG] Handling router status change:", routerStatus);

    const models = stateManager.get("models") || [];
    const routerRunning = routerStatus?.status === "running";

    const updatedModels = models.map((m) => {
      if (!routerRunning) {
        return { ...m, status: "unloaded" };
      }
      const routerModel = routerStatus?.models?.find((x) => x.id === m.name);
      return routerModel ? { ...m, status: routerModel.state } : { ...m, status: "unloaded" };
    });

    stateManager.set("models", updatedModels);

    console.log("[DEBUG] Updated models for router status:", {
      count: updatedModels.length,
      routerRunning,
    });
  }

  _handleDisconnectedState() {
    console.log("[DEBUG] Handling disconnected state");

    const models = stateManager.get("models") || [];
    const updatedModels = models.map((m) => ({ ...m, status: "unloaded" }));
    stateManager.set("models", updatedModels);

    console.log("[DEBUG] Marked all models as unloaded:", updatedModels.length);
  }

  async _handleScan(data) {
    console.log("[MODELS] _handleScan() called");
    try {
      stateManager.setActionStatus("models:scan", {
        status: "scanning",
        message: "Scanning for models...",
        progress: 0,
      });

      const result = await stateManager.scanModels(data?.path);
      stateManager.set("models", result.models || []);

      stateManager.setActionStatus("models:scan", {
        status: "complete",
        message: `Found ${result.models?.length || 0} models`,
        progress: 100,
      });
    } catch (error) {
      stateManager.setActionStatus("models:scan", {
        status: "error",
        error: error.message,
      });
      console.log("[MODELS] Scan error:", error.message);
    }
  }

  async _handleLoad(data) {
    const { modelId } = data;
    console.log("[MODELS] _handleLoad() called for:", modelId);
    try {
      stateManager.setActionStatus("models:load", {
        status: "loading",
        modelId,
        message: `Loading ${modelId}...`,
      });

      const result = await stateManager.loadModel(modelId);
      if (result.success) {
        stateManager.setActionStatus("models:load", {
          status: "complete",
          modelId,
        });
      } else {
        stateManager.setActionStatus("models:load", {
          status: "error",
          modelId,
          error: result.error || "Failed to load model",
        });
      }

      // Refresh models list to show loaded status
      await this._refresh();
    } catch (error) {
      stateManager.setActionStatus("models:load", {
        status: "error",
        modelId,
        error: error.message,
      });
      console.log("[MODELS] Load model error:", error.message);
    }
  }

  async _handleUnload(data) {
    const { modelId } = data;
    console.log("[MODELS] _handleUnload() called for:", modelId);
    try {
      stateManager.setActionStatus("models:unload", {
        status: "loading",
        modelId,
        message: `Unloading ${modelId}...`,
      });

      const result = await stateManager.unloadModel(modelId);
      if (result.success) {
        stateManager.setActionStatus("models:unload", {
          status: "complete",
          modelId,
        });
      } else {
        stateManager.setActionStatus("models:unload", {
          status: "error",
          modelId,
          error: result.error || "Failed to unload model",
        });
      }

      // Refresh models list
      await this._refresh();
    } catch (error) {
      stateManager.setActionStatus("models:unload", {
        status: "error",
        modelId,
        error: error.message,
      });
      console.log("[MODELS] Unload model error:", error.message);
    }
  }

  async _handleDelete(data) {
    const { modelId } = data;
    console.log("[MODELS] _handleDelete() called for:", modelId);
    try {
      stateManager.setActionStatus("models:delete", {
        status: "loading",
        modelId,
        message: `Deleting ${modelId}...`,
      });

      await stateManager.deleteModel(modelId);

      stateManager.setActionStatus("models:delete", {
        status: "complete",
        modelId,
      });

      // Refresh models list
      await this._refresh();
    } catch (error) {
      stateManager.setActionStatus("models:delete", {
        status: "error",
        modelId,
        error: error.message,
      });
      console.log("[MODELS] Delete model error:", error.message);
    }
  }

  willUnmount() {
    console.log("[MODELS] ModelsController.willUnmount() called");
    if (this.unsubscribers) {
      this.unsubscribers.forEach((unsub) => unsub());
      this.unsubscribers = [];
    }
  }

  destroy() {
    this.willUnmount();
  }

  async render() {
    console.log("[MODELS] ModelsController.render() called - START");

    // Render immediately with cached data, then load fresh data in background
    const models = stateManager.get("models") || [];
    console.log("[MODELS] Found", models.length, "models in cache");

    console.log("[MODELS] Creating ModelsPage component");
    this.comp = new ModelsPage({ models: stateManager.get("models") || [] });

    console.log("[MODELS] Calling component.render()");
    const html = this.comp.render();
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    const el = wrapper.firstElementChild;

    this.comp._el = el;
    el._component = this.comp;

    console.log("[MODELS] Binding events");
    this.comp.bindEvents();
    this.comp.onMount?.();

    // Load fresh data in background (non-blocking)
    this.load().catch(e => {
      console.log("[MODELS] Background load failed:", e.message);
    });

    console.log("[MODELS] ModelsController.render() - END");
    return el;
  }

  async load() {
    console.log("[MODELS] ModelsController.load() called - START");
    try {
      console.log("[MODELS] Calling stateManager.getModels()");
      const d = await stateManager.getModels();
      console.log("[MODELS] Got response:", d.models?.length, "models");

      const models = d.models || [];
      console.log("[MODELS] Processing", models.length, "models");

      let routerStatus = null;
      try {
        console.log("[MODELS] Checking router status...");
        const rs = await stateManager.getRouterStatus();
        console.log("[MODELS] Router status:", rs.routerStatus?.status || "unknown");
        routerStatus = rs.routerStatus;
      } catch (e) {
        console.log("[MODELS] Router not running:", e.message);
      }

      const routerRunning = routerStatus?.status === "running";
      console.log("[MODELS] Router running:", routerRunning);

      const finalModels = routerRunning
        ? models
        : models.map((m) => ({ ...m, status: "unloaded" }));

      console.log("[MODELS] Setting models in stateManager - count:", finalModels.length);
      stateManager.set("models", finalModels);
      stateManager.set("routerStatus", routerStatus);

      console.log("[MODELS] ModelsController.load() - END");
    } catch (e) {
      console.log("[MODELS] Load error:", e.message);
      // Don't show toast on background load error, just log it
    }
  }

  async handleCleanup() {
    console.log("[MODELS] handleCleanup() called");
    showNotification("Cleaning...", "info");
    try {
      const d = await stateManager.cleanupModels();
      console.log("[MODELS] Cleanup result:", d);
      showNotification(`Removed ${d.deletedCount || 0} models`, "success");
    } catch (e) {
      console.log("[MODELS] Cleanup error:", e.message);
      showNotification(`Cleanup failed: ${e.message}`, "error");
    }
  }
}

window.ModelsController = ModelsController;
