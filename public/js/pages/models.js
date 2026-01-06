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

  render() {
    const filtered = this._getFiltered();
    console.log("[MODELS] ModelsPage.render() called");
    console.log("[MODELS] Total models:", this.state.models?.length, "Filtered:", filtered.length);

    const tbodyContent =
      filtered.length === 0
        ? Component.h("tr", {}, Component.h("td", { colSpan: 11 }, "No models"))
        : filtered.map((m, idx) => {
            console.log(`[MODELS] Rendering row ${idx}:`, m.name, "ctx:", m.ctx_size, "blocks:", m.block_count);
            return Component.h(
              "tr",
              { "data-id": m.id },
              Component.h("td", {}, m.name),
              Component.h(
                "td",
                {},
                Component.h("span", { className: `badge ${m.status}` }, m.status)
              ),
              Component.h("td", {}, m.type || "-"),
              Component.h("td", {}, m.params || "-"),
              Component.h("td", {}, m.quantization || "-"),
              Component.h("td", {}, this._formatCtx(m.ctx_size)),
              Component.h("td", {}, this._formatNumber(m.embedding_size)),
              Component.h("td", {}, this._formatNumber(m.block_count)),
              Component.h("td", {}, this._formatNumber(m.head_count)),
              Component.h("td", {}, m.file_size ? formatBytes(m.file_size) : "-"),
              Component.h(
                "td",
                {},
                m.status === "running"
                  ? Component.h(
                      "button",
                      { className: "btn btn-sm", "data-action": "stop" },
                      "Stop"
                    )
                  : Component.h(
                      "button",
                      { className: "btn btn-sm btn-primary", "data-action": "start" },
                      "Start"
                    )
              )
            );
          });

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
          Component.h("option", { value: "running" }, "Running"),
          Component.h("option", { value: "idle" }, "Idle")
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
      "click [data-action=start]": (e) =>
        stateManager
          .startModel(e.target.closest("tr").dataset.id)
          .then(() => {
            console.log("[MODELS] Model started successfully");
            showNotification("Model started", "success");
          })
          .catch((err) => {
            console.error("[MODELS] Start model error:", err);
            showNotification(err.message, "error");
          }),
      "click [data-action=stop]": (e) =>
        stateManager
          .stopModel(e.target.closest("tr").dataset.id)
          .then(() => {
            console.log("[MODELS] Model stopped successfully");
            showNotification("Model stopped", "success");
          })
          .catch((err) => {
            console.error("[MODELS] Stop model error:", err);
            showNotification(err.message, "error");
          }),
    };
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
