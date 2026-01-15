/**
 * Presets Editor - Editor component for editing preset parameters
 * Part of the modular Presets page refactoring
 */

PresetsPage.prototype._updatePresetsList = function () {
  let container = this._domCache.get("presets-items");
  if (!container) {
    container = document.getElementById("presets-items");
    if (container) this._domCache.set("presets-items", container);
  }
  if (!container) return;

  const html = this.state.presets.map((preset) => {
    const presetName = preset?.name;
    const isActive = this.state.selectedPreset?.name === presetName;
    return `<div class="preset-item ${isActive ? "active" : ""}" data-preset-name="${presetName}">` +
      `<span class="preset-name">${presetName}</span>${
        presetName !== "default" ? `<span class="preset-delete" data-preset-name="${presetName}">×</span>` : ""  }</div>`;
  }).join("");

  container.innerHTML = html;
  this._bindPresetEvents();
};

PresetsPage.prototype._updateEditor = function () {
  const editor = this._domCache.get("editor");
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
};

PresetsPage.prototype._renderEditor = function () {
  const editor = this._domCache.get("editor");
  if (!editor) return;

  const defaults = this.state.globalDefaults || {};
  const addedParamKeys = Object.keys(defaults).map((k) => LLAMA_PARAMS.find((p) => p.iniKey === k)?.key).filter(Boolean);
  const paramOptions = LLAMA_PARAMS.filter((p) => !addedParamKeys.includes(p.key))
    .map((p) => `<option value="${p.key}">${p.label} (${p.group})</option>`).join("");

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
                ${Object.entries(defaults).map(([key, value]) => {
    const param = LLAMA_PARAMS.find((p) => p.iniKey === key);
    const escaped = String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    return `<div class="param-item-display" data-param-key="${key}">
                    <div class="param-name"><strong>${param?.label || key}</strong></div>
                    <div class="param-controls">
                      <input type="text" class="param-value-input" value="${escaped}" data-param-key="${key}" placeholder="Value">
                      <button class="btn-param-delete" data-param-key="${key}" title="Delete">×</button>
                    </div>
                  </div>`;
  }).join("")}
              </div>
            </div>
          ` : "<p class='defaults-hint'>Default preset starts empty</p>"}
          <label class="add-param-label">Add Parameter</label>
          <select class="param-add-select" id="select-add-param" data-section="defaults" data-name="*">
            <option value="">-- Select --</option>${paramOptions}
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
          ${(this.state.availableModels || []).map((m) => `<option value="${this._escapeHtml(m.name)}">${this._escapeHtml(m.name)}</option>`).join("")}
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
};

PresetsPage.prototype._bindParamInputs = function () {
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
};

PresetsPage.prototype._handleParamChange = async function (input) {
  const paramKey = input.dataset.paramKey;
  const newValue = input.value;
  if (!paramKey || !this.state.selectedPreset) return;

  try {
    const param = LLAMA_PARAMS.find((p) => p.iniKey === paramKey);
    if (!param) return;
    const value = param.type === "number" ? parseFloat(newValue) : newValue;
    if (param.type === "number" && isNaN(value)) throw new Error("Invalid number");
    this.state.globalDefaults[paramKey] = value;
    await this._getService().updateDefaults(this.state.selectedPreset.name, this.state.globalDefaults);
    showNotification("Parameter updated", "success");
  } catch (error) {
    showNotification(`Error: ${error.message}`, "error");
  }
};

PresetsPage.prototype._handleDeleteParam = async function (paramKey) {
  if (!paramKey || !this.state.selectedPreset) return;
  try {
    const newDefaults = { ...this.state.globalDefaults };
    newDefaults[paramKey] = null;
    await this._getService().updateDefaults(this.state.selectedPreset.name, newDefaults);
    delete this.state.globalDefaults[paramKey];
    showNotification("Parameter deleted", "success");
    this._updateEditor();
  } catch (error) {
    showNotification(`Error: ${error.message}`, "error");
  }
};

PresetsPage.prototype._handleModelParamChange = async function (input) {
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
    const modelConfig = { ...this.state.standaloneModels[modelIdx] };
    delete modelConfig.name;
    delete modelConfig.fullName;
    await this._getService().updateModel(this.state.selectedPreset.name, modelName, modelConfig);
    showNotification("Parameter updated", "success");
  } catch (error) {
    showNotification(`Error: ${error.message}`, "error");
  }
};

PresetsPage.prototype._handleDeleteModelParam = async function (paramKey, modelName) {
  if (!paramKey || !modelName || !this.state.selectedPreset) return;
  try {
    const modelIdx = this.state.standaloneModels.findIndex((m) => m.name === modelName);
    if (modelIdx < 0) return;
    const model = this.state.standaloneModels[modelIdx];
    const newConfig = { ...model };
    delete newConfig.name;
    delete newConfig.fullName;
    newConfig[paramKey] = null;
    await this._getService().updateModel(this.state.selectedPreset.name, modelName, newConfig);
    delete this.state.standaloneModels[modelIdx][paramKey];
    showNotification("Parameter deleted", "success");
    this._updateEditor();
  } catch (error) {
    showNotification(`Error: ${error.message}`, "error");
  }
};

PresetsPage.prototype._handleAddModelParam = async function (data) {
  const { paramKey, modelName } = data;
  const param = LLAMA_PARAMS.find((p) => p.key === paramKey);
  if (!param || !modelName || !this.state.selectedPreset) return;
  try {
    await this._getService().updateModel(this.state.selectedPreset.name, modelName, { [param.iniKey]: param.default });
    showNotification(`Parameter "${param.label}" added`, "success");
    const modelIdx = this.state.standaloneModels.findIndex((m) => m.name === modelName);
    if (modelIdx >= 0) this.state.standaloneModels[modelIdx][param.iniKey] = param.default;
    this._updateEditor();
  } catch (error) {
    showNotification(`Error: ${error.message}`, "error");
  }
};

PresetsPage.prototype._handleDeleteModel = async function (modelName) {
  if (!modelName || !this.state.selectedPreset) return;
  if (!confirm(`Delete model "${modelName}"?`)) return;
  try {
    await this._getService().removeModel(this.state.selectedPreset.name, modelName);
    this.state.standaloneModels = this.state.standaloneModels.filter((m) => m.name !== modelName);
    showNotification(`Model "${modelName}" deleted`, "success");
    this._updateEditor();
  } catch (error) {
    showNotification(`Error: ${error.message}`, "error");
  }
};

PresetsPage.prototype._escapeHtml = function (text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};
