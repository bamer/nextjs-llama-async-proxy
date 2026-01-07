/**
 * Models Page - With Comprehensive Debug Logging
 */

class ModelsController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.comp = null;
    console.log("[MODELS] ModelsController constructor called");
  }

  init() {
    console.log("[MODELS] ModelsController.init() called");
  }

  willUnmount() {
    console.log("[MODELS] ModelsController.willUnmount() called");
  }

  destroy() {
    this.willUnmount();
  }

  async render() {
    console.log("[MODELS] ModelsController.render() called - START");

    // Load data first before rendering
    console.log("[MODELS] Calling load()...");
    await this.load();
    console.log("[MODELS] load() completed");

    console.log("[MODELS] Getting models from stateManager");
    const models = stateManager.get("models") || [];
    console.log("[MODELS] Found", models.length, "models");

    console.log("[MODELS] Creating ModelsPage component");
    this.comp = new ModelsPage({ models: models });

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

      // Check router status
      let routerStatus = null;
      try {
        console.log("[MODELS] Checking router status...");
        const rs = await stateManager.getRouterStatus();
        console.log("[MODELS] Router status:", rs.routerStatus?.status || "unknown");
        routerStatus = rs.routerStatus;
      } catch (e) {
        console.log("[MODELS] Router not running:", e.message);
      }

      // If router not running, mark all as unloaded
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
}

class ModelsPage extends Component {
  constructor(props) {
    super(props);
    console.log("[MODELS] ModelsPage constructor called");
    console.log("[MODELS] Props models count:", props.models?.length);

    this.state = {
      models: props.models || [],
      filters: { status: "all", search: "" },
      sortBy: "name",
      sortOrder: "asc",
    };
    this.lastSearchValue = "";
    this.lastStatusValue = "all";
    console.log("[MODELS] State initialized with", this.state.models.length, "models");
  }

  didUpdate() {
    // Restore focus and cursor position to search input after update
    const searchInput = this._el?.querySelector('[data-field="search"]');
    if (searchInput && document.activeElement === searchInput) {
      // Focus already restored by browser, no action needed
    } else if (searchInput && this.lastSearchValue === this.state.filters.search) {
      // Only restore if value hasn't changed (user is still typing)
      searchInput.focus();
      searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
    }
  }

  shouldUpdate(newProps) {
    // Always re-render - filters are in state, not props
    return true;
  }

  render() {
    console.log("[MODELS] ModelsPage.render() called");
    const filtered = this._getFiltered();
    console.log("[MODELS] Filtered models:", filtered.length);

    const routerStatus = stateManager.get("routerStatus");
    const routerRunning = routerStatus?.status === "running";
    const config = stateManager.get("config") || {};
    const port = routerStatus?.port || config.port || 8080;
    console.log("[MODELS] Router running:", routerRunning, "Port:", port);
    console.log("[MODELS] Router running:", routerRunning);

    const statusBadge = (status) => {
      console.log("[MODELS] Creating badge for status:", status);
      const cls =
        status === "loaded" || status === "running"
          ? "success"
          : status === "loading"
            ? "warning"
            : status === "error"
              ? "danger"
              : "default";
      return Component.h("span", { className: `badge ${cls}` }, status);
    };

    const actionBtn = (m) => {
      console.log("[MODELS] Creating action button for:", m.name, "status:", m.status);
      if (m.status === "loaded" || m.status === "running") {
        return Component.h(
          "button",
          { className: "btn btn-sm", "data-action": "unload" },
          "Unload"
        );
      }
      if (m.status === "loading") {
        return Component.h("button", { className: "btn btn-sm", disabled: true }, "Loading...");
      }
      return Component.h(
        "button",
        { className: "btn btn-sm btn-primary", "data-action": "load" },
        "Load"
      );
    };

    const sortableHeader = (label, field) => {
      const isSorted = this.state.sortBy === field;
      const indicator =
        isSorted && this.state.sortOrder === "asc"
          ? " ↑"
          : isSorted && this.state.sortOrder === "desc"
            ? " ↓"
            : "";
      return Component.h(
        "th",
        {
          "data-sort": field,
          className: isSorted ? "sorted" : "",
          style: "cursor: pointer; user-select: none;",
        },
        label + indicator
      );
    };

    const rows =
      filtered.length === 0
        ? Component.h("tr", {}, Component.h("td", { colSpan: 11 }, "No models"))
        : filtered.map((m) => {
            console.log("[MODELS] Rendering row for:", m.name);
            return Component.h(
              "tr",
              { "data-name": m.name },
              Component.h("td", { className: "name-cell" }, m.name),
              Component.h("td", { className: "status-cell" }, statusBadge(m.status)),
              Component.h("td", {}, m.type || "-"),
              Component.h("td", {}, m.params || "-"),
              Component.h("td", {}, m.quantization || "-"),
              Component.h("td", {}, this._fmtCtx(m.ctx_size)),
              Component.h("td", {}, m.embedding_size || "-"),
              Component.h("td", {}, m.block_count || "-"),
              Component.h("td", {}, m.head_count || "-"),
              Component.h(
                "td",
                { className: "size-cell" },
                m.file_size ? this._fmtBytes(m.file_size) : "-"
              ),
              Component.h("td", { className: "action-cell" }, actionBtn(m))
            );
          });

    console.log("[MODELS] Total rows to render:", Array.isArray(rows) ? rows.length : 1);

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
            )
      ),
      Component.h(
        "div",
        { className: "filters" },
        Component.h("input", {
          type: "text",
          placeholder: "Search models...",
          "data-field": "search",
          value: this.state.filters.search,
          autoComplete: "off",
        }),
        Component.h(
          "select",
          { "data-field": "status", value: this.state.filters.status },
          Component.h("option", { value: "all" }, "All"),
          Component.h("option", { value: "loaded" }, "Loaded"),
          Component.h("option", { value: "unloaded" }, "Unloaded")
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
            sortableHeader("Name", "name"),
            sortableHeader("Status", "status"),
            sortableHeader("Arch", "type"),
            sortableHeader("Params", "params"),
            sortableHeader("Quant", "quantization"),
            sortableHeader("Ctx", "ctx_size"),
            sortableHeader("Embed", "embedding_size"),
            sortableHeader("Blocks", "block_count"),
            sortableHeader("Heads", "head_count"),
            sortableHeader("Size", "file_size"),
            Component.h("th", {}, "Actions")
          )
        ),
        Component.h(
          "tbody",
          { className: "models-tbody" },
          ...(Array.isArray(rows) ? rows : [rows])
        )
      )
    );

    console.log("[MODELS] ModelsPage.render() - END");
    return result;
  }

  _getFiltered() {
    console.log("[MODELS] _getFiltered() called");
    let ms = this.state.models || [];
    console.log("[MODELS] Starting with", ms.length, "models");

    if (this.state.filters.status !== "all") {
      console.log("[MODELS] Filtering by status:", this.state.filters.status);
      ms = ms.filter((m) => m.status === this.state.filters.status);
    }

    if (this.state.filters.search) {
      console.log("[MODELS] Filtering by search:", this.state.filters.search);
      ms = ms.filter((m) => m.name.toLowerCase().includes(this.state.filters.search.toLowerCase()));
    }

    // Apply sorting
    ms = this._sortModels(ms);

    console.log("[MODELS] Returning", ms.length, "filtered models");
    return ms;
  }

  _sortModels(models) {
    const { sortBy, sortOrder } = this.state;
    const sorted = [...models].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "file_size") {
        aVal = aVal || 0;
        bVal = bVal || 0;
      } else if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }

  _fmtCtx(v) {
    const result = !v || v === 0 ? "-" : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v);
    console.log("[MODELS] _fmtCtx:", v, "->", result);
    return result;
  }

  _fmtBytes(v) {
    if (!v) return "-";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(v) / Math.log(k));
    const result = `${parseFloat((v / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    console.log("[MODELS] _fmtBytes:", v, "->", result);
    return result;
  }

  getEventMap() {
    console.log("[MODELS] getEventMap() called");
    return {
      "input [data-field=search]": (e) => {
        console.log("[MODELS] Search input changed:", e.target.value);
        this.lastSearchValue = e.target.value;
        this.setState({ filters: { ...this.state.filters, search: e.target.value } });
      },
      "change [data-field=status]": (e) => {
        console.log("[MODELS] Status filter changed:", e.target.value);
        this.lastStatusValue = e.target.value;
        this.setState({ filters: { ...this.state.filters, status: e.target.value } });
      },
      "click [data-sort]": (e) => {
        const field = e.target.closest("[data-sort]").dataset.sort;
        console.log("[MODELS] Sort header clicked:", field);
        const newOrder =
          this.state.sortBy === field && this.state.sortOrder === "asc" ? "desc" : "asc";
        this.setState({ sortBy: field, sortOrder: newOrder });
      },
      "click [data-action=scan]": () => this._scan(),
      "click [data-action=cleanup]": () => this._cleanup(),
      "click [data-action=load]": (e) => this._loadModel(e.target.closest("tr").dataset.name),
      "click [data-action=unload]": (e) => this._unloadModel(e.target.closest("tr").dataset.name),
    };
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
      this.setState({
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
      this.setState({
        models: updated,
        port: config.port || 8080,
      });
    }
  }

  async _loadModel(name) {
    console.log("[MODELS] _loadModel() called for:", name);
    try {
      await stateManager.loadModel(name);
      console.log("[MODELS] Model loaded successfully");
      showNotification("Model loaded", "success");
      this._refresh();
    } catch (e) {
      console.log("[MODELS] Load model error:", e.message);
      showNotification(e.message, "error");
    }
  }

  async _unloadModel(name) {
    console.log("[MODELS] _unloadModel() called for:", name);
    try {
      await stateManager.unloadModel(name);
      console.log("[MODELS] Model unloaded successfully");
      showNotification("Model unloaded", "success");
      this._refresh();
    } catch (e) {
      console.log("[MODELS] Unload model error:", e.message);
      showNotification(e.message, "error");
    }
  }

  async _scan() {
    console.log("[MODELS] _scan() called");
    showNotification("Scanning...", "info");
    try {
      const d = await stateManager.scanModels();
      console.log("[MODELS] Scan result:", d);
      showNotification(`Scanned: ${d.scanned || 0} new, ${d.updated || 0} updated`, "success");
      const d2 = await stateManager.getModels();
      this.setState({ models: d2.models || [] });
      console.log("[MODELS] Reloaded", d2.models?.length, "models");
    } catch (e) {
      console.log("[MODELS] Scan error:", e.message);
      showNotification(`Scan failed: ${e.message}`, "error");
    }
  }

  async _cleanup() {
    console.log("[MODELS] _cleanup() called");
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
window.ModelsPage = ModelsPage;
console.log("[MODELS] ModelsPage module loaded");
