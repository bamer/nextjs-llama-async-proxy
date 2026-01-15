/**
 * Models Page - Table display and filtering
 */

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
        Component.h("button", { className: "btn btn-primary", "data-action": "scan" }, "Scan Filesystem"),
        Component.h("button", { className: "btn", "data-action": "cleanup" }, "Cleanup"),
        Component.h("span", { className: `router-indicator ${routerRunning ? "success" : "default"}` }, `Router ${routerRunning ? "Active" : "Not Running"} (${port})`),
      ]),
      Component.h("div", { className: "filters" }, [
        Component.h("input", {
          type: "text",
          placeholder: "Search models...",
          "data-field": "search",
          value: this.filters.search,
          autocomplete: "off"
        }),
        Component.h("select", { "data-field": "status" }, [
          Component.h("option", { value: "all", selected: this.filters.status === "all" }, "All"),
          Component.h("option", { value: "loaded", selected: this.filters.status === "loaded" }, "Loaded"),
          Component.h("option", { value: "unloaded", selected: this.filters.status === "unloaded" }, "Unloaded"),
        ]),
      ]),
      Component.h("div", { className: "models-table-container" }, this._renderTableComponent(filtered)),
    ]);
  }

  /**
   * Render the table component for displaying models.
   * @param {Array} models - Array of model objects to display
   * @returns {HTMLElement} Table component element
   */
  _renderTableComponent(models) {
    if (models.length === 0) {
      return Component.h("div", { className: "empty-state" }, "No models found");
    }

    const rows = models.map((m) =>
      Component.h("tr", { "data-name": m.name, className: `status-${m.status || "unknown"}` }, [
        Component.h("td", { className: "name-cell" }, m.name),
        Component.h("td", { className: "status-cell" }, Component.h("span", { className: `badge badge-${m.status || "unknown"}` }, m.status || "unknown")),
        Component.h("td", {}, m.type || "-"),
        Component.h("td", {}, m.params || "-"),
        Component.h("td", {}, m.quantization || "-"),
        Component.h("td", {}, this._fmtCtx(m.ctx_size)),
        Component.h("td", {}, m.embedding_size || "-"),
        Component.h("td", {}, m.block_count || "-"),
        Component.h("td", {}, m.head_count || "-"),
        Component.h("td", { className: "size-cell" }, this._fileSize(m.file_size)),
        Component.h("td", { className: "action-cell" }, this._actionButtonsComponents(m)),
      ])
    );

    return Component.h("table", { className: "models-table" }, [
      Component.h("thead", {}, Component.h("tr", {}, [
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
      ])),
      Component.h("tbody", {}, rows),
    ]);
  }

  _actionButtonsComponents(model) {
    const canLoad = model.status !== "loaded" && model.status !== "loading";
    const canUnload = model.status === "loaded" || model.status === "running";
    const buttons = [];
    if (canLoad) {
      buttons.push(
        Component.h("button", { className: "btn btn-primary btn-sm", "data-action": "load", "data-name": model.name }, "Load")
      );
    }
    if (canUnload) {
      buttons.push(
        Component.h("button", { className: "btn btn-secondary btn-sm", "data-action": "unload", "data-name": model.name }, "Unload")
      );
    }
    return buttons;
  }

  /**
   * Format context size value for display (e.g., 4096 -> "4k").
   * @param {number} v - Context size value
   * @returns {string} Formatted context size string
   */
  _fmtCtx(v) {
    if (!v || v === 0) return "-";
    return v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v);
  }

  /**
   * Format bytes value to human readable size (e.g., 1024 -> "1.0 KB").
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size string with unit
   */
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

  /**
   * Get filtered and sorted list of models based on current filter settings.
   * @returns {Array} Filtered and sorted array of model objects
   */
  _getFiltered() {
    let ms = this.models || [];
    if (this.filters.status !== "all") ms = ms.filter((m) => m.status === this.filters.status);
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

  /**
   * Update the table UI with current filtered models.
   * @returns {void}
   */
  _updateTable() {
    const filtered = this._getFiltered();
    const container = this.$(".models-table-container");
    if (container) {
      // Replace the table with a new one
      const newTable = this._renderTableComponent(filtered);
      container.innerHTML = "";
      container.appendChild(newTable);
    }
  }

  /**
   * Refresh models data by fetching latest router status and model states.
   * @returns {Promise<void>} Promise that resolves when refresh is complete
   */
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

  /**
   * Load a model by name via stateManager.
   * @param {string} name - Name of the model to load
   * @returns {Promise<void>} Promise that resolves when model is loaded
   */
  async _loadModel(name) {
    try {
      await stateManager.loadModel(name);
      showNotification("Model loaded", "success");
      this._refresh();
    } catch (e) {
      showNotification(e.message, "error");
    }
  }

  /**
   * Unload a model by name via stateManager.
   * @param {string} name - Name of the model to unload
   * @returns {Promise<void>} Promise that resolves when model is unloaded
   */
  async _unloadModel(name) {
    try {
      await stateManager.unloadModel(name);
      showNotification("Model unloaded", "success");
      this._refresh();
    } catch (e) {
      showNotification(e.message, "error");
    }
  }

  /**
   * Scan filesystem for models and update model list.
   * @returns {Promise<void>} Promise that resolves when scan is complete
   */
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

  /**
   * Cleanup invalid or duplicate models from the database.
   * @returns {Promise<void>} Promise that resolves when cleanup is complete
   */
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

window.ModelsPage = ModelsPage;
