/**
 * Models Page - Socket-First Architecture
 *
 * Socket contracts:
 * - models:list         GET all models
 * - models:load         POST start model
 * - models:unload       POST stop model
 * - models:scan         POST scan disk
 * - models:delete       DELETE model
 * - router:status       GET router status
 * - models:updated      [BROADCAST] Models changed
 * - router:status       [BROADCAST] Router status changed
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
    console.log("[DEBUG] ModelsController.render() - loading data...");

    // Load initial data directly from socket
    let models = [];
    try {
      const modelsRes = await socketClient.request("models:list", {});
      models = modelsRes.success ? modelsRes.data || [] : [];
    } catch (e) {
      console.error("[MODELS] Load error:", e);
    }

    this.comp = new ModelsPage({ models });

    const html = this.comp.render();
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    const el = wrapper.firstElementChild;

    this.comp._el = el;
    el._component = this.comp;
    this.comp.bindEvents();
    this.comp.onMount();

    return el;
  }
}

class ModelsPage extends Component {
  constructor(props) {
    super(props);
    this.models = props.models || [];
    this.routerStatus = null;
    this.filters = { status: "all", search: "" };
    this.loading = false;
    this.unsubscribers = [];
  }

  onMount() {
    console.log("[DEBUG] ModelsPage.onMount() - subscribing to broadcasts");

    // Listen to socket broadcasts for updates
    this.unsubscribers.push(
      socketClient.on("models:updated", (data) => {
        console.log("[DEBUG] models:updated broadcast received");
        this.models = data.models || [];
        this._updateTable();
      })
    );

    this.unsubscribers.push(
      socketClient.on("llama:status", (data) => {
        console.log("[DEBUG] llama:status broadcast received");
        this.routerStatus = data;
        this._updateRouterIndicator();
      })
    );

    // Request current router status on mount (in case router is already running)
    this._requestRouterStatus();
  }

  async _requestRouterStatus() {
    try {
      const response = await socketClient.request("llama:status", {});
      if (response.success && response.data) {
        this.routerStatus = response.data;
        this._updateRouterIndicator();
      }
    } catch (e) {
      console.log("[ModelsPage] Router not running, using default status");
    }
  }

  render() {
    // Llama:status returns status: "running" or "idle"
    const routerRunning = this.routerStatus?.status === "running" || this.routerStatus?.processRunning;
    const port = this.routerStatus?.port || this.routerStatus?.port || 8080;

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
    if (!container) return;
    const newTable = this._buildTableDom(filtered);
    const existing = container.querySelector("table.models-table");
    if (existing) {
      container.replaceChild(newTable, existing);
    } else {
      container.appendChild(newTable);
    }
  }

  // Build table DOM from model data without using innerHTML replacements
  _buildTableDom(models) {
    const table = document.createElement("table");
    table.className = "models-table";

    const thead = document.createElement("thead");
    thead.innerHTML = `
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
      </tr>`;
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    (models || []).forEach((m) => {
      const tr = document.createElement("tr");
      tr.dataset.name = m.name;
      tr.className = `status-${m.status || "unknown"}`;

      const nameTd = document.createElement("td");
      nameTd.className = "name-cell";
      nameTd.textContent = m.name || "";
      tr.appendChild(nameTd);

      const statusTd = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = `badge badge-${m.status || "unknown"}`;
      badge.textContent = m.status || "unknown";
      statusTd.appendChild(badge);
      tr.appendChild(statusTd);

      const archTd = document.createElement("td");
      archTd.textContent = m.type || "-";
      tr.appendChild(archTd);

      const paramsTd = document.createElement("td");
      paramsTd.textContent = m.params || "-";
      tr.appendChild(paramsTd);

      const quantTd = document.createElement("td");
      quantTd.textContent = m.quantization || "-";
      tr.appendChild(quantTd);

      const ctxTd = document.createElement("td");
      ctxTd.textContent = this._fmtCtx(m.ctx_size);
      tr.appendChild(ctxTd);

      const embedTd = document.createElement("td");
      embedTd.textContent = m.embedding_size || "-";
      tr.appendChild(embedTd);

      const blocksTd = document.createElement("td");
      blocksTd.textContent = m.block_count || "-";
      tr.appendChild(blocksTd);

      const headsTd = document.createElement("td");
      headsTd.textContent = m.head_count || "-";
      tr.appendChild(headsTd);

      const sizeTd = document.createElement("td");
      sizeTd.className = "size-cell";
      sizeTd.textContent = this._fileSize(m.file_size);
      tr.appendChild(sizeTd);

      const actionsTd = document.createElement("td");
      // Build action buttons without innerHTML
      const canLoad = m.status !== "loaded" && m.status !== "loading" && m.status !== "running";
      const canUnload = m.status === "loaded" || m.status === "running";
      if (canLoad) {
        const btn = document.createElement("button");
        btn.className = "btn btn-primary btn-sm";
        btn.setAttribute("data-action", "load");
        btn.setAttribute("data-name", m.name);
        btn.textContent = "Load";
        actionsTd.appendChild(btn);
      }
      if (canUnload) {
        const btn2 = document.createElement("button");
        btn2.className = "btn btn-secondary btn-sm";
        btn2.setAttribute("data-action", "unload");
        btn2.setAttribute("data-name", m.name);
        btn2.textContent = "Unload";
        actionsTd.appendChild(btn2);
      }
      tr.appendChild(actionsTd);

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    return table;
  }

  _updateRouterIndicator() {
    const indicator = this.$(".router-indicator");
    if (!indicator) return;

    // Llama:status returns status: "running" or "idle"
    const routerRunning = this.routerStatus?.status === "running" || this.routerStatus?.processRunning;
    const port = this.routerStatus?.port || 8080;

    indicator.className = `router-indicator ${routerRunning ? "success" : "default"}`;
    indicator.textContent = `Router ${routerRunning ? "Active" : "Not Running"} (${port})`;
  }

  async _loadModel(name) {
    try {
      this.loading = true;
      console.log("[DEBUG] Loading model:", name);

      const response = await socketClient.request("models:load", {
        modelName: name,
      });

      if (response.success) {
        showNotification(`Model ${name} loaded`, "success");
        // Server broadcasts models:updated + router:status
        // Our socketClient.on() handlers will update UI
      } else {
        showNotification(`Failed: ${response.error}`, "error");
      }
    } catch (error) {
      console.error("[ModelsPage] Load failed:", error);
      showNotification(`Error: ${error.message}`, "error");
    } finally {
      this.loading = false;
    }
  }

  async _unloadModel(name) {
    try {
      this.loading = true;
      console.log("[DEBUG] Unloading model:", name);

      const response = await socketClient.request("models:unload", {
        modelName: name,
      });

      if (response.success) {
        showNotification(`Model ${name} unloaded`, "success");
        // Server broadcasts models:updated + router:status
      } else {
        showNotification(`Failed: ${response.error}`, "error");
      }
    } catch (error) {
      console.error("[ModelsPage] Unload failed:", error);
      showNotification(`Error: ${error.message}`, "error");
    } finally {
      this.loading = false;
    }
  }

  async _scan() {
    try {
      this.loading = true;
      showNotification("Scanning for models...", "info");
      console.log("[DEBUG] Scanning for models");

      const response = await socketClient.request("models:scan", {});

      if (response.success) {
        const count = response.data?.found || 0;
        showNotification(`Found ${count} models`, "success");
        // Server broadcasts models:updated with new list
      } else {
        showNotification(`Scan failed: ${response.error}`, "error");
      }
    } catch (error) {
      console.error("[ModelsPage] Scan failed:", error);
      showNotification(`Error: ${error.message}`, "error");
    } finally {
      this.loading = false;
    }
  }

  async _cleanup() {
    try {
      this.loading = true;
      showNotification("Cleaning up models...", "info");
      console.log("[DEBUG] Cleaning up models");

      const response = await socketClient.request("models:cleanup", {});

      if (response.success) {
        const count = response.data?.deletedCount || 0;
        showNotification(`Removed ${count} models`, "success");
        // Server broadcasts models:updated
      } else {
        showNotification(`Cleanup failed: ${response.error}`, "error");
      }
    } catch (error) {
      console.error("[ModelsPage] Cleanup failed:", error);
      showNotification(`Error: ${error.message}`, "error");
    } finally {
      this.loading = false;
    }
  }

  destroy() {
    console.log("[DEBUG] ModelsPage.destroy() - cleanup");
    this.unsubscribers.forEach((unsub) => unsub?.());
    this.unsubscribers = [];
  }
}

window.ModelsController = ModelsController;
window.ModelsPage = ModelsPage;
console.log("[MODELS] ModelsPage module loaded");
