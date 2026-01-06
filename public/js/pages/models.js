/**
 * Models Page - Simple and native
 */

class ModelsController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.comp = null;
  }

  init() {}

  willUnmount() {}

  destroy() {
    this.willUnmount();
  }

  async render() {
    // Load data and get models BEFORE creating component
    await this.load();
    
    // Get models from stateManager
    const models = stateManager.get("models") || [];
    
    // Create component with data pre-loaded
    this.comp = new ModelsPage({ models: models });
    
    const el = this.comp.render();
    this.comp._el = el;
    el._component = this.comp;
    this.comp.bindEvents();
    
    return el;
  }

  async load() {
    try {
      const d = await stateManager.getModels();
      const models = d.models || [];

      let routerStatus = null;
      try {
        const rs = await stateManager.getRouterStatus();
        routerStatus = rs.routerStatus;
      } catch (e) {}

      const finalModels = routerStatus?.status === "running"
        ? models
        : models.map((m) => ({ ...m, status: "unloaded" }));

      stateManager.set("models", finalModels);
      stateManager.set("routerStatus", routerStatus);
    } catch (e) {
      console.log("[MODELS] Load error:", e.message);
    }
  }
}

class ModelsPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      models: props.models || [],
      filters: { status: "all", search: "" },
    };
  }

  render() {
    const filtered = this._getFiltered();
    const routerStatus = stateManager.get("routerStatus");
    const routerRunning = routerStatus?.status === "running";

    const statusBadge = (status) => {
      const cls = status === "loaded" || status === "running" ? "success" : status === "loading" ? "warning" : status === "error" ? "danger" : "default";
      return Component.h("span", { className: "badge " + cls }, status);
    };

    const actionBtn = (m) => {
      if (m.status === "loaded" || m.status === "running") {
        return Component.h("button", { className: "btn btn-sm", "data-action": "unload" }, "Unload");
      }
      if (m.status === "loading") {
        return Component.h("button", { className: "btn btn-sm", disabled: true }, "Loading...");
      }
      return Component.h("button", { className: "btn btn-sm btn-primary", "data-action": "load" }, "Load");
    };

    const rows = filtered.length === 0
      ? Component.h("tr", {}, Component.h("td", { colSpan: 11 }, "No models"))
      : filtered.map((m) => Component.h("tr", { "data-name": m.name },
          Component.h("td", {}, m.name),
          Component.h("td", {}, statusBadge(m.status)),
          Component.h("td", {}, m.type || "-"),
          Component.h("td", {}, m.params || "-"),
          Component.h("td", {}, m.quantization || "-"),
          Component.h("td", {}, this._fmtCtx(m.ctx_size)),
          Component.h("td", {}, m.embedding_size || "-"),
          Component.h("td", {}, m.block_count || "-"),
          Component.h("td", {}, m.head_count || "-"),
          Component.h("td", {}, m.file_size ? this._fmtBytes(m.file_size) : "-"),
          Component.h("td", {}, actionBtn(m))
        ));

    return Component.h("div", { className: "models-page" },
      Component.h("div", { className: "toolbar" },
        Component.h("button", { className: "btn btn-primary", "data-action": "scan" }, "Scan Filesystem"),
        Component.h("button", { className: "btn", "data-action": "cleanup" }, "Cleanup"),
        routerRunning
          ? Component.h("span", { className: "router-indicator success" }, "Router Active (" + (routerStatus?.port || 8080) + ")")
          : Component.h("span", { className: "router-indicator default" }, "Router Not Running")
      ),
      Component.h("div", { className: "filters" },
        Component.h("input", { type: "text", placeholder: "Search...", "data-field": "search", value: this.state.filters.search }),
        Component.h("select", { "data-field": "status" },
          Component.h("option", { value: "all" }, "All"),
          Component.h("option", { value: "loaded" }, "Loaded"),
          Component.h("option", { value: "unloaded" }, "Unloaded")
        )
      ),
      Component.h("table", { className: "models-table" },
        Component.h("thead", {},
          Component.h("tr", {},
            Component.h("th", {}, "Name"), Component.h("th", {}, "Status"), Component.h("th", {}, "Arch"),
            Component.h("th", {}, "Params"), Component.h("th", {}, "Quant"), Component.h("th", {}, "Ctx"),
            Component.h("th", {}, "Embed"), Component.h("th", {}, "Blocks"), Component.h("th", {}, "Heads"),
            Component.h("th", {}, "Size"), Component.h("th", {}, "Actions")
          )
        ),
        Component.h("tbody", {}, rows)
      )
    );
  }

  _getFiltered() {
    let ms = this.state.models || [];
    if (this.state.filters.status !== "all") {
      ms = ms.filter((m) => m.status === this.state.filters.status);
    }
    if (this.state.filters.search) {
      ms = ms.filter((m) => m.name.toLowerCase().includes(this.state.filters.search.toLowerCase()));
    }
    return ms;
  }

  _fmtCtx(v) {
    return !v || v === 0 ? "-" : v >= 1000 ? (v / 1000).toFixed(0) + "k" : String(v);
  }

  _fmtBytes(v) {
    if (!v) return "-";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(v) / Math.log(k));
    return parseFloat((v / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  getEventMap() {
    return {
      "input [data-field=search]": (e) => this.setState({ filters: { ...this.state.filters, search: e.target.value } }),
      "change [data-field=status]": (e) => this.setState({ filters: { ...this.state.filters, status: e.target.value } }),
      "click [data-action=scan]": () => this._scan(),
      "click [data-action=cleanup]": () => this._cleanup(),
      "click [data-action=load]": (e) => this._loadModel(e.target.closest("tr").dataset.name),
      "click [data-action=unload]": (e) => this._unloadModel(e.target.closest("tr").dataset.name),
    };
  }

  async _refresh() {
    try {
      const rs = await stateManager.getRouterStatus();
      stateManager.set("routerStatus", rs.routerStatus);
      const models = stateManager.get("models") || [];
      const updated = models.map((m) => {
        const rm = rs.routerStatus?.models?.find((x) => x.id === m.name);
        return rm ? { ...m, status: rm.state } : { ...m, status: "unloaded" };
      });
      stateManager.set("models", updated);
      this.setState({ models: updated });
    } catch (e) {
      const models = stateManager.get("models") || [];
      const updated = models.map((m) => ({ ...m, status: "unloaded" }));
      stateManager.set("models", updated);
      stateManager.set("routerStatus", null);
      this.setState({ models: updated });
    }
  }

  async _loadModel(name) {
    try {
      await stateManager.loadModel(name);
      showNotification("Model loaded", "success");
      this._refresh();
    } catch (e) {
      showNotification(e.message, "error");
    }
  }

  async _unloadModel(name) {
    try {
      await stateManager.unloadModel(name);
      showNotification("Model unloaded", "success");
      this._refresh();
    } catch (e) {
      showNotification(e.message, "error");
    }
  }

  async _scan() {
    showNotification("Scanning...", "info");
    try {
      const d = await stateManager.scanModels();
      showNotification("Scanned: " + (d.scanned || 0) + " new, " + (d.updated || 0) + " updated", "success");
      // Reload models
      const d2 = await stateManager.getModels();
      this.setState({ models: d2.models || [] });
    } catch (e) {
      showNotification("Scan failed: " + e.message, "error");
    }
  }

  async _cleanup() {
    showNotification("Cleaning...", "info");
    try {
      const d = await stateManager.cleanupModels();
      showNotification("Removed " + (d.deletedCount || 0) + " models", "success");
    } catch (e) {
      showNotification("Cleanup failed: " + e.message, "error");
    }
  }
}

window.ModelsController = ModelsController;
window.ModelsPage = ModelsPage;
