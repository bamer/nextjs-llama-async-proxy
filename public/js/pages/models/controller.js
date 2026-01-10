/**
 * Models Page Controller - Handles models CRUD operations
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

    if (this.comp && this.comp.setState) {
      this.comp.setState({ models: updatedModels, port: routerStatus?.port || 8080 });
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

    if (this.comp && this.comp.setState) {
      this.comp.setState({ models: updatedModels, port: 8080 });
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
    await this.load();
    console.log("[MODELS] load() completed");

    const models = stateManager.get("models") || [];
    console.log("[MODELS] Found", models.length, "models");

    console.log("[MODELS] Creating ModelsPage component");
    this.comp = new ModelsPage({ models: models, controller: this });

    console.log("[MODELS] Calling component.render()");
    const el = this.comp.render();
    this.comp._el = el;
    el._component = this.comp;

    console.log("[MODELS] Binding events");
    this.comp.bindEvents();

    console.log("[MODELS] ModelsController.render() - END");
    return el;
  }

  async load() {
    console.log("[MODELS] ModelsController.load() called");
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
      this.comp.setState({
        models: updated,
        port: rs.routerStatus?.port || config.port || 8080,
      });
      console.log("[MODELS] Refreshed", updated.length, "models");
    } catch (e) {
      console.log("[MODELS] Router not running during refresh");
      const models = stateManager.get("models") || [];
      const updated = models.map((m) => ({ ...m, status: "unloaded" }));
      stateManager.set("models", updated);
      const config = stateManager.get("config") || {};
      stateManager.set("routerStatus", null);
      this.comp.setState({
        models: updated,
        port: config.port || 8080,
      });
    }
  }

  async handleLoadModel(modelName) {
    console.log("[MODELS] handleLoadModel() called for:", modelName);
    try {
      await stateManager.loadModel(modelName);
      console.log("[MODELS] Model loaded successfully");
      showNotification("Model loaded", "success");
      await this._refresh();
    } catch (e) {
      console.log("[MODELS] Load model error:", e.message);
      showNotification(e.message, "error");
    }
  }

  async handleUnloadModel(modelName) {
    console.log("[MODELS] handleUnloadModel() called for:", modelName);
    try {
      await stateManager.unloadModel(modelName);
      console.log("[MODELS] Model unloaded successfully");
      showNotification("Model unloaded", "success");
      await this._refresh();
    } catch (e) {
      console.log("[MODELS] Unload model error:", e.message);
      showNotification(e.message, "error");
    }
  }

  async handleToggleFavorite(modelName, isFavorite) {
    console.log("[MODELS] handleToggleFavorite() called for:", modelName, isFavorite);
    try {
      await stateManager.toggleFavorite(modelName, isFavorite);
      const models = stateManager.get("models") || [];
      const updatedModels = models.map((m) =>
        m.name === modelName ? { ...m, favorite: isFavorite ? 1 : 0 } : m
      );
      stateManager.set("models", updatedModels);
      console.log("[MODELS] Favorite toggled successfully");
      showNotification(isFavorite ? "Added to favorites" : "Removed from favorites", "success");
    } catch (e) {
      console.log("[MODELS] Toggle favorite error:", e.message);
      showNotification(e.message, "error");
    }
  }

  async handleTestModel(modelName) {
    console.log("[MODELS] handleTestModel() called for:", modelName);
    showNotification("Testing model...", "info");
    try {
      const result = await stateManager.testModel(modelName);
      if (result.success) {
        console.log("[MODELS] Model test successful:", result.output);
        showNotification(`Test successful: ${result.output}`, "success");
      } else {
        console.log("[MODELS] Model test failed:", result.error);
        showNotification(`Test failed: ${result.error}`, "error");
      }
    } catch (e) {
      console.log("[MODELS] Test model error:", e.message);
      showNotification(`Test failed: ${e.message}`, "error");
    }
  }

  async handleScan() {
    console.log("[MODELS] handleScan() called");
    showNotification("Scanning...", "info");
    try {
      const d = await stateManager.scanModels();
      console.log("[MODELS] Scan result:", d);
      showNotification(`Scanned: ${d.scanned || 0} new, ${d.updated || 0} updated`, "success");
      const d2 = await stateManager.getModels();
      this.comp.setState({ models: d2.models || [] });
      console.log("[MODELS] Reloaded", d2.models?.length, "models");
    } catch (e) {
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
