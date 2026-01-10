/**
 * Models Page - Event-Driven DOM Updates
 * No setState, no virtual DOM - just direct updates
 */

class ModelsController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.comp = null;
    console.log("[MODELS] ModelsController created");
  }

  willUnmount() {
    console.log("[MODELS] ModelsController willUnmount");
    this.comp?.destroy();
  }

  destroy() {
    this.willUnmount();
  }

  async render() {
    console.log("[MODELS] Render - loading data...");
    await this.load();

    const models = stateManager.get("models") || [];
    this.comp = new ModelsPage({ models });
    const el = this.comp.render();

    // Bind events after render
    this.comp._el = el;
    el._component = this.comp;
    this.comp.bindEvents();

    return el;
  }

  async load() {
    try {
      const d = await stateManager.getModels();
      const models = d.models || [];

      // Check router status
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

class ModelsPage extends Component {
  constructor(props) {
    super(props);
    this.models = props.models || [];
    this.filters = { status: "all", search: "" };
  }

  render() {
    const routerStatus = stateManager.get("routerStatus");
    const routerRunning = routerStatus?.status === "running";
    const config = stateManager.get("config") || {};
    const port = routerStatus?.port || config.port || 8080;

    const filtered = this._getFiltered();

    return Component.h("div", { className: "models-page" }, [
      Component.h("div", { className: "toolbar" }, [
        Component.h(
          "button",
          { className: "btn btn-primary", "data-action": "scan" },
          "Scan Filesystem"
        ),
        Component.h("button", { className: "btn", "data-action": "cleanup" }, "Cleanup"),
        routerRunning
          ? Component.h(
            "span",
            { className: "router-indicator success" },
            `Router Active (${port})`
          )
          : Component.h(
            "span",
            { className: "router-indicator default" },
            `Router Not Running (Port: ${port})`
          ),
      ]),
      Component.h("div", { className: "filters" }, [
        Component.h("input", {
          type: "text",
          placeholder: "Search models...",
          "data-field": "search",
          value: this.filters.search,
          autoComplete: "off",
        }),
        Component.h("select", { "data-field": "status" }, [
          Component.h("option", { value: "all" }, "All"),
          Component.h("option", { value: "loaded" }, "Loaded"),
          Component.h("option", { value: "unloaded" }, "Unloaded"),
        ]),
      ]),
      Component.h("div", { className: "models-table-container" }, [this._renderTable(filtered)]),
    ]);
  }

  _renderTable(models) {
    if (models.length === 0) {
      return Component.h("div", { className: "empty-state" }, "No models found");
    }

    const rows = models.map((m) =>
      Component.h("tr", { "data-name": m.name, className: `status-${m.status || "unknown"}` }, [
        Component.h("td", { className: "name-cell" }, m.name),
        Component.h("td", { className: "status-cell" }, this._statusBadge(m.status)),
        Component.h("td", {}, m.type || "-"),
        Component.h("td", {}, m.params || "-"),
        Component.h("td", {}, m.quantization || "-"),
        Component.h("td", {}, this._fmtCtx(m.ctx_size)),
        Component.h("td", {}, m.embedding_size || "-"),
        Component.h("td", {}, m.block_count || "-"),
        Component.h("td", {}, m.head_count || "-"),
        Component.h("td", { className: "size-cell" }, this._fileSize(m.file_size)),
        Component.h("td", { className: "action-cell" }, this._actionButtons(m)),
      ])
    );

    return Component.h("table", { className: "models-table" }, [
      Component.h(
        "thead",
        {},
        Component.h("tr", {}, [
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
          Component.h("th", {}, "Actions"),
        ])
      ),
      Component.h("tbody", {}, rows),
    ]);
  }

  _statusBadge(status) {
    const className = `badge badge-${status || "unknown"}`;
    return Component.h("span", { className }, status || "unknown");
  }

  _actionButtons(model) {
    const canLoad =
      model.status !== "loaded" && model.status !== "loading" && model.status !== "running";
    const canUnload = model.status === "loaded" || model.status === "running";

    return [
      canLoad &&
        Component.h(
          "button",
          { className: "btn btn-primary btn-sm", "data-action": "load", "data-name": model.name },
          "Load"
        ),
      canUnload &&
        Component.h(
          "button",
          {
            className: "btn btn-secondary btn-sm",
            "data-action": "unload",
            "data-name": model.name,
          },
          "Unload"
        ),
    ].filter(Boolean);
  }

  _fmtCtx(v) {
    if (!v || v === 0) return "-";
    return v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v);
  }

  _fileSize(bytes) {
    if (!bytes) return "-";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let unitIndex = 0;
    let size = bytes;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  _getFiltered() {
    let ms = this.models || [];

    if (this.filters.status !== "all") {
      ms = ms.filter((m) => m.status === this.filters.status);
    }

    if (this.filters.search) {
      const searchLower = this.filters.search.toLowerCase();
      ms = ms.filter((m) => m.name.toLowerCase().includes(searchLower));
    }

    return ms;
  }

  bindEvents() {
    // Search input
    this.on("input", "[data-field=search]", (e) => {
      this.filters.search = e.target.value;
      this._updateTable();
    });

    // Status filter
    this.on("change", "[data-field=status]", (e) => {
      this.filters.status = e.target.value;
      this._updateTable();
    });

    // Scan button
    this.on("click", "[data-action=scan]", () => this._scan());

    // Cleanup button
    this.on("click", "[data-action=cleanup]", () => this._cleanup());

    // Load/Unload buttons
    this.on("click", "[data-action=load]", (e) => {
      const name = e.target.dataset.name;
      this._loadModel(name);
    });

    this.on("click", "[data-action=unload]", (e) => {
      const name = e.target.dataset.name;
      this._unloadModel(name);
    });
  }

  _updateTable() {
    const filtered = this._getFiltered();
    const tableContainer = this.$(".models-table-container");
    if (tableContainer) {
      tableContainer.innerHTML = "";
      tableContainer.appendChild(this._renderTable(filtered));
    }
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
      this.models = updated;
      this._updateTable();
    } catch {
      const models = stateManager.get("models") || [];
      const updated = models.map((m) => ({ ...m, status: "unloaded" }));
      stateManager.set("models", updated);
      this.models = updated;
      this._updateTable();
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
      await stateManager.scanModels();
      const d = await stateManager.getModels();
      this.models = d.models || [];
      stateManager.set("models", this.models);
      this._updateTable();
      showNotification(`Found ${this.models.length} models`, "success");
    } catch (e) {
      showNotification(`Scan failed: ${e.message}`, "error");
    }
  }

  async _cleanup() {
    showNotification("Cleaning...", "info");
    try {
      const d = await stateManager.cleanupModels();
      showNotification(`Removed ${d.deletedCount || 0} models`, "success");
    } catch (e) {
      showNotification(`Cleanup failed: ${e.message}`, "error");
    }
  }
}

window.ModelsController = ModelsController;
window.ModelsPage = ModelsPage;
console.log("[MODELS] ModelsPage module loaded");
