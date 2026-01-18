/**
 * Presets Editor Continued - Model and event bindings
 * Part of the modular Presets page refactoring
 */

(function() {
  /**
   * Extend PresetsPage prototype when available
   */
  function extendPresetsPage() {
    const PresetsPage = window.PresetsPage;
    if (!PresetsPage) {
      // PresetsPage not yet available, retry after a short delay
      setTimeout(extendPresetsPage, 10);
      return;
    }

    /**
     * Render HTML for standalone models section.
     * @returns {string} HTML string for standalone models
     */
    PresetsPage.prototype._renderStandaloneHtml = function () {
      return this.state.standaloneModels.map((model) => {
        const modelParams = Object.entries(model).filter(([k]) => k !== "name" && k !== "fullName");
        const isExpanded = this.state.expandedModels?.[model.name] || false;
        return `<div class="model-section" data-model="${model.name}">
          <div class="model-header" data-model-name="${model.name}">
            <span class="model-icon">📄</span>
            <span class="model-name">${model.name}</span>
            <span class="model-toggle">${isExpanded ? "▼" : "▶"}</span>
            <button class="btn-model-delete" data-model-name="${model.name}" title="Delete model">×</button>
          </div>
          <div class="model-content" style="display:${isExpanded ? "block" : "none"}">
            ${modelParams.length > 0 ? `
              <div class="model-params-section">
                <strong>Parameters:</strong>
                <div class="model-params-list">
                  ${modelParams.map(([key, value]) => {
    const param = LLAMA_PARAMS.find((p) => p.iniKey === key);
    const escaped = String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    return `<div class="param-item-display" data-param-key="${key}" data-model="${model.name}">
                        <div class="param-name"><strong>${param?.label || key}</strong></div>
                        <div class="param-controls">
                          <input type="text" class="param-value-input" value="${escaped}" data-param-key="${key}" data-model="${model.name}" placeholder="Value">
                          <button class="btn-param-delete" data-param-key="${key}" data-model="${model.name}" title="Delete">×</button>
                        </div>
                      </div>`;
  }).join("")}
                </div>
              </div>
            ` : "<p>No parameters</p>"}
            <label class="add-param-label">Add Parameter</label>
            <select class="param-add-select" data-section="model" data-model="${model.name}">
              <option value="">-- Select --</option>
              ${LLAMA_PARAMS.filter((p) => !Object.keys(model).includes(p.iniKey)).map((p) => `<option value="${p.key}">${p.label}</option>`).join("")}
            </select>
          </div>
        </div>`;
      }).join("");
    };

    /**
     * Toggle the models section visibility.
     * @returns {void}
     */
    PresetsPage.prototype._toggleModelsSection = function () {
      const modelsSection = document.querySelector(".standalone-section");
      if (!modelsSection) return;
      const content = modelsSection.querySelector(".add-model-controls");
      const list = modelsSection.querySelector(".standalone-list");
      const toggle = modelsSection.querySelector("#toggle-models");
      const isHidden = content.style.display === "none";
      content.style.display = isHidden ? "" : "none";
      list.style.display = isHidden ? "" : "none";
      toggle.textContent = isHidden ? "▼" : "▶";
    };

    /**
     * Bind event listeners for preset list interactions.
     * @returns {void}
     */
    PresetsPage.prototype._bindPresetEvents = function () {
      const container = this._domCache.get("presets-items");
      if (!container) return;
      container.onclick = (e) => {
        const item = e.target.closest(".preset-item");
        if (item && !e.target.classList.contains("preset-delete")) {
          this._handlePresetSelect(item.dataset.presetName);
        }
      };
      container.querySelectorAll(".preset-delete").forEach((btn) => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const presetId = btn.dataset.presetName;
          if (confirm(`Delete preset "${presetId}"?`)) {
            stateManager.emit("action:presets:delete", { presetId });
          }
        };
      });
    };

    /**
     * Bind event listeners for editor interactions.
     * @returns {void}
     */
    PresetsPage.prototype._bindEditorEvents = function () {
      const defaultsHeader = document.getElementById("header-defaults");
      defaultsHeader && (defaultsHeader.onclick = () => this._toggleDefaultsSection());

      const modelsHeader = document.getElementById("header-models");
      if (modelsHeader) {
        modelsHeader.onclick = (e) => {
          if (e.target.closest(".model-header") || e.target.closest(".model-content") || e.target.id === "toggle-models") return;
          this._toggleModelsSection();
        };
      }

      const modelsToggle = document.getElementById("toggle-models");
      modelsToggle && (modelsToggle.onclick = (e) => { e.stopPropagation(); this._toggleModelsSection(); });

      const addParamSelect = document.getElementById("select-add-param");
      if (addParamSelect) {
        addParamSelect.onchange = (e) => {
          if (e.target.value) {
            this._handleAddParam({ paramKey: e.target.value, section: e.target.dataset.section, name: e.target.dataset.name });
            e.target.value = "";
          }
        };
      }

      const addStandaloneBtn = document.getElementById("btn-add-standalone");
      addStandaloneBtn && (addStandaloneBtn.onclick = () => this._handleAddStandalone());

      const filterInput = document.getElementById("param-filter");
      filterInput && (filterInput.oninput = (e) => this.debouncedFilter(e.target.value));

      const modelsContainer = this._el?.querySelector("#standalone-list");
      if (modelsContainer) {
        if (this._modelHeaderClickHandler) modelsContainer.removeEventListener("click", this._modelHeaderClickHandler);
        this._modelHeaderClickHandler = (e) => {
          const header = e.target.closest(".model-header");
          if (!header) return;
          e.stopPropagation();
          if (e.target.classList.contains("btn-model-delete")) return;
          const modelName = header.dataset.modelName;
          this.state.expandedModels[modelName] = !this.state.expandedModels[modelName];
          const isExpanded = this.state.expandedModels[modelName];
          const modelSection = header.closest(".model-section");
          const toggle = header.querySelector(".model-toggle");
          const content = modelSection.querySelector(".model-content");
          if (toggle) toggle.textContent = isExpanded ? "▼" : "▶";
          if (content) content.style.display = isExpanded ? "block" : "none";
        };
        modelsContainer.addEventListener("click", this._modelHeaderClickHandler);
      }

      this._el?.querySelectorAll(".btn-model-delete").forEach((btn) => {
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          this._handleDeleteModel(btn.dataset.modelName);
        };
      });

      this._el?.querySelectorAll(".param-add-select[data-section='model']").forEach((select) => {
        select.onchange = (e) => {
          if (e.target.value) {
            this._handleAddModelParam({ paramKey: e.target.value, modelName: e.target.dataset.model });
            e.target.value = "";
          }
        };
      });
    };

    /**
     * Delete a preset from the configuration.
     * @param {string} name - The preset name to delete.
     * @returns {Promise<void>}
     */
    PresetsPage.prototype._handleDeletePreset = async function (name) {
      if (!confirm(`Delete preset "${name}"?`)) return;
      try {
        await this._getService().deletePreset(name);
        showNotification(`Preset "${name}" deleted`, "success");
        this.state.presets = this.state.presets.filter((p) => p.name !== name);
        this._updatePresetsList();
        if (this.state.selectedPreset?.name === name) {
          this.state.selectedPreset = this.state.presets[0] || null;
          if (this.state.selectedPreset) this._handlePresetSelect(this.state.selectedPreset.name);
          else {
            const editor = this._domCache.get("editor");
            if (editor) editor.innerHTML = "<div class='empty-state'>Select a preset</div>";
          }
        }
      } catch (error) {
        showNotification(`Error: ${error.message}`, "error");
      }
    };

    /**
     * Add a standalone model to the preset.
     * @returns {Promise<void>}
     */
    PresetsPage.prototype._handleAddStandalone = async function () {
      const select = document.getElementById("select-add-model");
      const modelName = select?.value?.trim();
      if (!modelName) return showNotification("Select a model", "warning");
      try {
        await this._getService().addModel(this.state.selectedPreset.name, modelName, {});
        showNotification(`Model "${modelName}" added`, "success");
        select.value = "";
        stateManager.emit("action:presets:loadData", { presetId: this.state.selectedPreset.name });
      } catch (error) {
        showNotification(`Error: ${error.message}`, "error");
      }
    };

    console.log("[PRESETS] PresetsPage extended with continued editor methods");
  }

  // Start extending when PresetsPage is available
  extendPresetsPage();
})();
