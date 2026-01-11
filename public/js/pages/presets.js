/**
 * Presets Page - Event-Driven DOM Updates
 * Components render once, then use events to update specific DOM elements
 */

/* global ToastManager */


// LLAMA_PARAMS definition moved to js/components/presets/llama-params.js
// This enables better code organization and lazy loading

class PresetsController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.comp = null;
    this.presetsService = null;
    this.unsubscribers = [];
  }

  _ensureService() {
    if (!this.presetsService && window.socketClient?.socket) {
      this.presetsService = new PresetsService(window.socketClient.socket);
    }
    return this.presetsService;
  }

  init() { }

  willUnmount() {
    this.unsubscribers.forEach((unsub) => unsub());
  }

  destroy() {
    this.willUnmount();
    if (this.comp && this.comp.destroy) {
      this.comp.destroy();
    }
    this.comp = null;
  }

  async render() {
    this._ensureService();
    // Load available models from state before rendering
    let availableModels = window.stateManager?.get("models") || [];

    // If no models in state, try to fetch them
    if (availableModels.length === 0) {
      try {
        const result = await stateManager.getModels();
        availableModels = result.models || [];
        stateManager.set("models", availableModels);
      } catch (error) {
        console.error("[PRESETS] Failed to fetch models on render:", error.message);
      }
    }

    this.comp = new PresetsPage({
      presetsService: this.presetsService,
      controller: this,
      availableModels,
    });
    const el = this.comp.render();
    this.comp._el = el;
    el._component = this.comp;
    // Bind events immediately - elements will be in DOM after append
    this.comp.bindEvents();
    return el;
  }

  didMount() {
    // Called by router after element is in DOM
    // Now bind button events that need DOM access
    const newBtn = document.getElementById("btn-new-preset");
    if (newBtn) {
      newBtn.onclick = () => this.comp._handleNewPreset();
    }
    this.loadPresetsData();
  }

  async loadPresetsData() {
    console.log("[PRESETS] loadPresetsData called");

    const service = this._ensureService();
    console.log("[PRESETS] Service:", service ? "ready" : "not ready");
    console.log("[PRESETS] Socket connected:", window.socketClient?.socket?.connected);

    if (!service) {
      console.log("[PRESETS] Waiting for socket connection...");
      let attempts = 0;
      const checkSocket = () => {
        attempts++;
        console.log(
          `[PRESETS] Socket check attempt ${attempts}:`,
          window.socketClient?.socket?.connected
        );
        if (window.socketClient?.socket?.connected) {
          console.log("[PRESETS] Socket connected, loading presets...");
          this.loadPresetsData();
        } else if (attempts < 50) {
          // Try for 5 seconds max
          setTimeout(checkSocket, 100);
        } else {
          console.error("[PRESETS] Socket never connected, giving up");
        }
      };
      checkSocket();
      return;
    }

    try {
      console.log("[PRESETS] Calling listPresets...");
      const result = await service.listPresets();
      console.log("[PRESETS] listPresets returned:", result);
      const presets = result?.presets || result || [];
      console.log("[PRESETS] Loaded", presets.length, "presets:", presets);
      if (this.comp) {
        // Update state directly without re-rendering
        this.comp.state.presets = presets;
        this.comp.state.loading = false;

        // Update DOM without re-rendering
        this.comp._updatePresetsList();

        // Auto-select first preset
        if (presets.length > 0 && !this.comp.state.selectedPreset) {
          console.log("[PRESETS] Auto-selecting first preset:", presets[0].name);
          this.comp._emit("preset:select", presets[0].name);
        } else {
          console.log("[PRESETS] No presets found or already selected");
        }
      }

      // Load available models from state manager
      this.loadAvailableModels();
    } catch (error) {
      console.error("[PRESETS] Load presets error:", error.message, error.stack);
      ToastManager.error("Failed to load presets", {
        action: { label: "Retry", handler: () => this.loadPresetsData() }
      });
      if (this.comp) {
        this.comp.state.loading = false;
      }
    }
  }

  async loadAvailableModels() {
    try {
      const models = stateManager.get("models") || [];
      if (this.comp) {
        this.comp.state.availableModels = models;
        // Re-render editor to update model dropdown
        if (this.comp.state.selectedPreset) {
          this.comp._updateEditor();
        }
      }
    } catch (error) {
      console.error("[PRESETS] Load available models error:", error.message);
    }
  }

  async loadPresetData(preset) {
    const service = this._ensureService();
    if (!service) return;

    try {
      const [modelsResult, defaultsResult] = await Promise.all([
        service.getModelsFromPreset(preset.name),
        service.getDefaults(preset.name),
      ]);

      const models = modelsResult || {};
      const standaloneModels = [];

      // Only include models that are not the defaults section
      for (const modelName of Object.keys(models)) {
        if (modelName === "*") continue;
        standaloneModels.push({ name: modelName, fullName: modelName, ...models[modelName] });
      }

      if (this.comp) {
        this.comp._emit("preset:loaded", {
          preset,
          defaults: defaultsResult || {},
          standaloneModels,
        });
      }
    } catch (error) {
      console.error("[PRESETS] Load preset data error:", error.message);
      showNotification("Failed to load preset data", "error");
    }
  }
}

class PresetsPage extends Component {
  constructor(props) {
    super(props);
    this._presetsService = props.presetsService || null;
    this.state = {
      presets: props.presets || [],
      selectedPreset: null,
      globalDefaults: {},
      standaloneModels: [],
      availableModels: props.availableModels || [],
      loading: true,
      expandedDefaults: true,
      expandedModels: false, // Models section collapsed by default
      parameterFilter: "",
      serverRunning: false,
      serverPort: null,
      serverUrl: null,
    };
    this.controller = props.controller;
    this._domCache = new Map();
    this._eventsBounded = false;
    // Create debounced filter handler
    this.debouncedFilter = AppUtils.debounce(this._handleFilter.bind(this), 300);
  }

  onMount() {
    console.log("[PRESETS] onMount called - THIS RUNS AFTER ELEMENT IS IN DOM");

    // Cache DOM elements after mounting (element is now in DOM)
    this._domCache.set("presets-items", document.getElementById("presets-items"));
    this._domCache.set("server-status", document.getElementById("server-status"));
    this._domCache.set("editor", document.getElementById("presets-editor"));

    // Set router card HTML
    const routerContainer = document.getElementById("router-card");
    if (routerContainer) {
      routerContainer.innerHTML = this._renderRouterCard();
    }
    this._domCache.set(
      "router-card-container",
      document.getElementById("router-card-container")
    );

    // New preset button - NOW we can find it since element is in DOM!
    const newBtn = document.getElementById("btn-new-preset");
    console.log("[PRESETS] New preset button found:", !!newBtn);
    if (newBtn) {
      // Remove any existing listeners to avoid duplicates
      newBtn.removeEventListener("click", this._boundHandleNewPreset);
      this._boundHandleNewPreset = this._handleNewPreset.bind(this);
      newBtn.addEventListener("click", this._boundHandleNewPreset);
      console.log("[PRESETS] Added click listener to new preset button");
    }

    // Launch server button
    const launchBtn = document.getElementById("btn-launch-server");
    launchBtn && (launchBtn.onclick = () => this._handleLaunchServer());

    // Stop server button
    const stopBtn = document.getElementById("btn-stop-server");
    stopBtn && (stopBtn.onclick = () => this._handleStopServer());

    // Subscribe to server status changes via state manager
    this._subscribeToServerStatus();

    // Also subscribe to llamaServerStatus state changes
    if (window.stateManager?.subscribe) {
      this.unsubscribers.push(
        window.stateManager.subscribe("llamaServerStatus", (status) => {
          console.log("[PRESETS] llamaServerStatus state changed:", status);
          if (status) {
            this.state.serverRunning = status.status === "running";
            this.state.serverPort = status.port || null;
            this.state.serverUrl = status.url || null;
            this._updateRouterCardHTML();
          }
        })
      );
    }

    // Bind router card events
    this._bindRouterCardEvents();
  }

  /**
       * Subscribe to llama:status broadcasts to update UI when server state changes
       */
  _subscribeToServerStatus() {
    if (!window.socketClient?.socket) {
      console.log("[PRESETS] Socket not available for status subscription");
      return;
    }

    // Listen to llama:status broadcasts from server
    window.socketClient.socket.on("llama:status", (data) => {
      console.log("[PRESETS] Received llama:status event:", data);

      if (data?.status) {
        // Update server state
        this.state.serverRunning = data.status === "running";
        this.state.serverPort = data.port || null;
        this.state.serverUrl = data.url || null;

        // Update the server status panel
        this._updateServerStatusPanel();

        // Update the RouterCard if it exists
        this._updateRouterCard();
      }
    });

    // Also listen to llama-server:status broadcasts
    window.socketClient.socket.on("llama-server:status", (data) => {
      console.log("[PRESETS] Received llama-server:status event:", data);

      if (data?.type === "broadcast" && data?.data) {
        const status = data.data;
        this.state.serverRunning = status.status === "running";
        this.state.serverPort = status.port || null;
        this.state.serverUrl = status.url || null;

        this._updateServerStatusPanel();
        this._updateRouterCard();
      }
    });

    console.log("[PRESETS] Subscribed to server status events");
  }

  /**
       * Update the RouterCard component when server status changes
       * Uses pure DOM manipulation (event-driven, no re-render)
       */
  _updateRouterCard() {
    const routerContainer = this._domCache.get("router-card-container");
    if (!routerContainer) return;

    // Find the router card element
    const routerCardEl = routerContainer.querySelector(".router-card");
    if (!routerCardEl) return;

    const isRunning = this.state.serverRunning;
    const displayPort = this.state.serverPort || this.state.configPort || 8080;

    // Update status badge
    const statusBadge = routerCardEl.querySelector(".status-badge");
    if (statusBadge) {
      statusBadge.textContent = isRunning ? "RUNNING" : "STOPPED";
      statusBadge.className = `status-badge ${isRunning ? "running" : "idle"}`;
    }

    // Update router info visibility
    const routerInfo = routerCardEl.querySelector(".router-info");
    if (routerInfo) {
      routerInfo.style.display = isRunning ? "flex" : "none";
    }

    // Update buttons
    const controls = routerCardEl.querySelector(".router-controls");
    if (controls) {
      const hasPresets = this.state.presets && this.state.presets.length > 0;
      const routerModels = this.state.routerStatus?.models || [];
      const loadedCount = routerModels.filter((x) => x.state === "loaded").length;

      controls.innerHTML = `
        ${hasPresets
    ? `
          <div class="preset-selector">
            <select class="preset-dropdown" id="router-preset-select">
              <option value="">📋 Select Preset...</option>
              ${this.state.presets
    .map(
      (preset) => `
                <option value="${preset.name}" ${this.state.selectedPreset?.name === preset.name ? "selected" : ""}>${preset.name}</option>
              `
    )
    .join("")}
            </select>
          </div>
        `
    : ""
}
        ${isRunning
    ? `
          <button class="btn btn-danger" data-action="router-stop">⏹ Stop Router</button>
          <button class="btn btn-secondary" data-action="router-restart">🔄 Restart</button>
        `
    : `
          <button class="btn btn-primary" data-action="router-start">${this.state.selectedPreset ? "▶ Start with Preset" : "▶ Start Router"}</button>
        `
}
      `;
    }

    // Re-bind events for new buttons
    this._bindRouterCardEvents();

    console.log("[PRESETS] RouterCard updated:", isRunning ? "RUNNING" : "STOPPED");
  }

  /**
       * Update just the HTML of router card (full re-render of the card only)
       */
  _updateRouterCardHTML() {
    const routerContainer = document.getElementById("router-card");
    if (!routerContainer) return;

    // Re-render the router card HTML
    routerContainer.innerHTML = this._renderRouterCard();

    // Bind events for the new elements
    this._bindRouterCardEvents();

    console.log(
      "[PRESETS] RouterCard HTML updated:",
      this.state.serverRunning ? "RUNNING" : "STOPPED"
    );
  }

  /**
       * Update the server status panel to reflect current server state
       */
  _updateServerStatusPanel() {
    const statusPanel = this._domCache.get("server-status");
    if (!statusPanel) return;

    if (this.state.serverRunning) {
      statusPanel.innerHTML = `
        <div class="server-status running">
          <div class="status-header">
            <span class="status-indicator">●</span>
            <span class="status-text">Server Running</span>
          </div>
          <div class="server-details">
            <div class="detail-row">
              <span class="detail-label">Port:</span>
              <span class="detail-value">${this.state.serverPort || "?"}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">URL:</span>
              <span class="detail-value">${this.state.serverUrl || "?"}</span>
            </div>
          </div>
          <div class="server-actions">
            <button class="btn btn-danger" id="btn-stop-server">⏹ Stop Server</button>
            <button class="btn btn-secondary" id="btn-restart-server">🔄 Restart</button>
          </div>
        </div>
      `;

      // Re-bind stop button
      const stopBtn = document.getElementById("btn-stop-server");
      stopBtn && (stopBtn.onclick = () => this._handleStopServer());
    } else {
      statusPanel.innerHTML = `
        <div class="server-status stopped">
          <div class="status-header">
            <span class="status-indicator stopped">●</span>
            <span class="status-text">Server Stopped</span>
          </div>
          <div class="server-actions">
            <button class="btn btn-primary" id="btn-launch-server">▶ Start Server</button>
          </div>
        </div>
      `;

      // Re-bind launch button
      const launchBtn = document.getElementById("btn-launch-server");
      launchBtn && (launchBtn.onclick = () => this._handleLaunchServer());
    }
  }

  _getService() {
    return this._presetsService || (this.controller ? this.controller.presetsService : null);
  }

  // Event bus for DOM updates (no re-renders)
  _emit(event, data) {
    if (!this._el) return;

    switch (event) {
    case "preset:select":
      this._handlePresetSelect(data);
      break;
    case "preset:loaded":
      this._handlePresetLoaded(data);
      break;
    case "presets:update":
      this._updatePresetsList(data);
      break;
    case "defaults:toggle":
      this._toggleDefaultsSection();
      break;
    case "param:add":
      this._handleAddParam(data);
      break;
    }
  }

  _handlePresetSelect(presetName) {
    const preset = this.state.presets.find((p) => p.name === presetName);
    if (!preset) return;

    this.state.selectedPreset = preset;
    this._updatePresetsList();
    this.controller?.loadPresetData(preset);
  }

  _handlePresetLoaded(data) {
    console.log("[PRESETS] _handlePresetLoaded called:", data);
    this.state.globalDefaults = data.defaults;
    this.state.standaloneModels = data.standaloneModels;
    console.log("[PRESETS] About to call _updateEditor...");
    this._updateEditor();
    console.log("[PRESETS] _updateEditor called");
  }

  _updatePresetsList() {
    console.log("[PRESETS] _updatePresetsList called");
    console.log("[PRESETS] _domCache keys:", Array.from(this._domCache.keys()));

    // Get container from cache or direct DOM
    let container = this._domCache.get("presets-items");
    console.log("[PRESETS] Container from cache:", !!container);

    if (!container) {
      console.log("[PRESETS] Container not found in cache, trying direct DOM access");
      container = document.getElementById("presets-items");
      if (container) {
        console.log("[PRESETS] Found element directly, caching it now");
        this._domCache.set("presets-items", container);
      }
    }

    if (!container) {
      console.log("[PRESETS] Element not found at all!");
      return;
    }

    console.log("[PRESETS] Presets to render:", this.state.presets.length, this.state.presets);

    let html = "";
    for (const preset of this.state.presets) {
      const isActive = this.state.selectedPreset?.name === preset.name;
      html += `
        <div class="preset-item ${isActive ? "active" : ""}" data-preset-name="${preset.name}">
          <span class="preset-name">${preset.name}</span>
          ${preset.name !== "default" ? `<span class="preset-delete" data-preset-name="${preset.name}">×</span>` : ""}
        </div>
      `;
    }
    container.innerHTML = html;
    // Bind events AFTER HTML is in DOM (not before!)
    this._bindPresetEvents();
  }

  _updateEditor() {
    console.log("[PRESETS] _updateEditor called, looking for editor element...");
    const editor = this._domCache.get("editor");
    console.log("[PRESETS] Editor from cache:", !!editor);

    if (!editor) {
      console.log("[PRESETS] Editor not found in cache, trying direct DOM...");
      const el = document.getElementById("presets-editor");
      console.log("[PRESETS] Editor from direct DOM:", !!el);
      if (el) {
        this._domCache.set("editor", el);
        // Show loading state
        el.innerHTML = "<div style=\"padding: 20px; text-align: center;\">Loading editor...</div>";
        // Defer render
        requestAnimationFrame(() => this._renderEditor());
      } else {
        console.log("[PRESETS] Editor element not found at all!");
      }
      return;
    }

    // Show loading state
    editor.innerHTML = "<div style=\"padding: 20px; text-align: center;\">Loading editor...</div>";

    // Defer update to avoid blocking UI
    requestAnimationFrame(() => {
      console.log("[PRESETS] requestAnimationFrame callback executing...");
      this._renderEditor();
    });
  }

  _renderEditor() {
    console.log("[PRESETS] _renderEditor called");
    const editor = this._domCache.get("editor");
    if (!editor) return;

    // Build param options only for parameters not yet added to defaults
    const defaults = this.state.globalDefaults || {};
    const addedParamKeys = Object.keys(defaults)
      .map((iniKey) => {
        // Find the param with this iniKey
        return LLAMA_PARAMS.find((p) => p.iniKey === iniKey)?.key;
      })
      .filter(Boolean);

    const paramOptions = LLAMA_PARAMS.filter((p) => !addedParamKeys.includes(p.key))
      .map((p) => `<option value="${p.key}">${p.label} (${p.group})</option>`)
      .join("");

    editor.innerHTML = `
      <div class="editor-header">
        <h2>${this.state.selectedPreset.name}</h2>
        <span class="preset-type-badge">${this.state.selectedPreset.name === "default" ? "Built-in" : "Custom"}</span>
      </div>

      <div class="section defaults-section">
        <div class="section-header" id="header-defaults">
          <span class="section-icon">★</span>
          <span class="section-title">Global Defaults</span>
          <span class="section-toggle">${this.state.expandedDefaults ? "▼" : "▶"}</span>
        </div>
        ${this.state.expandedDefaults
    ? `
          <div class="section-content" id="content-defaults">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input type="text" class="search-input" placeholder="Filter parameters by name..." id="param-filter">
            </div>
            ${Object.keys(this.state.globalDefaults || {}).length > 0
    ? `
             <div class="added-params-section">
               <strong>Added Parameters:</strong>
               <div class="added-params-list">
                 ${Object.entries(this.state.globalDefaults)
    .map(([key, value]) => {
      const param = LLAMA_PARAMS.find((p) => p.iniKey === key);
      // Format value for display: handle arrays/strings properly
      let displayValue = value;
      if (typeof value === "string") {
        displayValue = value;
      } else if (Array.isArray(value)) {
        displayValue = value.join(",");
      } else {
        displayValue = String(value);
      }
      // Escape HTML special characters in the value
      const escaped = displayValue
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
      return `
                        <div class="param-item-display" data-param-key="${key}">
                          <div class="param-name"><strong>${param?.label || key}</strong></div>
                          <div class="param-controls">
                            <input type="text" class="param-value-input" value="${escaped}" data-param-key="${key}" placeholder="Value">
                            <button class="btn-param-delete" data-param-key="${key}" title="Delete parameter">×</button>
                          </div>
                        </div>
                      `;
    })
    .join("")}
               </div>
             </div>
            `
    : "<p class=\"defaults-hint\">Default preset starts empty - all default values are in llama-router</p>"
}
            <label class="add-param-label">Add Parameter to Defaults</label>
            <select class="param-add-select" id="select-add-param" data-section="defaults" data-name="*">
              <option value="">-- Select parameter to add --</option>
              ${paramOptions}
            </select>
          </div>
        `
    : ""
}
      </div>

      <div class="section standalone-section">
        <div class="section-header" id="header-models">
          <span class="section-icon">📄</span>
          <span class="section-title">Models</span>
          <span class="section-toggle" id="toggle-models">▶</span>
        </div>
        <div class="add-model-controls" style="display: none;">
          <select class="model-select" id="select-add-model">
            <option value="">-- Select a model --</option>
            ${(this.state.availableModels || [])
    .map(
      (model) =>
        `<option value="${this._escapeHtml(model.name)}">${this._escapeHtml(model.name)}</option>`
    )
    .join("")}
          </select>
          <button class="btn btn-secondary" id="btn-add-standalone">+ Add Selected Model</button>
        </div>
        <div class="standalone-list" id="standalone-list" style="display: none;">
          ${this.state.standaloneModels.length === 0 ? "<p>No models added yet</p>" : this._renderStandaloneHtml()}
        </div>
      </div>
    `;

    this._bindEditorEvents();
    this._bindParamInputs();
  }

  _bindParamInputs() {
    const inputs = this._el?.querySelectorAll(".param-value-input") || [];
    inputs.forEach((input) => {
      input.onchange = (e) => {
        const modelName = e.target.dataset.model;
        if (modelName) {
          this._handleModelParamChange(e.target);
        } else {
          this._handleParamChange(e.target);
        }
      };
      input.onblur = (e) => {
        const modelName = e.target.dataset.model;
        if (modelName) {
          this._handleModelParamChange(e.target);
        } else {
          this._handleParamChange(e.target);
        }
      };
    });

    // Bind delete buttons
    const deleteButtons = this._el?.querySelectorAll(".btn-param-delete") || [];
    deleteButtons.forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        const paramKey = btn.dataset.paramKey;
        const modelName = btn.dataset.model;
        if (modelName) {
          this._handleDeleteModelParam(paramKey, modelName);
        } else {
          this._handleDeleteParam(paramKey);
        }
      };
    });
  }

  async _handleParamChange(input) {
    const paramKey = input.dataset.paramKey;
    const newValue = input.value;

    if (!paramKey || !this.state.selectedPreset) return;

    try {
      // Find the param to get its type and details
      const param = LLAMA_PARAMS.find((p) => p.iniKey === paramKey);
      if (!param) return;

      // Parse the value based on parameter type
      let value;
      if (param.type === "number") {
        value = parseFloat(newValue);
        if (isNaN(value)) {
          throw new Error(`Invalid number: ${newValue}`);
        }
      } else if (param.type === "select") {
        value = newValue; // Select values stay as strings
      } else {
        // For text and other types, keep as string
        value = newValue;
      }

      // Update state first with all parameters
      this.state.globalDefaults[paramKey] = value;

      // Update the parameter with ALL current defaults
      await this._getService().updateDefaults(this.state.selectedPreset.name, this.state.globalDefaults);

      showNotification("Parameter updated", "success");
    } catch (error) {
      console.error("[PRESETS] Parameter update error:", error);
      showNotification(`Error updating parameter: ${error.message}`, "error");
    }
  }

  async _handleDeleteParam(paramKey) {
    if (!paramKey || !this.state.selectedPreset) return;

    const param = LLAMA_PARAMS.find((p) => p.iniKey === paramKey);
    if (!param) return;

    try {
      // Create new defaults with the parameter marked for deletion (null)
      const newDefaults = { ...this.state.globalDefaults };
      newDefaults[paramKey] = null; // Mark for deletion

      // Update the defaults in the preset
      await this._getService().updateDefaults(this.state.selectedPreset.name, newDefaults);

      // Update state - actually remove it from the state
      delete this.state.globalDefaults[paramKey];
      showNotification(`Parameter "${param.label}" deleted`, "success");

      // Re-render editor to update the UI
      this._updateEditor();
    } catch (error) {
      console.error("[PRESETS] Delete parameter error:", error);
      showNotification(`Error deleting parameter: ${error.message}`, "error");
    }
  }

  async _handleModelParamChange(input) {
    const paramKey = input.dataset.paramKey;
    const modelName = input.dataset.model;
    const newValue = input.value;

    if (!paramKey || !modelName || !this.state.selectedPreset) return;

    try {
      const param = LLAMA_PARAMS.find((p) => p.iniKey === paramKey);
      if (!param) return;

      let value;
      if (param.type === "number") {
        value = parseFloat(newValue);
        if (isNaN(value)) {
          throw new Error(`Invalid number: ${newValue}`);
        }
      } else if (param.type === "select") {
        value = newValue;
      } else {
        value = newValue;
      }

      // Update state first
      const modelIdx = this.state.standaloneModels.findIndex((m) => m.name === modelName);
      if (modelIdx < 0) return;

      this.state.standaloneModels[modelIdx][paramKey] = value;

      // Update the model with ALL current parameters (exclude name/fullName)
      const modelConfig = { ...this.state.standaloneModels[modelIdx] };
      delete modelConfig.name;
      delete modelConfig.fullName;
      await this._getService().updateModel(
        this.state.selectedPreset.name,
        modelName,
        modelConfig
      );

      showNotification("Parameter updated", "success");
    } catch (error) {
      console.error("[PRESETS] Model parameter update error:", error);
      showNotification(`Error updating parameter: ${error.message}`, "error");
    }
  }

  async _handleDeleteModelParam(paramKey, modelName) {
    if (!paramKey || !modelName || !this.state.selectedPreset) return;

    const param = LLAMA_PARAMS.find((p) => p.iniKey === paramKey);
    if (!param) return;

    try {
      const modelIdx = this.state.standaloneModels.findIndex((m) => m.name === modelName);
      if (modelIdx < 0) return;

      const model = this.state.standaloneModels[modelIdx];
      const newConfig = { ...model };
      delete newConfig.name;
      delete newConfig.fullName;
      newConfig[paramKey] = null; // Mark for deletion

      await this._getService().updateModel(this.state.selectedPreset.name, modelName, newConfig);

      delete this.state.standaloneModels[modelIdx][paramKey];
      showNotification(`Parameter "${param.label}" deleted`, "success");
      this._updateEditor();
    } catch (error) {
      console.error("[PRESETS] Delete model parameter error:", error);
      showNotification(`Error deleting parameter: ${error.message}`, "error");
    }
  }

  async _handleAddModelParam(data) {
    const { paramKey, modelName } = data;
    const param = LLAMA_PARAMS.find((p) => p.key === paramKey);
    if (!param || !modelName || !this.state.selectedPreset) return;

    try {
      await this._getService().updateModel(this.state.selectedPreset.name, modelName, {
        [param.iniKey]: param.default,
      });
      showNotification(`Parameter "${param.label}" added`, "success");

      const modelIdx = this.state.standaloneModels.findIndex((m) => m.name === modelName);
      if (modelIdx >= 0) {
        this.state.standaloneModels[modelIdx][param.iniKey] = param.default;
      }

      this._updateEditor();
    } catch (error) {
      console.error("[PRESETS] Add model parameter error:", error);
      showNotification(`Error: ${error.message}`, "error");
    }
  }

  async _handleDeleteModel(modelName) {
    if (!modelName || !this.state.selectedPreset) return;

    if (!confirm(`Delete model "${modelName}" from preset?`)) return;

    try {
      await this._getService().removeModel(this.state.selectedPreset.name, modelName);
      this.state.standaloneModels = this.state.standaloneModels.filter((m) => m.name !== modelName);
      showNotification(`Model "${modelName}" deleted`, "success");
      this._updateEditor();
    } catch (error) {
      console.error("[PRESETS] Delete model error:", error);
      showNotification(`Error: ${error.message}`, "error");
    }
  }

  _escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  _renderStandaloneHtml() {
    return this.state.standaloneModels
      .map((model) => {
        const modelParams = Object.entries(model).filter(
          ([key]) => key !== "name" && key !== "fullName"
        );
        const isExpanded = this.state.expandedModels?.[model.name] || false;

        return `
      <div class="model-section" data-model="${model.name}">
        <div class="model-header" data-model-name="${model.name}">
          <span class="model-icon">📄</span>
          <span class="model-name">${model.name}</span>
          <span class="model-toggle">${isExpanded ? "▼" : "▶"}</span>
          <button class="btn-model-delete" data-model-name="${model.name}" title="Delete model">×</button>
        </div>
        ${isExpanded
    ? `
        <div class="model-content">
          ${modelParams.length > 0
    ? `
          <div class="model-params-section">
            <strong>Parameters:</strong>
            <div class="model-params-list">
              ${modelParams
    .map(([key, value]) => {
      const param = LLAMA_PARAMS.find((p) => p.iniKey === key);
      const displayValue = Array.isArray(value) ? value.join(",") : String(value);
      const escaped = displayValue
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
      return `
                <div class="param-item-display" data-param-key="${key}" data-model="${model.name}">
                  <div class="param-name"><strong>${param?.label || key}</strong></div>
                  <div class="param-controls">
                    <input type="text" class="param-value-input" value="${escaped}" data-param-key="${key}" data-model="${model.name}" placeholder="Value">
                    <button class="btn-param-delete" data-param-key="${key}" data-model="${model.name}" title="Delete parameter">×</button>
                  </div>
                </div>
              `;
    })
    .join("")}
            </div>
          </div>
          `
    : "<p>No parameters added</p>"
}
          <label class="add-param-label">Add Parameter</label>
          <select class="param-add-select" data-section="model" data-model="${model.name}">
            <option value="">-- Select parameter to add --</option>
            ${LLAMA_PARAMS.filter((p) => !Object.keys(model).includes(p.iniKey))
    .map((p) => `<option value="${p.key}">${p.label} (${p.group})</option>`)
    .join("")}
          </select>
        </div>
        `
    : ""
}
      </div>
    `;
      })
      .join("");
  }

  _toggleDefaultsSection() {
    this.state.expandedDefaults = !this.state.expandedDefaults;
    this._updateEditor();
  }

  _toggleModelsSection() {
    const modelsSection = document.querySelector(".standalone-section");
    if (!modelsSection) return;

    const content = modelsSection.querySelector(".add-model-controls");
    const list = modelsSection.querySelector(".standalone-list");
    const toggle = modelsSection.querySelector("#toggle-models");

    if (content.style.display === "none") {
      content.style.display = "";
      list.style.display = "";
      toggle.textContent = "▼";
    } else {
      content.style.display = "none";
      list.style.display = "none";
      toggle.textContent = "▶";
    }
  }

  _bindPresetEvents() {
    console.log("[PRESETS] _bindPresetEvents called");
    const container = this._domCache.get("presets-items");
    if (!container) {
      console.log("[PRESETS] _bindPresetEvents: container not found!");
      return;
    }

    // Use event delegation on container instead of binding to each item
    container.onclick = (e) => {
      const item = e.target.closest(".preset-item");
      if (item && !e.target.classList.contains("preset-delete")) {
        console.log("[PRESETS] Preset item clicked:", item.dataset.presetName);
        this._emit("preset:select", item.dataset.presetName);
      }
    };

    container.querySelectorAll(".preset-delete").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        this._handleDeletePreset(btn.dataset.presetName);
      };
    });

    console.log("[PRESETS] Event delegation set up on container");
  }

  _bindEditorEvents() {
    // Defaults toggle
    const defaultsHeader = document.getElementById("header-defaults");
    defaultsHeader && (defaultsHeader.onclick = () => this._emit("defaults:toggle"));

    // Models toggle
    const modelsHeader = document.getElementById("header-models");
    modelsHeader && (modelsHeader.onclick = () => this._toggleModelsSection());

    // Add param dropdown for defaults
    const addParamSelect = document.getElementById("select-add-param");
    if (addParamSelect) {
      addParamSelect.onchange = (e) => {
        if (e.target.value) {
          this._emit("param:add", {
            paramKey: e.target.value,
            section: e.target.dataset.section,
            name: e.target.dataset.name,
          });
          e.target.value = "";
        }
      };
    }

    // Add standalone button
    const addStandaloneBtn = document.getElementById("btn-add-standalone");
    addStandaloneBtn && (addStandaloneBtn.onclick = () => this._handleAddStandalone());

    // Filter input
    const filterInput = document.getElementById("param-filter");
    filterInput && (filterInput.oninput = (e) => this.debouncedFilter(e.target.value));

    // Model header toggles
    const modelHeaders = this._el?.querySelectorAll(".model-header") || [];
    modelHeaders.forEach((header) => {
      header.onclick = (e) => {
        if (e.target.classList.contains("btn-model-delete")) return;
        const modelName = header.dataset.modelName;
        this.state.expandedModels[modelName] = !this.state.expandedModels[modelName];
        this._updateEditor();
      };
    });

    // Model delete buttons
    const modelDeleteBtns = this._el?.querySelectorAll(".btn-model-delete") || [];
    modelDeleteBtns.forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const modelName = btn.dataset.modelName;
        this._handleDeleteModel(modelName);
      };
    });

    // Add param dropdown for models
    const modelParamSelects =
            this._el?.querySelectorAll(".param-add-select[data-section='model']") || [];
    modelParamSelects.forEach((select) => {
      select.onchange = (e) => {
        if (e.target.value) {
          this._handleAddModelParam({
            paramKey: e.target.value,
            modelName: e.target.dataset.model,
          });
          e.target.value = "";
        }
      };
    });
  }

  _filterParams(query) {
    const items = this._el?.querySelectorAll(".param-item") || [];
    const lower = query.toLowerCase();
    items.forEach((item) => {
      const label = item.querySelector(".param-label")?.textContent.toLowerCase() || "";
      item.style.display = label.includes(lower) ? "" : "none";
    });
  }

  _handleFilter(query) {
    console.log("[DEBUG] PresetsPage _handleFilter:", query);
    this._filterParams(query);
  }

  async _handleAddParam(data) {
    const { paramKey, section, name } = data;
    const param = LLAMA_PARAMS.find((p) => p.key === paramKey);
    if (!param) return;

    const modelName = section === "defaults" ? "*" : name;
    if (!modelName || !this.state.selectedPreset) return;

    try {
      await this._getService().addModel(this.state.selectedPreset.name, modelName, {
        [param.iniKey]: param.default,
      });
      showNotification(`Parameter "${param.label}" added`, "success");

      // Optimistically update the UI immediately
      if (section === "defaults") {
        this.state.globalDefaults[param.iniKey] = param.default;
        this._updateEditor(); // Re-render editor with new parameter
      } else {
        // For non-defaults, reload full data
        this.controller?.loadPresetData(this.state.selectedPreset);
      }
    } catch (error) {
      console.error("[PRESETS] Add param error:", error);
      showNotification(`Error: ${error.message}`, "error");
    }
  }

  async _handleDeletePreset(name) {
    if (!confirm(`Delete preset "${name}"?`)) return;

    try {
      await this._getService().deletePreset(name);
      showNotification(`Preset "${name}" deleted`, "success");
      this.state.presets = this.state.presets.filter((p) => p.name !== name);
      this._updatePresetsList();

      if (this.state.selectedPreset?.name === name) {
        this.state.selectedPreset = this.state.presets[0] || null;
        if (this.state.selectedPreset) {
          this._emit("preset:select", this.state.selectedPreset.name);
        } else {
          const editor = this._domCache.get("editor");
          if (editor) {
            editor.innerHTML = "<div class=\"empty-state\">Select a preset to edit</div>";
          }
        }
      }
    } catch (error) {
      console.error("[PRESETS] Delete error:", error);
      showNotification(`Error: ${error.message}`, "error");
    }
  }

  async _handleAddStandalone() {
    const select = document.getElementById("select-add-model");
    const modelName = select?.value?.trim();

    if (!modelName) {
      showNotification("Please select a model from the dropdown", "warning");
      return;
    }

    try {
      await this._getService().addModel(this.state.selectedPreset.name, modelName, {});
      showNotification(`Model "${modelName}" added`, "success");
      select.value = "";
      this.controller?.loadPresetData(this.state.selectedPreset);
    } catch (error) {
      console.error("[PRESETS] Add model error:", error);
      showNotification(`Error: ${error.message}`, "error");
    }
  }

  async _handleApplyTemplate(templateConfig) {
    if (!this.state.selectedPreset || this.state.selectedPreset.name === "default") {
      showNotification("Please select or create a custom preset first", "warning");
      return;
    }

    try {
      console.log("[PRESETS] Applying template:", templateConfig);

      // Apply template to global defaults
      for (const [key, value] of Object.entries(templateConfig)) {
        await this._getService().updateDefaults(this.state.selectedPreset.name, {
          ...this.state.globalDefaults,
          [key]: value,
        });
        this.state.globalDefaults[key] = value;
      }

      showNotification("Template applied successfully", "success");
      this._updateEditor();
    } catch (error) {
      console.error("[PRESETS] Apply template error:", error);
      showNotification(`Failed to apply template: ${error.message}`, "error");
    }
  }

  render() {
    return Component.h(
      "div",
      { className: "presets-page" },
      Component.h(
        "div",
        { className: "presets-page-header" },
        Component.h("h1", {}, "Model Presets")
      ),
      Component.h(window.PresetTemplates, {
        onApplyTemplate: this._handleApplyTemplate.bind(this),
      }),
      Component.h(
        "div",
        { className: "presets-list" },
        Component.h(
          "div",
          { className: "presets-header-row" },
          Component.h("span", { className: "presets-label" }, "Presets:"),
          Component.h("div", { className: "presets-items", id: "presets-items" }),
          Component.h(
            "button",
            { className: "btn btn-secondary add-preset-btn", id: "btn-new-preset" },
            "+ New Preset"
          )
        )
      ),
      Component.h(
        "div",
        { className: "presets-container" },
        // Left panel: Router Card (event-driven, no React-style callbacks)
        Component.h(
          "div",
          { className: "router-card-container", id: "router-card" }
        ),
        // Right panel: Editor
        Component.h(
          "div",
          { className: "presets-editor", id: "presets-editor" },
          Component.h("div", { className: "empty-state" }, "Select a preset to edit")
        )
      )
    );
  }

  /**
       * Handle router actions from RouterCard
       */
  _handleRouterAction(action, data) {
    console.log("[PRESETS] RouterCard action:", action, data);

    switch (action) {
    case "start":
      this._handleLaunchServer();
      break;
    case "stop":
      this._handleStopServer();
      break;
    case "restart":
      this._handleStopServer().then(() => {
        setTimeout(() => this._handleLaunchServer(), 2000);
      });
      break;
    case "start-with-preset":
      this._handleLaunchServerWithPreset(data);
      break;
    }
  }

  /**
       * Render the Router Card using pure event-driven pattern (no Component.h)
       */
  _renderRouterCard() {
    const isRunning = this.state.serverRunning;
    const displayPort = this.state.serverPort || this.state.configPort || 8080;
    const routerModels = this.state.routerStatus?.models || [];
    const loadedCount = routerModels.filter((x) => x.state === "loaded").length;
    const hasPresets = this.state.presets && this.state.presets.length > 0;

    return `
      <div class="router-section">
        <div class="router-card ${isRunning ? "running" : "idle"}">
          <div class="router-header">
            <div class="router-title">
              <h3>🦙 Llama Router</h3>
              <span class="status-badge ${isRunning ? "running" : "idle"}">${isRunning ? "RUNNING" : "STOPPED"}</span>
            </div>
            ${isRunning
    ? `
              <div class="router-info">
                <span class="info-item">Port: ${displayPort}</span>
                <span class="info-item models-info">Models: ${loadedCount}/${this.state.availableModels.length} loaded</span>
              </div>
            `
    : ""
}
          </div>
          <div class="router-controls">
            ${hasPresets
    ? `
              <div class="preset-selector">
                <select class="preset-dropdown" id="router-preset-select">
                  <option value="">📋 Select Preset...</option>
                  ${this.state.presets
    .map(
      (preset) => `
                    <option value="${preset.name}" ${this.state.selectedPreset?.name === preset.name ? "selected" : ""}>${preset.name}</option>
                  `
    )
    .join("")}
                </select>
              </div>
            `
    : ""
}
            ${isRunning
    ? `
              <button class="btn btn-danger" data-action="router-stop">⏹ Stop Router</button>
              <button class="btn btn-secondary" data-action="router-restart" ${!isRunning ? "disabled" : ""}>🔄 Restart</button>
            `
    : `
              <button class="btn btn-primary" data-action="router-start">${this.state.selectedPreset ? "▶ Start with Preset" : "▶ Start Router"}</button>
            `
}
          </div>
        </div>
      </div>
    `;
  }

  /**
       * Bind router card events after it's rendered
       */
  _bindRouterCardEvents() {
    const routerCard = document.getElementById("router-card");
    if (!routerCard) return;

    // Start button
    const startBtn = routerCard.querySelector("[data-action=\"router-start\"]");
    startBtn && (startBtn.onclick = () => this._handleLaunchServer());

    // Stop button
    const stopBtn = routerCard.querySelector("[data-action=\"router-stop\"]");
    stopBtn && (stopBtn.onclick = () => this._handleStopServer());

    // Restart button
    const restartBtn = routerCard.querySelector("[data-action=\"router-restart\"]");
    restartBtn &&
            (restartBtn.onclick = () => {
              this._handleStopServer().then(() => {
                setTimeout(() => this._handleLaunchServer(), 2000);
              });
            });

    // Preset select
    const presetSelect = routerCard.querySelector("#router-preset-select");
    presetSelect &&
            (presetSelect.onchange = (e) => {
              if (e.target.value) {
                this._emit("preset:select", e.target.value);
              }
            });
  }

  /**
       * Launch server with currently selected preset
       */
  async _handleLaunchServerWithPreset(presetName) {
    if (!presetName) {
      showNotification("Please select a preset first", "warning");
      return;
    }

    try {
      console.log("[PRESETS] Launching server with preset:", presetName);
      const result = await window.stateLlamaServer.socket.request("llama:start-with-preset", {
        presetName,
      });

      if (result?.success) {
        showNotification(`Server started with preset "${presetName}"`, "success");
      } else {
        showNotification(`Failed to start server: ${result?.error || "Unknown error"}`, "error");
      }
    } catch (error) {
      console.error("[PRESETS] Launch error:", error);
      showNotification(`Failed to start server: ${error.message}`, "error");
    }
  }

  bindEvents() {
    // Events that can be bound before DOM append go here
    // (currently empty - all event binding is done in onMount for reliability)
    console.log("[PRESETS] bindEvents called");
  }

  async _handleNewPreset() {
    console.log("[PRESETS] _handleNewPreset called");
    const name = prompt("Preset name:");
    console.log("[PRESETS] New preset name:", name);
    if (!name) return;

    try {
      console.log("[PRESETS] Calling createPreset...");
      await this._getService().createPreset(name);
      console.log("[PRESETS] Preset created successfully");
      showNotification(`Preset "${name}" created with empty configuration`, "success");
      this.state.presets = [...this.state.presets, { name }];
      this._updatePresetsList();
      this._emit("preset:select", name);
    } catch (error) {
      console.error("[PRESETS] Create error:", error);
      showNotification(`Error: ${error.message}`, "error");
    }
  }

  didMount() {
    // Loading is handled by controller's loadPresetsData()
    // Just ensure refs are cached
  }
}

window.PresetsController = PresetsController;
window.PresetsPage = PresetsPage;
// LLAMA_PARAMS is now defined in llama-params.js and exported as window.LLAMA_PARAMS
