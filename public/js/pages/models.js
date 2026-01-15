/**
 * Models Page - Event-Driven DOM Updates
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

    const html = this.comp.render();
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    const el = wrapper.firstElementChild;

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

    return `
      <div class="models-page">
        <div class="toolbar">
          <button class="btn btn-primary" data-action="scan">Scan Filesystem</button>
          <button class="btn" data-action="cleanup">Cleanup</button>
          <span class="router-indicator ${routerRunning ? "success" : "default"}">
            Router ${routerRunning ? "Active" : "Not Running"} (${port})
          </span>
        </div>
        <div class="filters">
          <input type="text" placeholder="Search models..." data-field="search" value="${this.filters.search}" autocomplete="off">
          <select data-field="status">
            <option value="all" ${this.filters.status === "all" ? "selected" : ""}>All</option>
            <option value="loaded" ${this.filters.status === "loaded" ? "selected" : ""}>Loaded</option>
            <option value="unloaded" ${this.filters.status === "unloaded" ? "selected" : ""}>Unloaded</option>
          </select>
        </div>
        <div class="models-table-container">${this._renderTable(filtered)}</div>
      </div>
    `;
  }

  _renderTable(models) {
    if (models.length === 0) {
      return "<div class=\"empty-state\">No models found</div>";
    }

    const rows = models
      .map(
        (m) => `
        <tr data-name="${m.name}" class="status-${m.status || "unknown"}">
          <td class="name-cell">${m.name}</td>
          <td class="status-cell"><span class="badge badge-${m.status || "unknown"}">${m.status || "unknown"}</span></td>
          <td>${m.type || "-"}</td>
          <td>${m.params || "-"}</td>
          <td>${m.quantization || "-"}</td>
          <td>${this._fmtCtx(m.ctx_size)}</td>
          <td>${m.embedding_size || "-"}</td>
          <td>${m.block_count || "-"}</td>
          <td>${m.head_count || "-"}</td>
          <td class="size-cell">${this._fileSize(m.file_size)}</td>
          <td class="action-cell">${this._actionButtons(m).join("")}</td>
        </tr>
      `
      )
      .join("");

    return `
      <table class="models-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Arch</th>
            <th>Params</th>
            <th>Quant</th>
            <th>Ctx</th>
            <th>Embed</th>
            <th>Blocks</th>
            <th>Heads</th>
            <th>Size</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  _actionButtons(model) {
    const canLoad =
      model.status !== "loaded" && model.status !== "loading" && model.status !== "running";
    const canUnload = model.status === "loaded" || model.status === "running";

    const buttons = [];
    if (canLoad) {
      buttons.push(
        `<button class="btn btn-primary btn-sm" data-action="load" data-name="${model.name}">Load</button>`
      );
    }
    if (canUnload) {
      buttons.push(
        `<button class="btn btn-secondary btn-sm" data-action="unload" data-name="${model.name}">Unload</button>`
      );
    }
    return buttons;
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
    this.on("input", "[data-field=search]", (e) => {
      this.filters.search = e.target.value;
      this._updateTable();
    });

    this.on("change", "[data-field=status]", (e) => {
      this.filters.status = e.target.value;
      this._updateTable();
    });

    this.on("click", "[data-action=scan]", () => this._scan());
    this.on("click", "[data-action=cleanup]", () => this._cleanup());
    this.on("click", "[data-action=load]", (e) => this._loadModel(e.target.dataset.name));
    this.on("click", "[data-action=unload]", (e) => this._unloadModel(e.target.dataset.name));
  }

  _updateTable() {
    const filtered = this._getFiltered();
    const container = this.$(".models-table-container");
    if (container) {
      container.innerHTML = this._renderTable(filtered);
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
