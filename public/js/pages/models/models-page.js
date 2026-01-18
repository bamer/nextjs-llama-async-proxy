/**
 * Models Page - Table display and filtering
 * Socket-First Architecture Pattern
 *
 * Socket contracts used:
 * - models:list        GET all models
 * - models:load        POST load a model
 * - models:unload      POST unload a model
 * - models:scan        POST scan for new models
 * - models:cleanup     POST cleanup invalid models
 * - models:updated     [BROADCAST] Models changed
 */

class ModelsPage extends Component {
  constructor(props) {
    super(props);
    this.routerStatus = props.routerStatus || null;
    this.config = props.config || {};
    this.models = props.models || [];
    this.filters = { status: "all", search: "" };
    this.loading = false;
    this.unsubscribers = [];
  }

  render() {
    const routerRunning = this.routerStatus?.status === "running" || this.routerStatus?.status === "ready";
    const port = this.routerStatus?.port || this.config.port || 8080;
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
   * Load all models from server using socket-first pattern.
   * @returns {Promise<void>} Promise that resolves when models are loaded
   */
  async _loadModels() {
    try {
      this.loading = true;
      console.log("[DEBUG] ModelsPage: Loading models via socket...");

      const response = await socketClient.request("models:list", {});

      if (response.success) {
        this.models = response.data.models || [];
        console.log("[DEBUG] ModelsPage: Loaded", this.models.length, "models");
      } else {
        console.error("[DEBUG] ModelsPage: Failed to load models:", response.error);
        showNotification(response.error || "Failed to load models", "error");
      }
    } catch (error) {
      console.error("[DEBUG] ModelsPage: Error loading models:", error);
      showNotification("Error loading models: " + error.message, "error");
    } finally {
      this.loading = false;
      this._updateTable();
    }
  }

  /**
   * Refresh models data by fetching latest router status and model states.
   * @returns {Promise<void>} Promise that resolves when refresh is complete
   */
  async _refresh() {
    try {
      console.log("[DEBUG] ModelsPage: Refreshing model status...");

      // Get router status via socket
      const rsResponse = await socketClient.request("llama:status", {});
      if (rsResponse.success) {
        this.routerStatus = rsResponse.data;
      }

      // Update model statuses from router
      const updated = this.models.map((m) => {
        const rm = rsResponse.data?.models?.find((x) => x.id === m.name || x.name === m.name);
        return rm ? { ...m, status: rm.state || rm.status } : { ...m, status: "unloaded" };
      });

      this.models = updated;
      this._updateTable();
    } catch (error) {
      console.error("[DEBUG] ModelsPage: Refresh failed:", error);
      // Fall back to marking all as unloaded
      const updated = this.models.map((m) => ({ ...m, status: "unloaded" }));
      this.models = updated;
      this._updateTable();
    }
  }

  /**
   * Load a model by name via socket-first pattern.
   * @param {string} name - Name of the model to load
   * @returns {Promise<void>} Promise that resolves when model is loaded
   */
  async _loadModel(name) {
    try {
      this.loading = true;
      console.log("[DEBUG] ModelsPage: Loading model", name);

      const response = await socketClient.request("models:load", { modelName: name });

      if (response.success) {
        showNotification(`Model ${name} loaded`, "success");
        // Server broadcasts models:updated - we'll receive it via subscription
      } else {
        showNotification(response.error || `Failed to load ${name}`, "error");
      }
    } catch (error) {
      console.error("[DEBUG] ModelsPage: Load failed:", error);
      showNotification("Error loading model: " + error.message, "error");
    } finally {
      this.loading = false;
      this._refresh();
    }
  }

  /**
   * Unload a model by name via socket-first pattern.
   * @param {string} name - Name of the model to unload
   * @returns {Promise<void>} Promise that resolves when model is unloaded
   */
  async _unloadModel(name) {
    try {
      this.loading = true;
      console.log("[DEBUG] ModelsPage: Unloading model", name);

      const response = await socketClient.request("models:unload", { modelName: name });

      if (response.success) {
        showNotification(`Model ${name} unloaded`, "success");
        // Server broadcasts models:updated - we'll receive it via subscription
      } else {
        showNotification(response.error || `Failed to unload ${name}`, "error");
      }
    } catch (error) {
      console.error("[DEBUG] ModelsPage: Unload failed:", error);
      showNotification("Error unloading model: " + error.message, "error");
    } finally {
      this.loading = false;
      this._refresh();
    }
  }

  /**
   * Scan filesystem for models and update model list via socket-first pattern.
   * @returns {Promise<void>} Promise that resolves when scan is complete
   */
  async _scan() {
    showNotification("Scanning...", "info");
    try {
      console.log("[DEBUG] ModelsPage: Scanning for models...");

      const response = await socketClient.request("models:scan", {});

      if (response.success) {
        // Server broadcasts models:updated, so reload models
        await this._loadModels();
        showNotification(`Found ${response.data.total} models`, "success");
      } else {
        showNotification(response.error || "Scan failed", "error");
      }
    } catch (error) {
      console.error("[DEBUG] ModelsPage: Scan failed:", error);
      showNotification("Scan failed: " + error.message, "error");
    }
  }

  /**
   * Cleanup invalid or duplicate models from the database via socket-first pattern.
   * @returns {Promise<void>} Promise that resolves when cleanup is complete
   */
  async _cleanup() {
    showNotification("Cleaning...", "info");
    try {
      console.log("[DEBUG] ModelsPage: Cleaning up models...");

      const response = await socketClient.request("models:cleanup", {});

      if (response.success) {
        showNotification(`Removed ${response.data.deletedCount || 0} models`, "success");
        // Reload models after cleanup
        await this._loadModels();
      } else {
        showNotification(response.error || "Cleanup failed", "error");
      }
    } catch (error) {
      console.error("[DEBUG] ModelsPage: Cleanup failed:", error);
      showNotification("Cleanup failed: " + error.message, "error");
    }
  }

  /**
   * Called when component is mounted to DOM.
   * Sets up socket subscriptions and loads initial data.
   */
  onMount() {
    console.log("[DEBUG] ModelsPage: onMount - setting up subscriptions...");

    // Listen for broadcast updates from server
    this.unsubscribers.push(
      socketClient.on("models:updated", (data) => {
        console.log("[DEBUG] ModelsPage: Received models:updated broadcast");
        this.models = data.models || [];
        this._updateTable();
      }),
      socketClient.on("models:created", (data) => {
        console.log("[DEBUG] ModelsPage: Received models:created broadcast");
        this._loadModels();
      }),
      socketClient.on("models:deleted", (data) => {
        console.log("[DEBUG] ModelsPage: Received models:deleted broadcast");
        this._loadModels();
      }),
      socketClient.on("router:status", (data) => {
        console.log("[DEBUG] ModelsPage: Received router:status broadcast");
        this.routerStatus = data.status || null;
        this.replaceWith(this.render());
      })
    );
  }

  /**
   * Called when component is about to be unmounted.
   * Cleans up socket subscriptions.
   */
  destroy() {
    console.log("[DEBUG] ModelsPage: destroy - cleaning up subscriptions");
    this.unsubscribers.forEach((unsub) => {
      try {
        unsub();
      } catch (e) {
        console.warn("[DEBUG] ModelsPage: Error cleaning up subscription:", e);
      }
    });
    this.unsubscribers = [];
  }
}

window.ModelsPage = ModelsPage;
