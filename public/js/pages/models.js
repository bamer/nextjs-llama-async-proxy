/**
 * Models Page - Simplified
 */

class ModelsController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.unsubs = [];
    this.comp = null;
    this.filters = { status: "all", search: "" };
    console.log("[DEBUG] ModelsController created");
  }

  init() {
    console.log("[DEBUG] ModelsController init");
    this.unsubs.push(stateManager.subscribe("models", m => {
      console.log("[DEBUG] Models state changed, count:", m?.length);
      this.comp?.setState({ models: m });
    }));
    this.load();
  }

  async load() {
    console.log("[DEBUG] ModelsController load");
    try {
      const d = await stateManager.getModels();
      console.log("[DEBUG] Models loaded:", d.models?.length, "models");
      stateManager.set("models", d.models || []);
    } catch (e) {
      console.error("[DEBUG] Models load error:", e);
      showNotification("Failed to load models", "error");
    }
  }

  willUnmount() {
    console.log("[DEBUG] ModelsController willUnmount");
    this.unsubs.forEach(u => u());
    this.unsubs = [];
    if (this.comp) this.comp.destroy();
  }
  destroy() { this.willUnmount(); }

  render() {
    this.comp = new ModelsPage({ models: stateManager.get("models") || [], filters: this.filters });
    this.comp._setController(this);
    this.init();
    const el = this.comp.render();
    this.comp._el = el;
    el._component = this.comp;
    this.comp.bindEvents();
    return el;
  }
}

class ModelsPage extends Component {
  constructor(props) {
    super(props);
    this.state = { models: props.models || [], filters: props.filters || { status: "all", search: "" } };
    console.log("[DEBUG] ModelsPage created, props.models:", props.models?.length);
  }

  willReceiveProps(props) {
    console.log("[DEBUG] ModelsPage willReceiveProps, new models:", props.models?.length);
    this.setState({ models: props.models || [], filters: props.filters || { status: "all", search: "" } });
  }

  render() {
    const filtered = this._getFiltered();
    console.log("[DEBUG] ModelsPage.render, filtered count:", filtered.length);
    const tbodyContent = filtered.length === 0
      ? Component.h("tr", {}, Component.h("td", { colSpan: 6 }, "No models"))
      : filtered.map(m => Component.h("tr", { "data-id": m.id },
          Component.h("td", {}, m.name),
          Component.h("td", {}, Component.h("span", { className: `badge ${m.status}` }, m.status)),
          Component.h("td", {}, m.params || "-"),
          Component.h("td", {}, m.quantization || "-"),
          Component.h("td", {}, m.file_size ? formatBytes(m.file_size) : "-"),
          Component.h("td", {},
            m.status === "running"
              ? Component.h("button", { className: "btn btn-sm", "data-action": "stop" }, "Stop")
              : Component.h("button", { className: "btn btn-sm btn-primary", "data-action": "start" }, "Start")
          )
        ));
    const result = Component.h("div", { className: "models-page" },
      Component.h("div", { className: "toolbar" },
        Component.h("button", { className: "btn btn-primary", "data-action": "scan" }, "Scan Filesystem")
      ),
      Component.h("div", { className: "filters" },
        Component.h("input", { type: "text", placeholder: "Search...", "data-field": "search", value: this.state.filters.search }),
        Component.h("select", { "data-field": "status" },
          Component.h("option", { value: "all" }, "All"),
          Component.h("option", { value: "running" }, "Running"),
          Component.h("option", { value: "idle" }, "Idle")
        )
      ),
      Component.h("table", { className: "models-table" },
        Component.h("thead", {},
          Component.h("tr", {},
            Component.h("th", {}, "Name"),
            Component.h("th", {}, "Status"),
            Component.h("th", {}, "Params"),
            Component.h("th", {}, "Quant"),
            Component.h("th", {}, "Size"),
            Component.h("th", {}, "Actions")
          )
        ),
        Component.h("tbody", {}, ...(Array.isArray(tbodyContent) ? tbodyContent : [tbodyContent]))
      )
    );
    const tbody = result.querySelector ? result.querySelector('tbody') : null;
    console.log("[DEBUG] Rendered tbody rows:", tbody?.childElementCount);
    return result;
  }

  _getFiltered() {
    let ms = [...(this.state.models || [])];
    if (this.state.filters.status !== "all") ms = ms.filter(m => m.status === this.state.filters.status);
    if (this.state.filters.search) {
      const s = this.state.filters.search.toLowerCase();
      ms = ms.filter(m => m.name.toLowerCase().includes(s));
    }
    return ms;
  }

  getEventMap() {
    return {
      "input [data-field=search]": (e) => this.setState({ filters: { ...this.state.filters, search: e.target.value } }),
      "change [data-field=status]": (e) => this.setState({ filters: { ...this.state.filters, status: e.target.value } }),
      "click [data-action=scan]": () => this.scanModels(),
      "click [data-action=start]": (e) => stateManager.startModel(e.target.closest("tr").dataset.id).then(() => showNotification("Model started", "success")).catch(err => showNotification(err.message, "error")),
      "click [data-action=stop]": (e) => stateManager.stopModel(e.target.closest("tr").dataset.id).then(() => showNotification("Model stopped", "success")).catch(err => showNotification(err.message, "error"))
    };
  }

  scanModels() {
    console.log("[DEBUG] scanModels clicked");
    showNotification("Scanning filesystem...", "info");
    stateManager.scanModels().then(data => {
      console.log("[DEBUG] scanModels result:", data);
      // Update models list from scan result
      stateManager.set("models", data.models || []);
      const msg = `Scanned: ${data.scanned} new, Total: ${data.models.length} models`;
      showNotification(msg, "success");
    }).catch(err => {
      console.error("[DEBUG] scanModels error:", err);
      showNotification("Scan failed: " + err.message, "error");
    });
  }

  load() { this._controller?.load(); }

  _setController(c) { this._controller = c; }
}

// Utility: format bytes
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "-";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

window.ModelsController = ModelsController;
window.ModelsPage = ModelsPage;
