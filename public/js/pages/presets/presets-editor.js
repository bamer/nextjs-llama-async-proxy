/**
 * Presets Editor - Editor component for editing preset parameters
 * Modified to use Socket.IO calls instead of service layer
 */

(function () {
  /**
   * Extend PresetsPage prototype when available
   */
  function extendPresetsPage() {
    const PresetsPage = window.PresetsPage;
    if (!PresetsPage) {
      setTimeout(extendPresetsPage, 10);
      return;
    }

    /**
     * Update the presets list UI with current presets.
     */
    PresetsPage.prototype._updatePresetsList = function () {
      let container = this._domCache.get("presets-items");
      if (!container) {
        container = document.getElementById("presets-items");
        if (container) this._domCache.set("presets-items", container);
      }
      if (!container) return;

      const html = this.state.presets
        .map((preset) => {
          const presetName = preset?.name;
          const isActive = this.state.selectedPreset?.name === presetName;
          return `<div class="preset-item ${isActive ? "active" : ""}" data-preset-name="${presetName}">` +
            `<span class="preset-name">${presetName}</span>` +
            (presetName !== "default" ? `<span class="preset-delete" data-preset-name="${presetName}">×</span>` : "") +
            `</div>`;
        })
        .join("");

      container.innerHTML = html;
      this._bindPresetEvents();
    };

    /**
     * Update the editor container with fresh content.
     */
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

    /**
     * Render the editor content for the selected preset.
     */
    PresetsPage.prototype._renderEditor = function () {
      const editor = this._domCache.get("editor");
      if (!editor) return;

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
    };

    /**
     * Render standalone models HTML
     */
    PresetsPage.prototype._renderStandaloneHtml = function () {
      const hasModels = this.state.standaloneModels && this.state.standaloneModels.length > 0;
      if (!hasModels) return "<p>No models added</p>";

      return this.state.standaloneModels
        .map((model) => {
          const modelName = model.name;
          const modelParams = { ...model };
          delete modelParams.name;
          delete modelParams.fullName;

          return `
            <div class="standalone-item" data-model-name="${this._escapeHtml(modelName)}">
              <div class="standalone-header">
                <span class="standalone-name">${this._escapeHtml(modelName)}</span>
                <button class="btn btn-danger btn-sm btn-delete-model" data-model-name="${this._escapeHtml(modelName)}">Delete</button>
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
        })
        .join("");
    };

    /**
     * Bind event listeners for parameter input fields.
     */
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

      this._el?.querySelectorAll(".btn-delete-model").forEach((btn) => {
        btn.onclick = (e) => {
          e.preventDefault();
          const modelName = btn.dataset.modelName;
          this._handleDeleteModel(modelName);
        };
      });
    };

    /**
     * Handle changes to preset parameters (using socket calls).
     */
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

        // Use socket call instead of service
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
    };

    /**
     * Delete a parameter from the preset (using socket calls).
     */
    PresetsPage.prototype._handleDeleteParam = async function (paramKey) {
      if (!paramKey || !this.state.selectedPreset) return;
      try {
        const newDefaults = { ...this.state.globalDefaults };
        newDefaults[paramKey] = null;

        // Use socket call instead of service
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
    };

    /**
     * Handle changes to model-specific parameters (using socket calls).
     */
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

        // Use socket call instead of service
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
    };

    /**
     * Delete a model-specific parameter (using socket calls).
     */
    PresetsPage.prototype._handleDeleteModelParam = async function (paramKey, modelName) {
      if (!paramKey || !modelName || !this.state.selectedPreset) return;
      try {
        // Use socket call instead of service
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
    };

    /**
     * Add a new parameter to a model (using socket calls).
     */
    PresetsPage.prototype._handleAddModelParam = async function (data) {
      const { paramKey, modelName } = data;
      const param = LLAMA_PARAMS.find((p) => p.key === paramKey);
      if (!param || !modelName || !this.state.selectedPreset) return;
      try {
        // Use socket call instead of service
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
    };

    /**
     * Add a new parameter to defaults (using socket calls).
     */
    PresetsPage.prototype._handleAddParam = async function (data) {
      const { paramKey } = data;
      const param = LLAMA_PARAMS.find((p) => p.key === paramKey);
      if (!param || !this.state.selectedPreset) return;
      try {
        this.state.globalDefaults[param.iniKey] = param.default;

        // Use socket call
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
    };

    /**
     * Add a model to preset (using socket calls).
     */
    PresetsPage.prototype._handleAddModel = async function (modelName) {
      if (!modelName || !this.state.selectedPreset) return;
      try {
        // Use socket call
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
    };

    /**
     * Delete a model from the preset (using socket calls).
     */
    PresetsPage.prototype._handleDeleteModel = async function (modelName) {
      if (!modelName || !this.state.selectedPreset) return;
      if (!confirm(`Delete model "${modelName}"?`)) return;
      try {
        // Use socket call instead of service
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
    };

    /**
     * Bind editor events.
     */
    PresetsPage.prototype._bindEditorEvents = function () {
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
    };

    /**
     * Escape HTML special characters in a string.
     */
    PresetsPage.prototype._escapeHtml = function (text) {
      if (!text) return "";
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    };

    console.log("[PRESETS] PresetsPage extended with editor methods (socket-first)");
  }

  // Start extending when PresetsPage is available
  extendPresetsPage();
})();
