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

    if (this.comp && this.comp.updateModelList) {
      this.comp.updateModelList(updatedModels);
    }

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

    if (this.comp && this.comp.updateModelList) {
      this.comp.updateModelList(updatedModels);
    }

    console.log("[DEBUG] Marked all models as unloaded:", updatedModels.length);
  }

  willUnmount() {
    console.log("[MODELS] ModelsController.willUnmount() called");
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
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
    this.comp = new ModelsPage({ models: models, controller: this });

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

      // Update the UI if component is mounted
      if (this.comp && this.comp.updateModelList) {
        this.comp.updateModelList(finalModels);
      }

      console.log("[MODELS] ModelsController.load() - END");
    } catch (e) {
      console.log("[MODELS] Load error:", e.message);
      // Don't show toast on background load error, just log it
    }
  }

  async _refresh() {
    console.log("[MODELS] _refresh() called");
    try {
      const rs = await stateManager.getRouterStatus();
      console.log("[MODELS] Router status refreshed:", rs.routerStatus?.status);
      stateManager.set("routerStatus", rs.routerStatus);

      const config = stateManager.get("config") || {};
      const settings = stateManager.get("settings") || {};

      const models = stateManager.get("models") || [];
      const updated = models.map((m) => {
        const rm = rs.routerStatus?.models?.find((x) => x.id === m.name);
        return rm ? { ...m, status: rm.state } : { ...m, status: "unloaded" };
      });
      stateManager.set("models", updated);
      this.comp?.updateModelList(updated);
      console.log("[MODELS] Refreshed", updated.length, "models");
    } catch (e) {
      console.log("[MODELS] Router not running during refresh");
      const models = stateManager.get("models") || [];
      const updated = models.map((m) => ({ ...m, status: "unloaded" }));
      stateManager.set("models", updated);
      const config = stateManager.get("config") || {};
      stateManager.set("routerStatus", null);
      this.comp?.updateModelList(updated);
    }
  }

  async handleLoad(name) {
    console.log("[MODELS] handleLoad() called for:", name);
    this.comp?.setModelLoading(name, true);
    showNotification(`Loading ${name}...`, "info");
    try {
      const result = await stateManager.loadModel(name);
      if (result.success) {
        showNotification("Model loaded", "success");
      } else {
        showNotification(result.error || "Failed to load model", "error");
      }
      await this._refresh();
    } catch (e) {
      console.log("[MODELS] Load model error:", e.message);
      showNotification(e.message, "error");
    } finally {
      this.comp?.setModelLoading(name, false);
    }
  }

  async handleUnload(name) {
    console.log("[MODELS] handleUnload() called for:", name);
    this.comp?.setModelLoading(name, true);
    showNotification(`Unloading ${name}...`, "info");
    try {
      const result = await stateManager.unloadModel(name);
      if (result.success) {
        showNotification("Model unloaded", "success");
      } else {
        showNotification(result.error || "Failed to unload model", "error");
      }
      await this._refresh();
    } catch (e) {
      console.log("[MODELS] Unload model error:", e.message);
      showNotification(e.message, "error");
    } finally {
      this.comp?.setModelLoading(name, false);
    }
  }

  async handleScan() {
    console.log("[MODELS] handleScan() called");
    this.comp?.setScanning(true, "Starting scan...");
    showNotification("Scanning...", "info");
    try {
      this.comp?.setScanning(true, "Scanning filesystem...");
      const d = await stateManager.scanModels();
      console.log("[MODELS] Scan result:", d);
      this.comp?.setScanning(true, `Processed: ${d.scanned || 0} new, ${d.updated || 0} updated`);
      const d2 = await stateManager.getModels();
      this.comp?.updateModelList(d2.models || []);
      this.comp?.setScanning(false);
      showNotification(`Scanned: ${d.scanned || 0} new, ${d.updated || 0} updated`, "success");
      console.log("[MODELS] Reloaded", d2.models?.length, "models");
    } catch (e) {
      this.comp?.setScanning(false);
      console.log("[MODELS] Scan error:", e.message);
      showNotification(`Scan failed: ${e.message}`, "error");
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
