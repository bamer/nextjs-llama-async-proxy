/**
 * Models Page Controller - Socket-First Architecture
 * Direct socket calls + socket broadcasts, zero stateManager dependency
 */

class ModelsController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.comp = null;
    this.unsubscribers = [];
    this.models = [];
    this.routerStatus = null;
    this.actionStatuses = {}; // Local action status tracking
    console.log("[MODELS] ModelsController constructor called");
  }

  init() {
    console.log("[MODELS] ModelsController.init() called");

    // Subscribe to socket broadcasts instead of stateManager
    this.unsubscribers.push(
      socketClient.on("router:status", (data) => {
        console.log("[DEBUG] Router status changed:", data?.status);
        this.routerStatus = data;
        this._handleRouterStatusChange(data);
        // Update the component's router indicator
        this.comp?.updateRouterStatus(data);
      })
    );

    this.unsubscribers.push(
      socketClient.on("connection:status", (data) => {
        console.log("[DEBUG] Connection status changed:", data?.status);
        if (data?.status === "disconnected") {
          this._handleDisconnectedState();
        }
      })
    );

    this.unsubscribers.push(
      socketClient.on("models:updated", (data) => {
        console.log("[DEBUG] Models updated:", data?.models?.length);
        this.models = data.models || [];
        this.comp?.updateModels(this.models);
      })
    );
  }

  _handleRouterStatusChange(routerStatus) {
    console.log("[DEBUG] Handling router status change:", routerStatus);

    const routerRunning = routerStatus?.status === "running";

    const updatedModels = this.models.map((m) => {
      if (!routerRunning) {
        return { ...m, status: "unloaded" };
      }
      const routerModel = routerStatus?.models?.find((x) => x.id === m.name);
      return routerModel ? { ...m, status: routerModel.state } : { ...m, status: "unloaded" };
    });

    this.models = updatedModels;
    this.comp?.updateModels(this.models);

    console.log("[DEBUG] Updated models for router status:", {
      count: updatedModels.length,
      routerRunning,
    });
  }

  _handleDisconnectedState() {
    console.log("[DEBUG] Handling disconnected state");

    const updatedModels = this.models.map((m) => ({ ...m, status: "unloaded" }));
    this.models = updatedModels;
    this.comp?.updateModels(this.models);

    console.log("[DEBUG] Marked all models as unloaded:", updatedModels.length);
  }

  _setActionStatus(action, status) {
    this.actionStatuses[action] = status;
    this.comp?.updateActionStatus(action, status);
  }

  async _handleScan(data) {
    console.log("[MODELS] _handleScan() called");
    try {
      this._setActionStatus("models:scan", {
        status: "scanning",
        message: "Scanning for models...",
        progress: 0,
      });

      const response = await socketClient.request("models:scan", { path: data?.path });
      if (response.success) {
        this.models = response.data?.models || [];
        this.comp?.updateModels(this.models);

        this._setActionStatus("models:scan", {
          status: "complete",
          message: `Found ${this.models.length} models`,
          progress: 100,
        });
      } else {
        this._setActionStatus("models:scan", {
          status: "error",
          error: response.error,
        });
        console.log("[MODELS] Scan error:", response.error);
      }
    } catch (error) {
      this._setActionStatus("models:scan", {
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
      this._setActionStatus("models:load", {
        status: "loading",
        modelId,
        message: `Loading ${modelId}...`,
      });

      const response = await socketClient.request("models:load", { modelName: modelId });
      if (response.success) {
        this._setActionStatus("models:load", {
          status: "complete",
          modelId,
        });
      } else {
        this._setActionStatus("models:load", {
          status: "error",
          modelId,
          error: response.error || "Failed to load model",
        });
      }

      // Refresh models list to show loaded status
      await this._refresh();
    } catch (error) {
      this._setActionStatus("models:load", {
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
      this._setActionStatus("models:unload", {
        status: "loading",
        modelId,
        message: `Unloading ${modelId}...`,
      });

      const response = await socketClient.request("models:unload", { modelName: modelId });
      if (response.success) {
        this._setActionStatus("models:unload", {
          status: "complete",
          modelId,
        });
      } else {
        this._setActionStatus("models:unload", {
          status: "error",
          modelId,
          error: response.error || "Failed to unload model",
        });
      }

      // Refresh models list
      await this._refresh();
    } catch (error) {
      this._setActionStatus("models:unload", {
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
      this._setActionStatus("models:delete", {
        status: "loading",
        modelId,
        message: `Deleting ${modelId}...`,
      });

      const response = await socketClient.request("models:delete", { modelName: modelId });
      if (response.success) {
        this._setActionStatus("models:delete", {
          status: "complete",
          modelId,
        });

        // Refresh models list
        await this._refresh();
      } else {
        this._setActionStatus("models:delete", {
          status: "error",
          modelId,
          error: response.error,
        });
      }
    } catch (error) {
      this._setActionStatus("models:delete", {
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

    // Render immediately with empty data, then load fresh data
    console.log("[MODELS] Creating ModelsPage component");
    this.comp = new ModelsPage({ models: this.models });

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

    // Load fresh data (non-blocking)
    this.load().catch(e => {
      console.log("[MODELS] Load failed:", e.message);
    });

    console.log("[MODELS] ModelsController.render() - END");
    return el;
  }

  async load() {
    console.log("[MODELS] ModelsController.load() called - START");
    try {
      console.log("[MODELS] Calling socketClient.request('models:list', {})");
      const response = await socketClient.request("models:list", {});
      if (!response.success) {
        console.log("[MODELS] Failed to load models:", response.error);
        return;
      }

      const models = response.data || [];
      console.log("[MODELS] Got response:", models.length, "models");

      let routerStatusData = null;
      try {
        console.log("[MODELS] Checking router status...");
        const rs = await socketClient.request("router:status", {});
        if (rs.success) {
          console.log("[MODELS] Router status:", rs.data?.status || "unknown");
          routerStatusData = rs.data;
        }
      } catch (e) {
        console.log("[MODELS] Router not running:", e.message);
      }

      const routerRunning = routerStatusData?.status === "running";
      console.log("[MODELS] Router running:", routerRunning);

      this.models = routerRunning
        ? models
        : models.map((m) => ({ ...m, status: "unloaded" }));

      this.routerStatus = routerStatusData;
      this.comp?.updateModels(this.models);

      console.log("[MODELS] ModelsController.load() - END");
    } catch (e) {
      console.log("[MODELS] Load error:", e.message);
      // Don't show toast on background load error, just log it
    }
  }

  async _refresh() {
    console.log("[MODELS] Refreshing models list...");
    const response = await socketClient.request("models:list", {});
    if (response.success) {
      this.models = response.data || [];
      this.comp?.updateModels(this.models);
    }
  }

  async handleCleanup() {
    console.log("[MODELS] handleCleanup() called");
    showNotification("Cleaning...", "info");
    try {
      const response = await socketClient.request("models:cleanup", {});
      if (response.success) {
        showNotification(`Removed ${response.data?.deletedCount || 0} models`, "success");
        await this._refresh();
      } else {
        showNotification(`Cleanup failed: ${response.error}`, "error");
      }
    } catch (e) {
      console.log("[MODELS] Cleanup error:", e.message);
      showNotification(`Cleanup failed: ${e.message}`, "error");
    }
  }
}

window.ModelsController = ModelsController;
