/**
 * Presets Router Card - Router status and control component
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

PresetsPage.prototype._updateRouterCardHTML = function () {
  const routerContainer = document.getElementById("router-card");
  if (!routerContainer) return;

  routerContainer.innerHTML = this._renderRouterCard();
  this._bindRouterCardEvents();
  console.log("[PRESETS] RouterCard HTML updated:", this.state.serverRunning ? "RUNNING" : "STOPPED");
};

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
    <div class="router-section">
      <div class="router-card ${isRunning ? "running" : "idle"}">
        <div class="router-header">
          <div class="router-title">
            <h3>🦙 Llama Router</h3>
            <span class="status-badge ${isRunning ? "running" : "idle"}">${isRunning ? "RUNNING" : "STOPPED"}</span>
          </div>
          ${isRunning ? `
            <div class="router-info">
              <span class="info-item">Port: ${displayPort}</span>
              <span class="info-item models-info">Models: ${loadedCount}/${this.state.availableModels.length} loaded</span>
            </div>
          ` : ""}
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
            <button class="btn btn-secondary" data-action="router-restart" ${!isRunning ? "disabled" : ""}>🔄 Restart</button>
          ` : `
            <button class="btn btn-primary" data-action="router-start">${this.state.selectedPreset ? "▶ Start with Preset" : "▶ Start Router"}</button>
          `}
        </div>
      </div>
    </div>
  `;
};

PresetsPage.prototype._bindRouterCardEvents = function () {
  const routerCard = document.getElementById("router-card");
  if (!routerCard) return;

  const startBtn = routerCard.querySelector("[data-action=\"router-start\"]");
  startBtn && (startBtn.onclick = () => this._handleLaunchServer());

  const stopBtn = routerCard.querySelector("[data-action=\"router-stop\"]");
  stopBtn && (stopBtn.onclick = () => this._handleStopServer());

  const restartBtn = routerCard.querySelector("[data-action=\"router-restart\"]");
  restartBtn && (restartBtn.onclick = () => {
    this._handleStopServer().then(() => {
      setTimeout(() => this._handleLaunchServer(), 2000);
    });
  });

  const presetSelect = routerCard.querySelector("#router-preset-select");
  presetSelect && (presetSelect.onchange = (e) => {
    if (e.target.value) {
      this._emit("preset:select", e.target.value);
    }
  });
};

PresetsPage.prototype._updateServerStatusPanel = function () {
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
    const launchBtn = document.getElementById("btn-launch-server");
    launchBtn && (launchBtn.onclick = () => this._handleLaunchServer());
  }
};

PresetsPage.prototype._handleRouterAction = function (action, data) {
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
};

PresetsPage.prototype._handleLaunchServerWithPreset = async function (presetName) {
  if (!presetName) {
    showNotification("Please select a preset first", "warning");
    return;
  }

  try {
    console.log("[PRESETS] Launching server with preset:", presetName);
    const result = await window.stateLlamaServer.socket.request("llama:start-with-preset", { presetName });

    if (result?.success) {
      showNotification(`Server started with preset "${presetName}"`, "success");
    } else {
      showNotification(`Failed to start server: ${result?.error || "Unknown error"}`, "error");
    }
  } catch (error) {
    console.error("[PRESETS] Launch error:", error);
    showNotification(`Failed to start server: ${error.message}`, "error");
  }
};

PresetsPage.prototype._handleLaunchServer = function () {
  showNotification("Starting server...", "info");
  stateManager.startLlama().then(() => {
    showNotification("Server started", "success");
  }).catch((e) => {
    showNotification(`Failed: ${e.message}`, "error");
  });
};

PresetsPage.prototype._handleStopServer = function () {
  showNotification("Stopping server...", "info");
  return stateManager.stopLlama().then(() => {
    showNotification("Server stopped", "success");
  }).catch((e) => {
    showNotification(`Failed: ${e.message}`, "error");
  });
};
