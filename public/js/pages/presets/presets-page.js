/**
 * Presets Page - Socket-First Architecture
 * Compatible with presets-editor.js extension
 */

class PresetsPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      presets: [],
      selectedPreset: null,
      globalDefaults: {},
      standaloneModels: [],
      availableModels: props.availableModels || [],
      loading: false,
      expandedDefaults: true,
      expandedModels: {},
      parameterFilter: "",
      serverRunning: false,
      serverPort: null,
      serverUrl: null,
    };
    this._domCache = new Map();
    this.unsubscribers = [];
  }

  onMount() {
    console.log("[DEBUG] PresetsPage onMount");

    // Listen to socket broadcasts
    this.unsubscribers.push(
      socketClient.on("presets:updated", (data) => {
        console.log("[DEBUG] presets:updated broadcast");
        let presets = [];
        if (Array.isArray(data)) {
          presets = data;
        } else if (Array.isArray(data?.presets)) {
          presets = data.presets;
        }
        this.state.presets = presets;
        if (presets.length > 0 && !this.state.selectedPreset) {
          this._handlePresetSelect(presets[0].name);
        }
        this._updatePresetsUI();
      }),
      socketClient.on("models:updated", (data) => {
        console.log("[DEBUG] models:updated broadcast");
        this.state.availableModels = data.models || [];
      }),
      socketClient.on("llama:status", (data) => {
        console.log("[DEBUG] llama:status broadcast");
        if (data.status) {
          this.state.serverRunning = data.status === "running";
          this.state.serverPort = data.status.port || null;
        }
      })
    );
  }

  /**
   * Update the presets list UI
   */
  _updatePresetsUI() {
    let container = this._domCache.get("presets-items");
    if (!container) {
      container = this.$("#presets-items");
      if (container) this._domCache.set("presets-items", container);
    }
    if (!container) return;

    const presets = this.state.presets || [];
    if (presets.length === 0) {
      container.innerHTML = '<div class="empty-presets">No presets found</div>';
      return;
    }

    container.innerHTML = presets.map((preset) => {
      const presetName = preset?.name;
      const isActive = this.state.selectedPreset?.name === presetName;
      return `<div class="preset-item ${isActive ? "active" : ""}" data-preset-name="${presetName}">
        <span class="preset-name">${presetName}</span>
        ${presetName !== "default" ? `<span class="preset-delete" data-preset-name="${presetName}">×</span>` : ""}
      </div>`;
    }).join("");

    this._bindPresetEvents();
  }

  /**
   * Bind events for preset items
   */
  _bindPresetEvents() {
    const container = this._domCache.get("presets-items");
    if (!container) return;

    container.querySelectorAll(".preset-item").forEach((item) => {
      item.onclick = () => {
        const presetName = item.dataset.presetName;
        this._handlePresetSelect(presetName);
      };
    });

    container.querySelectorAll(".preset-delete").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const presetName = btn.dataset.presetName;
        if (confirm(`Delete preset "${presetName}"?`)) {
          const controller = this._el?._component?._controller;
          if (controller) {
            controller.handleDeletePreset(presetName);
          }
        }
      };
    });
  }

  /**
   * Handle preset selection
   */
  _handlePresetSelect(presetName) {
    const preset = this.state.presets.find((p) => p.name === presetName);
    if (!preset) return;

    this.state.selectedPreset = preset;
    console.log("[DEBUG] Preset selected:", presetName);

    // Load defaults and models from the preset
    this._loadPresetDetails(preset);

    this._updatePresetsUI();
    this._updateEditor();
  }

  /**
   * Load preset defaults and models from server
   */
  async _loadPresetDetails(preset) {
    try {
      // Get defaults
      const defaultsResponse = await socketClient.request("presets:get-defaults", {
        filename: preset.name,
      });
      if (defaultsResponse.success) {
        this.state.globalDefaults = defaultsResponse.data?.defaults || {};
      }

      // Get models
      const modelsResponse = await socketClient.request("presets:get-models", {
        filename: preset.name,
      });
      if (modelsResponse.success) {
        this.state.standaloneModels = Object.entries(modelsResponse.data?.models || {}).map(
          ([name, config]) => ({ name, ...config })
        );
      }
    } catch (error) {
      console.error("[DEBUG] Error loading preset details:", error.message);
    }
  }

  /**
   * Update the editor container
   */
  _updateEditor() {
    let editor = this._domCache.get("editor");
    if (!editor) {
      const el = document.getElementById("presets-editor");
      if (el) {
        this._domCache.set("editor", el);
        el.innerHTML = "<div style='padding:20px;text-align:center'>Loading editor...</div>";
        requestAnimationFrame(() => this._renderEditor());
      }
      return;
    }
    editor.innerHTML = "<div style='padding:20px;text-align:center'>Loading editor...</div>";
    requestAnimationFrame(() => this._renderEditor());
  }

  /**
   * Render the editor content
   */
  _renderEditor() {
    const editor = this._domCache.get("editor");
    if (!editor) return;
    if (!this.state.selectedPreset) return;

    const defaults = this.state.globalDefaults || {};
    const addedParamKeys = Object.keys(defaults)
      .map((k) => LLAMA_PARAMS.find((p) => p.iniKey === k)?.key)
      .filter(Boolean);
    const paramOptions = LLAMA_PARAMS.filter((p) => !addedParamKeys.includes(p.key))
      .map((p) => `<option value="${p.key}">${p.label} (${p.group})</option>`)
      .join("");

    const hasModels = this.state.standaloneModels && this.state.standaloneModels.length > 0;
    const modelsListHtml = hasModels ? this._renderStandaloneHtml() : "<p>No models added</p>";

    editor.innerHTML = `
      <div class="editor-header">
        <h2>${this.state.selectedPreset.name}</h2>
        <span class="preset-type-badge">${this.state.selectedPreset.name === "default" ? "Built-in" : "Custom"}</span>
      </div>
      <div class="section defaults-section">
        <div class="section-header" id="header-defaults">
          <span class="section-icon">★</span><span class="section-title">Global Defaults</span>
          <span class="section-toggle">${this.state.expandedDefaults ? "▼" : "▶"}</span>
        </div>
        ${this.state.expandedDefaults ? `
          <div class="section-content" id="content-defaults">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input type="text" class="search-input" placeholder="Filter..." id="param-filter">
            </div>
            ${Object.keys(defaults).length > 0 ? `
              <div class="added-params-section">
                <strong>Added Parameters:</strong>
                <div class="added-params-list">
                  ${Object.entries(defaults)
                    .map(([key, value]) => {
                      const param = LLAMA_PARAMS.find((p) => p.iniKey === key);
                      const escaped = String(value)
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/"/g, "&quot;");
                      return `<div class="param-item-display" data-param-key="${key}">
                        <div class="param-name"><strong>${param?.label || key}</strong></div>
                        <div class="param-controls">
                          <input type="text" class="param-value-input" value="${escaped}" data-param-key="${key}" placeholder="Value">
                          <button class="btn-param-delete" data-param-key="${key}" title="Delete">×</button>
                        </div>
                      </div>`;
                    })
                    .join("")}
                </div>
              </div>
            ` : "<p class='defaults-hint'>Default preset starts empty</p>"}
            <label class="add-param-label">Add Parameter</label>
            <select class="param-add-select" id="select-add-param" data-section="defaults" data-name="*">
              <option value="">-- Select --</option>
              ${paramOptions}
            </select>
          </div>
        ` : ""}
      </div>
      <div class="section standalone-section">
        <div class="section-header" id="header-models">
          <span class="section-icon">📄</span><span class="section-title">Models</span>
          <span class="section-toggle" id="toggle-models">${hasModels ? "▼" : "▶"}</span>
        </div>
        <div class="add-model-controls" style="display:${hasModels ? "" : "none"};">
          <select class="model-select" id="select-add-model">
            <option value="">-- Select model --</option>
            ${(this.state.availableModels || [])
              .map((m) => `<option value="${this._escapeHtml(m.name)}">${this._escapeHtml(m.name)}</option>`)
              .join("")}
          </select>
          <button class="btn btn-secondary" id="btn-add-standalone">+ Add</button>
        </div>
        <div class="standalone-list" id="standalone-list" style="display:${hasModels ? "" : "none"};">
          ${modelsListHtml}
        </div>
      </div>
    `;

    this._bindEditorEvents();
    this._bindParamInputs();
  }

  /**
   * Render standalone models HTML
   */
  _renderStandaloneHtml() {
    const hasModels = this.state.standaloneModels && this.state.standaloneModels.length > 0;
    if (!hasModels) return "<p>No models added</p>";

    return this.state.standaloneModels.map((model) => {
      const modelName = model.name;
      const modelParams = { ...model };
      delete modelParams.name;
      delete modelParams.fullName;

      return `
        <div class="standalone-item" data-model-name="${this._escapeHtml(modelName)}">
          <div class="standalone-header">
            <span class="standalone-name">${this._escapeHtml(modelName)}</span>
            <button class="btn btn-danger btn-sm btn-delete-model" data-model-name="${this._escapeHtml(
              modelName
            )}">Delete</button>
          </div>
          <div class="standalone-params">
            ${Object.entries(modelParams)
              .map(([key, value]) => {
                const param = LLAMA_PARAMS.find((p) => p.iniKey === key);
                const escaped = String(value)
                  .replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
                  .replace(/"/g, "&quot;");
                return `
                  <div class="param-item-display" data-model="${this._escapeHtml(modelName)}" data-param-key="${key}">
                    <div class="param-name"><strong>${param?.label || key}</strong></div>
                    <div class="param-controls">
                      <input type="text" class="param-value-input" value="${escaped}" data-model="${this._escapeHtml(
                        modelName
                      )}" data-param-key="${key}" placeholder="Value">
                      <button class="btn-param-delete" data-model="${this._escapeHtml(
                        modelName
                      )}" data-param-key="${key}" title="Delete">×</button>
                    </div>
                  </div>
                `;
              })
              .join("")}
            <div class="add-model-param-controls">
              <select class="param-add-select model-param-select" data-model="${this._escapeHtml(modelName)}">
                <option value="">-- Add param --</option>
                ${LLAMA_PARAMS.filter((p) => !modelParams[p.iniKey])
                  .map((p) => `<option value="${p.key}">${p.label}</option>`)
                  .join("")}
              </select>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  /**
   * Bind editor events
   */
  _bindEditorEvents() {
    // Section toggles
    const headerDefaults = document.getElementById("header-defaults");
    if (headerDefaults) {
      headerDefaults.onclick = () => {
        this.state.expandedDefaults = !this.state.expandedDefaults;
        headerDefaults.querySelector(".section-toggle").textContent = this.state.expandedDefaults ? "▼" : "▶";
        const content = document.getElementById("content-defaults");
        if (content) content.style.display = this.state.expandedDefaults ? "" : "none";
      };
    }

    // Add model button
    const btnAddStandalone = document.getElementById("btn-add-standalone");
    if (btnAddStandalone) {
      btnAddStandalone.onclick = () => {
        const select = document.getElementById("select-add-model");
        const modelName = select?.value;
        if (modelName) {
          this._handleAddModel(modelName);
        }
      };
    }

    // Add param select
    const selectAddParam = document.getElementById("select-add-param");
    if (selectAddParam) {
      selectAddParam.onchange = () => {
        const paramKey = selectAddParam.value;
        if (paramKey) {
          this._handleAddParam({ paramKey, section: "defaults", name: "*" });
          selectAddParam.value = "";
        }
      };
    }

    // Model param selects
    document.querySelectorAll(".model-param-select").forEach((select) => {
      select.onchange = () => {
        const paramKey = select.value;
        const modelName = select.dataset.model;
        if (paramKey && modelName) {
          this._handleAddModelParam({ paramKey, modelName });
          select.value = "";
        }
      };
    });
  }

  /**
   * Bind parameter input events
   */
  _bindParamInputs() {
    const inputs = this._el?.querySelectorAll(".param-value-input") || [];
    inputs.forEach((input) => {
      input.onchange = (e) => {
        const modelName = e.target.dataset.model;
        if (modelName) this._handleModelParamChange(e.target);
        else this._handleParamChange(e.target);
      };
      input.onblur = (e) => {
        const modelName = e.target.dataset.model;
        if (modelName) this._handleModelParamChange(e.target);
        else this._handleParamChange(e.target);
      };
    });

    this._el?.querySelectorAll(".btn-param-delete").forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        const paramKey = btn.dataset.paramKey;
        const modelName = btn.dataset.model;
        if (modelName) this._handleDeleteModelParam(paramKey, modelName);
        else this._handleDeleteParam(paramKey);
      };
    });

    this._el?.querySelectorAll(".btn-delete-model").forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        const modelName = btn.dataset.modelName;
        this._handleDeleteModel(modelName);
      };
    });
  }

  /**
   * Handle parameter change
   */
  async _handleParamChange(input) {
    const paramKey = input.dataset.paramKey;
    const newValue = input.value;
    if (!paramKey || !this.state.selectedPreset) return;

    try {
      const param = LLAMA_PARAMS.find((p) => p.iniKey === paramKey);
      if (!param) return;
      const value = param.type === "number" ? parseFloat(newValue) : newValue;
      if (param.type === "number" && isNaN(value)) throw new Error("Invalid number");

      this.state.globalDefaults[paramKey] = value;

      // Save to server
      const response = await socketClient.request("presets:update-defaults", {
        filename: this.state.selectedPreset.name,
        config: this.state.globalDefaults,
      });

      if (response.success) {
        showNotification("Parameter updated", "success");
      } else {
        showNotification("Error: " + response.error, "error");
      }
    } catch (error) {
      showNotification(`Error: ${error.message}`, "error");
    }
  }

  /**
   * Delete a parameter
   */
  async _handleDeleteParam(paramKey) {
    if (!paramKey || !this.state.selectedPreset) return;
    try {
      const newDefaults = { ...this.state.globalDefaults };
      newDefaults[paramKey] = null;

      const response = await socketClient.request("presets:update-defaults", {
        filename: this.state.selectedPreset.name,
        config: newDefaults,
      });

      if (response.success) {
        delete this.state.globalDefaults[paramKey];
        showNotification("Parameter deleted", "success");
        this._updateEditor();
      } else {
        showNotification("Error: " + response.error, "error");
      }
    } catch (error) {
      showNotification(`Error: ${error.message}`, "error");
    }
  }

  /**
   * Handle model parameter change
   */
  async _handleModelParamChange(input) {
    const paramKey = input.dataset.paramKey;
    const modelName = input.dataset.model;
    const newValue = input.value;
    if (!paramKey || !modelName || !this.state.selectedPreset) return;

    try {
      const param = LLAMA_PARAMS.find((p) => p.iniKey === paramKey);
      if (!param) return;
      const value = param.type === "number" ? parseFloat(newValue) : newValue;
      if (param.type === "number" && isNaN(value)) throw new Error("Invalid number");

      const modelIdx = this.state.standaloneModels.findIndex((m) => m.name === modelName);
      if (modelIdx < 0) return;

      this.state.standaloneModels[modelIdx][paramKey] = value;

      const response = await socketClient.request("presets:update-model", {
        filename: this.state.selectedPreset.name,
        modelName: modelName,
        config: { [paramKey]: value },
      });

      if (response.success) {
        showNotification("Parameter updated", "success");
      } else {
        showNotification("Error: " + response.error, "error");
      }
    } catch (error) {
      showNotification(`Error: ${error.message}`, "error");
    }
  }

  /**
   * Delete a model parameter
   */
  async _handleDeleteModelParam(paramKey, modelName) {
    if (!paramKey || !modelName || !this.state.selectedPreset) return;
    try {
      const response = await socketClient.request("presets:update-model", {
        filename: this.state.selectedPreset.name,
        modelName: modelName,
        config: { [paramKey]: null },
      });

      if (response.success) {
        const modelIdx = this.state.standaloneModels.findIndex((m) => m.name === modelName);
        if (modelIdx >= 0) {
          delete this.state.standaloneModels[modelIdx][paramKey];
        }
        showNotification("Parameter deleted", "success");
        this._updateEditor();
      } else {
        showNotification("Error: " + response.error, "error");
      }
    } catch (error) {
      showNotification(`Error: ${error.message}`, "error");
    }
  }

  /**
   * Add a model parameter
   */
  async _handleAddModelParam(data) {
    const { paramKey, modelName } = data;
    const param = LLAMA_PARAMS.find((p) => p.key === paramKey);
    if (!param || !modelName || !this.state.selectedPreset) return;

    try {
      const response = await socketClient.request("presets:update-model", {
        filename: this.state.selectedPreset.name,
        modelName: modelName,
        config: { [param.iniKey]: param.default },
      });

      if (response.success) {
        const modelIdx = this.state.standaloneModels.findIndex((m) => m.name === modelName);
        if (modelIdx >= 0) {
          this.state.standaloneModels[modelIdx][param.iniKey] = param.default;
        }
        showNotification(`Parameter "${param.label}" added`, "success");
        this._updateEditor();
      } else {
        showNotification("Error: " + response.error, "error");
      }
    } catch (error) {
      showNotification(`Error: ${error.message}`, "error");
    }
  }

  /**
   * Add a model to preset
   */
  async _handleAddModel(modelName) {
    if (!modelName || !this.state.selectedPreset) return;

    try {
      const response = await socketClient.request("presets:add-model", {
        filename: this.state.selectedPreset.name,
        modelName: modelName,
        config: {},
      });

      if (response.success) {
        this.state.standaloneModels.push({ name: modelName });
        showNotification(`Model "${modelName}" added`, "success");
        this._updateEditor();
      } else {
        showNotification("Error: " + response.error, "error");
      }
    } catch (error) {
      showNotification(`Error: ${error.message}`, "error");
    }
  }

  /**
   * Delete a model from preset
   */
  async _handleDeleteModel(modelName) {
    if (!modelName || !this.state.selectedPreset) return;
    if (!confirm(`Delete model "${modelName}"?`)) return;

    try {
      const response = await socketClient.request("presets:remove-model", {
        filename: this.state.selectedPreset.name,
        modelName: modelName,
      });

      if (response.success) {
        this.state.standaloneModels = this.state.standaloneModels.filter((m) => m.name !== modelName);
        showNotification(`Model "${modelName}" deleted`, "success");
        this._updateEditor();
      } else {
        showNotification("Error: " + response.error, "error");
      }
    } catch (error) {
      showNotification(`Error: ${error.message}`, "error");
    }
  }

  /**
   * Add a parameter to defaults
   */
  async _handleAddParam(data) {
    const { paramKey } = data;
    const param = LLAMA_PARAMS.find((p) => p.key === paramKey);
    if (!param || !this.state.selectedPreset) return;

    try {
      this.state.globalDefaults[param.iniKey] = param.default;

      const response = await socketClient.request("presets:update-defaults", {
        filename: this.state.selectedPreset.name,
        config: this.state.globalDefaults,
      });

      if (response.success) {
        showNotification(`Parameter "${param.label}" added`, "success");
        this._updateEditor();
      } else {
        showNotification("Error: " + response.error, "error");
      }
    } catch (error) {
      showNotification(`Error: ${error.message}`, "error");
    }
  }

  /**
   * Escape HTML special characters
   */
  _escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  render() {
    return Component.h("div", { className: "presets-page" }, [
      Component.h("div", { className: "presets-page-header" }, Component.h("h1", {}, "Model Presets")),
      Component.h(window.PresetTemplates, { onApplyTemplate: this._handleApplyTemplate.bind(this) }),
      Component.h("div", { className: "presets-list" }, [
        Component.h("div", { className: "presets-toolbar" }, [
          Component.h("span", { className: "presets-label" }, "Presets:"),
          Component.h("div", { className: "presets-items", id: "presets-items" }),
          Component.h("button", { className: "btn btn-secondary add-preset-btn", id: "btn-new-preset" }, "+ New Preset")
        ])
      ]),
      Component.h("div", { className: "presets-main" }, [
        Component.h("div", { className: "router-card-container", id: "router-card" }),
        Component.h("div", { className: "presets-editor", id: "presets-editor" }, Component.h("div", { className: "empty-state" }, "Select a preset to edit"))
      ])
    ]);
  }

  bindEvents() {
    // New preset button
    this.on("click", "#btn-new-preset", () => {
      const name = prompt("Preset name:");
      if (name) {
        const controller = this._el?._component?._controller;
        if (controller) {
          controller.handleCreatePreset(name);
        }
      }
    });
  }

  _handleApplyTemplate(templateConfig) {
    if (!this.state.selectedPreset || this.state.selectedPreset.name === "default") {
      showNotification("Select or create a custom preset first", "warning");
      return;
    }
    console.log("[DEBUG] Applying template");
    showNotification("Template applied", "success");
  }

  destroy() {
    if (this.unsubscribers) {
      this.unsubscribers.forEach((unsub) => unsub());
      this.unsubscribers = [];
    }
    super.destroy();
  }
}

window.PresetsPage = PresetsPage;
