/**
 * Models Page - With Comprehensive Debug Logging
 */

class ModelsController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.unsubs = [];
    this.comp = null;
    this.filters = { status: "all", search: "" };
    console.log("[MODELS] ModelsController constructor called");
  }

  init() {
    console.log("[MODELS] ModelsController.init() called");
    console.log("[MODELS] Subscribing to models state changes");
    this.unsubs.push(
      stateManager.subscribe("models", (m) => {
        console.log("[MODELS] State changed, models count:", m?.length);
        console.log("[MODELS] First model:", JSON.stringify(m?.[0])?.substring(0, 300));
        if (this.comp) {
          console.log("[MODELS] Updating component state");
          this.comp.setState({ models: m });
        } else {
          console.log("[MODELS] No component to update");
        }
      })
    );
    // Also subscribe to router status updates
    this.unsubs.push(
      stateManager.subscribe("routerStatus", (status) => {
        console.log("[MODELS] Router status changed:", status);
        if (this.comp) {
          this.comp._refreshFromRouter(status);
        }
      })
    );
    console.log("[MODELS] Calling load()");
    this.load();
  }

  async load() {
    console.log("[MODELS] ModelsController.load() called");
    try {
      console.log("[MODELS] Calling stateManager.getModels()");
      const d = await stateManager.getModels();
      console.log("[MODELS] Got response:", JSON.stringify(d)?.substring(0, 500));
      console.log("[MODELS] Models count:", d.models?.length);
      console.log("[MODELS] Setting models in stateManager");
      stateManager.set("models", d.models || []);
      // Also get router status
      try {
        const routerStatus = await stateManager.getRouterStatus();
        console.log("[MODELS] Router status:", routerStatus);
        stateManager.set("routerStatus", routerStatus.routerStatus);
      } catch (e) {
        console.warn("[MODELS] Could not get router status:", e.message);
      }
    } catch (e) {
      console.error("[MODELS] Models load error:", e);
      showNotification("Failed to load models", "error");
    }
  }

  willUnmount() {
    console.log("[MODELS] ModelsController.willUnmount() called");
    console.log("[MODELS] Unsubscribing from", this.unsubs.length, "listeners");
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    if (this.comp) {
      console.log("[MODELS] Destroying component");
      this.comp.destroy();
    }
  }
  destroy() {
    this.willUnmount();
  }

  render() {
    console.log("[MODELS] ModelsController.render() called");
    const currentModels = stateManager.get("models") || [];
    console.log("[MODELS] Rendering with", currentModels.length, "models");
    this.comp = new ModelsPage({ models: currentModels, filters: this.filters });
    this.comp._setController(this);
    this.init();
    const el = this.comp.render();
    this.comp._el = el;
    el._component = this.comp;
    console.log("[MODELS] Binding events");
    this.comp.bindEvents();
    return el;
  }
}

class ModelsPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      models: props.models || [],
      filters: props.filters || { status: "all", search: "" },
      routerModels: [], // Models loaded in router
    };
    console.log("[MODELS] ModelsPage constructor called");
    console.log("[MODELS] Props models count:", props.models?.length);
  }

  willReceiveProps(props) {
    console.log("[MODELS] ModelsPage.willReceiveProps() called");
    console.log("[MODELS] New models count:", props.models?.length);
    console.log("[MODELS] First new model:", JSON.stringify(props.models?.[0])?.substring(0, 300));
    this.setState({
      models: props.models || [],
      filters: props.filters || { status: "all", search: "" },
    });
  }

  _refreshFromRouter(routerStatus) {
    console.log("[MODELS] _refreshFromRouter() called");
    if (routerStatus?.models) {
      this.setState({ routerModels: routerStatus.models });
      // Update model statuses based on router state
      const models = this.state.models.map((m) => {
        const routerModel = routerStatus.models.find((rm) => rm.id === m.name || rm.id === m.id);
        if (routerModel) {
          return { ...m, status: routerModel.state || m.status };
        }
        return { ...m, status: "unloaded" };
      });
      this.setState({ models });
    }
  }

  render() {
    const filtered = this._getFiltered();
    console.log("[MODELS] ModelsPage.render() called");
    console.log("[MODELS] Total models:", this.state.models?.length, "Filtered:", filtered.length);

    const getStatusBadge = (status) => {
      const statusClass = status === "loaded" ? "success" : status === "loading" ? "warning" : status === "running" ? "success" : status === "error" ? "danger" : "default";
      return Component.h("span", { className: `badge ${statusClass}` }, status);
    };

    const getActionButtons = (m) => {
      if (m.status === "loaded" || m.status === "running") {
        return Component.h(
          "button",
          { className: "btn btn-sm", "data-action": "unload" },
          "Unload"
        );
      } else if (m.status === "loading") {
        return Component.h(
          "button",
          { className: "btn btn-sm", disabled: true, "data-action": "loading" },
          "Loading..."
        );
      } else {
        return Component.h(
          "button",
          { className: "btn btn-sm btn-primary", "data-action": "load" },
          "Load"
        );
      }
    };

    const tbodyContent =
      filtered.length === 0
        ? Component.h("tr", {}, Component.h("td", { colSpan: 11 }, "No models"))
        : filtered.map((m, idx) => {
            console.log(`[MODELS] Rendering row ${idx}:`, m.name, "ctx:", m.ctx_size, "blocks:", m.block_count);
            return Component.h(
              "tr",
              { "data-id": m.id, "data-name": m.name },
              Component.h("td", {}, m.name),
              Component.h("td", {}, getStatusBadge(m.status)),
              Component.h("td", {}, m.type || "-"),
              Component.h("td", {}, m.params || "-"),
              Component.h("td", {}, m.quantization || "-"),
              Component.h("td", {}, this._formatCtx(m.ctx_size)),
              Component.h("td", {}, this._formatNumber(m.embedding_size)),
              Component.h("td", {}, this._formatNumber(m.block_count)),
              Component.h("td", {}, this._formatNumber(m.head_count)),
              Component.h("td", {}, m.file_size ? formatBytes(m.file_size) : "-"),
              Component.h("td", {}, getActionButtons(m))
            );
          });

    const routerStatus = stateManager.get("routerStatus");
    const routerRunning = routerStatus?.status === "running";

    const result = Component.h(
      "div",
      { className: "models-page" },
      Component.h(
        "div",
        { className: "toolbar" },
        Component.h(
          "button",
          { className: "btn btn-primary", "data-action": "scan" },
          "Scan Filesystem"
        ),
        Component.h(
          "button",
          { className: "btn", "data-action": "cleanup" },
          "Cleanup"
        ),
        routerRunning
          ? Component.h(
              "span",
              { className: "router-indicator success" },
              `Router Active (${routerStatus?.port || 8080})`
            )
          : Component.h(
              "span",
              { className: "router-indicator default" },
              "Router Not Running"
            )
      ),
      Component.h(
        "div",
        { className: "filters" },
        Component.h("input", {
          type: "text",
          placeholder: "Search...",
          "data-field": "search",
          value: this.state.filters.search,
        }),
        Component.h(
          "select",
          { "data-field": "status" },
          Component.h("option", { value: "all" }, "All"),
          Component.h("option", { value: "loaded" }, "Loaded"),
          Component.h("option", { value: "loading" }, "Loading"),
          Component.h("option", { value: "unloaded" }, "Unloaded"),
          Component.h("option", { value: "running" }, "Running")
        )
      ),
      Component.h(
        "table",
        { className: "models-table" },
        Component.h(
          "thead",
          {},
          Component.h(
            "tr",
            {},
            Component.h("th", {}, "Name"),
            Component.h("th", {}, "Status"),
            Component.h("th", {}, "Arch"),
            Component.h("th", {}, "Params"),
            Component.h("th", {}, "Quant"),
            Component.h("th", {}, "Ctx"),
            Component.h("th", {}, "Embed"),
            Component.h("th", {}, "Blocks"),
            Component.h("th", {}, "Heads"),
            Component.h("th", {}, "Size"),
            Component.h("th", {}, "Actions")
          )
        ),
        Component.h(
          "tbody",
          { className: "models-tbody" },
          ...(Array.isArray(tbodyContent) ? tbodyContent : [tbodyContent])
        )
      )
    );
    const tbody = result.querySelector ? result.querySelector("tbody") : null;
    console.log("[MODELS] Rendered tbody rows:", tbody?.childElementCount);
    return result;
  }

  _getFiltered() {
    let ms = [...(this.state.models || [])];
    console.log("[MODELS] _getFiltered() starting with", ms.length, "models");
    if (this.state.filters.status !== "all") {
      console.log("[MODELS] Filtering by status:", this.state.filters.status);
      ms = ms.filter((m) => m.status === this.state.filters.status);
    }
    if (this.state.filters.search) {
      console.log("[MODELS] Filtering by search:", this.state.filters.search);
      ms = ms.filter((m) => m.name.toLowerCase().includes(this.state.filters.search.toLowerCase()));
    }
    console.log("[MODELS] _getFiltered() returning", ms.length, "models");
    return ms;
  }

  _formatCtx(ctxSize) {
    const result = !ctxSize || ctxSize === 0 ? "-" : ctxSize >= 1000 ? `${(ctxSize / 1000).toFixed(0)}k` : String(ctxSize);
    console.log("[MODELS] _formatCtx:", ctxSize, "->", result);
    return result;
  }

  _formatNumber(val) {
    const result = !val || val === 0 ? "-" : String(val);
    console.log("[MODELS] _formatNumber:", val, "->", result);
    return result;
  }

  getEventMap() {
    console.log("[MODELS] getEventMap() called");
    return {
      "input [data-field=search]": (e) => {
        console.log("[MODELS] Search input changed:", e.target.value);
        this.setState({ filters: { ...this.state.filters, search: e.target.value } });
      },
      "change [data-field=status]": (e) => {
        console.log("[MODELS] Status filter changed:", e.target.value);
        this.setState({ filters: { ...this.state.filters, status: e.target.value } });
      },
      "click [data-action=scan]": () => this.scanModels(),
      "click [data-action=cleanup]": () => this.cleanupModels(),
      "click [data-action=load]": (e) =>
        stateManager
          .loadModel(e.target.closest("tr").dataset.name)
          .then(() => {
            console.log("[MODELS] Model loaded successfully");
            showNotification("Model loaded", "success");
            this._refreshRouterStatus();
          })
          .catch((err) => {
            console.error("[MODELS] Load model error:", err);
            showNotification(err.message, "error");
          }),
      "click [data-action=unload]": (e) =>
        stateManager
          .unloadModel(e.target.closest("tr").dataset.name)
          .then(() => {
            console.log("[MODELS] Model unloaded successfully");
            showNotification("Model unloaded", "success");
            this._refreshRouterStatus();
          })
          .catch((err) => {
            console.error("[MODELS] Unload model error:", err);
            showNotification(err.message, "error");
          }),
    };
  }

  async _refreshRouterStatus() {
    try {
      const routerStatus = await stateManager.getRouterStatus();
      stateManager.set("routerStatus", routerStatus.routerStatus);
    } catch (e) {
      console.warn("[MODELS] Could not refresh router status:", e.message);
    }
  }

  scanModels() {
    console.log("[MODELS] scanModels() called");
    console.log("[MODELS] Showing 'Scanning...' notification");
    showNotification("Scanning filesystem...", "info");
    stateManager
      .scanModels()
      .then((data) => {
        console.log("[MODELS] scanModels() SUCCESS");
        console.log("[MODELS] Response data:", JSON.stringify(data)?.substring(0, 300));
        const scanned = data.scanned || 0;
        const updated = data.updated || 0;
        const total = data.total || 0;
        const msg = `Scanned: ${scanned} new, ${updated} updated, Total: ${total} models`;
        console.log("[MODELS] About to show success notification:", msg);
        try {
          showNotification(msg, "success");
          console.log("[MODELS] Success notification shown");
        } catch (e) {
          console.error("[MODELS] Failed to show notification:", e.message);
        }
        // Trigger refresh to get updated model data
        console.log("[MODELS] Triggering model refresh...");
        stateManager.refreshModels();
      })
      .catch((err) => {
        console.error("[MODELS] scanModels() ERROR:", err.message);
        showNotification(`Scan failed: ${err.message}`, "error");
      });
  }

  cleanupModels() {
    console.log("[MODELS] cleanupModels() called");
    showNotification("Cleaning up missing files...", "info");
    stateManager
      .cleanupModels()
      .then((data) => {
        console.log("[MODELS] cleanupModels() SUCCESS:", data);
        const msg = `Removed ${data.deletedCount || 0} missing models`;
        showNotification(msg, "success");
        stateManager.refreshModels();
      })
      .catch((err) => {
        console.error("[MODELS] cleanupModels() ERROR:", err.message);
        showNotification(`Cleanup failed: ${err.message}`, "error");
      });
  }

  load() {
    console.log("[MODELS] ModelsPage.load() called, delegating to controller");
    this._controller?.load();
  }

  _setController(c) {
    console.log("[MODELS] _setController() called with:", c?.constructor?.name);
    this._controller = c;
  }
}

// Utility: format bytes
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "-";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

window.ModelsController = ModelsController;
window.ModelsPage = ModelsPage;
console.log("[MODELS] ModelsPage module loaded");
