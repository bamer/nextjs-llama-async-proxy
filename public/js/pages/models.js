/**
 * Models Page - Simplified
 */

class ModelsController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.unsubs = [];
    this.comp = null;
    this.filters = { status: "all", search: "" };
  }

  init() {
    this.unsubs.push(stateManager.subscribe("models", m => this.comp?.setState({ models: m })));
    this.load();
  }

  async load() {
    try {
      const d = await stateManager.getModels();
      stateManager.set("models", d.models || []);
    } catch (e) { console.error("[Models] Load error:", e); showNotification("Failed to load models", "error"); }
  }

  willUnmount() { this.unsubs.forEach(u => u()); this.unsubs = []; if (this.comp) this.comp.destroy(); }
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
  }

  willReceiveProps(props) {
    this.setState({ models: props.models || [], filters: props.filters || { status: "all", search: "" } });
  }

  render() {
    const filtered = this._getFiltered();
    return Component.h("div", { className: "models-page" },
      Component.h("div", { className: "toolbar" },
        Component.h("button", { className: "btn btn-primary", "data-action": "import" }, "Import"),
        Component.h("button", { className: "btn btn-secondary", "data-action": "refresh" }, "Refresh")
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
          Component.h("tr", {}, Component.h("th", {}, "Name"), Component.h("th", {}, "Status"), Component.h("th", {}, "Actions"))
        ),
        Component.h("tbody", {},
          filtered.length === 0 ? Component.h("tr", {}, Component.h("td", { colSpan: 3 }, "No models")) :
            filtered.map(m => Component.h("tr", { "data-id": m.id },
              Component.h("td", {}, m.name),
              Component.h("td", {}, Component.h("span", { className: `badge ${m.status}` }, m.status)),
              Component.h("td", {},
                m.status === "running" ?
                  Component.h("button", { className: "btn btn-sm", "data-action": "stop" }, "Stop") :
                  Component.h("button", { className: "btn btn-sm btn-primary", "data-action": "start" }, "Start")
              )
            ))
        )
      )
    );
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
      "click [data-action=refresh]": () => this.load(),
      "click [data-action=import]": () => this.importModel(),
      "click [data-action=start]": (e) => stateManager.startModel(e.target.closest("tr").dataset.id).then(() => showNotification("Model started", "success")).catch(err => showNotification(err.message, "error")),
      "click [data-action=stop]": (e) => stateManager.stopModel(e.target.closest("tr").dataset.id).then(() => showNotification("Model stopped", "success")).catch(err => showNotification(err.message, "error"))
    };
  }

  importModel() {
    const name = prompt("Enter model name:");
    if (name) {
      stateManager.createModel({ name }).then(() => {
        showNotification("Model created", "success");
      }).catch(err => showNotification(err.message, "error"));
    }
  }

  load() { this._controller?.load(); }

  // Called from controller init
  _setController(c) { this._controller = c; }
}

window.ModelsController = ModelsController;
window.ModelsPage = ModelsPage;
