/**
 * Models Page - Event-Driven DOM Updates
 */

class ModelsPage extends Component {
  constructor(props) {
    super(props);
    console.log("[MODELS] ModelsPage constructor called");
    console.log("[MODELS] Props models count:", props.models?.length);

    // Direct properties instead of state
    this.models = props.models || [];
    this.filters = { status: "all", search: "", favoritesOnly: false };
    this.sortBy = "name";
    this.sortOrder = "asc";
    this.lastSearchValue = "";
    this.lastStatusValue = "all";
    this.controller = props.controller;
    this.debouncedSearch = AppUtils.debounce(this._handleSearch.bind(this), 300);
    this.scanning = false;
    this.scanProgress = "";
    this.loadingModels = new Set(); // Track models being loaded/unloaded
    console.log("[MODELS] Initialized with", this.models.length, "models");
  }

  render() {
    console.log("[MODELS] ModelsPage.render() called");
    const filtered = this._getFiltered();
    console.log("[MODELS] Filtered models:", filtered.length);

    const config = stateManager.get("config") || {};
    const port = config.llama_server_port || 8080;
    const routerStatus = stateManager.get("routerStatus") || {};
    const routerRunning = routerStatus?.status === "running";

    const rows = filtered
      .map((m) => this._renderRow(m))
      .join("");

    const scanBtnText = this.scanning ? "Scanning..." : "Scan";
    const scanDisabled = this.scanning ? "disabled" : "";
    const scanProgress = this.scanning && this.scanProgress ? `<span class="scan-progress">${this.scanProgress}</span>` : "";

    return `<div class="models-page">
  <div class="toolbar">
    <button class="btn btn-sm" data-action="scan" ${scanDisabled}>${scanBtnText}</button>
    <button class="btn btn-sm" data-action="cleanup">Cleanup</button>
    ${scanProgress}
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
    <label class="checkbox-label">
      <input type="checkbox" data-field="favorites" ${this.filters.favoritesOnly ? "checked" : ""}>
      Favorites only
    </label>
  </div>
  <div class="models-table-wrapper">
    <table class="models-table">
      <thead>
        <tr>
          <th data-sort="name" class="${this.sortBy === "name" ? "sorted" : ""}">${this.sortBy === "name" && this.sortOrder === "asc" ? "↑" : this.sortBy === "name" && this.sortOrder === "desc" ? "↓" : ""} Name</th>
          <th data-sort="status" class="${this.sortBy === "status" ? "sorted" : ""}">${this.sortBy === "status" && this.sortOrder === "asc" ? "↑" : this.sortBy === "status" && this.sortOrder === "desc" ? "↓" : ""} Status</th>
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
  </div>
</div>`;
  }

  /**
   * Render a single model row for the table.
   * @param {Object} m - Model object with properties
   * @returns {string} HTML string for the table row
   */
  _renderRow(m) {
    const isLoading = this.loadingModels.has(m.name);
    const statusClass =
      m.status === "loaded" || m.status === "running"
        ? "success"
        : m.status === "loading"
          ? "warning"
          : m.status === "error"
            ? "danger"
            : "default";

    let actionBtn;
    if (isLoading) {
      actionBtn = `<button class="btn btn-sm" disabled>Loading...</button>`;
    } else if (m.status === "loaded" || m.status === "running") {
      actionBtn = `<button class="btn btn-sm" data-action="unload" data-name="${m.name}">Unload</button>`;
    } else {
      actionBtn = `<button class="btn btn-sm btn-primary" data-action="load" data-name="${m.name}">Load</button>`;
    }

    return `<tr data-name="${m.name}">
  <td>${m.name}</td>
  <td><span class="badge ${statusClass}">${m.status || "unknown"}</span></td>
  <td>${m.type || "-"}</td>
  <td>${m.params || "-"}</td>
  <td>${m.quantization || "-"}</td>
  <td>${this._fmtCtx(m.ctx_size)}</td>
  <td>${m.embedding_size || "-"}</td>
  <td>${m.block_count || "-"}</td>
  <td>${m.head_count || "-"}</td>
  <td>${this._fmtBytes(m.file_size)}</td>
  <td>${actionBtn}</td>
</tr>`;
  }

  /**
   * Get filtered and sorted list of models based on current filter settings.
   * @returns {Array} Filtered and sorted array of model objects
   */
  _getFiltered() {
    let ms = this.models || [];

    if (this.filters.status !== "all") {
      ms = ms.filter((m) => m.status === this.filters.status);
    }

    if (this.filters.favoritesOnly) {
      ms = ms.filter((m) => m.favorite === 1 || m.favorite === true);
    }

    if (this.filters.search) {
      ms = ms.filter((m) => m.name.toLowerCase().includes(this.filters.search.toLowerCase()));
    }

    return this._sortModels(ms);
  }

  /**
   * Sort models array by current sortBy field and sortOrder.
   * @param {Array} models - Array of model objects to sort
   * @returns {Array} Sorted array of model objects
   */
  _sortModels(models) {
    const sorted = [...models].sort((a, b) => {
      if (this.sortBy !== "favorite") {
        const aFav = a.favorite === 1 || a.favorite === true ? 0 : 1;
        const bFav = b.favorite === 1 || b.favorite === true ? 0 : 1;
        if (aFav !== bFav) return aFav - bFav;
      }

      let aVal = a[this.sortBy];
      let bVal = b[this.sortBy];

      if (this.sortBy === "file_size") {
        aVal = aVal || 0;
        bVal = bVal || 0;
      } else if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return this.sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return this.sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }

  /**
   * Format context size value for display (e.g., 4096 -> "4k").
   * @param {number} v - Context size value
   * @returns {string} Formatted context size string
   */
  _fmtCtx(v) {
    return !v || v === 0 ? "-" : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v);
  }

  /**
   * Format bytes value to human readable size (e.g., 1024 -> "1.0 KB").
   * @param {number} v - Size in bytes
   * @returns {string} Formatted size string with unit
   */
  _fmtBytes(v) {
    if (!v) return "-";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(v) / Math.log(k));
    return `${parseFloat((v / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  /**
   * Handle search input change with debouncing.
   * @param {string} value - Search query value
   * @returns {void}
   */
  _handleSearch(value) {
    this.filters.search = value;
    this._updateTable();
  }

  /**
   * Update the table UI with current filtered models.
   * @returns {void}
   */
  _updateTable() {
    const filtered = this._getFiltered();
    const tbody = this.$(".models-table tbody");
    if (tbody) {
      tbody.innerHTML = filtered.map((m) => this._renderRow(m)).join("");
    }
  }

  bindEvents() {
    console.log("[MODELS] bindEvents called");

    this.on("click", "[data-sort]", (e) => {
      const field = e.target.closest("[data-sort]").dataset.sort;
      console.log("[MODELS] Sort header clicked:", field);
      if (this.sortBy === field) {
        this.sortOrder = this.sortOrder === "asc" ? "desc" : "asc";
      } else {
        this.sortBy = field;
        this.sortOrder = "asc";
      }
      this._updateTable();
    });

    this.on("click", "[data-action=scan]", () => {
      this.controller?.handleScan();
    });

    this.on("click", "[data-action=cleanup]", () => {
      this.controller?.handleCleanup();
    });

    this.on("click", "[data-action=load]", (e) => {
      const name = e.target.closest("[data-action=load]").dataset.name;
      this.controller?.handleLoad(name);
    });

    this.on("click", "[data-action=unload]", (e) => {
      const name = e.target.closest("[data-action=unload]").dataset.name;
      this.controller?.handleUnload(name);
    });

    this.on("input", "[data-field=search]", (e) => {
      this.lastSearchValue = e.target.value;
      this.filters.search = e.target.value;
      this.debouncedSearch(e.target.value);
    });

    this.on("change", "[data-field=status]", (e) => {
      this.lastStatusValue = e.target.value;
      this.filters.status = e.target.value;
      this._updateTable();
    });

    this.on("change", "[data-field=favorites]", (e) => {
      this.filters.favoritesOnly = e.target.checked;
      this._updateTable();
    });
  }

  /**
   * Update the model list and refresh the table UI.
   * @param {Array} models - Array of model objects
   * @returns {void}
   */
  updateModelList(models) {
    this.models = models || [];
    this._updateTable();
  }

  /**
   * Update scanning state and UI progress indicator.
   * @param {boolean} isScanning - Whether scanning is in progress
   * @param {string} progress - Progress message to display
   * @returns {void}
   */
  setScanning(isScanning, progress = "") {
    this.scanning = isScanning;
    this.scanProgress = progress;
    const scanBtn = this.$("[data-action=scan]");
    if (scanBtn) {
      scanBtn.textContent = isScanning ? "Scanning..." : "Scan";
      scanBtn.disabled = isScanning;
    }
    const toolbar = this.$(".toolbar");
    if (toolbar) {
      // Update or add progress indicator
      let progressEl = toolbar.querySelector(".scan-progress");
      if (isScanning && progress) {
        if (!progressEl) {
          progressEl = document.createElement("span");
          progressEl.className = "scan-progress";
          toolbar.insertBefore(progressEl, toolbar.children[toolbar.children.length - 1]);
        }
        progressEl.textContent = progress;
      } else if (progressEl) {
        progressEl.remove();
      }
    }
  }

  /**
   * Update loading state for a specific model.
   * @param {string} modelName - Name of the model
   * @param {boolean} isLoading - Whether the model is being loaded
   * @returns {void}
   */
  setModelLoading(modelName, isLoading) {
