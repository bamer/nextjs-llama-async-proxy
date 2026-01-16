/**
 * Presets Router Card - Router status and control component
 * Extends PresetsPage with router card methods
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
     * Update the router card DOM elements with current state.
     * @returns {void}
     */
    PresetsPage.prototype._updateRouterCard = function () {
      const routerContainer = this._domCache.get("router-card-container");
      if (!routerContainer) return;

      const routerCardEl = routerContainer.querySelector(".router-card");
      if (!routerCardEl) return;

      const isRunning = this.state.serverRunning;
      const displayPort = this.state.serverPort || this.state.configPort || 8080;

      const statusBadge = routerCardEl.querySelector(".status-badge");
      if (statusBadge) {
        statusBadge.textContent = isRunning ? "RUNNING" : "STOPPED";
        statusBadge.className = `status-badge ${isRunning ? "running" : "idle"}`;
      }

      const routerInfo = routerCardEl.querySelector(".router-info");
      if (routerInfo) {
        routerInfo.style.display = isRunning ? "flex" : "none";
      }

      const controls = routerCardEl.querySelector(".router-controls");
      if (controls) {
        const hasPresets = this.state.presets && this.state.presets.length > 0;
        const routerModels = this.state.routerStatus?.models || [];
        const loadedCount = routerModels.filter((x) => x.state === "loaded").length;

        // Helper to generate preset options
        const getPresetOptions = () => {
          return this.state.presets.map((preset) => {
            const presetName = preset?.name;
            const isSelected = this.state.selectedPreset?.name === presetName;
            return `<option value="${presetName}" ${isSelected ? "selected" : ""}>${presetName}</option>`;
          }).join("");
        };

        controls.innerHTML = `
        ${hasPresets ? `
          <div class="preset-selector">
            <select class="preset-dropdown" id="router-preset-select">
              <option value="">📋 Select Preset...</option>
              ${getPresetOptions()}
            </select>
          </div>
        ` : ""}
          ${isRunning ? `
            <button class="btn btn-danger" data-action="router-stop">⏹ Stop Router</button>
            <button class="btn btn-secondary" data-action="router-restart">🔄 Restart</button>
          ` : `
            <button class="btn btn-primary" data-action="router-start">${this.state.selectedPreset ? "▶ Start with Preset" : "▶ Start Router"}</button>
          `}
        `;
      }

      this._bindRouterCardEvents();
      console.log("[PRESETS] RouterCard updated:", isRunning ? "RUNNING" : "STOPPED");
    };

    /**
     * Update the router card HTML content with current state.
     * @returns {void}
     */
    PresetsPage.prototype._updateRouterCardHTML = function () {
      const routerContainer = document.getElementById("router-card");
      if (!routerContainer) return;

      routerContainer.innerHTML = this._renderRouterCard();
      this._bindRouterCardEvents();
      console.log("[PRESETS] RouterCard HTML updated:", this.state.serverRunning ? "RUNNING" : "STOPPED");
    };

    /**
     * Render the router card HTML with current state.
     * @returns {string} HTML string for the router card
     */
    PresetsPage.prototype._renderRouterCard = function () {
      const isRunning = this.state.serverRunning;
      const displayPort = this.state.serverPort || this.state.configPort || 8080;
      const routerModels = this.state.routerStatus?.models || [];
      const loadedCount = routerModels.filter((x) => x.state === "loaded").length;
      const hasPresets = this.state.presets && this.state.presets.length > 0;

      // Helper to generate preset options
      const getPresetOptions = () => {
        return this.state.presets.map((preset) => {
          const presetName = preset?.name;
          const isSelected = this.state.selectedPreset?.name === presetName;
          return `<option value="${presetName}" ${isSelected ? "selected" : ""}>${presetName}</option>`;
        }).join("");
      };

      return `
      <div class="router-card">
        <div class="router-header">
          <h3>Llama Router</h3>
          <span class="status-badge ${isRunning ? "running" : "idle"}">${isRunning ? "RUNNING" : "STOPPED"}</span>
        </div>
        <div class="router-info">
          <span class="router-port">Port: ${displayPort}</span>
          <span class="models-info">Models: ${loadedCount}/${this.state.models.length} loaded</span>
        </div>
        <div class="router-controls">
          ${hasPresets ? `
            <div class="preset-selector">
              <select class="preset-dropdown" id="router-preset-select">
                <option value="">📋 Select Preset...</option>
                ${getPresetOptions()}
              </select>
            </div>
          ` : ""}
          ${isRunning ? `
            <button class="btn btn-danger" data-action="router-stop">⏹ Stop Router</button>
            <button class="btn btn-secondary" data-action="router-restart">🔄 Restart</button>
          ` : `
            <button class="btn btn-primary" data-action="router-start">${this.state.selectedPreset ? "▶ Start with Preset" : "▶ Start Router"}</button>
          `}
        </div>
      </div>
      `;
    };

    /**
     * Bind event listeners for router card interactions.
     * @returns {void}
     */
    PresetsPage.prototype._bindRouterCardEvents = function () {
      const routerCard = document.getElementById("router-card");
      if (!routerCard) return;

      // Handle preset selection
      const presetSelect = routerCard.querySelector("#router-preset-select");
      if (presetSelect) {
        presetSelect.addEventListener("change", (e) => {
          const presetName = e.target.value;
          if (presetName) {
            const preset = this.state.presets.find((p) => p.name === presetName);
            if (preset) {
              this.state.selectedPreset = preset;
              this._updateRouterCardHTML();
              showNotification(`Selected preset: ${presetName}`, "info");
            }
          } else {
            this.state.selectedPreset = null;
            this._updateRouterCardHTML();
          }
        });
      }

      // Handle router control buttons
      const startBtn = routerCard.querySelector("[data-action=\"router-start\"]");
      const stopBtn = routerCard.querySelector("[data-action=\"router-stop\"]");
      const restartBtn = routerCard.querySelector("[data-action=\"router-restart\"]");

      if (startBtn) {
        startBtn.addEventListener("click", () => {
          if (this.state.selectedPreset) {
            this._handleLaunchServerWithPreset();
          } else {
            this._handleLaunchServer();
          }
        });
      }

      if (stopBtn) {
        stopBtn.addEventListener("click", () => this._handleStopServer());
      }

      if (restartBtn) {
        restartBtn.addEventListener("click", () => {
          this._handleStopServer().then(() => {
            setTimeout(() => {
              if (this.state.selectedPreset) {
                this._handleLaunchServerWithPreset();
              } else {
                this._handleLaunchServer();
              }
            }, 2000);
          });
        });
      }
    };

    /**
     * Launch the server with a specific preset.
     * @param {string} presetName - Name of the preset to use.
     * @returns {Promise<void>} Promise that resolves when server is launched
     */
    PresetsPage.prototype._handleLaunchServerWithPreset = function () {
      const presetName = this.state.selectedPreset?.name;
      if (!presetName) {
        showNotification("No preset selected", "error");
        return Promise.reject(new Error("No preset selected"));
      }

      showNotification(`Starting server with preset: ${presetName}`, "info");

      return stateManager.startLlamaWithPreset(presetName)
        .then(() => {
          showNotification(`Server started with preset: ${presetName}`, "success");
        })
        .catch((e) => {
          showNotification(`Failed to start server: ${e.message}`, "error");
          throw e;
        });
    };

    /**
     * Launch the server with default settings or selected preset.
     * @returns {Promise<void>} Promise that resolves when server is launched
     */
    PresetsPage.prototype._handleLaunchServer = function () {
      showNotification("Starting server...", "info");
      stateManager.startLlama().then(() => {
        showNotification("Server started", "success");
      }).catch((e) => {
        showNotification(`Failed: ${e.message}`, "error");
      });
    };

    /**
     * Stop the server and update state accordingly.
     * @returns {Promise<void>} Promise that resolves when server is stopped
     */
    PresetsPage.prototype._handleStopServer = function () {
      showNotification("Stopping server...", "info");
      return stateManager.stopLlama().then(() => {
        showNotification("Server stopped", "success");
      }).catch((e) => {
        showNotification(`Failed: ${e.message}`, "error");
      });
    };

    console.log("[PRESETS] PresetsPage extended with router card methods");
  }

  // Start extending when PresetsPage is available
  extendPresetsPage();
})();
